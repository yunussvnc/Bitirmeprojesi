# routers/stories.py — Hikaye endpoint'leri

import json as _json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Stories"])


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


# ─── Story Oluşturma ────────────────────────────────────────────────────────

@router.post("/stories", response_model=schemas.Story)
def create_story(
    data: schemas.StoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Yeni hikaye oluşturur. Mekan ID verilmişse geçerliliği doğrulanır.
    Mention edilen kullanıcılara bildirim gönderilir.
    """
    if data.place_id is not None and not crud.get_place_by_id(db, data.place_id):
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    story = crud.create_story(db, current_user.id, data)

    # Mention bildirimleri
    if data.mentioned_user_ids:
        for uid in data.mentioned_user_ids:
            if uid != current_user.id:
                notif = models.Notification(
                    user_id=uid,
                    type="story_mention",
                    actor_id=current_user.id,
                    payload=_json.dumps({
                        "story_id": story.id,
                        "actor_username": current_user.username or f"user_{current_user.id}",
                        "actor_avatar": current_user.avatar_url,
                        "media_url": story.thumbnail_url or story.media_url,
                    }),
                )
                db.add(notif)
        db.commit()

    return _story_to_schema(story, db, current_user.id)


# ─── Feed ve Listeleme ──────────────────────────────────────────────────────

@router.get("/places/{place_id}/stories", response_model=schemas.PaginatedStories)
def get_place_stories(
    place_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Mekanın aktif (süresi dolmamış + arşivlenmemiş) hikayelerini sayfalı olarak getirir."""
    from datetime import datetime, timezone
    uid = current_user.id if current_user else None
    stories, total = crud.get_stories_by_place(db, place_id, page, page_size)
    items = [_story_to_schema(s, db, uid) for s in stories]
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
    uid = current_user.id if current_user else None
    items = [_story_to_schema(s, db, uid) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


@router.get("/users/{user_id}/stories", response_model=schemas.PaginatedStories)
def get_user_stories(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Belirli bir kullanıcının aktif hikayelerini getirir."""
    from datetime import datetime, timezone
    query = db.query(models.Story).filter(
        models.Story.user_id == user_id,
        models.Story.expires_at > datetime.now(timezone.utc),
        models.Story.is_archived == False,
    ).order_by(models.Story.created_at.desc())
    total = query.count()
    stories = query.offset((page - 1) * page_size).limit(page_size).all()
    uid = current_user.id if current_user else None
    items = [_story_to_schema(s, db, uid) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


# ─── Görüntüleme (View) ─────────────────────────────────────────────────────

@router.post("/stories/{story_id}/view")
def record_story_view_endpoint(
    story_id: int,
    source: Optional[str] = Query(None, description="'feed', 'place', 'profile', 'mention'"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Hikaye açıldığında ilk görüntüleme kaydı oluşturur."""
    recorded = crud.record_story_view(db, story_id, current_user.id, source=source)
    return {"ok": True, "recorded": recorded}


@router.patch("/stories/{story_id}/view")
def update_story_view_analytics_endpoint(
    story_id: int,
    data: schemas.StoryViewAnalyticsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Hikaye kapatıldığında izleme süresi ve etkileşim analitiklerini günceller.
    Frontend hikayeyi kapattığında çağırmalı.
    """
    crud.update_story_view_analytics(
        db,
        story_id=story_id,
        viewer_id=current_user.id,
        watch_duration_seconds=data.watch_duration_seconds,
        did_visit_profile=data.did_visit_profile,
        did_visit_place=data.did_visit_place,
        source=data.source,
    )
    return {"ok": True}


@router.get("/stories/{story_id}/viewers", response_model=schemas.StoryViewerList)
def get_story_viewers_endpoint(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Hikayeyi izleyen kullanıcıların listesini getirir (sadece hikaye sahibine açık).
    Mekan hesapları (role=venue_owner) için analitik veriler de döner.
    """
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece kendi hikayelerinizin izleyicilerini görebilirsiniz.")

    is_venue = current_user.role in ("venue_owner", "admin")

    views = crud.get_story_viewers_with_analytics(db, story_id)
    items = []
    total_watch = 0
    profile_visits = 0
    place_visits = 0

    for v in views:
        u = v.viewer
        if not u:
            continue
        is_following = crud.is_following(db, current_user.id, u.id)
        follow_status = None
        follow_row = db.query(models.Follow).filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.following_id == u.id,
        ).first()
        if follow_row:
            follow_status = follow_row.status

        prefs = db.query(models.UserPreferences).filter(
            models.UserPreferences.user_id == u.id
        ).first()
        is_private = prefs.is_private_account if prefs else False

        user_summary = schemas.UserSummary(
            id=u.id,
            username=u.username,
            first_name=u.first_name,
            last_name=u.last_name,
            avatar_url=u.avatar_url,
            is_following=is_following,
            follow_status=follow_status,
            is_private=is_private,
        )

        items.append(schemas.StoryViewerItem(
            user=user_summary,
            viewed_at=v.created_at,
            # Analitik veriler sadece mekan hesabına tam gösterilir
            watch_duration_seconds=v.watch_duration_seconds if is_venue else 0,
            did_visit_profile=v.did_visit_profile if is_venue else False,
            did_visit_place=v.did_visit_place if is_venue else False,
            source=v.source if is_venue else None,
        ))

        if is_venue:
            total_watch += v.watch_duration_seconds
            if v.did_visit_profile:
                profile_visits += 1
            if v.did_visit_place:
                place_visits += 1

    return schemas.StoryViewerList(
        items=items,
        total=len(items),
        total_watch_seconds=total_watch,
        profile_visit_count=profile_visits,
        place_visit_count=place_visits,
    )


# ─── Tepkiler (Reactions) ───────────────────────────────────────────────────

class StoryReactRequest(BaseModel):
    emoji: str = Field(..., description="❤️ 🔥 😍 👏 😂")


@router.post("/stories/{story_id}/react")
async def react_to_story(
    story_id: int,
    data: StoryReactRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Hikayeye emoji tepkisi gönder. Aynı emoji tekrar gönderilirse kaldırılır (toggle).
    Tepki DM üzerinden hikaye sahibine de iletilir.
    """
    from datetime import datetime, timezone

    if data.emoji not in crud.ALLOWED_STORY_EMOJIS:
        raise HTTPException(status_code=400, detail=f"Geçersiz emoji. İzin verilenler: {', '.join(crud.ALLOWED_STORY_EMOJIS)}")

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Bu hikayenin süresi dolmuş.")
    if story.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hikayenize tepki veremezsiniz.")

    # Toggle: aynı emoji zaten varsa sil
    existing = db.query(models.StoryReaction).filter(
        models.StoryReaction.story_id == story_id,
        models.StoryReaction.user_id == current_user.id,
    ).first()

    if existing and existing.emoji == data.emoji:
        crud.delete_story_reaction(db, story_id, current_user.id)
        return {"ok": True, "action": "removed", "emoji": data.emoji}

    reaction, created = crud.upsert_story_reaction(db, story_id, current_user.id, data.emoji)

    # Hikaye sahibine bildirim gönder
    notif = models.Notification(
        user_id=story.user_id,
        type="story_reaction",
        actor_id=current_user.id,
        payload=_json.dumps({
            "story_id": story_id,
            "emoji": data.emoji,
            "actor_username": current_user.username or f"user_{current_user.id}",
            "actor_avatar": current_user.avatar_url,
            "media_url": story.thumbnail_url or story.media_url,
        }),
    )
    db.add(notif)
    db.commit()

    # WebSocket ile anlık bildirim
    from app.websocket.manager import manager
    sender_name = current_user.first_name or current_user.username or f"User {current_user.id}"
    await manager.send_global_notification(story.user_id, {
        "type": "story_reaction",
        "story_id": story_id,
        "emoji": data.emoji,
        "actor_id": current_user.id,
        "actor_name": sender_name,
        "actor_avatar": current_user.avatar_url,
    })

    return {"ok": True, "action": "added" if created else "updated", "emoji": data.emoji}


@router.delete("/stories/{story_id}/react")
def remove_story_reaction(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Hikayeden tepkiyi kaldır."""
    removed = crud.delete_story_reaction(db, story_id, current_user.id)
    if not removed:
        raise HTTPException(status_code=404, detail="Tepki bulunamadı.")
    return {"ok": True}


@router.get("/stories/{story_id}/reactions", response_model=schemas.StoryReactionListResponse)
def get_story_reactions_endpoint(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Hikayenin tepkilerini ve emoji dağılımını getirir (hikaye sahibine açık)."""
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece kendi hikayenizin tepkilerini görebilirsiniz.")

    reactions = crud.get_story_reactions(db, story_id)
    counts = crud.get_story_reaction_counts(db, story_id)

    items = []
    for r in reactions:
        u = r.user
        items.append(schemas.StoryReactionResponse(
            emoji=r.emoji,
            user=schemas.UserSummary(
                id=u.id,
                username=u.username,
                first_name=u.first_name,
                avatar_url=u.avatar_url,
            ),
            created_at=r.created_at,
        ))

    return schemas.StoryReactionListResponse(items=items, total=len(items), counts=counts)


# ─── Yanıt (Reply) ─────────────────────────────────────────────────────────

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
    Bir hikayeye metin yanıtı ver → DM konuşmasına story_reply mesajı olarak kaydeder.
    """
    from datetime import datetime, timezone

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Bu hikayenin süresi dolmuş.")
    if story.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hikayenize yanıt veremezsiniz.")

    story_owner_id = story.user_id
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
        db.flush()

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


# ─── Arşiv ─────────────────────────────────────────────────────────────────

@router.get("/me/stories/archive", response_model=schemas.PaginatedStories)
def get_my_story_archive(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Kullanıcının arşivlenmiş hikayelerini getirir.
    Süresi dolan hikayeler otomatik olarak arşivlenerek burada görünür.
    """
    # Önce süresi dolmuş hikayeleri arşivle
    crud.archive_expired_stories(db, user_id=current_user.id)

    stories, total = crud.get_archived_stories(db, current_user.id, page, page_size)
    items = [_story_to_schema(s, db, current_user.id) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)
