from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Kişisel bilgiler
    first_name = Column(String, nullable=True) # Ad
    last_name = Column(String, nullable=True)  # Soyad
    phone_number = Column(String, unique=True, index=True, nullable=True) # Telefon
    
    # Sistem yönetimi için eklenenler
    role = Column(String, default="standard") # admin, standard vb.
    is_active = Column(Boolean, default=True) # Kullanıcı hesabı aktif mi?

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # İlişkiler: Bir kullanıcının birçok yorumu olabilir
    reviews = relationship("Review", back_populates="user")

class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    city = Column(String)

    # --- Proje Formu Gereksinimleri ---
    description = Column(Text)  # RAG için kullanılacak metin
    vector_id = Column(String, unique=True, index=True, nullable=True) # Vektör veritabanındaki (Qdrant vb.) ID karşılığı
    price_range = Column(Integer) # 1-4 arası (TL simgesi sayısı gibi)
    category = Column(String, index=True) # Restoran, Kafe, Kütüphane vb.
    features = Column(Text) # "Ücretsiz Wi-Fi, Priz, Açık Alan" gibi etiketler (JSON string olarak tutulabilir)
    # ---------------------------------

    latitude = Column(Float)    # Harita entegrasyonu için
    longitude = Column(Float)   # Harita entegrasyonu için
    average_rating = Column(Float, default=0.0)

    # İlişkiler: Bir mekanın birçok yorumu olabilir
    reviews = relationship("Review", back_populates="place")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    place_id = Column(Integer, ForeignKey("places.id"))
    comment_text = Column(Text) # RAG için en kritik veri: "Ambiyansı çok sessiz..."
    rating = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Proje Formu Gereksinimi ---
    # Kullanıcı QR kod okutarak oraya gittiğini kanıtladı mı?
    is_verified = Column(Boolean, default=False) 
    # -------------------------------
    
    # İlişkiler: Yorumun kim tarafından ve hangi mekana yapıldığı
    user = relationship("User", back_populates="reviews")
    place = relationship("Place", back_populates="reviews")
