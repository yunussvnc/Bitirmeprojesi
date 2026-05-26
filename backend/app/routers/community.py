# routers/community.py — Topluluk Odaları (Mekan/Bölge Tabanlı Grup Sohbeti)

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session, joinedload

import models, schemas
from auth import decode_token
from app.dependencies import get_db, get_current_user, get_optional_user
from app.websocket.manager import manager

logger = logging.getLogger("asemos")

router = APIRouter(prefix="/community", tags=["Community"])


def _room_to_response(room: models.CommunityRoom, db: Session, current_user_id: int | None = None) -> schemas.CommunityRoomResponse:
    """CommunityRoom model → response schema"""
    member_count = db.query(models.CommunityMember).filter(
        models.CommunityMember.room_id == room.id
    ).count()
    
    is_member = False
    if current_user_id:
        is_member = db.query(models.CommunityMember).filter(
            models.CommunityMember.room_id == room.id,
            models.CommunityMember.user_id == current_user_id,
        ).first() is not None
    
    return schemas.CommunityRoomResponse(
        id=room.id,
        name=room.name,
        description=room.description,
        place_id=room.place_id,
        cover_image_url=room.cover_image_url,
        room_type=room.room_type,
        is_active=room.is_active,
        member_count=member_count,
        created_by=room.created_by,
        created_at=room.created_at,
        last_message_at=room.last_message_at,
        is_member=is_member,
    )


def _cmsg_to_response(msg: models.CommunityMessage) -> schemas.CommunityMessageResponse:
    """CommunityMessage model → response schema"""
    sender_name = None
    sender_avatar = None
    if msg.sender:
        sender_name = msg.sender.first_name or msg.sender.username or f"User {msg.sender_id}"
        sender_avatar = msg.sender.avatar_url
    return schemas.CommunityMessageResponse(
        id=msg.id,
        room_id=msg.room_id,
        sender_id=msg.sender_id,
        content=msg.content,
        message_type=msg.message_type,
        media_url=msg.media_url,
        shared_place_id=msg.shared_place_id,
        created_at=msg.created_at,
        sender_name=sender_name,
        sender_avatar=sender_avatar,
    )


# ---- REST ENDPOINTS ----

@router.get("/rooms")
def list_rooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    place_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Topluluk odalarını listele. place_id ile filtreleme destekler."""
    base = db.query(models.CommunityRoom).filter(models.CommunityRoom.is_active == True)
    
    if place_id:
        base = base.filter(models.CommunityRoom.place_id == place_id)
    
    total = base.count()
    rooms = base.order_by(models.CommunityRoom.last_message_at.desc().nullslast()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    uid = current_user.id if current_user else None
    items = [_room_to_response(r, db, uid) for r in rooms]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/rooms")
def create_room(
    data: schemas.CommunityRoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Yeni topluluk odası oluştur."""
    room = models.CommunityRoom(
        name=data.name,
        description=data.description,
        place_id=data.place_id,
        room_type=data.room_type,
        cover_image_url=data.cover_image_url,
        created_by=current_user.id,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Oluşturanı otomatik olarak admin yap
    member = models.CommunityMember(
        room_id=room.id,
        user_id=current_user.id,
        role="admin",
    )
    db.add(member)
    db.commit()
    
    return _room_to_response(room, db, current_user.id)


@router.post("/rooms/{room_id}/join")
def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Topluluk odasına katıl."""
    room = db.query(models.CommunityRoom).filter(models.CommunityRoom.id == room_id).first()
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Oda bulunamadı.")
    
    # Zaten üye mi?
    existing = db.query(models.CommunityMember).filter(
        models.CommunityMember.room_id == room_id,
        models.CommunityMember.user_id == current_user.id,
    ).first()
    if existing:
        return {"ok": True, "message": "Zaten bu odanın üyesisiniz."}
    
    # Max member kontrolü
    member_count = db.query(models.CommunityMember).filter(
        models.CommunityMember.room_id == room_id
    ).count()
    if member_count >= room.max_members:
        raise HTTPException(status_code=400, detail="Oda kapasitesi dolu.")
    
    member = models.CommunityMember(
        room_id=room_id,
        user_id=current_user.id,
        role="member",
    )
    db.add(member)
    db.commit()
    return {"ok": True, "message": "Odaya katıldınız."}


@router.post("/rooms/{room_id}/leave")
def leave_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Topluluk odasından ayrıl."""
    member = db.query(models.CommunityMember).filter(
        models.CommunityMember.room_id == room_id,
        models.CommunityMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Bu odanın üyesi değilsiniz.")
    
    db.delete(member)
    db.commit()
    return {"ok": True, "message": "Odadan ayrıldınız."}


@router.get("/rooms/{room_id}/messages", response_model=schemas.PaginatedCommunityMessages)
def get_room_messages(
    room_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Oda mesaj geçmişini getir (Pagination ile)."""
    # Üyelik kontrolü
    member = db.query(models.CommunityMember).filter(
        models.CommunityMember.room_id == room_id,
        models.CommunityMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Bu odanın üyesi değilsiniz.")
    
    total = db.query(models.CommunityMessage).filter(
        models.CommunityMessage.room_id == room_id
    ).count()
    
    messages = db.query(models.CommunityMessage).filter(
        models.CommunityMessage.room_id == room_id
    ).options(
        joinedload(models.CommunityMessage.sender)
    ).order_by(
        models.CommunityMessage.created_at.desc()
    ).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    messages.reverse()
    items = [_cmsg_to_response(m) for m in messages]
    return schemas.PaginatedCommunityMessages(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/rooms/{room_id}")
def get_room_detail(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Oda detaylarını getir."""
    room = db.query(models.CommunityRoom).filter(models.CommunityRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Oda bulunamadı.")
    uid = current_user.id if current_user else None
    return _room_to_response(room, db, uid)


# ---- WEBSOCKET ENDPOINT ----

@router.websocket("/ws/community/{room_id}")
async def websocket_community(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(default=None),
):
    """
    Topluluk odası WebSocket endpoint'i.
    Bağlantı: ws://host/community/ws/community/{room_id}?token=JWT_TOKEN

    Gönderme:
    - Mesaj:  {"type": "message", "content": "Bu mekan harika!", "message_type": "text"}
    - Typing: {"type": "typing", "is_typing": true}
    - Mekan Paylaşımı: {"type": "message", "content": "Bunu deneyin!", "message_type": "place_share", "shared_place_id": 42}

    Alma:
    - Yeni mesaj:     {"type": "new_message", "message": {...}}
    - Typing:         {"type": "typing", "user_id": 123, "is_typing": true}
    - Kullanıcı girdi: {"type": "user_joined", "user_id": 123}
    - Kullanıcı çıktı: {"type": "user_left", "user_id": 123}
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

    user_id_str = payload.get("sub")
    if not user_id_str or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Geçersiz token")
        return

    user_id = int(user_id_str)
    room_id_str = str(room_id)

    # Üyelik kontrolü
    db = next(get_db())
    try:
        member = db.query(models.CommunityMember).filter(
            models.CommunityMember.room_id == room_id,
            models.CommunityMember.user_id == user_id,
        ).first()
        if not member:
            await websocket.close(code=4003, reason="Bu odanın üyesi değilsiniz")
            return
    finally:
        db.close()

    # Odaya bağlan (socket.join(venue_id) mantığı)
    await manager.connect_room(websocket, room_id_str, user_id)

    # Odadaki herkese bildir
    await manager.broadcast_to_room(room_id_str, {
        "type": "user_joined",
        "user_id": user_id,
        "online_count": manager.get_room_online_count(room_id_str),
    }, exclude_user_id=user_id)

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
                content = data.get("content", "").strip()
                if not content or len(content) > 5000:
                    continue

                db = next(get_db())
                try:
                    msg = models.CommunityMessage(
                        room_id=room_id,
                        sender_id=user_id,
                        content=content,
                        message_type=data.get("message_type", "text"),
                        media_url=data.get("media_url"),
                        shared_place_id=data.get("shared_place_id"),
                    )
                    db.add(msg)
                    
                    # Odanın last_message_at güncelle
                    room_obj = db.query(models.CommunityRoom).filter(
                        models.CommunityRoom.id == room_id
                    ).first()
                    if room_obj:
                        room_obj.last_message_at = datetime.now(timezone.utc)
                    
                    db.commit()
                    db.refresh(msg)

                    # Sender bilgisi (Munia hafif JSON paketleme)
                    sender = db.query(models.User).filter(models.User.id == user_id).first()
                    sender_name = sender.first_name or sender.username if sender else None
                    sender_avatar = sender.avatar_url if sender else None

                    # Tüm odaya yayınla (kendisi dahil — onay için)
                    await manager.broadcast_to_room(room_id_str, {
                        "type": "new_message",
                        "message": {
                            "id": msg.id,
                            "room_id": msg.room_id,
                            "sender_id": msg.sender_id,
                            "content": msg.content,
                            "message_type": msg.message_type,
                            "media_url": msg.media_url,
                            "shared_place_id": msg.shared_place_id,
                            "created_at": msg.created_at.isoformat() if msg.created_at else None,
                            "sender_name": sender_name,
                            "sender_avatar": sender_avatar,
                        },
                    })
                finally:
                    db.close()

            elif msg_type == "typing":
                await manager.broadcast_to_room(
                    room_id_str,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": data.get("is_typing", False),
                    },
                    exclude_user_id=user_id,
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("Community WebSocket hatası: %s", str(e))
    finally:
        manager.disconnect_room(room_id_str, user_id)
        try:
            await manager.broadcast_to_room(room_id_str, {
                "type": "user_left",
                "user_id": user_id,
                "online_count": manager.get_room_online_count(room_id_str),
            })
        except Exception:
            pass
