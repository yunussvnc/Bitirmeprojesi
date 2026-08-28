"""Shared story request models and access/serialization helpers."""

import json as _json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

def _parse_mentioned_ids(raw: str | None) -> list[int] | None:
    if not raw:
        return None
    try:
        return _json.loads(raw)
    except Exception:
        return None


def _story_to_schema(s, db: Session, current_user_id: Optional[int] = None):
    author = None
    if s.user:
        author = schemas.UserSummary(
            id=s.user.id,
            username=s.user.username,
            first_name=s.user.first_name,
            avatar_url=s.user.avatar_url,
        )
    place = None
    if s.place:
        place = schemas.PlaceSummary(id=s.place.id, name=s.place.name, category=s.place.category)

    view_count = crud.get_story_views_count(db, s.id)
    is_viewed = crud.is_story_viewed_by_user(db, s.id, current_user_id) if current_user_id else False
    reaction_count = db.query(models.StoryReaction).filter(models.StoryReaction.story_id == s.id).count()
    my_reaction = crud.get_my_story_reaction(db, s.id, current_user_id) if current_user_id else None

    return schemas.Story(
        id=s.id,
        user_id=s.user_id,
        place_id=s.place_id,
        media_type=s.media_type,
        media_url=s.media_url,
        thumbnail_url=s.thumbnail_url,
        is_archived=s.is_archived,
        privacy_type=s.privacy_type,
        is_close_friends=getattr(s, "is_close_friends", False),
        mentioned_user_ids=_parse_mentioned_ids(s.mentioned_user_ids),
        link_type=s.link_type,
        link_id=s.link_id,
        link_label=s.link_label,
        created_at=s.created_at,
        expires_at=s.expires_at,
        author=author,
        place=place,
        view_count=view_count,
        is_viewed=is_viewed,
        reaction_count=reaction_count,
        my_reaction=my_reaction,
    )


def check_story_view_access(db: Session, story: models.Story, viewer_id: int):
    """Kullanıcının hikayeyi görüntüleme yetkisi (Gizlilik, Engel vb.) olup olmadığını kontrol eder."""
    if story.user_id == viewer_id:
        return

    # Engel Kontrolü
    is_blocked = db.query(models.UserBlock).filter(
        (
            (models.UserBlock.blocker_id == story.user_id) & (models.UserBlock.blocked_id == viewer_id)
        ) | (
            (models.UserBlock.blocker_id == viewer_id) & (models.UserBlock.blocked_id == story.user_id)
        )
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Bu hikayeyi görüntüleme yetkiniz yok.")

    # Gizli Hesap Kontrolü
    prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id == story.user_id).first()
    is_private = prefs.is_private_account if prefs else False
    is_follower = db.query(models.Follow).filter(
        models.Follow.follower_id == viewer_id,
        models.Follow.following_id == story.user_id
    ).first() is not None

    if is_private and not is_follower:
        raise HTTPException(status_code=403, detail="Gizli hesapların hikayelerini sadece takipçileri görebilir.")

    # Yakın Arkadaş Kontrolü (Mevcut mantıkta mutual follow)
    if story.privacy_type == "close_friends":
        is_mutual = db.query(models.Follow).filter(
            models.Follow.follower_id == story.user_id,
            models.Follow.following_id == viewer_id
        ).first() is not None
        if not is_mutual:
            raise HTTPException(status_code=403, detail="Bu hikaye sadece Yakın Arkadaşlara özeldir.")

    # Gizli (Hide from) Kontrolü
    is_hidden = db.query(models.StoryHiddenUser).filter(
        models.StoryHiddenUser.user_id == story.user_id,
        models.StoryHiddenUser.hidden_user_id == viewer_id
    ).first()
    if is_hidden:
        raise HTTPException(status_code=403, detail="Bu hikaye sizden gizlenmiş.")


class StoryReactRequest(BaseModel):
    emoji: str = Field(..., description="❤️ 🔥 😍 👏 😂")


class StoryReplyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class StoryShareRequest(BaseModel):
    target_user_id: int = Field(..., description="Hikayenin gönderileceği kullanıcı ID'si")


class StoryReportRequest(BaseModel):
    reason: str = Field(..., description="Şikayet nedeni: spam, inappropriate, violence, harassment, other")
    description: str | None = Field(None, max_length=500, description="Ek açıklama (isteğe bağlı)")
