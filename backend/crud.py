from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext

# Şifreleme ayarları
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- KULLANICI İŞLEMLERİ ---

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    
    if not pwd_context.verify(password, user.password_hash):
        return False
        
    return user

# --- MEKAN (PLACE) İŞLEMLERİ ---

def get_places(db: Session, skip: int = 0, limit: int = 100):
    # Yeni eklenen mekanlar önce gelsin (ID'ye göre ters sıralama)
    return db.query(models.Place).order_by(models.Place.id.desc()).offset(skip).limit(limit).all()

def create_place(db: Session, place: schemas.PlaceCreate):
    db_place = models.Place(
        name=place.name,
        address=place.address,
        city=place.city,
        description=place.description,
        price_range=place.price_range,
        category=place.category,
        features=place.features,
        latitude=place.latitude,
        longitude=place.longitude,
        photo_url=getattr(place, "photo_url", None),
        video_url=getattr(place, "video_url", None),
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
