# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field, model_validator, field_validator
import json as _json
from datetime import datetime, date
from typing import Optional, List

# --- KULLANICI (USER) ŞEMALARI ---

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    birth_date: Optional[date] = None

    @field_validator('birth_date')
    @classmethod
    def check_birth_date(cls, v):
        if v is not None and (v.year < 1950 or v.year > 2023):
            raise ValueError('Doğum yılı 1950 ile 2023 arasında olmalıdır.')
        return v

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    birth_date: Optional[date] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator('birth_date')
    @classmethod
    def check_birth_date(cls, v):
        if v is not None and (v.year < 1950 or v.year > 2023):
            raise ValueError('Doğum yılı 1950 ile 2023 arasında olmalıdır.')
        return v

class SocialLoginRequest(BaseModel):
    token: str

class User(UserBase):
    id: int
    role: str
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    birth_date: Optional[date] = None

    class Config:
        from_attributes = True


class UserProfile(User):
    """Profil sayfası için: followers/following sayıları + is_following + follow_status"""
    followers_count: int = 0
    following_count: int = 0
    friends_count: int = 0
    is_following: bool = False
    follow_status: Optional[str] = None  # "pending", "accepted", or None (not following)

# --- MEKAN (PLACE) ŞEMALARI ---

class PlaceBase(BaseModel):
    name: str
    address: str
    city: str
    description: Optional[str] = None
    campaign_text: Optional[str] = None
    price_range: Optional[int] = Field(None, ge=1, le=4, description="Fiyat segmenti (1-4)")  # 1 ile 4 arası
    category: Optional[str] = None
    features: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    photo_url: Optional[str] = None  # Mekan (kapak) fotoğrafı
    video_url: Optional[str] = None  # Mekan videosu
    opening_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$", description="Açılış saati (HH:MM)")
    closing_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$", description="Kapanış saati (HH:MM)")
    is_open: Optional[bool] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    opening_hours_json: Optional[dict] = None  # Détailed daily hours
    gallery_urls: Optional[List[str]] = None
    menu_items: Optional[List[dict]] = None

class PlaceCreate(PlaceBase):
    pass # Mekan eklerken tüm base alanları kullanıyoruz

class Place(PlaceBase):
    id: int
    vector_id: Optional[str] = None
    average_rating: float
    photo_url: Optional[str] = None
    video_url: Optional[str] = None
    
    # Yeni eklenen dinamik / popülerlik alanları
    review_count: Optional[int] = 0
    saved_count: Optional[int] = 0
    popularity_score: Optional[float] = 0.0
    google_place_id: Optional[str] = None
    user_ratings_total: Optional[int] = None

    # Mekan takip sistemi
    follower_count: Optional[int] = 0
    is_following: Optional[bool] = False

    @model_validator(mode='before')
    @classmethod
    def _parse_json_fields(cls, values):
        """ORM modelinden gelen JSON string alanları Python objelerine dönüştürür."""
        # Handle ORM objects
        if hasattr(values, '__dict__'):
            obj = values
            data = {}
            # menu_items_json -> menu_items
            raw_menu = getattr(obj, 'menu_items_json', None)
            if raw_menu and isinstance(raw_menu, str):
                try:
                    data['menu_items'] = _json.loads(raw_menu)
                except Exception:
                    pass
            # gallery_urls (stored as JSON string)
            raw_gallery = getattr(obj, 'gallery_urls', None)
            if raw_gallery and isinstance(raw_gallery, str):
                try:
                    data['gallery_urls'] = _json.loads(raw_gallery)
                except Exception:
                    pass
            # opening_hours_json (stored as JSON string)
            raw_hours = getattr(obj, 'opening_hours_json', None)
            if raw_hours and isinstance(raw_hours, str):
                try:
                    data['opening_hours_json'] = _json.loads(raw_hours)
                except Exception:
                    pass
            # Set parsed values on the ORM object for from_attributes to pick up
            for key, val in data.items():
                setattr(obj, key, val)
            return obj
        return values

    class Config:
        from_attributes = True


class GoogleReviewItem(BaseModel):
    author_name: str
    rating: float = Field(ge=0, le=5)
    text: str
    relative_time: Optional[str] = None
    avatar_url: Optional[str] = None


class GoogleReviewsResponse(BaseModel):
    reviews: List[GoogleReviewItem] = []
    total_fetched: int = 0
    display_limit: int = 5
    source: str = "google_maps"


class DeviceTokenCreate(BaseModel):
    token: str
    platform: Optional[str] = None
    device_id: Optional[str] = None

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
    comment_text: str = Field(..., min_length=3, max_length=2000, description="Yorum metni")
    rating: int = Field(..., ge=1, le=5, description="Genel puan (1-5)")
    
    # Google Yorumlar tarzı detaylı bilgiler
    visit_date: Optional[datetime] = None
    visit_type: Optional[str] = Field(None, pattern=r"^(solo|friends|family|business|couple)$")
    spent_amount: Optional[float] = Field(None, ge=0)
    spent_currency: str = "TRY"
    wait_time_minutes: Optional[int] = Field(None, ge=0, le=480)
    ordered_items: Optional[str] = None  # JSON string
    
    # Kategorik puanlar (opsiyonel)
    food_rating: Optional[int] = Field(None, ge=1, le=5)
    service_rating: Optional[int] = Field(None, ge=1, le=5)
    atmosphere_rating: Optional[int] = Field(None, ge=1, le=5)
    value_rating: Optional[int] = Field(None, ge=1, le=5)
    cleanliness_rating: Optional[int] = Field(None, ge=1, le=5)

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

    # Yazar bilgisi (Post şemasındaki author gibi, ama modelde user olarak geçiyor)
    user: Optional['UserSummary'] = None

    class Config:
        from_attributes = True

# --- AUTH ŞEMALARI ---

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User

class RefreshRequest(BaseModel):
    refresh_token: str

class FirstTimeSetupRequest(BaseModel):
    """İlk girişte kullanıcı adı ve doğum tarihi ayarlama"""
    username: str
    birth_date: date

    @field_validator('birth_date')
    @classmethod
    def check_birth_date(cls, v):
        if v.year < 1950 or v.year > 2023:
            raise ValueError('Doğum yılı 1950 ile 2023 arasında olmalıdır.')
        return v

class VenueRegisterRequest(BaseModel):
    """Mekan sahipliği başvuru isteği"""
    venue_name: str
    email: EmailStr
    password: str
    claimed_place_id: int            # ZORUNLU — Hangi Google mekanına sahip olduğunu belirtir
    contact_name: Optional[str] = None   # Yetkili adı soyadı
    contact_phone: Optional[str] = None  # İletişim telefonu
    notes: Optional[str] = None          # Admin'e ek açıklama

class PendingVenueResponse(BaseModel):
    id: int
    venue_name: str
    email: EmailStr
    status: str                           # pending | approved | rejected
    claimed_place_id: Optional[int] = None
    claimed_place_name: Optional[str] = None   # Place.name (computed, okuma için)
    claimed_place_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    rejected_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VenueRejectRequest(BaseModel):
    """Admin red gerekçesi"""
    reason: str

class VenueClaimStatusResponse(BaseModel):
    """Başvuru durumu — mobil status ekranı için"""
    status: str           # pending | approved | rejected | not_found
    venue_name: Optional[str] = None
    claimed_place_name: Optional[str] = None
    rejected_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None


# --- E-POSTA DOĞRULAMA (EMAIL VERIFICATION) ŞEMALARI ---

class VerifyEmailRequest(BaseModel):
    code: str   # 6 haneli doğrulama kodu

class VerifyRegisterRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str           # 6 haneli sıfırlama kodu
    new_password: str   # Yeni şifre

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ReportCreate(BaseModel):
    target_type: str   # "post", "comment", "user", "match_profile"
    target_id: int
    reason: str        # "spam", "inappropriate", "harassment", "other"
    description: Optional[str] = None

class PlaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    photo_url: Optional[str] = None
    video_url: Optional[str] = None
    campaign_text: Optional[str] = Field(None, max_length=500)
    features: Optional[str] = None
    opening_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    closing_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    is_open: Optional[bool] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    price_range: Optional[int] = Field(None, ge=1, le=4)
    gallery_urls: Optional[List[str]] = None
    menu_items: Optional[List[dict]] = None
    opening_hours_json: Optional[dict] = None

# --- ÖNERİ (RECOMMEND) ŞEMALARI ---

class Preferences(BaseModel):
    vibe: Optional[str] = "quiet"
    purpose: Optional[str] = "work"
    budget: Optional[str] = "mid"

class Location(BaseModel):
    lat: float
    lng: float

class RecommendRequest(BaseModel):
    queryText: str = ""
    preferences: Preferences = Preferences()
    location: Optional[Location] = None
    radius_m: int = 3000
    category: Optional[str] = None
    district: Optional[str] = None  # Kullanıcının seçtiği ilçe (dropdown)

class RecommendItem(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    distance_m: Optional[int] = None
    score: float = 0
    photo_url: Optional[str] = None
    explanation: Optional[str] = None
    tags: List[str] = []
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    average_rating: Optional[float] = None
    review_count: Optional[int] = None
    price_range: Optional[int] = None
    address: Optional[str] = None

class RecommendResponse(BaseModel):
    items: List[RecommendItem]
    summary: str = ""
    cached: bool = False


# --- POST (SOSYAL AKIŞ) ŞEMALARI ---

class PostMediaBase(BaseModel):
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    blurhash: Optional[str] = None
    order_index: int = 0
    width: Optional[int] = None
    height: Optional[int] = None

class PostMediaCreate(PostMediaBase):
    pass

class PostMedia(PostMediaBase):
    id: int
    post_id: int

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    caption: Optional[str] = None
    place_id: Optional[int] = None
    post_type: str = "photo"
    comments_disabled: bool = False
    likes_hidden: bool = False
    media: List[PostMediaCreate]
    tagged_user_ids: Optional[List[int]] = None

class PostCommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Yorum metni")

class PostComment(BaseModel):
    id: int
    user_id: int
    post_id: int
    text: str
    created_at: datetime
    author_username: Optional[str] = None

    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_following: bool = False
    follow_status: Optional[str] = None  # "pending" | "accepted" | None
    is_private: bool = False

    class Config:
        from_attributes = True

class PlaceSummary(BaseModel):
    id: int
    name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True

class Post(BaseModel):
    id: int
    user_id: int
    place_id: Optional[int] = None
    caption: Optional[str] = None
    post_type: str
    comments_disabled: bool = False
    likes_hidden: bool = False
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime
    is_liked: bool = False
    author: Optional[UserSummary] = None
    place: Optional[PlaceSummary] = None
    media: List[PostMedia] = []
    tagged_users: List[UserSummary] = []

    class Config:
        from_attributes = True

class PaginatedPosts(BaseModel):
    items: List[Post]
    total: int
    page: int
    page_size: int


class CursorPaginatedPosts(BaseModel):
    """
    Cursor tabanlı sayfalama yanıtı.
    Büyük veri setleri (25M+ gönderi) için OFFSET yerine kullanılır.
    next_cursor: Sonraki sayfayı almak için gönderilecek opaque token (ISO datetime:id).
    has_more: Daha fazla içerik var mı?
    """
    items: List[Post]
    next_cursor: Optional[str] = None   # "<created_at_iso>:<post_id>"
    has_more: bool = False
    page_size: int


# --- HİKAYE (STORY) ---

class StoryCreate(BaseModel):
    place_id: Optional[int] = None
    media_type: str  # "image", "video"
    media_url: str
    thumbnail_url: Optional[str] = None
    # Gizlilik: 'public' | 'close_friends'
    privacy_type: str = "public"
    # Geriye dönük uyumluluk (eski mobil istemciler is_close_friends gönderebilir)
    is_close_friends: bool = False
    # Konum meta verisi: {"place_id": 5, "name": "Kadıköy", "lat": 40.99, "lng": 29.02}
    location_data: Optional[dict] = None

    def resolved_privacy_type(self) -> str:
        """is_close_friends True ise close_friends döndür (geriye dönük)."""
        if self.is_close_friends:
            return "close_friends"
        return self.privacy_type


class Story(BaseModel):
    id: int
    user_id: int
    place_id: Optional[int] = None
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    privacy_type: str = "public"
    is_close_friends: bool = False
    location_data: Optional[dict] = None
    created_at: datetime
    expires_at: datetime
    author: Optional[UserSummary] = None
    place: Optional[PlaceSummary] = None

    class Config:
        from_attributes = True


class PaginatedStories(BaseModel):
    items: List[Story]
    total: int
    page: int
    page_size: int


# --- PAGİNATED RESPONSE ---

class PaginatedPlaces(BaseModel):
    items: List[Place]
    total: int
    page: int
    page_size: int


# --- BİLDİRİM (Kademe 5) ---

class Notification(BaseModel):
    id: int
    user_id: int
    type: str
    actor_id: Optional[int] = None
    post_id: Optional[int] = None
    place_id: Optional[int] = None
    is_read: bool = False
    payload: Optional[str] = None
    created_at: datetime
    actor_username: Optional[str] = None
    # Munia-style rich payload fields (parsed from JSON payload)
    actor_avatar: Optional[str] = None
    post_thumbnail: Optional[str] = None
    # Novu-style digest grouping
    group_count: int = 0  # "X, Y ve 3 kişi daha beğendi" — 0 = no grouping

    class Config:
        from_attributes = True


class PaginatedNotifications(BaseModel):
    items: List[Notification]
    total: int
    page: int
    page_size: int


# --- PROFİL İSTATİSTİKLERİ (Kademe 6) ---

class UserStats(BaseModel):
    post_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    friends_count: int = 0
    review_count: int = 0
    visit_count: int = 0  # verified reviews or all reviews
    visits_this_month: int = 0
    favorite_category: Optional[str] = None
    favorite_region: Optional[str] = None


# --- EŞLEŞME (MATCHING) ŞEMALARI ---

class MatchProfileCreate(BaseModel):
    display_name: str
    age: int
    bio: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    height: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    location_text: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    looking_for: Optional[str] = None
    interests: Optional[List[str]] = None
    star_sign: Optional[str] = None
    family_plans: Optional[str] = None
    exercise: Optional[str] = None
    prompts: Optional[List[dict]] = None

class MatchProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    height: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    location_text: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    looking_for: Optional[str] = None
    interests: Optional[List[str]] = None
    star_sign: Optional[str] = None
    family_plans: Optional[str] = None
    exercise: Optional[str] = None
    prompts: Optional[List[dict]] = None
    is_active: Optional[bool] = None

class MatchProfileResponse(BaseModel):
    id: int
    user_id: int
    display_name: str
    age: int
    bio: Optional[str] = None
    photo_urls: List[str] = []
    height: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    location_text: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    looking_for: Optional[str] = None
    interests: List[str] = []
    star_sign: Optional[str] = None
    family_plans: Optional[str] = None
    exercise: Optional[str] = None
    prompts: List[dict] = []
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class MatchLikeCreate(BaseModel):
    to_user_id: int
    place_id: Optional[int] = None
    action: str  # "like" veya "pass"

class MatchCandidateResponse(BaseModel):
    """Aday profili — eşleşme kartında gösterilecek"""
    user_id: int
    display_name: str
    age: int
    bio: Optional[str] = None
    photo_urls: List[str] = []
    height: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    looking_for: Optional[str] = None
    interests: List[str] = []
    star_sign: Optional[str] = None
    exercise: Optional[str] = None
    prompts: List[dict] = []
    active_place_id: Optional[int] = None
    active_place_name: Optional[str] = None
    is_qr_verified: bool = False
    distance_priority: int = 0  # 0=aynı mekan, 1=yakın, 2=uzak

class MatchConversationResponse(BaseModel):
    id: int
    other_user_display_name: str
    other_user_photo: Optional[str] = None
    other_user_id: int
    place_name: Optional[str] = None
    my_profile_revealed: bool = False
    other_profile_revealed: bool = False
    is_active: bool = True
    created_at: datetime
    last_message_at: Optional[datetime] = None
    last_message_text: Optional[str] = None
    last_message_sender_id: Optional[int] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class MatchActionResponse(BaseModel):
    """Beğenme/geçme sonucu"""
    action: str
    matched: bool = False
    conversation_id: Optional[int] = None

class QRVerifyRequest(BaseModel):
    place_id: int
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None

class QRVerifyResponse(BaseModel):
    verified: bool
    place_id: int
    place_name: str
    active_until: Optional[datetime] = None


# --- MESAJLAŞMA (MESSAGING) ŞEMALARI ---

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Mesaj içeriği")
    message_type: str = "text"  # "text", "image", "shared_post", "story_reply"
    media_url: Optional[str] = None
    shared_post_id: Optional[int] = None
    parent_story_id: Optional[int] = None
    story_snapshot_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None
    shared_post_id: Optional[int] = None
    parent_story_id: Optional[int] = None
    story_snapshot_url: Optional[str] = None
    is_read: bool = False
    status: str = "sent"  # "sent", "delivered", "read"
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedMessages(BaseModel):
    items: List[MessageResponse]
    total: int
    page: int
    page_size: int

class TypingEvent(BaseModel):
    conversation_id: int
    user_id: int
    is_typing: bool

class OpenConversationRequest(BaseModel):
    user_id: int


class ConversationPermission(BaseModel):
    """Gönderici → alıcı yönünde mesajlaşma izin durumu"""
    can_send: bool
    can_send_media: bool
    hide_read_receipt: bool
    reason: Optional[str] = None          # UI'da gösterilebilir açıklama kodu
    messages_sent_count: int = 0          # Gönderici'nin bu konuşmada gönderdiği mesaj sayısı
    awaiting_reply: bool = False          # True = karşı taraf henüz cevap vermedi


# --- PUSH TOKEN ---

class PushTokenRequest(BaseModel):
    token: str  # ExponentPushToken[xxx]


# --- TOPLULUK ODALARI (COMMUNITY ROOMS) ---

class CommunityRoomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    place_id: Optional[int] = None
    room_type: str = "venue"  # "venue", "region", "topic"
    cover_image_url: Optional[str] = None

class CommunityRoomResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    place_id: Optional[int] = None
    cover_image_url: Optional[str] = None
    room_type: str = "venue"
    is_active: bool = True
    member_count: int = 0
    created_by: int
    created_at: datetime
    last_message_at: Optional[datetime] = None
    is_member: bool = False  # Mevcut kullanıcı üye mi?

    class Config:
        from_attributes = True

class CommunityMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    message_type: str = "text"  # "text", "image", "place_share"
    media_url: Optional[str] = None
    shared_place_id: Optional[int] = None

class CommunityMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None
    shared_place_id: Optional[int] = None
    created_at: datetime
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedCommunityMessages(BaseModel):
    items: List[CommunityMessageResponse]
    total: int
    page: int
    page_size: int


# --- KULLANICI TERCİHLERİ (USER PREFERENCES) ---

class UserPreferencesUpdate(BaseModel):
    """Kullanıcının ayarlar ekranından güncellediği tercihler."""
    is_private_account: Optional[bool] = None
    default_comments_disabled: Optional[bool] = None
    comment_allowed_audience: Optional[str] = None  # everyone, followers, off
    unknown_message_requests: Optional[bool] = None
    story_reply_audience: Optional[str] = None  # everyone, followers, off
    show_read_receipts: Optional[bool] = None
    story_save_to_archive: Optional[bool] = None
    story_save_to_camera_roll: Optional[bool] = None
    hide_offensive_words: Optional[bool] = None
    hidden_words: Optional[List[str]] = None
    upload_quality: Optional[str] = None  # high, auto, data_saver
    wifi_auto_high_quality: Optional[bool] = None
    include_location_in_posts: Optional[bool] = None
    language: Optional[str] = None  # tr, en
    # Bildirim Tercihleri (Novu Subscriber Preferences)
    notify_likes: Optional[bool] = None
    notify_comments: Optional[bool] = None
    notify_follows: Optional[bool] = None
    notify_messages: Optional[bool] = None


class UserPreferencesResponse(BaseModel):
    """Sunucudan dönen tam tercih objesi."""
    is_private_account: bool = False
    default_comments_disabled: bool = False
    comment_allowed_audience: str = "everyone"
    unknown_message_requests: bool = True
    story_reply_audience: str = "everyone"
    show_read_receipts: bool = True
    story_save_to_archive: bool = True
    story_save_to_camera_roll: bool = False
    hide_offensive_words: bool = True
    hidden_words: List[str] = []
    upload_quality: str = "auto"
    wifi_auto_high_quality: bool = True
    include_location_in_posts: bool = True
    language: str = "tr"
    # Bildirim Tercihleri
    notify_likes: bool = True
    notify_comments: bool = True
    notify_follows: bool = True
    notify_messages: bool = True
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
Review.model_rebuild()
