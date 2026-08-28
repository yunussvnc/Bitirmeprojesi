import os
import secrets
import string
import uuid
import logging
import jwt
import requests as req_lib
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import schemas, crud, models
from auth import create_access_token, create_refresh_token, decode_token
from crud import _hash_password, _verify_password
from app.dependencies import get_db, get_current_user, get_admin_user
from app.middleware.rate_limiter import (
    get_client_ip,
    is_login_locked,
    record_failed_login,
    reset_failed_logins,
)
from app.websocket.manager import manager
from app.services.email_service import (
    create_verification_code, verify_code,
    create_password_reset_code, verify_password_reset,
    RateLimitError,
    _check_rate_limit,
    _build_verification_html,
    _send_welcome_email,
    send_email,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


auth_logger = logging.getLogger("asemos.auth")


def _parse_allowed_client_ids(primary: str, extra: str) -> list[str]:
    ids: list[str] = []
    if primary and primary.strip():
        ids.append(primary.strip())
    if extra:
        ids.extend(part.strip() for part in extra.split(",") if part.strip())
    return list(dict.fromkeys(ids))


def _generate_verification_code(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def _verify_google_id_token(token: str) -> dict:
    """Google ID token veya access token doğrulaması; email_verified zorunlu."""
    settings_module = __import__("config", fromlist=["get_settings"]).get_settings()
    client_ids = _parse_allowed_client_ids(
        settings_module.GOOGLE_CLIENT_ID, settings_module.GOOGLE_ALLOWED_CLIENT_IDS
    )

    if client_ids:
        for client_id in client_ids:
            try:
                idinfo = id_token.verify_oauth2_token(
                    token, google_requests.Request(), client_id
                )
                if not idinfo.get("email_verified", False):
                    raise HTTPException(
                        status_code=400,
                        detail="Google e-postası doğrulanmamış.",
                    )
                return idinfo
            except HTTPException:
                raise
            except Exception:
                continue

    resp = req_lib.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Geçersiz Google token.")
    idinfo = resp.json()
    if not idinfo.get("email_verified", False):
        raise HTTPException(
            status_code=400,
            detail="Google e-postası doğrulanmamış.",
        )
    if not idinfo.get("email"):
        raise HTTPException(
            status_code=400,
            detail="Google token'dan e-posta alınamadı.",
        )
    return idinfo


def _verify_apple_identity_token(token: str) -> dict:
    """Apple identity token — JWKS ile imza doğrulaması (prod); testte mock."""
    settings_module = __import__("config", fromlist=["get_settings"]).get_settings()
    client_ids = _parse_allowed_client_ids(
        settings_module.APPLE_CLIENT_ID, settings_module.APPLE_ALLOWED_CLIENT_IDS
    )

    if os.getenv("TESTING") == "1" and not client_ids:
        return jwt.decode(token, options={"verify_signature": False})

    if not client_ids:
        raise HTTPException(
            status_code=400,
            detail="Apple Sign-In yapılandırılmamış.",
        )

    # pyrefly: ignore [missing-import]
    from jwt import PyJWKClient

    jwks_client = PyJWKClient("https://appleid.apple.com/auth/keys", cache_keys=True)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=client_ids,
        issuer="https://appleid.apple.com",
    )


@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    if user.username and crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    
    now_utc = datetime.now(timezone.utc)
    
    # Check if a valid (unexpired) pending user already exists for this email.
    # If so, reuse the existing code to prevent retry/timeout race conditions
    # where a new code is generated but the old code was already emailed.
    db_pend = crud.get_pending_user_by_email(db, user.email)
    if db_pend:
        pend_expires = db_pend.expires_at
        if pend_expires.tzinfo is None:
            pend_expires = pend_expires.replace(tzinfo=timezone.utc)
        
        if pend_expires > now_utc:
            # Pending user still valid — reuse existing code, don't regenerate
            return {"ok": True, "message": "Doğrulama kodu e-postanıza gönderildi.", "email": user.email}
        else:
            # Expired — delete and create fresh
            crud.delete_pending_user(db, user.email)
    
    code = _generate_verification_code()
    expires_at = now_utc + timedelta(minutes=15)
    
    crud.create_pending_user(db, user, code, expires_at)
    
    user_name = user.first_name or "Kullanıcı"
    subject = "AsEmOs — E-posta Doğrulama Kodu"
    html_body = _build_verification_html(user_name, code)
    
    try:
        _check_rate_limit(hash(user.email) % 1000000)
        send_email(user.email, subject, html_body)
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception:
        auth_logger.exception("Kayıt doğrulama e-postası gönderilemedi: %s", user.email)
        raise HTTPException(
            status_code=503,
            detail="E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        )
        
    return {"ok": True, "message": "Doğrulama kodu e-postanıza gönderildi.", "email": user.email}


@router.post("/venue-register", response_model=schemas.PendingVenueResponse)
def venue_register(venue_data: schemas.VenueRegisterRequest, db: Session = Depends(get_db)):
    """
    Mekan sahipliği başvurusu.
    claimed_place_id — sistemdeki (Google'dan çekilmiş) mevcut Place.id'si zorunludur.
    """
    if crud.get_user_by_email(db, email=venue_data.email):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    if crud.get_pending_venue_by_email(db, email=venue_data.email):
        raise HTTPException(status_code=400, detail="Bu e-posta ile bekleyen bir mekan başvurusu zaten var.")

    try:
        pending_venue = crud.create_pending_venue(db, venue_data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Başvuru onay bekleme e-postası (opsiyonel — servis hazırsa açılabilir)
    # send_email(venue_data.email, "Başvurunuz Alındı", "...")

    place_name = None
    place_address = None
    if pending_venue.claimed_place_id:
        place = db.query(models.Place).filter(models.Place.id == pending_venue.claimed_place_id).first()
        if place:
            place_name = place.name
            place_address = place.address

    return schemas.PendingVenueResponse(
        id=pending_venue.id,
        venue_name=pending_venue.venue_name,
        email=pending_venue.email,
        status=pending_venue.status,
        claimed_place_id=pending_venue.claimed_place_id,
        claimed_place_name=place_name,
        claimed_place_address=place_address,
        contact_name=pending_venue.contact_name,
        contact_phone=pending_venue.contact_phone,
        notes=pending_venue.notes,
        rejected_reason=pending_venue.rejected_reason,
        reviewed_at=pending_venue.reviewed_at,
        created_at=pending_venue.created_at,
    )


@router.get("/venue-register/status", response_model=schemas.VenueClaimStatusResponse)
def venue_claim_status(email: str, db: Session = Depends(get_db)):
    """
    Başvuru durumu sorgulama — mobil uygulama için.
    Kullanıcı e-postasıyla kendi başvurusunun durumunu görebilir.
    """
    pending = crud.get_pending_venue_by_email(db, email=email)
    if not pending:
        return schemas.VenueClaimStatusResponse(status="not_found")

    place_name = None
    if pending.claimed_place_id:
        place = db.query(models.Place).filter(models.Place.id == pending.claimed_place_id).first()
        if place:
            place_name = place.name

    return schemas.VenueClaimStatusResponse(
        status=pending.status,
        venue_name=pending.venue_name,
        claimed_place_name=place_name,
        rejected_reason=pending.rejected_reason,
        reviewed_at=pending.reviewed_at,
    )


@router.get("/admin/pending-venues")
def list_pending_venues(
    status: str = "pending",
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Admin: tüm bekleyen (veya onaylanmış/reddedilmiş) mekan başvurularını listele.
    ?status=pending | approved | rejected
    """
    return crud.get_pending_venues_with_place(db, status=status)


@router.post("/admin/approve-venue/{pending_id}")
def approve_venue(
    pending_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Admin: mekan başvurusunu onayla.
    - Venue User hesabı oluşturulur.
    - Mevcut Google Place kaydına owner_id atanır (YENİ PLACE OLUŞTURULMAZ).
    - Reddedilmiş başvuruyu veya claimed_place_id olmayan başvuruyu onaylamak hata verir.
    """
    result = crud.approve_pending_venue(db, pending_id, admin_id=admin.id)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Başvuru bulunamadı, zaten onaylanmış/iptal edilmiş veya eşleştirilecek mekan belirtilmemiş."
        )

    user, place = result
    return {
        "ok": True,
        "message": "Mekan onaylandı. Hesap oluşturuldu, mevcut mekan kaydına bağlandı.",
        "user_id": user.id,
        "user_email": user.email,
        "place_id": place.id,
        "place_name": place.name,
    }


@router.post("/admin/reject-venue/{pending_id}")
def reject_venue(
    pending_id: int,
    body: schemas.VenueRejectRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Admin: mekan başvurusunu reddet ve kaydı sil.
    Silme sonrası aynı e-posta ile tekrar başvuru yapılabilir.
    """
    success = crud.reject_pending_venue(db, pending_id, reason=body.reason, admin_id=admin.id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Başvuru bulunamadı veya zaten işleme alınmış."
        )
    return {"ok": True, "message": "Başvuru reddedildi ve silindi. Başvuru sahibi aynı e-posta ile tekrar başvurabilir."}


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
    
    if db_pend.verification_code.strip() != body.code.strip():
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
        access_token=create_access_token(db_user.id, db_user.token_version or 0, role=db_user.role),
        refresh_token=create_refresh_token(db_user.id, db_user.token_version or 0),
        user=schemas.User.model_validate(db_user),
    )


@router.post("/login", response_model=schemas.Token)
def login(
    user_data: schemas.UserLogin,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    if is_login_locked(ip, user_data.email):
        raise HTTPException(
            status_code=429,
            detail="Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.",
        )

    db_user = crud.get_user_by_email(db, user_data.email)
    if not db_user:
        if crud.get_pending_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=403, 
                detail="pending_verification: Lütfen önce e-posta adresinize gönderilen kod ile hesabınızı doğrulayın."
            )
        record_failed_login(ip, user_data.email)
        raise HTTPException(status_code=404, detail="Bu e-posta adresine ait kullanıcı bulunamadı.")

    user = crud.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        record_failed_login(ip, user_data.email)
        raise HTTPException(status_code=401, detail="Şifre hatalı.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hesabınız devre dışı bırakılmış.")

    user.token_version = (user.token_version or 0) + 1
    db.commit()
    reset_failed_logins(ip, user_data.email)
    background_tasks.add_task(
        manager.close_user_connections,
        user.id,
        "Yeni oturum açıldı",
        user.token_version - 1,
    )

    tv = user.token_version
    return schemas.Token(
        access_token=create_access_token(user.id, tv, role=user.role),
        refresh_token=create_refresh_token(user.id, tv),
        user=schemas.User.model_validate(user),
    )


@router.post("/google", response_model=schemas.Token)
def google_login(
    body: schemas.SocialLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        idinfo = _verify_google_id_token(body.token)
        if not idinfo.get("email_verified", False):
            raise HTTPException(
                status_code=400,
                detail="Google e-postası doğrulanmamış.",
            )
        email = idinfo["email"]
        first_name = idinfo.get("given_name") or idinfo.get("name", "").split(" ")[0] or None
        last_name = idinfo.get("family_name") or None
        
        user = crud.get_user_by_email(db, email)
        if not user:
            user_data = schemas.UserCreate(
                email=email, 
                password="SocialLogin1!_" + str(uuid.uuid4()), 
                username=None,
                first_name=first_name,
                last_name=last_name
            )
            user = crud.create_user(db, user_data)
            
        user.is_email_verified = True
        user.token_version = (user.token_version or 0) + 1
        db.commit()
        background_tasks.add_task(
            manager.close_user_connections,
            user.id,
            "Yeni oturum açıldı",
            user.token_version - 1,
        )

        tv = user.token_version
        return schemas.Token(
            access_token=create_access_token(user.id, tv, role=user.role),
            refresh_token=create_refresh_token(user.id, tv),
            user=schemas.User.model_validate(user),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Geçersiz Google token.")


@router.post("/apple", response_model=schemas.Token)
def apple_login(
    body: schemas.SocialLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        decoded = _verify_apple_identity_token(body.token)
        email = decoded.get("email")
        
        if not email:
            # Apple bazen email göndermeyebilir (Private Email Relay), handle et.
            raise HTTPException(status_code=400, detail="Token içinde e-posta bulunamadı. Lütfen Apple kimliğinizle e-posta paylaşımını aktif edin.")
        
        # Apple Private Relay e-posta tespiti
        is_private_relay = email.endswith("@privaterelay.appleid.com")
        
        # Apple ilk girişte fullName gönderir — bunu yakala
        first_name = None
        last_name = None
        if body.full_name:
            first_name = body.full_name.firstName or None
            last_name = body.full_name.lastName or None
            
        user = crud.get_user_by_email(db, email)
        is_new_user = user is None
        
        if not user:
            user_data = schemas.UserCreate(
                email=email, 
                password="SocialLogin1!_" + str(uuid.uuid4()), 
                username=None,
                first_name=first_name,
                last_name=last_name,
            )
            user = crud.create_user(db, user_data)
        elif is_private_relay and (first_name or last_name):
            # Mevcut kullanıcı, ama isim bilgisi yoksa güncelle
            # (Apple fullName'i sadece ilk seferde gönderir)
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
        
        user.is_email_verified = True
        user.token_version = (user.token_version or 0) + 1
        db.commit()
        background_tasks.add_task(
            manager.close_user_connections,
            user.id,
            "Yeni oturum açıldı",
            user.token_version - 1,
        )

        tv = user.token_version
        return schemas.Token(
            access_token=create_access_token(user.id, tv, role=user.role),
            refresh_token=create_refresh_token(user.id, tv),
            user=schemas.User.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Apple token doğrulanamadı.")


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
        
    code = _generate_verification_code()
    db_pend.verification_code = code
    db_pend.expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    
    user_name = db_pend.first_name or "Kullanıcı"
    subject = "AsEmOs — E-posta Doğrulama Kodu"
    html_body = _build_verification_html(user_name, code)
    
    try:
        send_email(body.email, subject, html_body)
    except Exception:
        auth_logger.exception("Kayıt kodu yeniden gönderilemedi: %s", body.email)
        raise HTTPException(
            status_code=503,
            detail="E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        )
        
    return {"ok": True, "message": "Yeni doğrulama kodu gönderildi."}


@router.post("/forgot-password")
def forgot_password(
    body: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Şifre sıfırlama kodu oluşturur ve e-posta gönderir.
    Kullanıcı bulunamazsa özel olarak 404 döner (UX iyileştirmesi).
    """
    user = crud.get_user_by_email(db, email=body.email)
    if not user:
        raise HTTPException(status_code=404, detail="Bu e-posta adresine kayıtlı kullanıcı bulunamadı.")

    try:
        create_password_reset_code(db, user)
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))

    return {"ok": True, "message": "E-posta adresinize şifre sıfırlama kodu gönderildi."}


@router.post("/reset-password")
def reset_password(
    body: schemas.ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Sıfırlama kodu + yeni şifre ile şifreyi günceller."""


    user = crud.get_user_by_email(db, email=body.email)
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz istek.")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır.")
        
    import re
    pwd_pattern = re.compile(r'(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*([^\w\s]|_))')
    if not pwd_pattern.search(body.new_password):
        raise HTTPException(
            status_code=400,
            detail="Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."
        )

    new_hash = _hash_password(body.new_password)
    success = verify_password_reset(db, user, body.code.strip(), new_hash)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Sıfırlama kodu hatalı, süresi dolmuş veya çok fazla yanlış deneme yapıldı.",
        )

    background_tasks.add_task(
        manager.close_user_connections,
        user.id,
        "Şifre sıfırlandı",
        user.token_version - 1,
    )
    return {"ok": True, "message": "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."}


@router.put("/change-password")
def change_password(
    body: schemas.ChangePasswordRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mevcut şifre ile yeni şifre belirleme (ayarlar ekranı)."""


    if not _verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz hatalı.")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 8 karakter olmalıdır.")
    
    import re
    pwd_pattern = re.compile(r'(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*([^\w\s]|_))')
    if not pwd_pattern.search(body.new_password):
        raise HTTPException(
            status_code=400,
            detail="Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."
        )

    current_user.password_hash = _hash_password(body.new_password)
    current_user.token_version = (current_user.token_version or 0) + 1
    db.commit()
    background_tasks.add_task(
        manager.close_user_connections,
        current_user.id,
        "Şifre değiştirildi",
        current_user.token_version - 1,
    )
    return {
        "ok": True,
        "message": "Şifreniz değiştirildi. Lütfen yeni şifrenizle tekrar giriş yapın.",
    }

from app.routers.auth_account import (
    router as extracted_router,
    delete_account,
    deactivate_account,
    refresh_token,
    logout_all_sessions,
    register_device_token,
    unregister_device_token,
    get_me,
    update_me,
    patch_me,
    get_my_stats,
    get_my_preferences,
    update_my_preferences,
    save_push_token,
    delete_push_token,
)

router.include_router(extracted_router)
