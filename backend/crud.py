from datetime import datetime, timedelta, timezone
import logging
# pyrefly: ignore [missing-import]
from sqlalchemy import func, or_, and_
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session, joinedload
# pyrefly: ignore [missing-import]
import bcrypt
import models, schemas
from app.services.moderator import AIModerator

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

# bcrypt 72 byte sınırı – uzun şifreleri kırp
def _to_bcrypt_password(pw: str) -> bytes:
    enc = pw.encode("utf-8")
    return enc[:72] if len(enc) > 72 else enc  # type: ignore

def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(_to_bcrypt_password(pw), bcrypt.gensalt()).decode("ascii")

def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_to_bcrypt_password(plain), hashed.encode("ascii"))

# --- KULLANICI İŞLEMLERİ ---

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

# --- PENDING VENUE İŞLEMLERİ ---

def get_pending_venue_by_email(db: Session, email: str):
    return db.query(models.PendingVenue).filter(models.PendingVenue.email == email).first()

def create_pending_venue(db: Session, venue_data: schemas.VenueRegisterRequest):
    hashed_password = _hash_password(venue_data.password)
    db_venue = models.PendingVenue(
        venue_name=venue_data.venue_name,
        email=venue_data.email,
        password_hash=hashed_password,
        status="pending"
    )
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

def get_pending_venues(db: Session, status: str = "pending"):
    return db.query(models.PendingVenue).filter(models.PendingVenue.status == status).all()

def approve_pending_venue(db: Session, pending_id: int):
    pending = db.query(models.PendingVenue).filter(models.PendingVenue.id == pending_id).first()
    if not pending or pending.status != "pending":
        return None
    
    # Kendi içinde User (role=venue) ve Place oluşturur
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
        is_email_verified=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Place oluştur
    db_place = models.Place(
        name=pending.venue_name,
        address="Varsayılan Adres",
        city="Belirsiz",
        category="Kafe", # Default category
        owner_id=db_user.id
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)

    # Status güncelle
    pending.status = "approved"
    db.commit()

    return db_user, db_place


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

# --- MEKAN (PLACE) İŞLEMLERİ ---

def _enrich_places_with_stats(db: Session, places, current_user_id: int | None = None):
    import math

    if not places:
        return places

    place_ids = [p.id for p in places]

    # Yorum sayıları
    reviews_count = (
        db.query(models.Review.place_id, func.count(models.Review.id).label("cnt"))
        .filter(models.Review.place_id.in_(place_ids))
        .group_by(models.Review.place_id)
        .all()
    )
    review_map = {r[0]: r[1] for r in reviews_count}

    # Kaydetme sayıları
    saved_count = (
        db.query(models.SavedPlace.place_id, func.count(models.SavedPlace.id).label("cnt"))
        .filter(models.SavedPlace.place_id.in_(place_ids))
        .group_by(models.SavedPlace.place_id)
        .all()
    )
    saved_map = {s[0]: s[1] for s in saved_count}

    # Takipçi sayıları
    follower_counts = (
        db.query(models.PlaceFollow.place_id, func.count(models.PlaceFollow.id).label("cnt"))
        .filter(models.PlaceFollow.place_id.in_(place_ids))
        .group_by(models.PlaceFollow.place_id)
        .all()
    )
    follower_map = {f[0]: f[1] for f in follower_counts}

    # Takip durumu (giriş yapmış kullanıcı için)
    following_set: set = set()
    if current_user_id:
        follows = (
            db.query(models.PlaceFollow.place_id)
            .filter(
                models.PlaceFollow.user_id == current_user_id,
                models.PlaceFollow.place_id.in_(place_ids),
            )
            .all()
        )
        following_set = {f[0] for f in follows}

    for p in places:
        rc = review_map.get(p.id, 0)
        sc = saved_map.get(p.id, 0)
        p.review_count = rc  # type: ignore
        p.saved_count = sc  # type: ignore
        p.follower_count = follower_map.get(p.id, 0)  # type: ignore
        p.is_following = p.id in following_set  # type: ignore

        score = p.average_rating * math.log10(rc + 1) if rc > 0 else (p.average_rating or 0.0)
        p.popularity_score = round(score, 2)  # type: ignore

        # JSON text → Python list deserialization
        import json as _json
        try:
            parsed_gallery = _json.loads(p.gallery_urls) if p.gallery_urls and isinstance(p.gallery_urls, str) else p.gallery_urls
            p.gallery_urls = parsed_gallery if isinstance(parsed_gallery, list) else []  # type: ignore
        except Exception:
            p.gallery_urls = []  # type: ignore
        try:
            parsed_menu = _json.loads(p.menu_items_json) if p.menu_items_json and isinstance(p.menu_items_json, str) else p.menu_items_json
            p.menu_items = parsed_menu if isinstance(parsed_menu, list) else []  # type: ignore
        except Exception:
            p.menu_items = []  # type: ignore
        try:
            parsed_hours = _json.loads(p.opening_hours_json) if p.opening_hours_json and isinstance(p.opening_hours_json, str) else p.opening_hours_json
            p.opening_hours_json = parsed_hours if isinstance(parsed_hours, dict) else None  # type: ignore
        except Exception:
            pass  # leave as-is

    return places



def get_places(db: Session, skip: int = 0, limit: int = 100):
    items = db.query(models.Place).order_by(models.Place.id.desc()).offset(skip).limit(limit).all()
    return _enrich_places_with_stats(db, items)

def get_places_paginated(db: Session, page: int = 1, page_size: int = 20):
    total = db.query(models.Place).count()
    offset = (page - 1) * page_size
    items = (
        db.query(models.Place)
        .order_by(models.Place.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    items = _enrich_places_with_stats(db, items)
    return items, total


def search_places(
    db: Session,
    q: str = "",
    category: str = None,
    city: str = None,
    page: int = 1,
    page_size: int = 20,
):
    """Mekan arama — isim, kategori, şehir filtreleri."""
    query = db.query(models.Place)
    if q:
        query = query.filter(models.Place.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(models.Place.category == category)
    if city:
        query = query.filter(models.Place.city.ilike(f"%{city}%"))
    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(models.Place.average_rating.desc()).offset(offset).limit(page_size).all()
    items = _enrich_places_with_stats(db, items)
    return items, total


def get_nearby_places(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    page: int = 1,
    page_size: int = 20,
):
    """
    Yakındaki mekanları döndürür — Bounding Box Pre-Filter + Haversine.

    Optimizasyon stratejisi (PostGIS ST_DWithin eşdeğeri):
    1. SQL seviyesinde coğrafi kutu (bounding box) filtresi → indeks dostu, O(1)
    2. Kutu içindeki mekanlar için Python Haversine → hassas mesafe + sıralama

    Bu yaklaşım 10.000+ mekan için bile milisaniye seviyesinde çalışır.
    PostgreSQL + PostGIS'e geçildiğinde ST_DWithin ile değiştirilebilir.
    """
    import math

    # 1️⃣ Bounding Box hesaplama (1° lat ≈ 111km, 1° lng ≈ 111km * cos(lat))
    lat_delta = radius_km / 111.0
    lng_delta = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))

    lat_min, lat_max = lat - lat_delta, lat + lat_delta
    lng_min, lng_max = lng - lng_delta, lng + lng_delta

    # 2️⃣ SQL bounding box pre-filter (indeks kullanır)
    box_places = db.query(models.Place).filter(
        models.Place.latitude.isnot(None),
        models.Place.longitude.isnot(None),
        models.Place.latitude >= lat_min,
        models.Place.latitude <= lat_max,
        models.Place.longitude >= lng_min,
        models.Place.longitude <= lng_max,
    ).all()

    # 3️⃣ Hassas Haversine filtresi (bounding box false-positive'leri eler)
    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371.0
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearby = []
    for p in box_places:
        d = haversine_km(lat, lng, p.latitude, p.longitude)
        if d <= radius_km:
            p._distance_km = round(d, 2) # type: ignore
            nearby.append(p)

    nearby.sort(key=lambda p: p._distance_km) # type: ignore
    total = len(nearby)
    offset = (page - 1) * page_size
    paginated = nearby[offset : offset + page_size]
    paginated = _enrich_places_with_stats(db, paginated)
    return paginated, total


def get_popular_places(db: Session, page: int = 1, page_size: int = 20):
    """Popüler mekanlar — puan x yorum bazlı sıralama."""
    import math
    all_places = db.query(models.Place).all()
    all_places = _enrich_places_with_stats(db, all_places)
    all_places.sort(key=lambda p: p.popularity_score, reverse=True) # type: ignore
    total = len(all_places)
    offset = (page - 1) * page_size
    return all_places[offset : offset + page_size], total

def create_place(db: Session, place: schemas.PlaceCreate):
    import json as _json
    db_place = models.Place(
        name=place.name,
        address=place.address,
        city=place.city,
        description=place.description,
        campaign_text=getattr(place, "campaign_text", None),
        price_range=place.price_range,
        category=place.category,
        features=place.features,
        latitude=place.latitude,
        longitude=place.longitude,
        photo_url=getattr(place, "photo_url", None),
        video_url=getattr(place, "video_url", None),
        opening_time=getattr(place, "opening_time", None),
        closing_time=getattr(place, "closing_time", None),
        is_open=getattr(place, "is_open", True),
        phone_number=getattr(place, "phone_number", None),
        gallery_urls=_json.dumps(place.gallery_urls) if getattr(place, "gallery_urls", None) else None,
        menu_items_json=_json.dumps(place.menu_items) if getattr(place, "menu_items", None) else None,
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

def get_place_by_id(db: Session, place_id: int, current_user_id: int | None = None):
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if place:
        places_enriched = _enrich_places_with_stats(db, [place], current_user_id=current_user_id)
        return places_enriched[0]
    return None

def delete_place(db: Session, place_id: int):
    """Mekan siler (ilişkili yorumlar cascade ile silinebilir)."""
    db_place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if db_place:
        db.delete(db_place)
        db.commit()
        return True
    return False

def update_place_vector_id(db: Session, place_id: int, vector_id: str):
    """Vektör DB'ye (Qdrant vb.) kayıt edildikten sonra ID'yi SQL'e işler."""
    db_place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if db_place:
        db_place.vector_id = vector_id
        db.commit()
    return db_place


# --- MEKAN TAKİP İŞLEMLERİ ---

def toggle_place_follow(db: Session, user_id: int, place_id: int) -> dict:
    """Mekanı takip et / bırak (toggle). Sonuç: {followed: bool, follower_count: int}"""
    existing = db.query(models.PlaceFollow).filter(
        models.PlaceFollow.user_id == user_id,
        models.PlaceFollow.place_id == place_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        followed = False
    else:
        follow = models.PlaceFollow(user_id=user_id, place_id=place_id)
        db.add(follow)
        db.commit()
        followed = True

    count = db.query(models.PlaceFollow).filter(models.PlaceFollow.place_id == place_id).count()
    return {"followed": followed, "follower_count": count}


def record_place_interaction(db: Session, user_id: int, place_id: int, interaction_type: str = "view") -> None:
    """
    Kullanıcı–mekan etkileşim skoru güncelle.
    interaction_type: 'view' (+1), 'search' (+2), 'review' (+5)
    """
    score_map = {"view": 1, "search": 2, "review": 5, "like": 3}
    delta = score_map.get(interaction_type, 1)

    existing = db.query(models.PlaceInteraction).filter(
        models.PlaceInteraction.user_id == user_id,
        models.PlaceInteraction.place_id == place_id,
    ).first()

    if existing:
        existing.score += delta  # type: ignore
        if interaction_type == "view":
            existing.view_count += 1  # type: ignore
        elif interaction_type == "search":
            existing.search_count += 1  # type: ignore
        db.commit()
    else:
        interaction = models.PlaceInteraction(
            user_id=user_id,
            place_id=place_id,
            score=delta,
            view_count=1 if interaction_type == "view" else 0,
            search_count=1 if interaction_type == "search" else 0,
        )
        db.add(interaction)
        try:
            db.commit()
        except Exception:
            db.rollback()


def get_place_posts(db: Session, place_id: int, current_user_id: int | None = None, page: int = 1, page_size: int = 18):
    """Mekana ait gönderileri getir (mekan kartı için). Sadece gizli olmayan hesapların gönderileri listelenir."""
    total = db.query(models.Post)\
        .join(models.User, models.Post.user_id == models.User.id)\
        .outerjoin(models.UserPreferences, models.User.id == models.UserPreferences.user_id)\
        .filter(
            models.Post.place_id == place_id,
            models.Post.is_flagged == False,
            or_(
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None
            )
        ).count()

    posts = (
        db.query(models.Post)
        .join(models.User, models.Post.user_id == models.User.id)
        .outerjoin(models.UserPreferences, models.User.id == models.UserPreferences.user_id)
        .options(joinedload(models.Post.media), joinedload(models.Post.user))
        .filter(
            models.Post.place_id == place_id,
            models.Post.is_flagged == False,
            or_(
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None
            )
        )
        .order_by(models.Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # is_liked bilgisini ekle
    liked_set: set = set()
    if current_user_id and posts:
        post_ids = [p.id for p in posts]
        liked = db.query(models.PostLike.post_id).filter(
            models.PostLike.user_id == current_user_id,
            models.PostLike.post_id.in_(post_ids),
        ).all()
        liked_set = {l[0] for l in liked}

    for p in posts:
        p.is_liked = p.id in liked_set  # type: ignore
        if p.user:
            p.author = p.user  # type: ignore

    return posts, total


def get_place_stories(db: Session, place_id: int):
    """Mekana ait aktif (süresi dolmamış) hikayeleri getir. Sadece gizli olmayan hesapların hikayeleri listelenir."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    stories = (
        db.query(models.Story)
        .join(models.User, models.Story.user_id == models.User.id)
        .outerjoin(models.UserPreferences, models.User.id == models.UserPreferences.user_id)
        .options(joinedload(models.Story.user))
        .filter(
            models.Story.place_id == place_id,
            models.Story.expires_at > now,
            or_(
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None
            )
        )
        .order_by(models.Story.created_at.desc())
        .all()
    )
    for s in stories:
        if s.user:
            s.author = s.user  # type: ignore
    return stories


def get_followed_place_ids(db: Session, user_id: int) -> list[int]:
    """Kullanıcının takip ettiği mekan ID'lerini döner (feed için)."""
    rows = db.query(models.PlaceFollow.place_id).filter(
        models.PlaceFollow.user_id == user_id
    ).all()
    return [r[0] for r in rows]


def get_interacted_place_ids(db: Session, user_id: int, min_score: int = 2) -> list[int]:
    """Kullanıcının belirli bir eşiğin üzerinde etkileşim skoru olan mekan ID'leri."""
    rows = db.query(models.PlaceInteraction.place_id).filter(
        models.PlaceInteraction.user_id == user_id,
        models.PlaceInteraction.score >= min_score,
    ).all()
    return [r[0] for r in rows]


# --- YORUM (REVIEW) İŞLEMLERİ ---



def create_review(
    db: Session,
    review: schemas.ReviewCreate,
    user_id: int,
    is_verified: bool = False,
    verify_method: str | None = None,
    distance_meters: int | None = None,
):
    """
    Google Yorumlar tarzında zenginleştirilmiş yorum oluşturur.
    Medya dosyaları, ziyaret detayları, kategorik puanlar dahil.
    """
    from datetime import datetime
    
    db_review = models.Review(
        user_id=user_id,
        place_id=review.place_id,
        comment_text=review.comment_text,
        rating=review.rating,
        is_verified=is_verified,
        verify_method=verify_method,
        distance_meters=distance_meters,
        verified_at=datetime.now() if is_verified else None,
        
        # Google Yorumlar tarzı detaylar
        visit_date=review.visit_date,
        visit_type=review.visit_type,
        spent_amount=review.spent_amount,
        spent_currency=review.spent_currency,
        wait_time_minutes=review.wait_time_minutes,
        ordered_items=review.ordered_items,
        
        # Kategorik puanlar
        food_rating=review.food_rating,
        service_rating=review.service_rating,
        atmosphere_rating=review.atmosphere_rating,
        value_rating=review.value_rating,
        cleanliness_rating=review.cleanliness_rating,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Medya dosyalarını ekle (varsa)
    if review.media_urls:
        for idx, media_data in enumerate(review.media_urls):
            db_media = models.ReviewMedia(
                review_id=db_review.id,
                media_type=media_data.get('type', 'photo'),
                media_url=media_data.get('url'),
                thumbnail_url=media_data.get('thumbnail'),
                width=media_data.get('width'),
                height=media_data.get('height'),
                file_size=media_data.get('file_size'),
                duration_seconds=media_data.get('duration'),
                order_index=idx,
            )
            db.add(db_media)
        db.commit()
        db.refresh(db_review)
    
    # Mekan ortalamasını güncelle
    update_place_average_rating(db, review.place_id)
    
    return db_review

def get_reviews_by_place(db: Session, place_id: int):
    """Bir mekana ait tüm yorumları medya dosyalarıyla birlikte getirir"""
    return (
        db.query(models.Review)
        .filter(models.Review.place_id == place_id)
        .order_by(models.Review.is_verified.desc(), models.Review.created_at.desc())
        .all()
    )

def update_place_average_rating(db: Session, place_id: int):
    """Bir mekanın ortalama puanını yeniden hesaplar"""
    reviews = db.query(models.Review).filter(models.Review.place_id == place_id).all()
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        place = db.query(models.Place).filter(models.Place.id == place_id).first()
        if place:
            place.average_rating = round(avg_rating, 1) # type: ignore
            db.commit()

def mark_review_helpful(db: Session, review_id: int):
    """Yorumu 'Yardımcı bulundu' olarak işaretle"""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if review:
        review.helpful_count += 1
        db.commit()
        db.refresh(review)
    return review

def add_owner_response(db: Session, review_id: int, response_text: str):
    """İşletme sahibinin yoruma yanıt vermesini sağlar"""
    from datetime import datetime
    
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if review:
        review.owner_response = response_text
        review.owner_response_at = datetime.now()
        db.commit()
        db.refresh(review)
    return review


# --- POST (SOSYAL AKIŞ) İŞLEMLERİ ---

def create_post(db: Session, user_id: int, data: schemas.PostCreate):
    # AI Moderation Check
    is_flagged = AIModerator.moderate_text(data.caption)
    # Check media (assuming first media URL if present)
    if not is_flagged and data.media:
        is_flagged = AIModerator.moderate_image(data.media[0].media_url)

    db_post = models.Post(
        user_id=user_id,
        place_id=data.place_id,
        caption=data.caption,
        post_type=data.post_type or "photo",
        comments_disabled=data.comments_disabled,
        likes_hidden=data.likes_hidden,
        is_flagged=is_flagged,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    for idx, m in enumerate(data.media):
        db_media = models.PostMedia(
            post_id=db_post.id,
            media_type=m.media_type,
            media_url=m.media_url,
            thumbnail_url=m.thumbnail_url,
            order_index=idx,
        )
        db.add(db_media)

    # Handle tagged users
    if data.tagged_user_ids:
        for tag_user_id in data.tagged_user_ids:
            # Verify user exists
            tagged_user = get_user_by_id(db, tag_user_id)
            if tagged_user and tagged_user.id != user_id:
                db_tag = models.PostTag(
                    post_id=db_post.id,
                    user_id=tag_user_id,
                )
                db.add(db_tag)
                # Send notification to tagged user
                create_notification(db, tag_user_id, "tag", user_id, post_id=db_post.id)

    db.commit()
    db.refresh(db_post)
    return db_post


def get_feed_paginated(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    current_user_id: int | None = None,
    filter_mode: str = "all",
    post_type: str | None = None,
):
    base = db.query(models.Post)
    if filter_mode == "following" and current_user_id:
        following_ids = (
            db.query(models.Follow.following_id)
            .filter(models.Follow.follower_id == current_user_id)
            .subquery()
        )
        base = base.filter(models.Post.user_id.in_(following_ids))
    if post_type:
        base = base.filter(models.Post.post_type == post_type)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


def get_feed_paginated_cursor(
    db: Session,
    page_size: int = 12,
    cursor: str | None = None,
    current_user_id: int | None = None,
    filter_mode: str = "all",
    post_type: str | None = None,
    scoring_context=None,   # FeedScoringContext | None — dışarıdan geçilebilir (test kolaylığı)
):
    """
    Cursor tabanlı feed sayfalama.

    filter_mode = "all"  → Puanlanmış / kişiselleştirilmiş keşfet akışı.
        - Sadece hesabı açık (public) olan ve takip etmediğimiz kişilerin gönderileri.
        - Her gönderi FeedScoringContext ile puanlanır (etkileşim + tazelik + sosyal + ilgi).
        - Cursor formatı: "score:<float>:<post_id>"  (azalan skor sırası)

    filter_mode = "following" → Saf kronolojik takip akışı.
        - Sadece takip ettiklerinin gönderileri, zaman sırasıyla.
        - Cursor formatı: "<created_at_iso>:<post_id>"
    """
    from datetime import datetime as _dt
    # pyrefly: ignore [missing-import]
    from sqlalchemy import or_, and_

    if filter_mode == "following":
        # ── TAKIP AKışı: saf kronoloji + takip edilen MEKANLAR ─────────────
        if not current_user_id:
            return [], None, False

        following_ids_sq = (
            db.query(models.Follow.following_id)
            .filter(
                models.Follow.follower_id == current_user_id,
                models.Follow.status == "accepted",
            )
            .subquery()
        )

        # Takip edilen mekan sahiplerinin ID'leri
        followed_place_ids = get_followed_place_ids(db, current_user_id)
        venue_owner_ids: list[int] = []
        if followed_place_ids:
            rows = db.query(models.Place.owner_id).filter(
                models.Place.id.in_(followed_place_ids),
                models.Place.owner_id.isnot(None),
            ).all()
            venue_owner_ids = [r[0] for r in rows if r[0]]

        # Kullanıcı takipleri + mekan sahiplerini birleştir
        feed_filters = [models.Post.user_id.in_(following_ids_sq)]
        if followed_place_ids and venue_owner_ids:
            feed_filters.append(
                and_(
                    models.Post.user_id.in_(venue_owner_ids),
                    models.Post.place_id.in_(followed_place_ids),
                )
            )
        base = _filter_non_flagged_posts(db.query(models.Post), db).filter(or_(*feed_filters))
        if post_type:
            base = base.filter(models.Post.post_type == post_type)

        # Cursor decode (created_at:id formatı)
        if cursor:
            try:
                cursor_dt_str, cursor_id_str = cursor.rsplit(":", 1)
                cursor_dt = _dt.fromisoformat(cursor_dt_str)
                cursor_id = int(cursor_id_str)
                base = base.filter(
                    or_(
                        models.Post.created_at < cursor_dt,
                        and_(
                            models.Post.created_at == cursor_dt,
                            models.Post.id < cursor_id,
                        ),
                    )
                )
            except (ValueError, AttributeError):
                pass

        posts = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
                joinedload(models.Post.tags).joinedload(models.PostTag.user),
            )
            .order_by(models.Post.created_at.desc(), models.Post.id.desc())
            .limit(page_size + 1)
            .all()
        )
        has_more = len(posts) > page_size
        if has_more:
            posts = posts[:page_size]
        next_cursor: str | None = None
        if has_more and posts:
            last = posts[-1]
            next_cursor = f"{last.created_at.isoformat()}:{last.id}"
        return posts, next_cursor, has_more


    # ── HERKES AKışI: Puanlanmış Keşfet Feed'i ─────────────────────────────
    # Sadece: hesabı açık + benim takip etmediğim (ve ben değilim) kişilerin gönderileri
    from app.services.feed_scorer import FeedScoringContext, score_post

    # Benim takip ettiklerimin ID seti
    my_following_ids: set[int] = set()
    if current_user_id:
        rows = db.query(models.Follow.following_id).filter(
            models.Follow.follower_id == current_user_id,
            models.Follow.status == "accepted",
        ).all()
        my_following_ids = {r[0] for r in rows}

    # Private hesapların ID seti
    private_user_ids: set[int] = {
        r[0] for r in db.query(models.UserPreferences.user_id)
        .filter(models.UserPreferences.is_private_account == True).all()
    }

    # Filtre: kamuya açık, takip etmediğim, benim değilim
    base = _filter_non_flagged_posts(db.query(models.Post), db)

    if current_user_id:
        # Engellediğim veya beni engelleyen kişileri bul
        blocked_by_me = {r[0] for r in db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == current_user_id).all()}
        blocked_me = {r[0] for r in db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == current_user_id).all()}
        all_blocked_ids = blocked_by_me | blocked_me
        
        # Takip ettiklerimi, private hesapları, kendimi ve engellenenleri çıkar
        exclude_ids = my_following_ids | private_user_ids | {current_user_id} | all_blocked_ids
        if exclude_ids:
            base = base.filter(models.Post.user_id.notin_(exclude_ids))
    else:
        # Giriş yapmamış → sadece public hesapların gönderileri
        if private_user_ids:
            base = base.filter(models.Post.user_id.notin_(private_user_ids))

    if post_type:
        base = base.filter(models.Post.post_type == post_type)

    # Cursor: "score:<float>:<post_id>"
    # Puanlı feed'de cursor'u basit kronoloji yerine skor bazlı tutuyoruz.
    # Pratik çözüm: cursor'dan sonraki sayfayı almak için geniş bir zaman penceresi çekip
    # Python'da puanla, sonra offset ile kes.
    # Büyük veritabanlarında bu pencereyi daraltmak gerekir; şu an son 30 günlük içerik yeterli.
    cursor_score_threshold: float | None = None
    cursor_post_id: int | None = None
    if cursor and cursor.startswith("score:"):
        try:
            _, score_str, post_id_str = cursor.split(":", 2)
            cursor_score_threshold = float(score_str)
            cursor_post_id = int(post_id_str)
        except (ValueError, AttributeError):
            pass

    # Puanlama bağlamını oluştur (dışarıdan geçilmemişse)
    if scoring_context is None:
        if current_user_id:
            scoring_context = FeedScoringContext.build(db, current_user_id)
        else:
            scoring_context = FeedScoringContext.empty()

    # Çekme penceresi: son 30 gün (çok eski içerik zaten düşük tazelik puanı alır)
    from datetime import timedelta, timezone as _tz
    window_start = _dt.now(_tz.utc) - timedelta(days=30)

    # Makul bir batch çek (page_size * 8), puanla, sırala, kes
    # Not: 25M+ veritabanında bu sorgu index taramasıyla hızlıdır.
    BATCH_MULTIPLIER = 8
    batch_size = page_size * BATCH_MULTIPLIER

    raw_posts = (
        base.filter(models.Post.created_at >= window_start)
        .options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .limit(batch_size)
        .all()
    )

    # Tüm postları puana göre sırala
    scored: list[tuple[float, models.Post]] = []
    for p in raw_posts:
        s = score_post(
            p,
            fof_ids=scoring_context.fof_ids,
            direct_following_of_friends=scoring_context.direct_following_of_friends,
            user_interest_keywords=scoring_context.user_interest_keywords,
            liked_place_categories=scoring_context.liked_place_categories,
            interacted_place_ids=scoring_context.interacted_place_ids,
        )
        scored.append((s, p))

    # Azalan puana göre sırala, eşit puanda en yeni önce
    scored.sort(key=lambda x: (-x[0], -x[1].id))

    # Cursor'dan sonrasını al
    if cursor_score_threshold is not None and cursor_post_id is not None:
        # Cursor noktasından sonraki elemanları bul
        cursor_idx = None
        for i, (s, p) in enumerate(scored):
            if p.id == cursor_post_id:
                cursor_idx = i
                break
        if cursor_idx is not None:
            scored = scored[cursor_idx + 1:]
        else:
            # Cursor bulunamadı (eski içerik temizlenmiş olabilir) — eşik bazlı geç
            scored = [(s, p) for s, p in scored if s < cursor_score_threshold or (s == cursor_score_threshold and p.id < cursor_post_id)]

    has_more = len(scored) > page_size
    page_scored = scored[:page_size]

    posts = [p for _, p in page_scored]

    next_cursor_all: str | None = None
    if has_more and page_scored:
        last_score, last_post = page_scored[-1]
        next_cursor_all = f"score:{last_score}:{last_post.id}"

    return posts, next_cursor_all, has_more



def get_post_by_id(db: Session, post_id: int):
    return (
        db.query(models.Post)
        .options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .filter(models.Post.id == post_id)
        .first()
    )


def delete_post(db: Session, post_id: int, user_id: int):
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.user_id == user_id).first()
    if post:
        db.delete(post)
        db.commit()
        return True
    return False


def toggle_post_like(db: Session, post_id: int, user_id: int):
    like = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id, models.PostLike.user_id == user_id
    ).first()
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        return None, False
    if like:
        db.delete(like)
        post.like_count = max(0, post.like_count - 1) # type: ignore
        db.commit()
        return post, False
    db.add(models.PostLike(post_id=post_id, user_id=user_id))
    post.like_count += 1 # type: ignore
    db.commit()
    db.refresh(post)
    return post, True


def is_post_liked_by_user(db: Session, post_id: int, user_id: int | None) -> bool:
    if not user_id:
        return False
    return db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id, models.PostLike.user_id == user_id
    ).first() is not None


def get_comments_paginated(db: Session, post_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.PostComment).filter(models.PostComment.post_id == post_id)
    total = base.count()
    offset = (page - 1) * page_size
    comments = (
        base.options(joinedload(models.PostComment.user))
        .order_by(models.PostComment.created_at.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return comments, total


def add_post_comment(db: Session, post_id: int, user_id: int, text: str):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        return None
    if post.comments_disabled:
        return None  # Yorumlar kapatılmış
        
    # AI Moderation Check
    is_flagged = AIModerator.moderate_text(text)
    
    comment = models.PostComment(
        post_id=post_id, 
        user_id=user_id, 
        text=text,
        is_flagged=is_flagged
    )
    db.add(comment)
    
    # Sadece temiz yorumlar sayacı artırır
    if not is_flagged:
        post.comment_count += 1 # type: ignore
        
    db.commit()
    db.refresh(comment)
    return comment


def get_posts_by_user(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.Post).filter(models.Post.user_id == user_id)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


def get_posts_by_place(db: Session, place_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.Post).filter(models.Post.place_id == place_id)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


# --- STORY (Hikaye) ---

def create_story(db: Session, user_id: int, data: schemas.StoryCreate):
    import json as _json
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    # Gizlilik tipi: eski is_close_friends alanına geriye dönük destek
    privacy_type = data.resolved_privacy_type() if hasattr(data, 'resolved_privacy_type') else (
        "close_friends" if data.is_close_friends else data.privacy_type
    )

    story = models.Story(
        user_id=user_id,
        place_id=data.place_id,
        media_type=data.media_type,
        media_url=data.media_url,
        thumbnail_url=data.thumbnail_url,
        privacy_type=privacy_type,
        location_data=_json.dumps(data.location_data) if data.location_data else None,
        expires_at=expires_at,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


def get_stories_by_place(db: Session, place_id: int, page: int = 1, page_size: int = 50):
    now = datetime.now(timezone.utc)
    base = (
        db.query(models.Story)
        .filter(models.Story.place_id == place_id, models.Story.expires_at > now)
        # Mekan hikayelerinde sadece genel (public) hikayeler görünür
        .filter(models.Story.privacy_type == "public")
    )
    total = base.count()
    offset = (page - 1) * page_size
    stories = (
        base.options(
            joinedload(models.Story.user),
            joinedload(models.Story.place),
        )
        .order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return stories, total


def get_feed_stories(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    current_user_id: int | None = None,
    filter_mode: str = "all",
):
    """
    Akış hikayelerini getirir.

    Gizlilik filtresi (AŞAMA 4):
    • public hikayeler herkese görünür
    • close_friends hikayeler SADECE o kullanıcının
      'close_friends' listesindeki kullanıcılara görünür.

    Yakın arkadaş listesi mantığı:
      Hikaye sahibinin, izleyiciyi takip etmesi (mutual follow) VE
      hikayeyi close_friends olarak işaretlemesi gerekir.
      Bu implementasyonda basitlik için: mutual follow = close_friends listesi.
    """
    now = datetime.now(timezone.utc)

    if current_user_id:
        # Kullanıcının takip ettikleri (following)
        following_ids_sq = (
            db.query(models.Follow.following_id)
            .filter(models.Follow.follower_id == current_user_id)
            .subquery()
        )
        # Kullanıcıyı takip edenler (followers) — mutual için gerekli
        follower_ids_sq = (
            db.query(models.Follow.follower_id)
            .filter(models.Follow.following_id == current_user_id)
            .subquery()
        )

        # pyrefly: ignore [missing-import]
        from sqlalchemy import or_, and_  # noqa – already imported at top level; kept for clarity

        # Gizlilik koşulu:
        # 1. Genel hikayeler herkes görebilir
        # 2. close_friends hikayeleri sadece mutual follow (karşılıklı takip) varsa
        privacy_filter = or_(
            models.Story.privacy_type == "public",
            and_(
                models.Story.privacy_type == "close_friends",
                # Hikaye sahibi beni takip ediyor (ben close_friends listesindeyim)
                models.Story.user_id.in_(follower_ids_sq),
            )
        )

        base = db.query(models.Story).filter(
            models.Story.expires_at > now,
            privacy_filter,
        )

        if filter_mode == "following":
            base = base.filter(models.Story.user_id.in_(following_ids_sq))
    else:
        # Giriş yapmamış kullanıcı: sadece public hikayeler
        base = db.query(models.Story).filter(
            models.Story.expires_at > now,
            models.Story.privacy_type == "public",
        )

    total = base.count()
    offset = (page - 1) * page_size
    stories = (
        base.options(
            joinedload(models.Story.user),
            joinedload(models.Story.place),
        )
        .order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return stories, total


# --- FOLLOW (Kademe 5) ---

def toggle_follow(db: Session, follower_id: int, following_id: int) -> tuple[bool, bool]:
    """Takip et / takipten çık. Returns (is_following, was_created).
    is_following is True when the follow relationship is active ("accepted")."""
    if follower_id == following_id:
        return False, False
    
    existing = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return False, False

    # Check if target user is private
    target_prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id == following_id).first()
    is_private = target_prefs.is_private_account if target_prefs else False
    
    status = "pending" if is_private else "accepted"
    new_follow = models.Follow(follower_id=follower_id, following_id=following_id, status=status)
    db.add(new_follow)
    db.commit()
    is_following = status == "accepted"
    return is_following, True

def accept_follow_request(db: Session, follower_id: int, following_id: int) -> bool:
    """Pending bir takip isteğini onaylar."""
    req = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "pending"
    ).first()
    if req:
        req.status = "accepted"
        db.commit()
        return True
    return False

def reject_follow_request(db: Session, follower_id: int, following_id: int) -> bool:
    """Pending bir takip isteğini reddeder (siler)."""
    req = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "pending"
    ).first()
    if req:
        db.delete(req)
        db.commit()
        return True
    return False


def is_following(db: Session, follower_id: int, following_id: int) -> bool:
    if not follower_id or follower_id == following_id:
        return False
    return db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "accepted",
    ).first() is not None


def get_follower_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.follower_id).filter(
        models.Follow.following_id == user_id,
        models.Follow.status == "accepted"
    ).all()]


def get_following_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.following_id).filter(
        models.Follow.follower_id == user_id,
        models.Follow.status == "accepted"
    ).all()]


# --- NOTIFICATION (Kademe 5 – Novu Workflow + Munia Payload) ---


def _build_rich_payload(
    db: Session,
    actor_id: int,
    post_id: int | None = None,
    comment_text: str | None = None,
    extra: dict | None = None,
) -> str:
    """
    Munia-tarzı zengin JSON payload oluşturur.
    Bildirim kartında avatar, kullanıcı adı, post thumbnail ve yorum önizlemesi gösterilir.
    """
    import json
    actor = get_user_by_id(db, actor_id)
    data: dict = {
        "actor_username": actor.username if actor else None,
        "actor_avatar": actor.avatar_url if actor else None,
    }

    if post_id:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post and post.media:
            first_media = (
                db.query(models.PostMedia)
                .filter(models.PostMedia.post_id == post_id)
                .order_by(models.PostMedia.order_index)
                .first()
            )
            if first_media:
                data["post_thumbnail"] = first_media.thumbnail_url or first_media.media_url

    if comment_text:
        data["text"] = comment_text[:100]

    if extra:
        data.update(extra)

    return json.dumps(data)


def _compute_group_key(notif_type: str, post_id: int | None = None) -> str | None:
    """
    Novu digest mantığı: Aynı gruba ait bildirimleri birleştirmek için anahtar üret.
    Örn: "like:post:42" — 42 nolu post'a gelen tüm beğeniler gruplandırılır.
    """
    if notif_type in ("like", "comment") and post_id:
        return f"{notif_type}:post:{post_id}"
    return None


def _get_digest_count(db: Session, user_id: int, group_key: str) -> int:
    """Aynı group_key'e sahip bildirim sayısını döner (digest count)."""
    if not group_key:
        return 0
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.group_key == group_key,
    ).count()


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    actor_id: int,
    post_id: int | None = None,
    push_extra: dict | None = None,
    payload: str | None = None,
    comment_text: str | None = None,
):
    """
    Bildirim oluştur + push notification gönder + websocket üzerinden anlık fırlat.
    Munia & Novu mimarisi: OmnichannelManager'a delege eder.
    Novu Subscriber Preferences: Kullanıcının tercihlerine göre bildirim gönderilmeyebilir.
    """
    # Novu Subscriber Preferences kontrolü
    NOTIF_PREF_MAP = {
        "like": "notify_likes",
        "comment": "notify_comments",
        "follow": "notify_follows",
        "follow_request": "notify_follows",
        "follow_accepted": "notify_follows",
        "message": "notify_messages",
    }
    pref_field = NOTIF_PREF_MAP.get(type)
    if pref_field:
        prefs = get_or_create_preferences(db, user_id)
        if not getattr(prefs, pref_field, True):
            return None  # Kullanıcı bu tür bildirimi kapattı

    from app.repositories.notification_repo import PostgresNotificationRepository
    from app.services.notification_provider import OmnichannelManager

    repo = PostgresNotificationRepository(db)
    manager = OmnichannelManager(repo, db=db)


    place_id = None
    if post_id:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post:
            place_id = post.place_id

    return manager.notify(
        user_id=user_id,
        type=type,
        actor_id=actor_id,
        post_id=post_id,
        place_id=place_id,
        payload=payload,
        comment_text=comment_text,
        push_extra=push_extra
    )


def get_notifications_paginated(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_paginated(user_id, page, page_size)


def get_follow_requests(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Sadece bekleyen takip isteklerini getirir (Novu: ayrı kanal)."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_follow_requests(user_id, page, page_size)


def mark_notifications_read(db: Session, user_id: int):
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    repo.mark_all_read(user_id)


def mark_single_notification_read(db: Session, notification_id: int, user_id: int) -> bool:
    """Tekil bildirimi okundu olarak işaretle."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.mark_read(notification_id, user_id)


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Tekil bildirimi sil."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.delete(notification_id, user_id)


def get_unread_notification_count(db: Session, user_id: int) -> int:
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_unread_count(user_id)


# --- PROFİL İSTATİSTİKLERİ (Kademe 6) ---

def get_user_stats(db: Session, user_id: int) -> dict:
    """
    Kullanıcı istatistiklerini tek SQL sorgusuyla getirir.
    7 ayrı round-trip yerine 1 CTE sorgusu → cloud DB gecikmesi minimize edilir.
    """
    from sqlalchemy import text as sa_text
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    sql = sa_text("""
        WITH
        counts AS (
            SELECT
                (SELECT COUNT(*) FROM posts         WHERE user_id = :uid)                                          AS post_count,
                (SELECT COUNT(*) FROM follows        WHERE following_id = :uid AND status = 'accepted')            AS follower_count,
                (SELECT COUNT(*) FROM follows        WHERE follower_id  = :uid AND status = 'accepted')            AS following_count,
                (SELECT COUNT(*) FROM reviews        WHERE user_id = :uid)                                         AS review_count,
                (SELECT COUNT(*) FROM reviews        WHERE user_id = :uid AND created_at >= :start_of_month)       AS visits_this_month
        ),
        fav_category AS (
            SELECT p.category
            FROM reviews r JOIN places p ON p.id = r.place_id
            WHERE r.user_id = :uid AND p.category IS NOT NULL
            GROUP BY p.category ORDER BY COUNT(*) DESC LIMIT 1
        ),
        fav_region AS (
            SELECT p.city
            FROM reviews r JOIN places p ON p.id = r.place_id
            WHERE r.user_id = :uid AND p.city IS NOT NULL
            GROUP BY p.city ORDER BY COUNT(*) DESC LIMIT 1
        )
        SELECT
            c.post_count, c.follower_count, c.following_count,
            c.review_count, c.visits_this_month,
            fc.category AS favorite_category,
            fr.city     AS favorite_region
        FROM counts c
        LEFT JOIN fav_category fc ON true
        LEFT JOIN fav_region   fr ON true;
    """)

    row = db.execute(sql, {"uid": user_id, "start_of_month": start_of_month}).fetchone()
    if row is None:
        return {
            "post_count": 0, "follower_count": 0, "following_count": 0,
            "review_count": 0, "visit_count": 0, "visits_this_month": 0,
            "favorite_category": None, "favorite_region": None,
        }
    return {
        "post_count": row.post_count or 0,
        "follower_count": row.follower_count or 0,
        "following_count": row.following_count or 0,
        "review_count": row.review_count or 0,
        "visit_count": row.review_count or 0,
        "visits_this_month": row.visits_this_month or 0,
        "favorite_category": row.favorite_category,
        "favorite_region": row.favorite_region,
    }


# --- KAYDETME (SAVED / BOOKMARK) ---

def toggle_save_place(db: Session, user_id: int, place_id: int) -> bool:
    """Mekanı kaydet / kaydı kaldır. Returns is_now_saved."""
    existing = db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id,
        models.SavedPlace.place_id == place_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    saved = models.SavedPlace(user_id=user_id, place_id=place_id)
    db.add(saved)
    db.commit()
    return True


def toggle_save_post(db: Session, user_id: int, post_id: int) -> bool:
    """Postu kaydet / kaydı kaldır. Returns is_now_saved."""
    existing = db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id,
        models.SavedPost.post_id == post_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    saved = models.SavedPost(user_id=user_id, post_id=post_id)
    db.add(saved)
    db.commit()
    return True


def get_saved_places(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Kullanıcının kaydettiği mekanları döndürür (en yeniden eskiye)."""
    q = db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id
    ).order_by(models.SavedPlace.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    places = []
    for sp in items:
        place = get_place_by_id(db, sp.place_id)
        if place:
            places.append(place)
    return places, total


def get_saved_posts(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Kullanıcının kaydettiği postları döndürür (en yeniden eskiye)."""
    q = db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id
    ).order_by(models.SavedPost.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    posts = []
    for sp in items:
        post = get_post_by_id(db, sp.post_id)
        if post:
            posts.append(post)
    return posts, total


def is_place_saved(db: Session, user_id: int, place_id: int) -> bool:
    return db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id,
        models.SavedPlace.place_id == place_id,
    ).first() is not None


def is_post_saved(db: Session, user_id: int, post_id: int) -> bool:
    return db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id,
        models.SavedPost.post_id == post_id,
    ).first() is not None


# --- YORUM SİLME ---

def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
    """Kendi yorumunu sil. Post comment_count'u azalt."""
    comment = db.query(models.PostComment).filter(
        models.PostComment.id == comment_id,
        models.PostComment.user_id == user_id,
    ).first()
    if not comment:
        return False
    post = db.query(models.Post).filter(models.Post.id == comment.post_id).first()
    if post and post.comment_count > 0:
        post.comment_count -= 1
    db.delete(comment)
    db.commit()
    return True


# --- RAPOR ---

def create_report(db: Session, reporter_id: int, target_type: str, target_id: int, reason: str, description: str = None):
    """Rapor oluştur (post, comment, user, match_profile)."""
    report = models.Report(
        reporter_id=reporter_id,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        description=description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# --- ENGELLEME ---

def toggle_block_user(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Kullanıcıyı engelle / engeli kaldır. Returns is_now_blocked."""
    existing = db.query(models.UserBlock).filter(
        models.UserBlock.blocker_id == blocker_id,
        models.UserBlock.blocked_id == blocked_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    block = models.UserBlock(blocker_id=blocker_id, blocked_id=blocked_id)
    db.add(block)
    
    # Engelleme durumunda her iki yöndeki takipler (follow ve follow_request) silinmeli
    db.query(models.Follow).filter(
        (
            (models.Follow.follower_id == blocker_id) & 
            (models.Follow.following_id == blocked_id)
        ) | (
            (models.Follow.follower_id == blocked_id) & 
            (models.Follow.following_id == blocker_id)
        )
    ).delete(synchronize_session=False)

    db.commit()
    return True


def is_blocked(db: Session, blocker_id: int, blocked_id: int) -> bool:
    return db.query(models.UserBlock).filter(
        models.UserBlock.blocker_id == blocker_id,
        models.UserBlock.blocked_id == blocked_id,
    ).first() is not None


def users_block_each_other(db: Session, user_a: int, user_b: int) -> bool:
    """Her iki yönde engel var mı (A→B veya B→A)."""
    return is_blocked(db, user_a, user_b) or is_blocked(db, user_b, user_a)


def get_blocked_user_ids(db: Session, user_id: int) -> list[int]:
    """Kullanıcının engellediği tüm ID'leri döndürür."""
    rows = db.query(models.UserBlock.blocked_id).filter(
        models.UserBlock.blocker_id == user_id
    ).all()
    return [r[0] for r in rows]


# --- UNMATCH ---

def unmatch_conversation(db: Session, conversation_id: int, user_id: int) -> bool:
    """Eşleşme konuşmasını sil (unmatch). Mesajlar cascade ile silinir."""
    conv = db.query(models.MatchConversation).filter(
        models.MatchConversation.id == conversation_id,
    ).first()
    if not conv:
        return False
    if conv.user1_id != user_id and conv.user2_id != user_id:
        return False

    # MatchLike kayıtlarını da sil
    other_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
    db.query(models.MatchLike).filter(
        ((models.MatchLike.from_user_id == user_id) & (models.MatchLike.to_user_id == other_id)) |
        ((models.MatchLike.from_user_id == other_id) & (models.MatchLike.to_user_id == user_id))
    ).delete(synchronize_session=False)

    db.delete(conv)
    db.commit()
    return True


# --- MEKAN GÜNCELLEME ---

def update_place(db: Session, place_id: int, data: dict):
    """Mekan bilgilerini günceller. gallery_urls ve menu_items için JSON serileştirmesi yapar."""
    import json as _json
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        return None

    # Map schema field names to model column names & serialize lists
    if "gallery_urls" in data and data["gallery_urls"] is not None:
        place.gallery_urls = _json.dumps(data.pop("gallery_urls"))
    elif "gallery_urls" in data:
        data.pop("gallery_urls")

    if "menu_items" in data and data["menu_items"] is not None:
        place.menu_items_json = _json.dumps(data.pop("menu_items"))
    elif "menu_items" in data:
        data.pop("menu_items")

    if "opening_hours_json" in data and data["opening_hours_json"] is not None:
        place.opening_hours_json = _json.dumps(data.pop("opening_hours_json"), ensure_ascii=False)
    elif "opening_hours_json" in data:
        data.pop("opening_hours_json")

    for key, value in data.items():
        if hasattr(place, key) and value is not None:
            setattr(place, key, value)
    db.commit()
    db.refresh(place)
    return place


# --- KULLANICI TERCİHLERİ (USER PREFERENCES) ---

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

# --- DISCOVER (KEŞFET) ALGORİTMASI ---
def get_discover_feed_paginated(db: Session, page: int = 1, page_size: int = 20):
    """
    HackerNews tarzı Etkileşim ve Zaman Aşımı (Time Decay) algoritması.
    Sadece is_flagged=False olan temiz içerikleri getirir.
    Formül: (likes*1 + comments*2) / POW(AgeInHours + 2, 1.5)
    """
    # pyrefly: ignore [missing-import]
    from sqlalchemy import extract, func, text

    offset = (page - 1) * page_size

    # SQLite compatible age calculation (julyan day or seconds difference)
    # Since we use sqlite mostly for dev, we use a simple text/func workaround 
    # For actual PostgreSQL it would be extract(epoch from (now() - created_at))
    # Assuming SQLite, we use julianday
    try:
        # PostgreSQL specific syntax (Munia recommendation)
        score_formula = (
            (models.Post.like_count * 1 + models.Post.comment_count * 2) /
            func.pow(
                func.extract('epoch', func.now() - models.Post.created_at) / 3600.0 + 2, 
                1.5
            )
        )
        
        base = _filter_non_flagged_posts(db.query(models.Post), db)

        # Order by computed score
        items = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
            )
            .order_by(score_formula.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return items, base.count()
    except Exception as e:
        # Fallback to simple chronological if DB doesn't support pow/extract epoch (like SQLite)
        base = _filter_non_flagged_posts(db.query(models.Post), db)
        items = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
            )
            .order_by(models.Post.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return items, base.count()

