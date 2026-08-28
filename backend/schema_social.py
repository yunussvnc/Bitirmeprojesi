"""Definitions extracted from :mod:`schemas`."""

from datetime import datetime
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from schema_core import Place
from schema_core import PlaceSummary
from schema_core import Review
from schema_core import UserSummary
from typing import List
from typing import Optional

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
    # Mention: etiketlenen kullanıcı ID listesi
    mentioned_user_ids: Optional[List[int]] = None
    # Link sticker
    link_type: Optional[str] = None    # 'place', 'profile', 'event'
    link_id: Optional[int] = None
    link_label: Optional[str] = None

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
    is_archived: bool = False
    mentioned_user_ids: Optional[List[int]] = None
    link_type: Optional[str] = None
    link_id: Optional[int] = None
    link_label: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    author: Optional[UserSummary] = None
    place: Optional[PlaceSummary] = None
    view_count: int = 0
    is_viewed: bool = False
    reaction_count: int = 0
    my_reaction: Optional[str] = None  # Giriş yapan kullanıcının tepkisi

    class Config:
        from_attributes = True


class PaginatedStories(BaseModel):
    items: List[Story]
    total: int
    page: int
    page_size: int


class StoryViewerItem(BaseModel):
    """Hikaye görüntüleyici — analitik alanlarla birlikte"""
    user: UserSummary
    viewed_at: datetime
    watch_duration_seconds: int = 0
    did_visit_profile: bool = False
    did_visit_place: bool = False
    source: Optional[str] = None
    reaction: Optional[str] = None

    class Config:
        from_attributes = True


class StoryViewerList(BaseModel):
    items: List[StoryViewerItem]
    total: int
    # Toplam analitik özet (mekan hesabı için)
    total_watch_seconds: int = 0
    profile_visit_count: int = 0
    place_visit_count: int = 0


class StoryReactionResponse(BaseModel):
    emoji: str
    user: UserSummary
    created_at: datetime

    class Config:
        from_attributes = True


class StoryReactionListResponse(BaseModel):
    items: List[StoryReactionResponse]
    total: int
    counts: dict  # {'❤️': 5, '🔥': 3, ...}


class StoryViewAnalyticsUpdate(BaseModel):
    """Frontend'den izleme bittiğinde gönderilir"""
    watch_duration_seconds: int = 0
    did_visit_profile: bool = False
    did_visit_place: bool = False
    source: Optional[str] = None


class StoryHiddenUsersUpdate(BaseModel):
    hidden_user_ids: List[int]


class StoryHiddenUsersResponse(BaseModel):
    hidden_users: List[UserSummary]


class PaginatedPlaces(BaseModel):
    items: List[Place]
    total: int
    page: int
    page_size: int


class PlaceLite(BaseModel):
    """Harita/liste görünümü için minimal alan seti — gallery_urls, menu_items,
    opening_hours_json gibi ağır alanları hariç tutar. Tam Place şemasının
    Place.model_validator'ının (JSON string parse) CPU maliyetini de taşımaz."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    city: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_range: Optional[int] = None
    photo_url: Optional[str] = None
    average_rating: float = 0.0
    review_count: Optional[int] = 0


class PaginatedPlacesLite(BaseModel):
    items: List[PlaceLite]
    total: int


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


class ConversationResponse(BaseModel):
    id: int
    other_user_display_name: str
    other_user_photo: Optional[str] = None
    other_user_id: int
    place_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    last_message_at: Optional[datetime] = None
    last_message_text: Optional[str] = None
    last_message_sender_id: Optional[int] = None
    unread_count: int = 0
    is_request: bool = False

    class Config:
        from_attributes = True


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


class PushTokenRequest(BaseModel):
    token: str  # ExponentPushToken[xxx]


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


class NotificationSubscriptionUpdate(BaseModel):
    notify_posts: Optional[bool] = None
    notify_stories: Optional[bool] = None


class NotificationSubscriptionResponse(BaseModel):
    subscriber_id: int
    target_id: int
    notify_posts: bool
    notify_stories: bool

    class Config:
        from_attributes = True


Review.model_rebuild()
