"""Definitions extracted from :mod:`models`."""

from database import Base
from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import JSON
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint
from sqlalchemy import func
from sqlalchemy.orm import relationship

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
