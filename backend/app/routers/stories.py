# routers/stories.py — Hikaye endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Stories"])


def _story_to_schema(s):
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
    return schemas.Story(
        id=s.id,
        user_id=s.user_id,
        place_id=s.place_id,
        media_type=s.media_type,
        media_url=s.media_url,
        thumbnail_url=s.thumbnail_url,
        is_close_friends=getattr(s, "is_close_friends", False),
        created_at=s.created_at,
        expires_at=s.expires_at,
        author=author,
        place=place,
    )


@router.post("/stories", response_model=schemas.Story)
def create_story(
    data: schemas.StoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Yeni hikaye oluşturur. Mekan ID verilmişse geçerliliği doğrulanır."""
    if data.place_id is not None and not crud.get_place_by_id(db, data.place_id):
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    story = crud.create_story(db, current_user.id, data)
    return _story_to_schema(story)


@router.get("/places/{place_id}/stories", response_model=schemas.PaginatedStories)
def get_place_stories(
    place_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Mekanın hikayelerini sayfalı olarak getirir."""
    stories, total = crud.get_stories_by_place(db, place_id, page, page_size)
    items = [_story_to_schema(s) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


@router.get("/feed/stories", response_model=schemas.PaginatedStories)
def get_feed_stories(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    filter: str = Query("all"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Akış (feed) için hikayeler – Herkes veya Takip Ettiklerim."""
    filter_mode = "following" if filter == "following" else "all"
    stories, total = crud.get_feed_stories(
        db,
        page=page,
        page_size=page_size,
        current_user_id=current_user.id if current_user else None,
        filter_mode=filter_mode,
    )
    items = [_story_to_schema(s) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)
