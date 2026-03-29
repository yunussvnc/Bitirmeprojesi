# routers/messages.py — Mesajlaşma endpoint'leri (REST + WebSocket)

import json
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

import models, schemas
from auth import decode_token
from app.dependencies import get_db, get_current_user
from app.websocket.manager import manager

logger = logging.getLogger("asemos")

router = APIRouter(tags=["Messages"])


def _verify_conversation_access(db: Session, conversation_id: int, user_id: int) -> models.MatchConversation:
    """Kullanıcının bu konuşmaya erişimi var mı kontrol et"""
    conv = db.query(models.MatchConversation).filter(
        models.MatchConversation.id == conversation_id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı.")
    if user_id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(status_code=403, detail="Bu konuşmaya erişiminiz yok.")
    return conv


def _message_to_response(msg: models.Message) -> schemas.MessageResponse:
    """Message model → response schema"""
    sender_name = None
    if msg.sender:
        sender_name = msg.sender.first_name or msg.sender.username or f"User {msg.sender_id}"
    return schemas.MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        content=msg.content,
        message_type=msg.message_type,
        media_url=msg.media_url,
        shared_post_id=msg.shared_post_id,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender_name=sender_name,
    )


# ---- REST ENDPOINTS ----

@router.get("/messages/{conversation_id}", response_model=schemas.PaginatedMessages)
def get_messages(
    conversation_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mesaj geçmişini getir (en yeniden eskiye)"""
    conv = _verify_conversation_access(db, conversation_id, current_user.id)

    total = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).count()

    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).order_by(
        models.Message.created_at.desc()
    ).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    # Eski→Yeni sırasıyla dön (UI'da kolay render için)
    messages.reverse()

    items = [_message_to_response(m) for m in messages]
    return schemas.PaginatedMessages(
        items=items, total=total, page=page, page_size=page_size
    )


@router.post("/messages/{conversation_id}", response_model=schemas.MessageResponse)
async def send_message(
    conversation_id: int,
    data: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Mesaj gönder (REST fallback — WebSocket olmadan da çalışır).
    İçerik doğrulaması schema seviyesinde (Field min=1, max=5000) yapılır.
    """
    conv = _verify_conversation_access(db, conversation_id, current_user.id)

    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content.strip(),
        message_type=data.message_type,
        media_url=data.media_url,
        shared_post_id=data.shared_post_id,
    )
    db.add(msg)

    # Konuşmanın last_message_at güncelle
    conv.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    response = _message_to_response(msg)

    # WebSocket'e de push et (karşı tarafa)
    other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
    await manager.broadcast_to_conversation(
        conversation_id,
        {
            "type": "new_message",
            "message": response.model_dump(mode="json"),
        },
        exclude_user_id=current_user.id,
    )

    # Karşı taraf WS'de online değilse push notification gönder
    if not manager.is_user_online(other_user_id):
        import crud
        preview = data.content.strip()[:80] if data.content else "Yeni mesaj"
        crud.create_notification(
            db, other_user_id, "message", current_user.id,
            push_extra={"preview": preview, "conversation_id": conversation_id},
        )

    return response


@router.post("/messages/{conversation_id}/read")
def mark_messages_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Konuşmadaki tüm mesajları okundu olarak işaretle"""
    _verify_conversation_access(db, conversation_id, current_user.id)

    db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.sender_id != current_user.id,  # Sadece karşı tarafın mesajları
        models.Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {"ok": True}


@router.put("/messages/{message_id}/read")
def mark_single_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Belirli bir mesajı okundu olarak işaretle"""
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı.")
    
    _verify_conversation_access(db, msg.conversation_id, current_user.id)
    
    if msg.sender_id != current_user.id and not msg.is_read:
        msg.is_read = True
        db.commit()
        
    return {"ok": True, "is_read": msg.is_read}


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kendi mesajını sil"""
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı.")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece kendi mesajınızı silebilirsiniz.")

    db.delete(msg)
    db.commit()
    return {"ok": True}


@router.get("/messages/{conversation_id}/unread-count")
def unread_count(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Okunmamış mesaj sayısı"""
    _verify_conversation_access(db, conversation_id, current_user.id)

    count = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read == False,
    ).count()

    return {"count": count}


# ---- WEBSOCKET ENDPOINT ----

@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: int,
    token: str = Query(default=None),
):
    """
    WebSocket sohbet endpoint'i.
    Bağlantı: ws://host/ws/chat/{conversation_id}?token=JWT_TOKEN

    Mesaj formatları:
    - Gönderme: {"type": "message", "content": "Merhaba!", "message_type": "text"}
    - Typing:   {"type": "typing", "is_typing": true}
    - Read:     {"type": "read"}

    Alma:
    - Yeni mesaj:  {"type": "new_message", "message": {...}}
    - Typing:      {"type": "typing", "user_id": 123, "is_typing": true}
    - Read:        {"type": "messages_read", "user_id": 123}
    - Online:      {"type": "user_online", "user_id": 123}
    - Offline:     {"type": "user_offline", "user_id": 123}
    """

    # Token doğrulama
    if not token:
        await websocket.close(code=4001, reason="Token gerekli")
        return

    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Geçersiz token")
        return

    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Geçersiz token")
        return

    user_id = int(user_id)
    other_user_id = None
    
    # DB ile doğrulama
    db = next(get_db())
    try:
        conv = db.query(models.MatchConversation).filter(
            models.MatchConversation.id == conversation_id
        ).first()
        if not conv or user_id not in (conv.user1_id, conv.user2_id):
            await websocket.close(code=4003, reason="Bu konuşmaya erişiminiz yok")
            return

        other_user_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
    finally:
        db.close()

    # Bağlan
    await manager.connect(websocket, conversation_id, user_id)

    # Karşı tarafa online bildir
    await manager.send_to_user(conversation_id, other_user_id, {
        "type": "user_online",
        "user_id": user_id,
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "detail": "Geçersiz JSON"})
                continue

            msg_type = data.get("type")

            if msg_type == "message":
                # Yeni mesaj
                content = data.get("content", "").strip()
                if not content or len(content) > 5000:
                    continue

                db = next(get_db())
                try:
                    msg = models.Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        content=content,
                        message_type=data.get("message_type", "text"),
                        media_url=data.get("media_url"),
                        shared_post_id=data.get("shared_post_id"),
                    )
                    db.add(msg)
                    conv_obj = db.query(models.MatchConversation).filter(
                        models.MatchConversation.id == conversation_id
                    ).first()
                    if conv_obj:
                        conv_obj.last_message_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(msg)

                    # Sender'a geri bildir (id ve timestamp ile)
                    response_data = {
                        "type": "new_message",
                        "message": {
                            "id": msg.id,
                            "conversation_id": msg.conversation_id,
                            "sender_id": msg.sender_id,
                            "content": msg.content,
                            "message_type": msg.message_type,
                            "media_url": msg.media_url,
                            "shared_post_id": msg.shared_post_id,
                            "is_read": msg.is_read,
                            "created_at": msg.created_at.isoformat() if msg.created_at else None,
                        },
                    }

                    # Herkese gönder (kendisi dahil — confirmation için)
                    await manager.broadcast_to_conversation(conversation_id, response_data)

                    # Karşı taraf online değilse push notification gönder
                    import crud
                    if not manager.is_user_online(other_user_id):
                        preview = msg.content.strip()[:80] if msg.content else "Yeni mesaj"
                        crud.create_notification(
                            db, other_user_id, "message", user_id,
                            push_extra={"preview": preview, "conversation_id": conversation_id},
                        )

                finally:
                    db.close()

            elif msg_type == "typing":
                # Typing indicator
                await manager.broadcast_to_conversation(
                    conversation_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": data.get("is_typing", False),
                    },
                    exclude_user_id=user_id,
                )

            elif msg_type == "read":
                # Tüm mesajları okundu işaretle
                db = next(get_db())
                try:
                    db.query(models.Message).filter(
                        models.Message.conversation_id == conversation_id,
                        models.Message.sender_id != user_id,
                        models.Message.is_read == False,
                    ).update({"is_read": True})
                    db.commit()
                finally:
                    db.close()

                await manager.broadcast_to_conversation(
                    conversation_id,
                    {"type": "messages_read", "user_id": user_id},
                    exclude_user_id=user_id,
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket hatası: %s", str(e))
    finally:
        manager.disconnect(conversation_id, user_id)
        # Offline bildir
        if other_user_id is not None:
            try:
                await manager.send_to_user(conversation_id, other_user_id, {
                "type": "user_offline",
                "user_id": user_id,
            })
            except Exception:
                pass
