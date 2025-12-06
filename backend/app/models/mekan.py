"""
Mekan Modeli
"""

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Mekan(Base):
    """Mekan modeli"""
    
    __tablename__ = "mekanlar"
    
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String, index=True, nullable=False)
    aciklama = Column(Text, nullable=True)
    kategori = Column(String, nullable=True)  # restoran, kafe, park, vb.
    enlem = Column(Float, nullable=False)  # Latitude
    boylam = Column(Float, nullable=False)  # Longitude
    adres = Column(String, nullable=True)
    telefon = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

