# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean, UniqueConstraint, Date, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from database import Base
# pyrefly: ignore [missing-import]
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
    birth_date = Column(Date, nullable=True)

    role = Column(String, default="standard")
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    push_token = Column(String, nullable=True)  # ExponentPushToken[xxx]
    push_token_updated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    token_version = Column(Integer, default=0)  # Oturum yönetimi: artırılınca tüm tokenlar geçersiz olur

    reviews = relationship("Review", back_populates="user")
    posts = relationship("Post", back_populates="user")
    post_likes = relationship("PostLike", back_populates="user")
    post_comments = relationship("PostComment", back_populates="user")
    tagged_posts = relationship("PostTag", back_populates="user", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following_user")
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower_user")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user")
    stories = relationship("Story", back_populates="user")
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")
    saved_posts = relationship("SavedPost", back_populates="user", cascade="all, delete-orphan")
    owned_places = relationship("Place", back_populates="owner")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    comment_likes = relationship("CommentLike", back_populates="user", cascade="all, delete-orphan")
    story_views = relationship("StoryView", foreign_keys="StoryView.viewer_id", back_populates="viewer", cascade="all, delete-orphan")


class UserPreferences(Base):
    """
    Kullanıcı ayarları — sunucu tarafında persist edilen tercihler.
    Her kullanıcıya 1:1 ilişki ile bağlanır. İlk oluşturma /me/preferences PUT ile yapılır.
    """
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Gizlilik
    is_private_account = Column(Boolean, default=False)

    # Yorumlar
    default_comments_disabled = Column(Boolean, default=False)
    comment_allowed_audience = Column(String, default="everyone")  # everyone, followers, off

    # Mesajlar
    unknown_message_requests = Column(Boolean, default=True)
    story_reply_audience = Column(String, default="everyone")  # everyone, followers, off
    show_read_receipts = Column(Boolean, default=True)

    # Hikaye
    story_save_to_archive = Column(Boolean, default=True)
    story_save_to_camera_roll = Column(Boolean, default=False)

    # İçerik filtreleme
    hide_offensive_words = Column(Boolean, default=True)
    hidden_words_json = Column(Text, nullable=True)  # JSON array string

    # Medya & Uygulama
    upload_quality = Column(String, default="auto")  # high, auto, data_saver
    wifi_auto_high_quality = Column(Boolean, default=True)
    include_location_in_posts = Column(Boolean, default=True)

    # Dil
    language = Column(String, default="tr")  # tr, en

    # Bildirim Tercihleri (Novu Subscriber Preferences)
    notify_likes = Column(Boolean, default=True)       # Beğeni bildirimleri
    notify_comments = Column(Boolean, default=True)    # Yorum bildirimleri
    notify_follows = Column(Boolean, default=True)     # Takip bildirimleri
    notify_messages = Column(Boolean, default=True)    # DM bildirimleri

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="preferences")


class DeviceToken(Base):
    """
    Kullanıcıların birden fazla cihazındaki push notification token'larını (FCM/APNs) tutar.
    """
    __tablename__ = "device_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token = Column(String, unique=True, nullable=False) # ExponentPushToken[...]
    platform = Column(String, nullable=True) # ios, android, web
    device_id = Column(String, nullable=True) # Optional unique device identifier
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="device_tokens")


class PendingUser(Base):
    __tablename__ = "pending_users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    verification_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PendingVenue(Base):
    """Mekan kayıtları admin onayı beklerken burada tutulur"""
    __tablename__ = "pending_venues"
    id = Column(Integer, primary_key=True, index=True)
    venue_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    status = Column(String, default="pending", index=True)  # pending, approved, rejected

    # Sahip olunan mekan — Google'dan çekilmiş mevcut Place kaydı
    claimed_place_id = Column(Integer, ForeignKey("places.id", ondelete="SET NULL"), nullable=True, index=True)

    # Başvuru sahibi iletişim bilgileri (doğrulama için)
    contact_name = Column(String, nullable=True)   # Yetkili adı soyadı
    contact_phone = Column(String, nullable=True)  # Telefon

    # Ek açıklama
    notes = Column(Text, nullable=True)

    # Admin işlem bilgileri
    rejected_reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claimed_place = relationship("Place", foreign_keys=[claimed_place_id])

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="email_verifications")

class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reset_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0)  # Brute-force koruması: max 5 deneme
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="password_resets")


class SavedPlace(Base):
    """Kullanıcının kaydettiği mekanlar (bookmark)"""
    __tablename__ = "saved_places"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_places")
    place = relationship("Place")
    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_saved_place_user_place"),
    )


class SavedPost(Base):
    """Kullanıcının kaydettiği postlar (bookmark)"""
    __tablename__ = "saved_posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_posts")
    post = relationship("Post")
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_saved_post_user_post"),
    )


class Report(Base):
    """Rapor — post, yorum veya kullanıcı raporlama"""
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String, nullable=False)  # "post", "comment", "user", "match_profile"
    target_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)  # "spam", "inappropriate", "harassment", "other"
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # "pending", "reviewed", "dismissed"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reporter = relationship("User", foreign_keys=[reporter_id])


class UserBlock(Base):
    """Kullanıcı engelleme"""
    __tablename__ = "user_blocks"
    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_user_block"),
    )


class StoryHiddenUser(Base):
    """Hikayesi gizlenen kullanıcılar (Kullanıcının hikayelerini göremeyecek kişiler)"""
    __tablename__ = "story_hidden_users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hidden_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # user: hikayeyi paylaşan kişi
    # hidden_user: hikayeyi göremeyecek kişi
    user = relationship("User", foreign_keys=[user_id])
    hidden_user = relationship("User", foreign_keys=[hidden_user_id])

    __table_args__ = (
        UniqueConstraint("user_id", "hidden_user_id", name="uq_story_hidden_user"),
    )


class PlaceFollow(Base):
    """Kullanıcının mekanı takip etmesi — tek yönlü (kullanıcı → mekan)"""
    __tablename__ = "place_follows"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="place_follows")
    place = relationship("Place", back_populates="followers")

    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_place_follow_user_place"),
    )


class PlaceInteraction(Base):
    """
    Kullanıcı–mekan etkileşim skoru — algoritmik feed boosting için.
    Kaynaklar: mekan kartı açma, AI arama, yorum yapma, beğenme vb.
    """
    __tablename__ = "place_interactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    # Ağırlıklı skor: kart_açma=1, AI_arama=2, yorum=5, beğeni=3
    score = Column(Integer, default=0)
    view_count = Column(Integer, default=0)      # Kaç kez mekan kartı açıldı
    search_count = Column(Integer, default=0)    # AI aramada kaç kez çıktı/tıklandı
    last_interacted_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="place_interactions")
    place = relationship("Place", back_populates="interactions")

    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_place_interaction_user_place"),
    )


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    city = Column(String)

    # --- Proje Formu Gereksinimleri ---
    description = Column(Text)  # RAG için kullanılacak metin
    vector_id = Column(String, unique=True, index=True, nullable=True) # Vektör veritabanındaki (Qdrant vb.) ID karşılığı
    google_place_id = Column(String, unique=True, index=True, nullable=True)  # Google Places benzersiz ID
    price_range = Column(Integer) # 1-4 arası (TL simgesi sayısı gibi)
    category = Column(String, index=True) # Restoran, Kafe, Kütüphane vb.
    features = Column(Text) # "Ücretsiz Wi-Fi, Priz, Açık Alan" gibi etiketler (JSON string olarak tutulabilir)
    # ---------------------------------

    latitude = Column(Float)    # Harita entegrasyonu için
    longitude = Column(Float)   # Harita entegrasyonu için
    average_rating = Column(Float, default=0.0)
    user_ratings_total = Column(Integer, nullable=True)  # Google'daki toplam yorum sayısı
    
    # Medya içeriği
    photo_url = Column(String, nullable=True)  # Mekan fotoğrafı URL'si
    video_url = Column(String, nullable=True)  # Mekan videosu URL'si
    campaign_text = Column(String, nullable=True)  # Mekan kampanyası (ör. 2 al 1 bedava)

    # Çalışma saatleri ve ekstra iletişim bilgileri
    opening_time = Column(String, nullable=True)  # Açılış saati (HH:MM)
    closing_time = Column(String, nullable=True)  # Kapanış saati (HH:MM)
    opening_hours_json = Column(Text, nullable=True)  # Günlük detaylı çalışma saatleri (JSON)
    is_open = Column(Boolean, default=True)
    phone_number = Column(String, nullable=True)
    
    # JSON Arrays stored as Text
    gallery_urls = Column(Text, nullable=True)
    menu_items_json = Column(Text, nullable=True)

    # İlişkiler
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    owner = relationship("User", back_populates="owned_places")
    reviews = relationship("Review", back_populates="place")
    posts = relationship("Post", back_populates="place")
    stories = relationship("Story", back_populates="place")
    followers = relationship("PlaceFollow", back_populates="place", cascade="all, delete-orphan")
    interactions = relationship("PlaceInteraction", back_populates="place", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    place_id = Column(Integer, ForeignKey("places.id"), index=True)
    
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
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True, index=True)

    caption = Column(Text, nullable=True)
    post_type = Column(String, default="photo", index=True)  # photo, reel, review_highlight

    comments_disabled = Column(Boolean, default=False)  # Yorumları kapat
    likes_hidden = Column(Boolean, default=False)       # Beğeni sayısını gizle
    is_flagged = Column(Boolean, default=False, index=True) # AI Content Moderation
    status = Column(String(20), default="approved", index=True) # approved, pending, rejected

    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="posts")
    place = relationship("Place", back_populates="posts")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")


class PostMedia(Base):
    __tablename__ = "post_media"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), index=True)

    media_type = Column(String)  # image, video
    media_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    medium_url = Column(String, nullable=True)  # 600x600 WebP
    blurhash = Column(String, nullable=True)    # Progressive loading placeholder
    duration_seconds = Column(Integer, nullable=True)
    aspect_ratio = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    order_index = Column(Integer, default=0)

    post = relationship("Post", back_populates="media")


class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_likes")
    post = relationship("Post", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_post_like_user_post"),)


class PostComment(Base):
    __tablename__ = "post_comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True)

    text = Column(Text, nullable=False)
    is_flagged = Column(Boolean, default=False, index=True) # AI Content Moderation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_comments")
    post = relationship("Post", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")


class PostTag(Base):
    """Post'ta etiketlenen kullanıcılar (Instagram tag benzeri)"""
    __tablename__ = "post_tags"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="tags")
    user = relationship("User", back_populates="tagged_posts")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_tag_post_user"),
    )


# --- TAKİP + BİLDİRİM (Kademe 5) ---

class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, default="accepted", index=True)  # "pending", "accepted"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow_follower_following"),)


class Story(Base):
    """24 saatlik hikaye – mekana bağlı fotoğraf/video"""
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True, index=True)  # nullable: hikaye konumsuz olabilir

    media_type = Column(String, nullable=False)  # "image", "video"
    media_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)

    # Gizlilik: 'public' | 'close_friends'
    privacy_type = Column(String, default="public", nullable=False, index=True)
    status = Column(String(20), default="approved", index=True) # approved, pending, rejected
    # is_close_friends: geriye dönük uyumluluk için property
    @property
    def is_close_friends(self) -> bool:
        return self.privacy_type == "close_friends"

    # Konum meta verisi (JSONB yerine JSON text — SQLite/PostgreSQL uyumlu)
    # Örnek: {"place_id": 5, "name": "Kadıköy", "lat": 40.99, "lng": 29.02}
    location_data = Column(Text, nullable=True)

    # Arşiv: 24s dolunca görünmez ama silinmez
    is_archived = Column(Boolean, default=False, nullable=False, index=True)

    # Mention: JSON array string — etiketlenen kullanıcı ID'leri [3, 7, 12]
    mentioned_user_ids = Column(Text, nullable=True)

    # Link sticker: Mekana / Profile / Etkinliğe yönlendirme
    link_type = Column(String, nullable=True)   # 'place', 'profile', 'event'
    link_id = Column(Integer, nullable=True)    # İlgili kaydın ID'si
    link_label = Column(String, nullable=True)  # "Bu mekanı incele" gibi label

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)  # created_at + 24 saat

    user = relationship("User", back_populates="stories")
    place = relationship("Place", back_populates="stories")
    replies = relationship("Message", back_populates="parent_story", foreign_keys="Message.parent_story_id")
    views = relationship("StoryView", back_populates="story", cascade="all, delete-orphan")
    reactions = relationship("StoryReaction", back_populates="story", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # like, comment, follow, follow_request, follow_accepted, tag, mention
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="SET NULL"), nullable=True)  # Munia: doğrudan navigasyon
    is_read = Column(Boolean, default=False, index=True)
    payload = Column(Text, nullable=True)  # Munia JSON: avatar, username, post thumb, comment text vb.
    group_key = Column(String, nullable=True, index=True)  # Novu digest: "like:post:42" — aynı gruba ait bildirimleri birleştir
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])




class Conversation(Base):
    """Kullanıcılar arası özel sohbet kanalı (DM)"""
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    place_name = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    place = relationship("Place")

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="uq_conversation_users"),
    )

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Sohbet mesajı"""
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # "text", "image", "shared_post", "story_reply"
    media_url = Column(String, nullable=True)  # image mesajları için
    shared_post_id = Column(Integer, nullable=True)  # shared_post mesajları için
    # Hikayeye yanıt: hangi hikayeye yanıt verildiği + anlık snapshot (hikaye 24s sonra silinse bile görünür)
    parent_story_id = Column(Integer, ForeignKey("stories.id", ondelete="SET NULL"), nullable=True, index=True)
    story_snapshot_url = Column(String, nullable=True)  # Hikayenin media_url kopyası
    is_read = Column(Boolean, default=False)
    status = Column(String, default="sent", index=True)  # "sent", "delivered", "read"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    parent_story = relationship("Story", foreign_keys=[parent_story_id])

    __table_args__ = (
        # Munia performans optimizasyonu: mesaj sorgularını hızlandırır
        # Index("ix_messages_conv_created", "conversation_id", "created_at"),  # SQLite compound index
    )


# --- TOPLULUK ODALARI (COMMUNITY ROOMS) ---

class CommunityRoom(Base):
    """Mekan veya bölge odaklı topluluk sohbet odası"""
    __tablename__ = "community_rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)          # "Kadıköy Kahvecileri"
    description = Column(Text, nullable=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True, index=True)  # Mekana bağlıysa
    cover_image_url = Column(String, nullable=True)

    room_type = Column(String, default="venue")  # "venue", "region", "topic"
    is_active = Column(Boolean, default=True)
    max_members = Column(Integer, default=500)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    # İlişkiler
    place = relationship("Place")
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("CommunityMember", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("CommunityMessage", back_populates="room", cascade="all, delete-orphan")


class CommunityMember(Base):
    """Topluluk odası üyeliği"""
    __tablename__ = "community_members"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("community_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, default="member")  # "member", "admin", "moderator"
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("CommunityRoom", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_community_member_room_user"),
    )


class CommunityMessage(Base):
    """Topluluk odası mesajı"""
    __tablename__ = "community_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("community_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # "text", "image", "place_share"
    media_url = Column(String, nullable=True)
    shared_place_id = Column(Integer, ForeignKey("places.id"), nullable=True)  # Mekan paylaşımı
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("CommunityRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    shared_place = relationship("Place")


class CommentLike(Base):
    __tablename__ = "comment_likes"
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    comment = relationship("PostComment", back_populates="likes")
    user = relationship("User", back_populates="comment_likes")

    __table_args__ = (
        UniqueConstraint("user_id", "comment_id", name="uq_comment_like_user_comment"),
    )


class StoryView(Base):
    __tablename__ = "story_views"
    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Analitik alanlar (mekan hesabı için detaylı görünür, normal kullanıcıya gizlenir)
    watch_duration_seconds = Column(Integer, default=0, nullable=False)  # Kaç saniye izledi
    did_visit_profile = Column(Boolean, default=False, nullable=False)    # Profiline tıkladı mı?
    did_visit_place = Column(Boolean, default=False, nullable=False)      # Mekana tıkladı mı?
    source = Column(String, nullable=True)  # 'feed', 'place', 'profile', 'mention'

    story = relationship("Story", back_populates="views")
    viewer = relationship("User", foreign_keys=[viewer_id], back_populates="story_views")

    __table_args__ = (
        UniqueConstraint("viewer_id", "story_id", name="uq_story_view_user_story"),
    )


class StoryReaction(Base):
    """Hikayeye emoji tepkisi — kişi başı 1 tepki (değiştirilebilir)"""
    __tablename__ = "story_reactions"
    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emoji = Column(String, nullable=False)  # '❤️', '🔥', '😍', '👏', '😂'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    story = relationship("Story", back_populates="reactions")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("story_id", "user_id", name="uq_story_reaction_story_user"),
    )


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)        # 'ban_user', 'delete_post' vb.
    target_type = Column(String(50), nullable=False)    # 'user', 'post', 'venue'
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)               # Detayları tutan JSON objesi
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", foreign_keys=[admin_id])


class AIQueryLog(Base):
    __tablename__ = "ai_query_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    query_text = Column(Text, nullable=False)
    query_type = Column(String(50), nullable=False)     # 'venue_search', 'chit_chat', 'blocked'
    llm_layer = Column(String(20), nullable=False)      # 'groq', 'gemma_fallback'
    response_time_ms = Column(Integer, nullable=False)
    result_count = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)         # 'success', 'fallback', 'error'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


class UserPlaceInteraction(Base):
    """
    Kullanıcının mekanlarla olan anlık etkileşimlerini (tıklama, arama, AI vs) tutar.
    Öneri motoru (foryou algoritması) için kullanılır.
    """
    __tablename__ = "user_place_interactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 'MAP_CLICK', 'CARD_VIEW', 'AI_SUGGESTION', 'SEARCH_CLICK'
    interaction_type = Column(String(50), nullable=False)
    
    # Her etkileşim tipinin farklı ağırlığı olacak
    weight = Column(Integer, nullable=False, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    place = relationship("Place")

