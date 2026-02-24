from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- KULLANICI (USER) ŞEMALARI ---

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfile(User):
    """Profil sayfası için: followers/following sayıları + is_following"""
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False

# --- MEKAN (PLACE) ŞEMALARI ---

class PlaceBase(BaseModel):
    name: str
    address: str
    city: str
    description: Optional[str] = None
    campaign_text: Optional[str] = None
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
    refresh_token: str
    token_type: str = "bearer"
    user: User

class RefreshRequest(BaseModel):
    refresh_token: str


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

class RecommendItem(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    distance_m: Optional[int] = None
    score: float = 0
    photo_url: Optional[str] = None
    explanation: Optional[str] = None
    tags: List[str] = []

class RecommendResponse(BaseModel):
    items: List[RecommendItem]
    summary: str = ""
    cached: bool = False


# --- POST (SOSYAL AKIŞ) ŞEMALARI ---

class PostMediaBase(BaseModel):
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    order_index: int = 0

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
    media: List[PostMediaCreate]

class PostCommentCreate(BaseModel):
    text: str

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
    avatar_url: Optional[str] = None
    is_following: bool = False

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
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime
    is_liked: bool = False
    author: Optional[UserSummary] = None
    place: Optional[PlaceSummary] = None
    media: List[PostMedia] = []

    class Config:
        from_attributes = True

class PaginatedPosts(BaseModel):
    items: List[Post]
    total: int
    page: int
    page_size: int


# --- HİKAYE (STORY) ---

class StoryCreate(BaseModel):
    place_id: Optional[int] = None
    media_type: str  # "image", "video"
    media_url: str
    thumbnail_url: Optional[str] = None


class Story(BaseModel):
    id: int
    user_id: int
    place_id: Optional[int] = None
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
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
    actor_id: int
    post_id: Optional[int] = None
    place_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime
    actor_username: Optional[str] = None

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
    interests: List[str] = []
    star_sign: Optional[str] = None
    exercise: Optional[str] = None
    prompts: List[dict] = []
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