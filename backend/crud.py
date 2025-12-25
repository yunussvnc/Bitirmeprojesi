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
    return db.query(models.Place).offset(skip).limit(limit).all()

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
        longitude=place.longitude
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

def update_place_vector_id(db: Session, place_id: int, vector_id: str):
    """Vektör DB'ye (Qdrant vb.) kayıt edildikten sonra ID'yi SQL'e işler."""
    db_place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if db_place:
        db_place.vector_id = vector_id
        db.commit()
    return db_place

# --- YORUM (REVIEW) İŞLEMLERİ ---

def create_review(db: Session, review: schemas.ReviewCreate, user_id: int, is_verified: bool = False):
    """
    Yorum oluşturur. 
    is_verified: QR kod doğrulaması başarılıysa True gönderilir.
    """
    db_review = models.Review(
        user_id=user_id,
        place_id=review.place_id,
        comment_text=review.comment_text,
        rating=review.rating,
        is_verified=is_verified
    )
    db.add(db_review)
    
    # Mekan ortalamasını güncelleme mantığı (Basitçe)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_by_place(db: Session, place_id: int):
    return db.query(models.Review).filter(models.Review.place_id == place_id).all()
