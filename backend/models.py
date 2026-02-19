from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    username = Column(String, unique=True, index=True, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    role = Column(String, default="standard")
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

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
    
    # Medya içeriği
    photo_url = Column(String, nullable=True)  # Mekan fotoğrafı URL'si
    video_url = Column(String, nullable=True)  # Mekan videosu URL'si

    # İlişkiler: Bir mekanın birçok yorumu olabilir
    reviews = relationship("Review", back_populates="place")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    place_id = Column(Integer, ForeignKey("places.id"))
    
    # --- Temel Yorum Bilgileri ---
    comment_text = Column(Text)  # RAG için en kritik veri: "Ambiyansı çok sessiz..."
    rating = Column(Integer)  # 1-5 arası genel puan
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # --- Doğrulanmış ziyaret bilgisi ---
    is_verified = Column(Boolean, default=False)
    verify_method = Column(String, nullable=True)  # "geofence", "qr", etc.
    verified_at = Column(DateTime(timezone=True), nullable=True)
    distance_meters = Column(Integer, nullable=True)
    
    # --- Google Yorumlar Tarzı Detaylı Bilgiler ---
    # Ziyaret Detayları
    visit_date = Column(DateTime(timezone=True), nullable=True)  # Ne zaman ziyaret edildi
    visit_type = Column(String, nullable=True)  # "solo", "friends", "family", "business", "couple"
    
    # Finansal Bilgi
    spent_amount = Column(Float, nullable=True)  # Harcanan tutar (TL)
    spent_currency = Column(String, default="TRY")  # Para birimi
    
    # Deneyim Detayları
    wait_time_minutes = Column(Integer, nullable=True)  # Bekleme süresi (dakika)
    ordered_items = Column(Text, nullable=True)  # Sipariş edilen yemekler/içecekler (JSON array olarak)
    
    # Kategorik Puanlar (1-5 arası, opsiyonel)
    food_rating = Column(Integer, nullable=True)  # Yemek kalitesi
    service_rating = Column(Integer, nullable=True)  # Servis kalitesi
    atmosphere_rating = Column(Integer, nullable=True)  # Atmosfer
    value_rating = Column(Integer, nullable=True)  # Fiyat/performans
    cleanliness_rating = Column(Integer, nullable=True)  # Temizlik
    
    # Sosyal Etkileşim
    helpful_count = Column(Integer, default=0)  # Kaç kişi "Yardımcı bulundu" dedi
    report_count = Column(Integer, default=0)  # Şikayet sayısı
    
    # İşletme Yanıtı
    owner_response = Column(Text, nullable=True)  # İşletme sahibinin yanıtı
    owner_response_at = Column(DateTime(timezone=True), nullable=True)
    
    # Medya (çoklu fotoğraf/video için ayrı tablo)
    # Bu review'a ait medya dosyaları ReviewMedia tablosunda
    
    # İlişkiler
    user = relationship("User", back_populates="reviews")
    place = relationship("Place", back_populates="reviews")
    media = relationship("ReviewMedia", back_populates="review", cascade="all, delete-orphan")


class ReviewMedia(Base):
    """
    Yorumlara ait fotoğraf ve videolar
    Bir yorum birden fazla medya içerebilir (Google yorumlar gibi)
    """
    __tablename__ = "review_media"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"))
    
    media_type = Column(String)  # "photo", "video"
    media_url = Column(String, nullable=False)  # Dosya URL'si (S3, Cloudinary, etc.)
    thumbnail_url = Column(String, nullable=True)  # Video için thumbnail
    
    # Medya metadata
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)  # Bytes
    duration_seconds = Column(Integer, nullable=True)  # Video için
    
    order_index = Column(Integer, default=0)  # Sıralama için
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    review = relationship("Review", back_populates="media")
