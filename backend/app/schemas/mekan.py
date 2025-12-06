"""
Mekan Pydantic Şemaları
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MekanBase(BaseModel):
    """Mekan temel şeması"""
    ad: str
    aciklama: Optional[str] = None
    kategori: Optional[str] = None
    enlem: float
    boylam: float
    adres: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class MekanCreate(MekanBase):
    """Mekan oluşturma şeması"""
    pass


class MekanUpdate(BaseModel):
    """Mekan güncelleme şeması"""
    ad: Optional[str] = None
    aciklama: Optional[str] = None
    kategori: Optional[str] = None
    enlem: Optional[float] = None
    boylam: Optional[float] = None
    adres: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class MekanInDB(MekanBase):
    """Veritabanındaki mekan şeması"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Mekan(MekanInDB):
    """Mekan response şeması"""
    pass

