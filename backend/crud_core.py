"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from datetime import datetime
from sqlalchemy.orm import Session
import bcrypt
import logging
import models
import schemas

_logger = logging.getLogger("asemos.crud")


_posts_is_flagged_available: bool | None = None


def _posts_has_is_flagged_column(db: Session) -> bool:
    """Render'da migrate gecikirse feed 500 vermesin diye kolon varlığını cache'ler."""
    global _posts_is_flagged_available
    if _posts_is_flagged_available is not None:
        return _posts_is_flagged_available
    try:
        from migrate import _column_exists
        bind = db.get_bind()
        with bind.connect() as conn:
            _posts_is_flagged_available = _column_exists(conn, "posts", "is_flagged")
    except Exception:
        _posts_is_flagged_available = True
    if not _posts_is_flagged_available:
        _logger.warning(
            "posts.is_flagged kolonu yok — feed moderasyon filtresi atlandi; migrate.py calistirin"
        )
    return _posts_is_flagged_available


def _filter_non_flagged_posts(query, db: Session):
    if _posts_has_is_flagged_column(db):
        return query.filter(models.Post.is_flagged == False)
    return query


def _to_bcrypt_password(pw: str) -> bytes:
    enc = pw.encode("utf-8")
    return enc[:72] if len(enc) > 72 else enc  # type: ignore


def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(_to_bcrypt_password(pw), bcrypt.gensalt()).decode("ascii")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_to_bcrypt_password(plain), hashed.encode("ascii"))


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = _hash_password(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        birth_date=user.birth_date,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_pending_user_by_email(db: Session, email: str):
    return db.query(models.PendingUser).filter(models.PendingUser.email == email).first()


def create_pending_user(db: Session, user: schemas.UserCreate, verification_code: str, expires_at: datetime):
    hashed_password = _hash_password(user.password)
    db_pend = models.PendingUser(
        email=user.email,
        username=user.username,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        birth_date=user.birth_date,
        verification_code=verification_code,
        expires_at=expires_at
    )
    db.add(db_pend)
    db.commit()
    db.refresh(db_pend)
    return db_pend


def delete_pending_user(db: Session, email: str):
    db_pend = get_pending_user_by_email(db, email)
    if db_pend:
        db.delete(db_pend)
        db.commit()


def create_user_from_pending(db: Session, pending: models.PendingUser):
    # Eğer aynı username ile seed kullanıcı varsa, onu ve yorumlarını sil
    if pending.username:
        seed_user = db.query(models.User).filter(
            models.User.username == pending.username,
            models.User.role == "seed"
        ).first()
        if seed_user:
            db.query(models.Review).filter(models.Review.user_id == seed_user.id).delete(synchronize_session=False)
            db.delete(seed_user)
            db.commit()

    db_user = models.User(
        email=pending.email,
        username=pending.username,
        password_hash=pending.password_hash,
        first_name=pending.first_name,
        last_name=pending.last_name,
        birth_date=pending.birth_date,
        is_active=True,
        is_email_verified=True
    )
    db.add(db_user)
    db.delete(pending)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, data: schemas.UserUpdate):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not _verify_password(password, user.password_hash):
        return False
    return user


def get_pending_venue_by_email(db: Session, email: str):
    return db.query(models.PendingVenue).filter(models.PendingVenue.email == email).first()


def get_pending_venue_by_id(db: Session, pending_id: int):
    return db.query(models.PendingVenue).filter(models.PendingVenue.id == pending_id).first()


def create_pending_venue(db: Session, venue_data: schemas.VenueRegisterRequest):
    hashed_password = _hash_password(venue_data.password)

    # Eğer claimed_place_id verilmişse ve o mekana zaten bir sahip atandıysa hata ver
    if venue_data.claimed_place_id:
        already_owned = db.query(models.Place).filter(
            models.Place.id == venue_data.claimed_place_id,
            models.Place.owner_id.isnot(None)
        ).first()
        if already_owned:
            raise ValueError("Bu mekan zaten başka bir kullanıcıya bağlı.")

    db_venue = models.PendingVenue(
        venue_name=venue_data.venue_name,
        email=venue_data.email,
        password_hash=hashed_password,
        status="pending",
        claimed_place_id=venue_data.claimed_place_id,
        contact_name=venue_data.contact_name,
        contact_phone=venue_data.contact_phone,
        notes=venue_data.notes,
    )
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue


def get_pending_venues(db: Session, status: str = "pending"):
    return db.query(models.PendingVenue).filter(models.PendingVenue.status == status).all()


def get_pending_venues_with_place(db: Session, status: str = "pending"):
    """Place bilgisiyle birlikte pending_venues listesi (admin için)."""
    rows = (
        db.query(models.PendingVenue)
        .filter(models.PendingVenue.status == status)
        .order_by(models.PendingVenue.created_at.desc())
        .all()
    )
    result = []
    for pv in rows:
        place_name = None
        place_address = None
        if pv.claimed_place_id:
            place = db.query(models.Place).filter(models.Place.id == pv.claimed_place_id).first()
            if place:
                place_name = place.name
                place_address = place.address
        result.append({
            "id": pv.id,
            "venue_name": pv.venue_name,
            "email": pv.email,
            "status": pv.status,
            "claimed_place_id": pv.claimed_place_id,
            "claimed_place_name": place_name,
            "claimed_place_address": place_address,
            "contact_name": pv.contact_name,
            "contact_phone": pv.contact_phone,
            "notes": pv.notes,
            "rejected_reason": pv.rejected_reason,
            "reviewed_at": pv.reviewed_at,
            "created_at": pv.created_at,
        })
    return result


def approve_pending_venue(db: Session, pending_id: int, admin_id: int | None = None):
    """
    Mekan sahipliği başvurusunu onayla.
    YENİ PLACE OLUŞTURMAZ — Google'dan çekilmiş mevcut Place'e owner_id atar.
    """
    from datetime import datetime, timezone as tz
    pending = db.query(models.PendingVenue).filter(models.PendingVenue.id == pending_id).first()
    if not pending or pending.status != "pending":
        return None

    if not pending.claimed_place_id:
        return None  # Eşleştirilecek mekan belirtilmemiş

    # Mevcut mekanı bul
    place = db.query(models.Place).filter(models.Place.id == pending.claimed_place_id).first()
    if not place:
        return None

    # Venue User hesabı oluştur
    username_base = pending.venue_name.lower().replace(" ", "_")[:30]
    username = username_base
    idx = 0
    while get_user_by_username(db, username):
        idx += 1
        username = f"{username_base}_{idx}"

    db_user = models.User(
        email=pending.email,
        username=username,
        password_hash=pending.password_hash,
        first_name=pending.venue_name,
        role="venue",
        is_active=True,
        is_email_verified=True,
    )
    db.add(db_user)
    db.flush()  # id almak için

    # Mevcut Place'e sahip ata (YENİ PLACE OLUŞTURULMAZ)
    place.owner_id = db_user.id

    # Pending kaydını güncelle
    pending.status = "approved"
    pending.reviewed_at = datetime.now(tz.utc)
    pending.reviewed_by_id = admin_id
    db.commit()
    db.refresh(db_user)
    db.refresh(place)

    return db_user, place


def reject_pending_venue(db: Session, pending_id: int, reason: str, admin_id: int | None = None) -> bool:
    """
    Mekan sahipliği başvurusunu reddet ve kaydı sil.
    Silme sayesinde aynı e-posta ile tekrar başvuru yapılabilir.
    """
    pending = db.query(models.PendingVenue).filter(models.PendingVenue.id == pending_id).first()
    if not pending or pending.status != "pending":
        return False

    # Kaydı sil — böylece aynı e-posta ile tekrar başvuru yapılabilir
    db.delete(pending)
    db.commit()
    return True


def get_or_create_user_for_login(db: Session, email: str, password: str):
    """Auth bypass: kullanıcı varsa döndür, yoksa oluştur. Şifre kontrolü yapılmaz."""
    user = get_user_by_email(db, email)
    if user:
        return user
    username_base = email.split("@")[0].replace(".", "_")[:30]  # type: ignore
    username = username_base
    idx = 0
    while get_user_by_username(db, username):
        idx += 1
        username = f"{username_base}_{idx}"
    user_data = schemas.UserCreate(email=email, password=password, username=username)
    return create_user(db, user_data)


def get_or_create_preferences(db: Session, user_id: int) -> models.UserPreferences:
    """Var olan ayarları getir, yoksa varsayılanlarla oluştur."""
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == user_id
    ).first()
    if not prefs:
        prefs = models.UserPreferences(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


def update_preferences(
    db: Session, user_id: int, data: "schemas.UserPreferencesUpdate"
) -> models.UserPreferences:
    """Kullanıcı tercihlerini kısmi güncelle (PATCH semantiği)."""
    prefs = get_or_create_preferences(db, user_id)
    update_data = data.model_dump(exclude_unset=True)

    # hidden_words gelirse JSON string'e çevir
    if "hidden_words" in update_data:
        import json as _json
        prefs.hidden_words_json = _json.dumps(update_data.pop("hidden_words"))

    for field, value in update_data.items():
        if hasattr(prefs, field):
            setattr(prefs, field, value)

    db.commit()
    db.refresh(prefs)
    return prefs


def preferences_to_response(prefs: models.UserPreferences) -> dict:
    """UserPreferences modelini response dict'e çevir (hidden_words_json deserialize)."""
    import json as _json
    hidden_words = []
    if prefs.hidden_words_json:
        try:
            hidden_words = _json.loads(prefs.hidden_words_json)
        except Exception:
            hidden_words = []
    return {
        "is_private_account": prefs.is_private_account,
        "default_comments_disabled": prefs.default_comments_disabled,
        "comment_allowed_audience": prefs.comment_allowed_audience,
        "unknown_message_requests": prefs.unknown_message_requests,
        "story_reply_audience": prefs.story_reply_audience,
        "show_read_receipts": prefs.show_read_receipts,
        "story_save_to_archive": prefs.story_save_to_archive,
        "story_save_to_camera_roll": prefs.story_save_to_camera_roll,
        "hide_offensive_words": prefs.hide_offensive_words,
        "hidden_words": hidden_words,
        "upload_quality": prefs.upload_quality,
        "wifi_auto_high_quality": prefs.wifi_auto_high_quality,
        "include_location_in_posts": prefs.include_location_in_posts,
        "language": prefs.language,
        "notify_likes": prefs.notify_likes if prefs.notify_likes is not None else True,
        "notify_comments": prefs.notify_comments if prefs.notify_comments is not None else True,
        "notify_follows": prefs.notify_follows if prefs.notify_follows is not None else True,
        "notify_messages": prefs.notify_messages if prefs.notify_messages is not None else True,
        "updated_at": prefs.updated_at,
    }
