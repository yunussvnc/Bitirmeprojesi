"""Story sharing and reporting routes."""

import json as _json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user
from app.routers.story_helpers import (
    StoryReactRequest,
    StoryReplyRequest,
    StoryReportRequest,
    StoryShareRequest,
    _parse_mentioned_ids,
    _story_to_schema,
    check_story_view_access,
)

router = APIRouter()

@router.post("/stories/{story_id}/share")
async def share_story_via_dm(
    story_id: int,
    data: StoryShareRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Bir hikayeyi başka bir kullanıcıya DM üzerinden paylaşır.
    Gizli/close_friends hikayeler paylaşılamaz.
    """
    from datetime import datetime, timezone

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Bu hikayenin süresi dolmuş.")

    # Gizlilik kontrolü — close_friends hikayeler paylaşılamaz
    if story.privacy_type == "close_friends":
        raise HTTPException(status_code=403, detail="Yakın arkadaşlara özel hikayeler paylaşılamaz.")

    # Gizli hesap hikayesi paylaşılamaz
    owner_prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == story.user_id
    ).first()
    if owner_prefs and owner_prefs.is_private_account:
        raise HTTPException(status_code=403, detail="Gizli hesapların hikayeleri paylaşılamaz.")

    # Hedef kullanıcı kontrolü
    target_user = db.query(models.User).filter(models.User.id == data.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Hedef kullanıcı bulunamadı.")
    if data.target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize hikaye gönderemezsiniz.")

    # Engel kontrolü
    is_blocked = db.query(models.UserBlock).filter(
        (
            (models.UserBlock.blocker_id == current_user.id) & (models.UserBlock.blocked_id == data.target_user_id)
        ) | (
            (models.UserBlock.blocker_id == data.target_user_id) & (models.UserBlock.blocked_id == current_user.id)
        )
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Bu kullanıcıyla iletişim kuramazsınız.")

    # DM konuşması bul veya oluştur
    conv = db.query(models.Conversation).filter(
        (
            (models.Conversation.user1_id == current_user.id) &
            (models.Conversation.user2_id == data.target_user_id)
        ) | (
            (models.Conversation.user1_id == data.target_user_id) &
            (models.Conversation.user2_id == current_user.id)
        )
    ).first()

    if not conv:
        conv = models.Conversation(
            user1_id=current_user.id,
            user2_id=data.target_user_id,
            is_active=True,
        )
        db.add(conv)
        db.flush()

    snapshot_url = story.thumbnail_url or story.media_url
    author_name = ""
    if story.user:
        author_name = story.user.first_name or story.user.username or f"user_{story.user_id}"

    msg = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"📸 {author_name} adlı kişinin hikayesini paylaştı",
        message_type="story_share",
        parent_story_id=story.id,
        story_snapshot_url=snapshot_url,
        status="sent",
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    # WebSocket bildirimi
    from app.websocket.manager import manager
    sender_name = current_user.first_name or current_user.username or f"User {current_user.id}"
    msg_data = {
        "id": msg.id,
        "conversation_id": conv.id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "message_type": "story_share",
        "parent_story_id": story.id,
        "story_snapshot_url": snapshot_url,
        "is_read": False,
        "status": "sent",
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
    await manager.send_global_notification(data.target_user_id, {
        "type": "new_message",
        "message": msg_data,
        "sender_name": sender_name,
        "content": f"Bir hikaye paylaştı",
        "conversation_id": conv.id,
    })

    return {
        "ok": True,
        "conversation_id": conv.id,
        "message_id": msg.id,
    }


@router.post("/stories/{story_id}/report")
def report_story(
    story_id: int,
    data: StoryReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Bir hikayeyi şikayet eder. Aynı kullanıcı aynı hikayeyi birden fazla kez şikayet edemez."""
    if data.reason not in STORY_REPORT_REASONS:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz şikayet nedeni. İzin verilenler: {', '.join(STORY_REPORT_REASONS)}"
        )

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")
    if story.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hikayenizi şikayet edemezsiniz.")

    # Aynı kullanıcı daha önce bu hikayeyi şikayet etmiş mi?
    existing = db.query(models.Report).filter(
        models.Report.reporter_id == current_user.id,
        models.Report.target_type == "story",
        models.Report.target_id == story_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Bu hikayeyi zaten şikayet ettiniz.")

    report = models.Report(
        reporter_id=current_user.id,
        target_type="story",
        target_id=story_id,
        reason=data.reason,
        description=data.description,
        status="pending",
    )
    db.add(report)
    db.commit()

    return {"ok": True, "report_id": report.id}
