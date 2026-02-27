from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean, UniqueConstraint
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
    posts = relationship("Post", back_populates="user")
    post_likes = relationship("PostLike", back_populates="user")
    post_comments = relationship("PostComment", back_populates="user")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following_user")
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower_user")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user")
    stories = relationship("Story", back_populates="user")
    match_profile = relationship("MatchProfile", back_populates="user", uselist=False)

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
    campaign_text = Column(String, nullable=True)  # Mekan kampanyası (ör. 2 al 1 bedava)

    # Çalışma saatleri (HH:MM formatında, ör. "09:00", "23:00")
    opening_time = Column(String, nullable=True)  # Açılış saati
    closing_time = Column(String, nullable=True)  # Kapanış saati

    # İlişkiler
    reviews = relationship("Review", back_populates="place")
    posts = relationship("Post", back_populates="place")
    stories = relationship("Story", back_populates="place")

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


# --- SOSYAL AKIŞ (Kademe 4) ---

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)

    caption = Column(Text, nullable=True)
    post_type = Column(String, default="photo")  # photo, reel, review_highlight

    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="posts")
    place = relationship("Place", back_populates="posts")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")


class PostMedia(Base):
    __tablename__ = "post_media"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))

    media_type = Column(String)  # image, video
    media_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    aspect_ratio = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    order_index = Column(Integer, default=0)

    post = relationship("Post", back_populates="media")


class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_likes")
    post = relationship("Post", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_post_like_user_post"),)


class PostComment(Base):
    __tablename__ = "post_comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True)

    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_comments")
    post = relationship("Post", back_populates="comments")


# --- TAKİP + BİLDİRİM (Kademe 5) ---

class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow_follower_following"),)


class Story(Base):
    """24 saatlik hikaye – mekana bağlı fotoğraf/video"""
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)

    media_type = Column(String, nullable=False)  # "image", "video"
    media_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # created_at + 24 saat

    user = relationship("User", back_populates="stories")
    place = relationship("Place", back_populates="stories")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # like, comment, follow, mention
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])


# --- EŞLEŞME SİSTEMİ (Kademe 6) ---

class MatchProfile(Base):
    """Eşleşme profili — uygulama profilinden bağımsız"""
    __tablename__ = "match_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    display_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    bio = Column(Text, nullable=True)
    photo_urls = Column(Text, nullable=True)  # JSON array string

    # Hakkımda detayları
    height = Column(Integer, nullable=True)  # cm
    gender = Column(String, nullable=True)  # "Erkek", "Kadın", "Diğer"
    education = Column(String, nullable=True)
    location_text = Column(String, nullable=True)  # serbest metin konum
    smoking = Column(String, nullable=True)  # "Evet", "Hayır", "Bazen"
    drinking = Column(String, nullable=True)  # "Evet", "Hayır", "Bazen"
    looking_for = Column(String, nullable=True)  # "Uzun süreli ilişki", "Arkadaşlık", vb.
    interests = Column(Text, nullable=True)  # JSON array string
    star_sign = Column(String, nullable=True)
    family_plans = Column(String, nullable=True)
    exercise = Column(String, nullable=True)
    prompts = Column(Text, nullable=True)  # JSON array string of {"question": "...", "answer": "..."}

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="match_profile")


class MatchLike(Base):
    """Beğenme/geçme kaydı"""
    __tablename__ = "match_likes"
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    action = Column(String, nullable=False)  # "like" veya "pass"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    place = relationship("Place")

    __table_args__ = (
        UniqueConstraint("from_user_id", "to_user_id", name="uq_match_like_from_to"),
    )


class MatchConversation(Base):
    """Eşleşme sonrası sohbet kanalı"""
    __tablename__ = "match_conversations"
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    place_name = Column(String, nullable=True)

    user1_revealed = Column(Boolean, default=False)
    user2_revealed = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    place = relationship("Place")

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="uq_match_conversation_users"),
    )
