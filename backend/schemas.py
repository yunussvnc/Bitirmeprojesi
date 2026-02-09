from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- KULLANICI (USER) ŞEMALARI ---

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- MEKAN (PLACE) ŞEMALARI ---

class PlaceBase(BaseModel):
    name: str
    address: str
    city: str
    description: Optional[str] = None
    price_range: Optional[int] = None # 1 ile 4 arası
    category: Optional[str] = None
    features: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None  # Mekan fotoğrafı
    video_url: Optional[str] = None  # Mekan videosu

class PlaceCreate(PlaceBase):
    pass # Mekan eklerken tüm base alanları kullanıyoruz

class Place(PlaceBase):
    id: int
    vector_id: Optional[str] = None
    average_rating: float
    photo_url: Optional[str] = None
    video_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- YORUM (REVIEW) ŞEMALARI ---

class ReviewMediaBase(BaseModel):
    """Yorum medyası (fotoğraf/video)"""
    media_type: str  # "photo" veya "video"
    media_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    duration_seconds: Optional[int] = None
    order_index: int = 0

class ReviewMediaCreate(ReviewMediaBase):
    pass

class ReviewMedia(ReviewMediaBase):
    id: int
    review_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    place_id: int
    comment_text: str
    rating: int  # 1-5 genel puan
    
    # Google Yorumlar tarzı detaylı bilgiler
    visit_date: Optional[datetime] = None
    visit_type: Optional[str] = None  # "solo", "friends", "family", "business", "couple"
    spent_amount: Optional[float] = None
    spent_currency: str = "TRY"
    wait_time_minutes: Optional[int] = None
    ordered_items: Optional[str] = None  # JSON string
    
    # Kategorik puanlar (opsiyonel)
    food_rating: Optional[int] = None
    service_rating: Optional[int] = None
    atmosphere_rating: Optional[int] = None
    value_rating: Optional[int] = None
    cleanliness_rating: Optional[int] = None

class ReviewCreate(ReviewBase):
    """
    İstemciden gelen yorum verisi.
    is_verified burada yok; sunucu tarafında geofence hesabına göre set edilir.
    """
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    
    # Medya dosyaları (URL'ler halinde, upload sonrası)
    media_urls: Optional[List[dict]] = None  # [{"type": "photo", "url": "...", "thumbnail": "..."}, ...]

class Review(ReviewBase):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    verify_method: Optional[str] = None
    distance_meters: Optional[int] = None
    
    # Sosyal etkileşim
    helpful_count: int = 0
    report_count: int = 0
    
    # İşletme yanıtı
    owner_response: Optional[str] = None
    owner_response_at: Optional[datetime] = None
    
    # İlişkili medya
    media: List[ReviewMedia] = []

    class Config:
        from_attributes = True

# --- AUTH ŞEMALARI ---

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
from pydantic import BaseModel
from typing import List, Optional, Literal

class Preferences(BaseModel):
    vibe: Literal["quiet", "lively"] = "quiet"
    purpose: Literal["work", "friends", "date"] = "work"
    budget: Literal["low", "mid", "high"] = "mid"

class RecommendItem(BaseModel):
    id: int
    name: str
    subtitle: str = ""
    tags: List[str] = []

class RecommendRequest(BaseModel):
    queryText: str = ""
    preferences: Preferences

class RecommendResponse(BaseModel):
    items: List[RecommendItem]
    explanation: str