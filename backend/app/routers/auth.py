# routers/auth.py — Kimlik doğrulama endpoint'leri

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date, timedelta, timezone
import random
import string
import uuid
import jwt
from jwt import PyJWKClient, PyJWTError

import schemas, crud, models
from auth import create_access_token, create_refresh_token, decode_token
from app.dependencies import get_db, get_current_user, get_admin_user
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.middleware.rate_limiter import (
    get_client_ip,
    record_failed_login,
    reset_failed_logins,
)
from app.services.email_service import (
    create_verification_code, verify_code,
    create_password_reset_code, verify_password_reset,
    RateLimitError,
    _build_verification_html,
    _check_rate_limit,
    send_email,
    _send_welcome_email,
)
from crud import _hash_password, _verify_password
from config import get_settings

router = APIRouter(prefix="/auth", tags=["Auth"])

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
_apple_jwks_client: PyJWKClient | None = None


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _configured_audiences(primary: str, allowed: str) -> list[str]:
    audiences: list[str] = []
    for audience in [primary, *_split_csv(allowed)]:
        if audience and audience not in audiences:
            audiences.append(audience)
    return audiences


def _is_truthy_claim(value) -> bool:
    return value is True or str(value).lower() == "true" or str(value) == "1"


def _verify_google_id_token(token: str) -> dict:
    settings = get_settings()
    audiences = _configured_audiences(settings.GOOGLE_CLIENT_ID, settings.GOOGLE_ALLOWED_CLIENT_IDS)
    if not audiences:
        raise HTTPException(status_code=500, detail="Google giriş yapılandırması eksik.")

    for audience in audiences:
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience,
            )
            if idinfo.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
                raise ValueError("Geçersiz Google issuer.")
            return idinfo
        except Exception:
            pass

    raise HTTPException(status_code=400, detail="Geçersiz Google token.")


def _get_apple_jwks_client() -> PyJWKClient:
    global _apple_jwks_client
    if _apple_jwks_client is None:
        _apple_jwks_client = PyJWKClient(APPLE_JWKS_URL)
    return _apple_jwks_client


def _verify_apple_identity_token(token: str) -> dict:
    settings = get_settings()
    audiences = _configured_audiences(settings.APPLE_CLIENT_ID, settings.APPLE_ALLOWED_CLIENT_IDS)
    if not audiences:
        raise HTTPException(status_code=500, detail="Apple giriş yapılandırması eksik.")

    try:
        signing_key = _get_apple_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audiences if len(audiences) > 1 else audiences[0],
            issuer=APPLE_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        )
    except PyJWTError:
        raise HTTPException(status_code=400, detail="Apple token doğrulanamadı.")


def _social_user_token(
    db: Session,
    *,
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
) -> schemas.Token:
    user = crud.get_user_by_email(db, email)
    if user and not user.is_active:
        raise HTTPException(status_code=403, detail="Hesabınız devre dışı bırakılmış.")

    if not user:
        user_data = schemas.UserCreate(
            email=email,
            password="social_login_" + str(uuid.uuid4()),
            username=None,
            first_name=first_name,
            last_name=last_name,
        )
        user = crud.create_user(db, user_data)
        user.is_active = True

    user.is_email_verified = True
    db.commit()
    db.refresh(user)

    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=schemas.User.model_validate(user),
    )


@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    if user.username and crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    # Check if a pending user already exists for this email
    db_pend = crud.get_pending_user_by_email(db, user.email)
    if db_pend:
        crud.delete_pending_user(db, user.email)
    
    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    crud.create_pending_user(db, user, code, expires_at)
    
    user_name = user.first_name or "Kullanıcı"
    subject = "AsEmOs — E-posta Doğrulama Kodu"
    html_body = _build_verification_html(user_name, code)
    
    try:
        _check_rate_limit(hash(user.email) % 1000000)
        send_email(user.email, subject, html_body)
    except RateLimitError as e:
        # Rate limit var ama kodu ekledik, yine de hata döndürmeyebiliriz veya try-catch i rate limit öncesi yapabiliriz.
        pass
    except Exception as e:
        pass
        
    return {"ok": True, "message": "Doğrulama kodu e-postanıza gönderildi.", "email": user.email}

@router.post("/venue-register", response_model=schemas.PendingVenueResponse)
def venue_register(venue_data: schemas.VenueRegisterRequest, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=venue_data.email):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    if crud.get_pending_venue_by_email(db, email=venue_data.email):
        raise HTTPException(status_code=400, detail="Bu e-posta ile bekleyen bir mekan başvuru zaten var.")
    
    pending_venue = crud.create_pending_venue(db, venue_data)
    # E-posta gönderme (İsteğe bağlı: "Talebiniz alındı" vb.)
    return pending_venue


@router.post("/admin/approve-venue/{pending_id}")
def approve_venue(pending_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    result = crud.approve_pending_venue(db, pending_id)
    if not result:
        raise HTTPException(status_code=400, detail="Başvuru bulunamadı veya onaylanmış/iptal edilmiş.")
    
    user, place = result
    # Burada kullanıcıya "Mekanınız onaylandı, artık giriş yapabilirsiniz" e-postası gönderilebilir.
    return {"ok": True, "message": "Mekan onaylandı, hesap oluşturuldu.", "user_id": user.id, "place_id": place.id}

@router.post("/first-time-setup", response_model=schemas.User)
def first_time_setup(
    body: schemas.FirstTimeSetupRequest, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.username and current_user.birth_date:
        raise HTTPException(status_code=400, detail="Kullanıcı adı ve doğum tarihi zaten ayarlanmış.")
    
    # Username değişecekse çakışma kontrolü (Google kullanıcıları için username null olabilir)
    if body.username:
        existing = crud.get_user_by_username(db, username=body.username)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    # Kullanıcı yaşı kontrolü backend tarafında da yapılabilir (14+)
    today = date.today()
    age = today.year - body.birth_date.year - ((today.month, today.day) < (body.birth_date.month, body.birth_date.day))
    if age < 14:
        raise HTTPException(status_code=400, detail="14 yaşından küçükler uygulamaya kayıt olamaz.")

    current_user.username = body.username
    current_user.birth_date = body.birth_date
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/verify-register", response_model=schemas.Token)
def verify_register(body: schemas.VerifyRegisterRequest, db: Session = Depends(get_db)):
    
    db_pend = crud.get_pending_user_by_email(db, email=body.email)
    if not db_pend:
        raise HTTPException(status_code=400, detail="Kayıt isteği bulunamadı veya kodu daha önce doğruladınız.")
    
    if db_pend.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Doğrulama kodu hatalı.")
        
    # Python 3.12 can compare aware with aware datetimes.
    now_utc = datetime.now(timezone.utc)
    # Check if expires_at is naive, if so add timezone. (SQLAlchemy SQLite returns naive objects)
    pend_expires = db_pend.expires_at
    if pend_expires.tzinfo is None:
        pend_expires = pend_expires.replace(tzinfo=timezone.utc)
        
    if pend_expires < now_utc:
        crud.delete_pending_user(db, email=body.email)
        raise HTTPException(status_code=400, detail="Doğrulama kodunun süresi dolmuş. Lütfen tekrar kayıt olun.")
        
    # Kullanıcıyı oluştur
    db_user = crud.create_user_from_pending(db, db_pend)
    
    try:
        _send_welcome_email(db_user)
    except Exception:
        pass
        
    return schemas.Token(
        access_token=create_access_token(db_user.id),
        refresh_token=create_refresh_token(db_user.id),
        user=schemas.User.model_validate(db_user),
    )



@router.post("/login", response_model=schemas.Token)
def login(
    user_data: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)

    user = crud.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        if crud.get_pending_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=403, 
                detail="pending_verification: Lütfen önce e-posta adresinize gönderilen kod ile hesabınızı doğrulayın."
            )
        record_failed_login(ip)
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hesabınız devre dışı bırakılmış.")

    reset_failed_logins(ip)

    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=schemas.User.model_validate(user),
    )


# --- SOSYAL GİRİŞ (OAUTH) ---

@router.post("/google", response_model=schemas.Token)
def google_login(
    body: schemas.SocialLoginRequest,
    db: Session = Depends(get_db)
):
    try:
        idinfo = _verify_google_id_token(body.token)
        if not idinfo or "email" not in idinfo:
            raise HTTPException(status_code=400, detail="Google token'dan e-posta alınamadı.")
        if not _is_truthy_claim(idinfo.get("email_verified")):
            raise HTTPException(status_code=400, detail="Google e-posta adresi doğrulanmamış.")
        
        email = idinfo["email"]
        first_name = idinfo.get("given_name") or idinfo.get("name", "").split(" ")[0] or None
        last_name = idinfo.get("family_name") or None

        return _social_user_token(db, email=email, first_name=first_name, last_name=last_name)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Geçersiz Google token.")

@router.post("/apple", response_model=schemas.Token)
def apple_login(
    body: schemas.SocialLoginRequest,
    db: Session = Depends(get_db)
):
    try:
        decoded = _verify_apple_identity_token(body.token)
        email = decoded.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Token içinde e-posta bulunamadı. Lütfen Apple kimliğinizle e-posta paylaşımını aktif edin.")
        if decoded.get("email_verified") is not None and not _is_truthy_claim(decoded.get("email_verified")):
            raise HTTPException(status_code=400, detail="Apple e-posta adresi doğrulanmamış.")
        
        return _social_user_token(db, email=email)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Apple token doğrulanamadı.")

# --- E-POSTA DOĞRULAMA ---

@router.post("/verify-email")
def verify_email(
    body: schemas.VerifyEmailRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcının girdiği 6 haneli doğrulama kodunu kontrol eder."""
    if current_user.is_email_verified:
        return {"ok": True, "message": "E-posta zaten doğrulanmış."}

    success = verify_code(db, current_user, body.code.strip())
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Doğrulama kodu hatalı veya süresi dolmuş. Lütfen tekrar deneyin.",
        )

    return {"ok": True, "message": "E-posta başarıyla doğrulandı!"}


@router.post("/resend-verification")
def resend_verification(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Yeni bir doğrulama kodu oluşturup e-posta gönderir."""
    if current_user.is_email_verified:
        return {"ok": True, "message": "E-posta zaten doğrulanmış."}

    try:
        create_verification_code(db, current_user)
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))

    return {"ok": True, "message": "Yeni doğrulama kodu gönderildi."}

@router.post("/resend-register-code")
def resend_register_code(body: schemas.ResendVerificationRequest, db: Session = Depends(get_db)):
    
    db_pend = crud.get_pending_user_by_email(db, email=body.email)
    if not db_pend:
        raise HTTPException(status_code=400, detail="Kayıt isteği bulunamadı.")
        
    try:
        _check_rate_limit(hash(body.email) % 1000000)
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
        
    code = "".join(random.choices(string.digits, k=6))
    db_pend.verification_code = code
    db_pend.expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    
    user_name = db_pend.first_name or "Kullanıcı"
    subject = "AsEmOs — E-posta Doğrulama Kodu"
    html_body = _build_verification_html(user_name, code)
    
    try:
        send_email(body.email, subject, html_body)
    except Exception:
        pass
        
    return {"ok": True, "message": "Yeni doğrulama kodu gönderildi."}


# --- ŞİFRE SIFIRLAMA (Forgot / Reset Password) ---

@router.post("/forgot-password")
def forgot_password(
    body: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Şifre sıfırlama kodu oluşturur ve e-posta gönderir.
    Güvenlik: e-posta bulunamasa bile aynı mesaj döner (bilgi sızdırmaz).
    """
    user = crud.get_user_by_email(db, email=body.email)
    if user:
        try:
            create_password_reset_code(db, user)
        except RateLimitError as e:
            raise HTTPException(status_code=429, detail=str(e))

    # Her durumda aynı cevap — e-posta var mı yok mu sızdırmıyoruz
    return {"ok": True, "message": "E-posta adresinize şifre sıfırlama kodu gönderildi."}


@router.post("/reset-password")
def reset_password(
    body: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Sıfırlama kodu + yeni şifre ile şifreyi günceller."""

    user = crud.get_user_by_email(db, email=body.email)
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz istek.")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır.")

    new_hash = _hash_password(body.new_password)
    success = verify_password_reset(db, user, body.code.strip(), new_hash)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Sıfırlama kodu hatalı, süresi dolmuş veya çok fazla yanlış deneme yapıldı.",
        )

    return {"ok": True, "message": "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."}


@router.put("/change-password")
def change_password(
    body: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mevcut şifre ile yeni şifre belirleme (ayarlar ekranı)."""

    if not _verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz hatalı.")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 8 karakter olmalıdır.")

    current_user.password_hash = _hash_password(body.new_password)
    db.commit()
    return {"ok": True, "message": "Şifreniz başarıyla değiştirildi."}


@router.delete("/me")
def delete_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hesabı kalıcı olarak siler — tüm ilişkili veriler cascade ile temizlenir."""
    uid = current_user.id
    # Tüm ilişkili verileri temizle (SQLite FK cascade güvenilir değil)
    db.query(models.Notification).filter(
        (models.Notification.user_id == uid) | (models.Notification.actor_id == uid)
    ).delete(synchronize_session=False)
    db.query(models.Report).filter(models.Report.reporter_id == uid).delete()
    db.query(models.UserBlock).filter(
        (models.UserBlock.blocker_id == uid) | (models.UserBlock.blocked_id == uid)
    ).delete(synchronize_session=False)
    db.query(models.UserPreferences).filter(models.UserPreferences.user_id == uid).delete()
    db.query(models.SavedPlace).filter(models.SavedPlace.user_id == uid).delete()
    db.query(models.SavedPost).filter(models.SavedPost.user_id == uid).delete()
    db.query(models.EmailVerification).filter(models.EmailVerification.user_id == uid).delete()
    db.query(models.PasswordReset).filter(models.PasswordReset.user_id == uid).delete()
    db.query(models.Follow).filter(
        (models.Follow.follower_id == uid) | (models.Follow.following_id == uid)
    ).delete(synchronize_session=False)
    db.query(models.Story).filter(models.Story.user_id == uid).delete()
    db.query(models.PostLike).filter(models.PostLike.user_id == uid).delete()
    db.query(models.PostComment).filter(models.PostComment.user_id == uid).delete()
    # Postlar ve medya
    for p in db.query(models.Post).filter(models.Post.user_id == uid).all():
        db.query(models.PostMedia).filter(models.PostMedia.post_id == p.id).delete()
        db.query(models.PostLike).filter(models.PostLike.post_id == p.id).delete()
        db.query(models.PostComment).filter(models.PostComment.post_id == p.id).delete()
        db.query(models.SavedPost).filter(models.SavedPost.post_id == p.id).delete()
        db.delete(p)
    # Reviewlar
    for r in db.query(models.Review).filter(models.Review.user_id == uid).all():
        db.query(models.ReviewMedia).filter(models.ReviewMedia.review_id == r.id).delete()
        db.delete(r)
    # Match
    db.query(models.MatchLike).filter(
        (models.MatchLike.from_user_id == uid) | (models.MatchLike.to_user_id == uid)
    ).delete(synchronize_session=False)
    for conv in db.query(models.MatchConversation).filter(
        (models.MatchConversation.user1_id == uid) | (models.MatchConversation.user2_id == uid)
    ).all():
        db.query(models.Message).filter(models.Message.conversation_id == conv.id).delete()
        db.delete(conv)
    mp = db.query(models.MatchProfile).filter(models.MatchProfile.user_id == uid).first()
    if mp:
        db.delete(mp)
    db.commit()
    db.delete(current_user)
    db.commit()
    return {"ok": True, "message": "Hesabınız kalıcı olarak silindi."}

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Geçersiz refresh token.")
    user = crud.get_user_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=schemas.User.model_validate(user),
    )


@router.get("/me", response_model=schemas.User)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.User)
def update_me(
    data: schemas.UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    if data.username and data.username != current_user.username:
        existing = crud.get_user_by_username(db, data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    # E-posta benzersizlik kontrolü
    if data.email and data.email != current_user.email:
        existing = crud.get_user_by_email(db, data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor.")
    
    # Telefon benzersizlik kontrolü
    if data.phone_number and data.phone_number != current_user.phone_number:
        existing = db.query(models.User).filter(
            models.User.phone_number == data.phone_number,
            models.User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kullanılıyor.")
    
    try:
        updated = crud.update_user(db, current_user.id, data)
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Profil güncellenirken bir çakışma oluştu. Benzersiz olması gereken bir alan (örn. telefon, e-posta) kullanılmış olabilir."
        )


@router.patch("/me", response_model=schemas.User)
def patch_me(
    data: schemas.UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kısmi profil güncellemesi (frontend personal.tsx kullanır)."""

    if data.username and data.username != current_user.username:
        existing = crud.get_user_by_username(db, data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")

    if data.email and data.email != current_user.email:
        existing = crud.get_user_by_email(db, data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor.")

    if data.phone_number and data.phone_number != current_user.phone_number:
        existing = db.query(models.User).filter(
            models.User.phone_number == data.phone_number,
            models.User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kullanılıyor.")

    try:
        updated = crud.update_user(db, current_user.id, data)
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Profil güncellenirken çakışma oluştu.")


@router.get("/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Oturum açmış kullanıcının istatistikleri (activity.tsx)."""
    return crud.get_user_stats(db, current_user.id)


@router.get("/me/preferences", response_model=schemas.UserPreferencesResponse)
def get_my_preferences(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcının sunucu tarafındaki tüm ayarlarını getirir."""
    prefs = crud.get_or_create_preferences(db, current_user.id)
    return crud.preferences_to_response(prefs)


@router.put("/me/preferences", response_model=schemas.UserPreferencesResponse)
def update_my_preferences(
    data: schemas.UserPreferencesUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcı tercihlerini günceller (upsert — yoksa oluşturur)."""
    # Geçerlilik kontrolleri
    VALID_AUDIENCES = {"everyone", "followers", "off"}
    VALID_QUALITIES = {"high", "auto", "data_saver"}
    VALID_LANGUAGES = {"tr", "en"}

    if data.comment_allowed_audience and data.comment_allowed_audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"Geçersiz yorum kitlesi: {data.comment_allowed_audience}")
    if data.story_reply_audience and data.story_reply_audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"Geçersiz hikaye yanıt kitlesi: {data.story_reply_audience}")
    if data.upload_quality and data.upload_quality not in VALID_QUALITIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz medya kalitesi: {data.upload_quality}")
    if data.language and data.language not in VALID_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Geçersiz dil: {data.language}")

    prefs = crud.update_preferences(db, current_user.id, data)
    return crud.preferences_to_response(prefs)


# --- Push Token Yönetimi ---

@router.post("/push-token")
def save_push_token(
    body: schemas.PushTokenRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Expo push notification token'ını kaydet"""
    if not body.token.startswith("ExponentPushToken"):
        raise HTTPException(status_code=400, detail="Geçersiz push token formatı.")
    current_user.push_token = body.token
    current_user.push_token_updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.delete("/push-token")
def delete_push_token(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Çıkışta push token'ı sil"""
    current_user.push_token = None
    current_user.push_token_updated_at = None
    db.commit()
    return {"ok": True}


@router.post("/admin/force-create-user")
def admin_force_create_user(
    body: dict,
    db: Session = Depends(get_db)
):
    """
    Admin endpoint - Test kullanıcısı oluşturmak için (psycopg2 hatası aşması)
    Body: { "email", "password", "first_name", "admin_secret" }
    """
    
    settings = get_settings()
    
    # Admin secret kontrolü
    if body.get("admin_secret") != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim.")
    
    email = body.get("email")
    password = body.get("password")
    first_name = body.get("first_name", "Test")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email ve password gerekli.")
    
    # Kullanıcı zaten var mı?
    existing = crud.get_user_by_email(db, email=email)
    if existing:
        # Zaten varsa token döndür
        access_token = create_access_token(existing.id)
        refresh_token = create_refresh_token(existing.id)
        return {
            "ok": True,
            "message": "Kullanıcı zaten mevcut.",
            "email": email,
            "password": password,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": existing.id
        }
    
    # Yeni kullanıcı oluştur
    password_hash = _hash_password(password)
    db_user = models.User(
        email=email,
        username=None,  # İlk giriş sonrası ayarlanacak
        password_hash=password_hash,
        first_name=first_name,
        last_name=None,
        birth_date=None,
        is_active=True,
        is_email_verified=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Token oluştur
    access_token = create_access_token(db_user.id)
    refresh_token = create_refresh_token(db_user.id)
    
    return {
        "ok": True,
        "message": "Test kullanıcısı oluşturuldu.",
        "email": email,
        "password": password,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": db_user.id
    }


