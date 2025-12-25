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

class PlaceCreate(PlaceBase):
    pass # Mekan eklerken tüm base alanları kullanıyoruz

class Place(PlaceBase):
    id: int
    vector_id: Optional[str] = None
    average_rating: float

    class Config:
        from_attributes = True

# --- YORUM (REVIEW) ŞEMALARI ---

class ReviewBase(BaseModel):
    place_id: int
    comment_text: str
    rating: int

class ReviewCreate(ReviewBase):
    # is_verified alanı burada yok, çünkü QR kod doğrulaması 
    # sunucu tarafında bir işlemle set edilecek.
    pass

class Review(ReviewBase):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- AUTH ŞEMALARI ---

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
