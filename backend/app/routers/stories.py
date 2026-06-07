# routers/stories.py — Hikaye endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Stories"])


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
        view_count=view_count,
        is_viewed=is_viewed,
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
    return _story_to_schema(story, db, current_user.id)


@router.get("/places/{place_id}/stories", response_model=schemas.PaginatedStories)
def get_place_stories(
    place_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Mekanın hikayelerini sayfalı olarak getirir."""
    stories, total = crud.get_stories_by_place(db, place_id, page, page_size)
    items = [_story_to_schema(s, db) for s in stories]
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
    items = [_story_to_schema(s, db, current_user.id if current_user else None) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


@router.get("/users/{user_id}/stories", response_model=schemas.PaginatedStories)
def get_user_stories(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Belirli bir kullanıcının aktif hikayelerini getirir."""
    from datetime import datetime, timezone
    query = db.query(models.Story).filter(
        models.Story.user_id == user_id,
        models.Story.expires_at > datetime.now(timezone.utc),
    ).order_by(models.Story.created_at.desc())
    total = query.count()
    stories = query.offset((page - 1) * page_size).limit(page_size).all()
    items = [_story_to_schema(s, db) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


class StoryReplyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


@router.post("/stories/{story_id}/reply")
async def reply_to_story(
    story_id: int,
    data: StoryReplyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Bir hikayeye yanıt ver → DM konuşmasına story_reply mesajı olarak kaydeder.

    Akış:
    1. Hikaye var mı ve süresi dolmamış mı kontrol et
    2. Kendi hikayene yanıt veremezsin
    3. Bu iki kullanıcı arasında mevcut DM konuşması var mı? Yoksa oluştur
    4. Yanıtı story_reply tipinde mesaj olarak kaydet (snapshot_url hikaye silindikten sonra da çalışır)
    5. WebSocket üzerinden story sahibine anlık bildir
    """
    from datetime import datetime, timezone

    # 1. Hikayeyi bul
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Bu hikayenin süresi dolmuş.")

    # 2. Kendi hikayene yanıt verme
    story_owner_id = story.user_id
    if story_owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hikayenize yanıt veremezsiniz.")

    # 3. Mevcut DM konuşmasını bul veya oluştur
    conv = db.query(models.MatchConversation).filter(
        (
            (models.MatchConversation.user1_id == current_user.id) &
            (models.MatchConversation.user2_id == story_owner_id)
        ) | (
            (models.MatchConversation.user1_id == story_owner_id) &
            (models.MatchConversation.user2_id == current_user.id)
        )
    ).first()

    if not conv:
        conv = models.MatchConversation(
            user1_id=current_user.id,
            user2_id=story_owner_id,
            is_active=True,
        )
        db.add(conv)
        db.flush()  # ID almak için flush, commit henüz değil

    # 4. story_reply mesajını kaydet (snapshot URL hikaye silindikten sonra da görünür)
    snapshot_url = story.thumbnail_url or story.media_url
    msg = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=data.text.strip(),
        message_type="story_reply",
        parent_story_id=story.id,
        story_snapshot_url=snapshot_url,
        status="sent",
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    # 5. WebSocket üzerinden hikaye sahibine bildir
    from app.websocket.manager import manager
    sender_name = current_user.first_name or current_user.username or f"User {current_user.id}"
    msg_data = {
        "id": msg.id,
        "conversation_id": conv.id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "message_type": "story_reply",
        "parent_story_id": story.id,
        "story_snapshot_url": snapshot_url,
        "is_read": False,
        "status": "sent",
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
    await manager.send_global_notification(story_owner_id, {
        "type": "new_message",
        "message": msg_data,
        "sender_name": sender_name,
        "content": f"Hikayenize yanıt verdi: {data.text[:60]}",
        "conversation_id": conv.id,
    })

    return {
        "ok": True,
        "conversation_id": conv.id,
        "message_id": msg.id,
    }


@router.post("/stories/{story_id}/view")
def record_story_view_endpoint(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Hikaye izlenme kaydı oluşturur."""
    recorded = crud.record_story_view(db, story_id, current_user.id)
    return {"ok": True, "recorded": recorded}


@router.get("/stories/{story_id}/viewers", response_model=schemas.StoryViewerList)
def get_story_viewers_endpoint(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Hikayeyi izleyen kullanıcıların listesini getirir (sadece hikaye sahibine açık)."""
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece kendi hikayelerinizin izleyicilerini görebilirsiniz.")
    
    viewers = crud.get_story_viewers(db, story_id)
    items = []
    for u in viewers:
        # Check if following
        is_following = crud.is_following(db, current_user.id, u.id)
        follow_status = None
        follow_row = db.query(models.Follow).filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.following_id == u.id,
        ).first()
        if follow_row:
            follow_status = follow_row.status

        # Privacy check
        prefs = db.query(models.UserPreferences).filter(
            models.UserPreferences.user_id == u.id
        ).first()
        is_private = prefs.is_private_account if prefs else False

        items.append(schemas.UserSummary(
            id=u.id,
            username=u.username,
            first_name=u.first_name,
            last_name=u.last_name,
            avatar_url=u.avatar_url,
            is_following=is_following,
            follow_status=follow_status,
            is_private=is_private,
        ))
    return schemas.StoryViewerList(items=items, total=len(items))
