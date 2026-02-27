from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
import bcrypt
import models, schemas

# bcrypt 72 byte sınırı – uzun şifreleri kırp
def _to_bcrypt_password(pw: str) -> bytes:
    enc = pw.encode("utf-8")
    return enc[:72] if len(enc) > 72 else enc

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
    )
    db.add(db_user)
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


def get_or_create_user_for_login(db: Session, email: str, password: str):
    """Auth bypass: kullanıcı varsa döndür, yoksa oluştur. Şifre kontrolü yapılmaz."""
    user = get_user_by_email(db, email)
    if user:
        return user
    username_base = email.split("@")[0].replace(".", "_")[:30]
    username = username_base
    idx = 0
    while get_user_by_username(db, username):
        idx += 1
        username = f"{username_base}_{idx}"
    user_data = schemas.UserCreate(email=email, password=password, username=username)
    return create_user(db, user_data)

# --- MEKAN (PLACE) İŞLEMLERİ ---

def get_places(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Place).order_by(models.Place.id.desc()).offset(skip).limit(limit).all()

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
    return items, total

def create_place(db: Session, place: schemas.PlaceCreate):
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
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

def get_place_by_id(db: Session, place_id: int):
    return db.query(models.Place).filter(models.Place.id == place_id).first()

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
            place.average_rating = round(avg_rating, 1)
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
    db_post = models.Post(
        user_id=user_id,
        place_id=data.place_id,
        caption=data.caption,
        post_type=data.post_type or "photo",
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
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


def get_post_by_id(db: Session, post_id: int):
    return (
        db.query(models.Post)
        .options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
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
        post.like_count = max(0, post.like_count - 1)
        db.commit()
        return post, False
    db.add(models.PostLike(post_id=post_id, user_id=user_id))
    post.like_count += 1
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
    comment = models.PostComment(post_id=post_id, user_id=user_id, text=text)
    db.add(comment)
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post:
        post.comment_count += 1
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
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


# --- STORY (Hikaye) ---

def create_story(db: Session, user_id: int, data: schemas.StoryCreate):
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    story = models.Story(
        user_id=user_id,
        place_id=data.place_id,
        media_type=data.media_type,
        media_url=data.media_url,
        thumbnail_url=data.thumbnail_url,
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
    """Akış için hikayeler – süresi dolmamış, takip edilenler veya herkes."""
    now = datetime.now(timezone.utc)
    base = db.query(models.Story).filter(models.Story.expires_at > now)
    if filter_mode == "following" and current_user_id:
        following_ids = (
            db.query(models.Follow.following_id)
            .filter(models.Follow.follower_id == current_user_id)
            .subquery()
        )
        base = base.filter(models.Story.user_id.in_(following_ids))
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
    """Takip et / takipten çık. Returns (is_now_following, was_created)."""
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
    db.add(models.Follow(follower_id=follower_id, following_id=following_id))
    db.commit()
    return True, True


def is_following(db: Session, follower_id: int, following_id: int) -> bool:
    if not follower_id or follower_id == following_id:
        return False
    return db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
    ).first() is not None


def get_follower_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.follower_id).filter(models.Follow.following_id == user_id).all()]


def get_following_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.following_id).filter(models.Follow.follower_id == user_id).all()]


# --- NOTIFICATION (Kademe 5) ---

def create_notification(db: Session, user_id: int, type: str, actor_id: int, post_id: int | None = None):
    if user_id == actor_id:
        return None
    n = models.Notification(user_id=user_id, type=type, actor_id=actor_id, post_id=post_id)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_notifications_paginated(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    total = base.count()
    offset = (page - 1) * page_size
    items = (
        base.order_by(models.Notification.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return items, total


def mark_notifications_read(db: Session, user_id: int):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False,
    ).update({models.Notification.is_read: True})
    db.commit()


def get_unread_notification_count(db: Session, user_id: int) -> int:
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False,
    ).count()


# --- PROFİL İSTATİSTİKLERİ (Kademe 6) ---

def get_user_stats(db: Session, user_id: int) -> dict:
    post_count = db.query(models.Post).filter(models.Post.user_id == user_id).count()
    review_count = db.query(models.Review).filter(models.Review.user_id == user_id).count()
    visit_count = review_count
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    visits_this_month = (
        db.query(models.Review)
        .filter(models.Review.user_id == user_id, models.Review.created_at >= start_of_month)
        .count()
    )
    favorite_category = None
    favorite_region = None
    if review_count > 0:
        cat_row = (
            db.query(models.Place.category, func.count(models.Review.id))
            .join(models.Review, models.Review.place_id == models.Place.id)
            .filter(models.Review.user_id == user_id, models.Place.category.isnot(None))
            .group_by(models.Place.category)
            .order_by(func.count(models.Review.id).desc())
            .first()
        )
        if cat_row and cat_row[0]:
            favorite_category = cat_row[0]
        region_row = (
            db.query(models.Place.city, func.count(models.Review.id))
            .join(models.Review, models.Review.place_id == models.Place.id)
            .filter(models.Review.user_id == user_id, models.Place.city.isnot(None))
            .group_by(models.Place.city)
            .order_by(func.count(models.Review.id).desc())
            .first()
        )
        if region_row and region_row[0]:
            favorite_region = region_row[0]
    return {
        "post_count": post_count,
        "review_count": review_count,
        "visit_count": visit_count,
        "visits_this_month": visits_this_month,
        "favorite_category": favorite_category,
        "favorite_region": favorite_region,
    }
