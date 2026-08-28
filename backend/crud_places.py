"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from datetime import datetime
from datetime import timezone
from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
import models
import schemas
from config import get_settings

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

        # Eğer photo_url google_photo_ref: ise → Google API key varsa proxy URL'e çevir,
        # yoksa None yap ki frontend kategori placeholder'ına düşsün.
        if getattr(p, "photo_url", None) and p.photo_url.startswith("google_photo_ref:"):
            settings = get_settings()
            has_key = bool(settings.GOOGLE_PLACES_API_KEY or settings.GOOGLE_MAPS_API_KEY)
            if has_key:
                p.photo_url = f"/api/v1/places/{p.id}/photo"
            else:
                p.photo_url = None  # type: ignore

        # gallery_urls içindeki google_photo_ref:'leri de proxy URL'e çevir (veya temizle)
        if hasattr(p, "gallery_urls") and isinstance(p.gallery_urls, list):
            settings = get_settings()
            has_key = bool(settings.GOOGLE_PLACES_API_KEY or settings.GOOGLE_MAPS_API_KEY)
            converted = []
            for idx, url in enumerate(p.gallery_urls):
                if isinstance(url, str) and url.startswith("google_photo_ref:"):
                    if has_key:
                        converted.append(f"/api/v1/places/{p.id}/gallery/{idx}")
                    # key yoksa bu URL'i atla (listeye ekleme)
                else:
                    converted.append(url)
            p.gallery_urls = converted  # type: ignore

    return places


def get_places(db: Session, skip: int = 0, limit: int = 100):
    items = db.query(models.Place).order_by(models.Place.id.desc()).offset(skip).limit(limit).all()
    return _enrich_places_with_stats(db, items)


def get_places_lite(db: Session, skip: int = 0, limit: int = 6000):
    """Harita/liste görünümü için minimal kolon seçimi — gallery_urls, menu_items_json,
    opening_hours_json, description gibi ağır alanları hiç DB'den çekmez, Review/SavedPlace/
    PlaceFollow enrichment join'lerini atlar (user_ratings_total zaten Google'dan gelen kolon).
    Büyük hacimli (binlerce kayıt) tam-liste isteklerinde payload/CPU maliyetini ciddi azaltır."""
    cols = (
        models.Place.id, models.Place.name, models.Place.address, models.Place.city,
        models.Place.category, models.Place.latitude, models.Place.longitude,
        models.Place.price_range, models.Place.photo_url, models.Place.average_rating,
        models.Place.user_ratings_total,
    )
    rows = (
        db.query(*cols)
        .order_by(models.Place.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(func.count(models.Place.id)).scalar()
    return rows, total


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
    minimal: bool = False,
):
    """Mekan arama — isim, kategori, şehir filtreleri."""
    from sqlalchemy import func
    bind = db.get_bind()
    query = db.query(models.Place)
    has_q = bool(q)
    
    if has_q:
        if bind.dialect.name == "postgresql":
            query = query.filter(func.similarity(models.Place.name, q) > 0.2)
            query = query.order_by(func.similarity(models.Place.name, q).desc())
        else:
            query = query.filter(models.Place.name.ilike(f"%{q}%"))
            
    if category:
        query = query.filter(models.Place.category == category)
    if city:
        query = query.filter(models.Place.city.ilike(f"%{city}%"))
        
    total = query.count()
    offset = (page - 1) * page_size
    
    if not has_q or bind.dialect.name != "postgresql":
        query = query.order_by(models.Place.average_rating.desc())
        
    items = query.offset(offset).limit(page_size).all()
    if not minimal:
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
    Yakındaki mekanları döndürür — PostgreSQL/PostGIS veya SQLite (Bounding Box + Haversine) fallback.
    """
    bind = db.get_bind()
    if bind.dialect.name == "postgresql":
        # PostgreSQL/PostGIS optimize edilmiş ST_DistanceSphere sorgusu
        distance_expr = func.ST_DistanceSphere(
            func.ST_MakePoint(models.Place.longitude, models.Place.latitude),
            func.ST_MakePoint(lng, lat)
        )
        query = db.query(
            models.Place,
            (distance_expr / 1000.0).label("distance_km")
        ).filter(
            models.Place.latitude.isnot(None),
            models.Place.longitude.isnot(None),
            distance_expr <= radius_km * 1000.0
        ).order_by("distance_km")
        
        total = query.count()
        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()
        
        paginated = []
        for p, d_km in results:
            p._distance_km = round(d_km, 2)
            paginated.append(p)
            
        paginated = _enrich_places_with_stats(db, paginated)
        return paginated, total

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
    ).order_by(models.PlaceFollow.created_at.desc()).all()
    return [r[0] for r in rows]


def get_interacted_place_ids(db: Session, user_id: int, min_score: int = 2) -> list[int]:
    """Kullanıcının belirli bir eşiğin üzerinde etkileşim skoru olan mekan ID'leri."""
    rows = db.query(models.PlaceInteraction.place_id).filter(
        models.PlaceInteraction.user_id == user_id,
        models.PlaceInteraction.score >= min_score,
    ).all()
    return [r[0] for r in rows]


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
