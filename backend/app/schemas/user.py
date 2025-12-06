"""
Kullanıcı Pydantic Şemaları
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Kullanıcı temel şeması"""
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Kullanıcı oluşturma şeması"""
    password: str


class UserUpdate(BaseModel):
    """Kullanıcı güncelleme şeması"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    """Veritabanındaki kullanıcı şeması"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """Kullanıcı response şeması"""
    pass


class UserLogin(BaseModel):
    """Kullanıcı giriş şeması"""
    username: str
    password: str


class Token(BaseModel):
    """Token response şeması"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token veri şeması"""
    username: Optional[str] = None

