# routers/messages.py — Mesajlaşma endpoint'leri (REST + WebSocket)
# Gizlilik Kuralları Motoru dahil

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

import models, schemas
import crud
from app.dependencies import get_db, get_current_user
from app.websocket.auth import authenticate_websocket_token, websocket_session_is_current
from app.websocket.manager import manager

logger = logging.getLogger("asemos")

router = APIRouter(tags=["Messages"])

_BLOCK_OPEN_DETAIL = "Bu kullanıcıyla mesajlaşamazsınız. Engelleme nedeniyle erişim kapalı."
_BLOCK_SEND_DETAIL = "Bu kullanıcıyla mesaj gönderemezsiniz. Engel mevcut."


def _raise_if_users_blocked(db: Session, user_a: int, user_b: int) -> None:
    if crud.users_block_each_other(db, user_a, user_b):
        raise HTTPException(status_code=403, detail=_BLOCK_OPEN_DETAIL)


# ─────────────────────────────────────────────────────────────
# Yardımcı: Konuşma erişim doğrulaması
# ─────────────────────────────────────────────────────────────

def _verify_conversation_access(db: Session, conversation_id: int, user_id: int) -> models.Conversation:
    """Kullanıcının bu konuşmaya erişimi var mı kontrol et"""
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı.")
    if user_id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(status_code=403, detail="Bu konuşmaya erişiminiz yok.")
    return conv


# ─────────────────────────────────────────────────────────────
# 🔐 Merkezi Mesajlaşma Gizlilik Motoru
# ─────────────────────────────────────────────────────────────

def _get_messaging_permission(
    db: Session,
    conversation_id: int,
    sender_id: int,
) -> schemas.ConversationPermission:
    """
    Gönderici (sender_id) → alıcı yönünde mesajlaşma izinlerini hesapla.

    Kurallar:
    1. B gizli + karşılıklı takip yok → can_send=False
    2. B açık + karşılıklı takip yok → max 1 metin, medya yok, read receipt gizli
    3. Karşılıklı takip → sınırsız, medya serbest, read receipt anlık
    """
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not conv:
        return schemas.ConversationPermission(
            can_send=False, can_send_media=False, hide_read_receipt=True,
            reason="conversation_not_found"
        )

    # Alıcı kim?
    receiver_id = conv.user2_id if conv.user1_id == sender_id else conv.user1_id

    if crud.users_block_each_other(db, sender_id, receiver_id):
        return schemas.ConversationPermission(
            can_send=False,
            can_send_media=False,
            hide_read_receipt=True,
            reason="blocked",
        )

    receiver = db.query(models.User).filter(models.User.id == receiver_id).first()
    if not receiver or not receiver.is_active:
        return schemas.ConversationPermission(
            can_send=False, can_send_media=False, hide_read_receipt=True,
            reason="receiver_not_found"
        )

    # ── Takip durumu ──────────────────────────────────────────
    # A → B (gönderici B'yi takip ediyor mu?)
    a_follows_b = db.query(models.Follow).filter(
        models.Follow.follower_id == sender_id,
        models.Follow.following_id == receiver_id,
        models.Follow.status == "accepted",
    ).first() is not None

    # B → A (alıcı göndericiye geri takip ediyor mu?)
    b_follows_a = db.query(models.Follow).filter(
        models.Follow.follower_id == receiver_id,
        models.Follow.following_id == sender_id,
        models.Follow.status == "accepted",
    ).first() is not None

    mutual = a_follows_b and b_follows_a

    # ── Alıcının tercihlerini oku ──────────────────────────────
    receiver_prefs = receiver.preferences
    receiver_is_private = bool(receiver_prefs and receiver_prefs.is_private_account)
    # Kullanıcı read receipt'leri kapatmışsa, karşılıklı takipleşme olsa bile gizle
    receiver_hides_read = bool(receiver_prefs and receiver_prefs.show_read_receipts is False)
    # Kullanıcı tanımadığı kişilerden mesaj istemiyor mu?
    receiver_blocks_unknown = bool(receiver_prefs and receiver_prefs.unknown_message_requests is False)

    # ── Kural 3: Karşılıklı takip → tam serbest ──────────────
    if mutual:
        return schemas.ConversationPermission(
            can_send=True,
            can_send_media=True,
            hide_read_receipt=receiver_hides_read,
            reason="mutual_follow",
        )

    # ── Kural 1: B gizli hesap + takipleşme yok → tamamen engel ─
    if receiver_is_private:
        return schemas.ConversationPermission(
            can_send=False,
            can_send_media=False,
            hide_read_receipt=True,
            reason="private_account_no_mutual",
        )

    # ── Kural 1.5: B "tanımadığım kişilerden mesaj istemiyorum" açık ──
    if receiver_blocks_unknown and not a_follows_b and not b_follows_a:
        return schemas.ConversationPermission(
            can_send=False,
            can_send_media=False,
            hide_read_receipt=True,
            reason="unknown_messages_disabled",
        )

    # ── Kural 2: B açık hesap, kısıtlı mod (ping-pong) ───────
    # B'nin en son gönderdiği mesajın zamanını bul
    last_receiver_msg = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.sender_id == receiver_id,
    ).order_by(models.Message.created_at.desc(), models.Message.id.desc()).first()

    if last_receiver_msg:
        # B cevap vermiş → A'nın B'nin son mesajından SONRA gönderdiği sayı
        # ID karşılaştırması kullanıyoruz çünkü created_at eşit olabilir (aynı saniye)
        sent_after_reply = db.query(models.Message).filter(
            models.Message.conversation_id == conversation_id,
            models.Message.sender_id == sender_id,
            models.Message.id > last_receiver_msg.id,
        ).count()
        awaiting_reply = sent_after_reply >= 1
        sent_count = sent_after_reply
    else:
        # B hiç cevap vermedi → A'nın toplam mesaj sayısı
        sent_count = db.query(models.Message).filter(
            models.Message.conversation_id == conversation_id,
            models.Message.sender_id == sender_id,
        ).count()
        awaiting_reply = sent_count >= 1

    # Limit kontrolü: 1 mesaj gönderilmişse ve B henüz cevap vermediyse → engelle
    if awaiting_reply:
        return schemas.ConversationPermission(
            can_send=False,
            can_send_media=False,
            hide_read_receipt=True,
            reason="awaiting_reply",
            messages_sent_count=sent_count,
            awaiting_reply=True,
        )

    # İlk metin gönderilebilir ama medya yasak, read receipt gizli
    return schemas.ConversationPermission(
        can_send=True,
        can_send_media=False,
        hide_read_receipt=True,
        reason="restricted_first_message",
        messages_sent_count=sent_count,
        awaiting_reply=False,
    )


# ─────────────────────────────────────────────────────────────
# Yardımcı: Message → Response dönüşümü
# ─────────────────────────────────────────────────────────────

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
        parent_story_id=msg.parent_story_id,
        story_snapshot_url=msg.story_snapshot_url,
        is_read=msg.is_read,
        status=msg.status or "sent",
        created_at=msg.created_at,
        sender_name=sender_name,
    )


# ─────────────────────────────────────────────────────────────
# REST ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("/messages/conversation/open")
def open_or_create_conversation(
    data: schemas.OpenConversationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Belirtilen kullanıcıyla mevcut DM konuşmasını getir veya yenisini oluştur.
    Profil ekranındaki 'Mesaj' butonu için kullanılır.
    Gizli hesaplara sadece karşılıklı takip varsa konuşma açılır.
    """
    other_user_id = data.user_id

    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinizle konuşamazsınız.")

    other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
    if not other_user or not other_user.is_active:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    _raise_if_users_blocked(db, current_user.id, other_user_id)

    # Gizli hesap kontrolü — mevcut konuşma yoksa ve karşılıklı takip yoksa engelle
    existing_conv = db.query(models.Conversation).filter(
        (
            (models.Conversation.user1_id == current_user.id) &
            (models.Conversation.user2_id == other_user_id)
        ) | (
            (models.Conversation.user1_id == other_user_id) &
            (models.Conversation.user2_id == current_user.id)
        )
    ).first()

    other_is_private = bool(other_user.preferences and other_user.preferences.is_private_account)
    if not existing_conv and other_is_private:
        # Karşılıklı takip var mı?
        mutual = (
            db.query(models.Follow).filter(
                models.Follow.follower_id == current_user.id,
                models.Follow.following_id == other_user_id,
                models.Follow.status == "accepted",
            ).first() is not None
        ) and (
            db.query(models.Follow).filter(
                models.Follow.follower_id == other_user_id,
                models.Follow.following_id == current_user.id,
                models.Follow.status == "accepted",
            ).first() is not None
        )
        if not mutual:
            raise HTTPException(
                status_code=403,
                detail="private_account_no_mutual"
            )

    conv = existing_conv
    if not conv:
        # Duplikat konuşma oluşmasını önlemek için user ID'leri sırala
        u1 = min(current_user.id, other_user_id)
        u2 = max(current_user.id, other_user_id)
        conv = models.Conversation(
            user1_id=u1,
            user2_id=u2,
            is_active=True,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return {
        "conversation_id": conv.id,
        "user_id": other_user_id,
        "username": other_user.username or other_user.email,
        "name": other_user.first_name or other_user.username or other_user.email,
        "avatar_url": other_user.avatar_url,
    }

@router.get("/messages/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Kullanıcının aktif sohbetlerini (DM) listeler.
    """
    convs = db.query(models.Conversation).filter(
        (models.Conversation.user1_id == current_user.id) |
        (models.Conversation.user2_id == current_user.id),
        models.Conversation.is_active == True,
    ).order_by(models.Conversation.last_message_at.desc().nullslast()).all()

    result = []
    for conv in convs:
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
        
        display_name = "Kullanıcı bulunamadı"
        avatar_url = ""
        
        if other_user:
            is_blocked = crud.users_block_each_other(db, current_user.id, other_user_id)
            if not is_blocked and other_user.is_active:
                display_name = other_user.first_name or other_user.username or "Kullanıcı"
                avatar_url = other_user.avatar_url or ""

        unread_count = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id,
            models.Message.sender_id == other_user_id,
            models.Message.is_read == False
        ).count()

        last_msg = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id
        ).order_by(models.Message.created_at.desc()).first()

        last_msg_text = None
        last_msg_sender_id = None
        if last_msg:
            if last_msg.message_type == "image":
                last_msg_text = "📷 Fotoğraf"
            elif last_msg.message_type == "story_reply":
                last_msg_text = "Hikayeye yanıt verdi"
            else:
                last_msg_text = last_msg.content
            last_msg_sender_id = last_msg.sender_id

        result.append(schemas.ConversationResponse(
            id=conv.id,
            other_user_display_name=display_name,
            other_user_photo=avatar_url,
            other_user_id=other_user_id,
            place_name=conv.place_name,
            is_active=conv.is_active,
            created_at=conv.created_at,
            last_message_at=conv.last_message_at,
            last_message_text=last_msg_text,
            last_message_sender_id=last_msg_sender_id,
            unread_count=unread_count,
            is_request=False
        ))

    return result



@router.get("/messages/{conversation_id}/permission", response_model=schemas.ConversationPermission)
def get_conversation_permission(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Mevcut kullanıcının bu konuşmada mesajlaşma izinlerini döner.
    Frontend, konuşma ekranı açılırken bunu çağırarak UI'ı kilitler/açar.
    """
    _verify_conversation_access(db, conversation_id, current_user.id)
    return _get_messaging_permission(db, conversation_id, current_user.id)


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

    messages.reverse()

    # Blocked user filtering for shared posts
    blocked_by_me = {r[0] for r in db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == current_user.id).all()}
    blocked_me = {r[0] for r in db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == current_user.id).all()}
    all_blocked_ids = blocked_by_me | blocked_me

    items = []
    for m in messages:
        resp = _message_to_response(m)
        if resp.shared_post_id and all_blocked_ids:
            post = db.query(models.Post).filter(models.Post.id == resp.shared_post_id).first()
            if post and post.user_id in all_blocked_ids:
                author = db.query(models.User).filter(models.User.id == post.user_id).first()
                author_name = author.username if author else "Bilinmeyen"
                resp.content = f"Engellediğiniz {author_name} kullanıcısının gönderisi"
                resp.shared_post_id = None
                resp.media_url = None
        items.append(resp)
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
    Mesaj gönder (REST fallback).
    Gizlilik kuralları burada uygulanır.
    """
    conv = _verify_conversation_access(db, conversation_id, current_user.id)

    # 🔐 Gizlilik kontrolü
    perm = _get_messaging_permission(db, conversation_id, current_user.id)

    if not perm.can_send:
        detail = _BLOCK_SEND_DETAIL if perm.reason == "blocked" else (perm.reason or "messaging_not_allowed")
        raise HTTPException(status_code=403, detail=detail)

    # Medya içeriyorsa ek kontrol
    has_media = bool(data.media_url) or data.message_type not in ("text", "shared_post")
    if has_media and not perm.can_send_media:
        raise HTTPException(
            status_code=403,
            detail="media_not_allowed_restricted_mode"
        )

    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content.strip(),
        message_type=data.message_type,
        media_url=data.media_url,
        shared_post_id=data.shared_post_id,
        parent_story_id=data.parent_story_id,
        story_snapshot_url=data.story_snapshot_url,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    response = _message_to_response(msg)

    other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id

    # Karşı tarafa mesajı ilet
    await manager.send_to_user(
        conversation_id,
        other_user_id,
        {
            "type": "new_message",
            "message": response.model_dump(mode="json"),
            "sender_name": current_user.first_name or current_user.username or f"User {current_user.id}",
            "content": data.content.strip()[:80],
        },
    )

    # Global bildirim (DM liste güncellemesi + push)
    await manager.send_global_notification(
        other_user_id,
        {
            "type": "new_message",
            "message": response.model_dump(mode="json"),
            "sender_name": current_user.first_name or current_user.username or f"User {current_user.id}",
            "content": data.content.strip()[:80],
            "conversation_id": conversation_id,
        }
    )

    return response


@router.post("/messages/{conversation_id}/read")
async def mark_messages_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Konuşmadaki tüm mesajları okundu olarak işaretle.
    Karşılıklı takip yoksa karşı tarafa "görüldü" bilgisi gönderilmez.
    """
    conv = _verify_conversation_access(db, conversation_id, current_user.id)

    # Karşı tarafın sender_id'si
    other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id

    # 🔐 Görüldü gizleme: karşı tarafın izin durumunu kontrol et
    # (B mesaj gönderdi, A okudu → A'nın gönderim izni değil, B'nin A'ya gönderim izni sorulur)
    other_perm = _get_messaging_permission(db, conversation_id, other_user_id)
    should_hide_receipt = other_perm.hide_read_receipt

    query = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read == False,
    )

    messages_to_update = query.all()
    if not messages_to_update:
        return {"ok": True}

    updated_ids = [m.id for m in messages_to_update]
    query.update({"is_read": True, "status": "read"}, synchronize_session=False)
    db.commit()

    # 🔐 Read receipt: sadece karşılıklı takip varsa anlık ilet
    if not should_hide_receipt:
        await manager.send_to_user(conversation_id, other_user_id, {
            "type": "message:status",
            "message_ids": updated_ids,
            "status": "read",
            "reader_id": current_user.id,
        })

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


# ─────────────────────────────────────────────────────────────
# WEBSOCKET ENDPOINT
# ─────────────────────────────────────────────────────────────

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
    - Hata:        {"type": "error", "code": "PERMISSION_DENIED", "detail": "..."}
    """

    if not token:
        await websocket.close(code=4001, reason="Token gerekli")
        return

    principal = authenticate_websocket_token(token)
    if not principal:
        await websocket.close(code=4001, reason="Geçersiz token")
        return

    user_id = principal.user_id
    other_user_id = None

    db = next(get_db())
    try:
        conv = db.query(models.Conversation).filter(
            models.Conversation.id == conversation_id
        ).first()
        if not conv or user_id not in (conv.user1_id, conv.user2_id):
            await websocket.close(code=4003, reason="Bu konuşmaya erişiminiz yok")
            return

        other_user_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
    finally:
        db.close()

    if not await manager.connect(websocket, conversation_id, principal):
        return

    await manager.send_to_user(conversation_id, other_user_id, {
        "type": "user_online",
        "user_id": user_id,
    })

    try:
        while True:
            raw = await websocket.receive_text()
            if not websocket_session_is_current(principal):
                await websocket.close(code=4001, reason="Oturum geçersiz")
                break
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
                    # 🔐 Gizlilik kontrolü (WebSocket üzerinden gelen mesajlarda da zorunlu)
                    perm = _get_messaging_permission(db, conversation_id, user_id)

                    if not perm.can_send:
                        ws_detail = _BLOCK_SEND_DETAIL if perm.reason == "blocked" else (perm.reason or "messaging_not_allowed")
                        await manager.send_to_user(conversation_id, user_id, {
                            "type": "error",
                            "code": "PERMISSION_DENIED",
                            "detail": ws_detail,
                        })
                        continue

                    # Medya kontrolü
                    has_media = bool(data.get("media_url")) or data.get("message_type", "text") not in ("text", "shared_post")
                    if has_media and not perm.can_send_media:
                        await manager.send_to_user(conversation_id, user_id, {
                            "type": "error",
                            "code": "PERMISSION_DENIED",
                            "detail": "media_not_allowed_restricted_mode",
                        })
                        continue

                    msg = models.Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        content=content,
                        message_type=data.get("message_type", "text"),
                        media_url=data.get("media_url"),
                        shared_post_id=data.get("shared_post_id"),
                        status="sent",
                    )
                    db.add(msg)
                    conv_obj = db.query(models.Conversation).filter(
                        models.Conversation.id == conversation_id
                    ).first()
                    if conv_obj:
                        conv_obj.last_message_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(msg)

                    msg_data = {
                        "id": msg.id,
                        "conversation_id": msg.conversation_id,
                        "sender_id": msg.sender_id,
                        "content": msg.content,
                        "message_type": msg.message_type,
                        "media_url": msg.media_url,
                        "shared_post_id": msg.shared_post_id,
                        "is_read": msg.is_read,
                        "status": "sent",
                        "created_at": msg.created_at.isoformat() if msg.created_at else None,
                    }

                    # Sender'a onay
                    await manager.send_to_user(conversation_id, user_id, {
                        "type": "message:sent",
                        "message": msg_data,
                    })

                    msg_data_for_receiver = msg_data.copy()
                    
                    if msg.shared_post_id:
                        blocked_by_receiver = {r[0] for r in db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == other_user_id).all()}
                        blocked_receiver = {r[0] for r in db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == other_user_id).all()}
                        receiver_all_blocked = blocked_by_receiver | blocked_receiver
                        
                        if receiver_all_blocked:
                            post = db.query(models.Post).filter(models.Post.id == msg.shared_post_id).first()
                            if post and post.user_id in receiver_all_blocked:
                                author = db.query(models.User).filter(models.User.id == post.user_id).first()
                                author_name = author.username if author else "Bilinmeyen"
                                msg_data_for_receiver["content"] = f"Engellediğiniz {author_name} kullanıcısının gönderisi"
                                msg_data_for_receiver["shared_post_id"] = None
                                msg_data_for_receiver["media_url"] = None

                    # Karşı tarafa ilet
                    delivered = await manager.send_to_user(conversation_id, other_user_id, {
                        "type": "new_message",
                        "message": msg_data_for_receiver,
                    })

                    if delivered:
                        msg.status = "delivered"
                        db.commit()
                        await manager.send_to_user(conversation_id, user_id, {
                            "type": "message:status",
                            "message_id": msg.id,
                            "status": "delivered",
                        })

                    preview = msg.content.strip()[:80] if msg.content else "Yeni mesaj"
                    sender_user = db.query(models.User).filter(models.User.id == user_id).first()
                    sender_name = (sender_user.first_name or sender_user.username or f"User {user_id}") if sender_user else f"User {user_id}"
                    await manager.send_global_notification(
                        other_user_id,
                        {
                            "type": "new_message",
                            "message": msg_data,
                            "sender_name": sender_name,
                            "content": preview,
                            "conversation_id": conversation_id,
                        }
                    )

                finally:
                    db.close()

            elif msg_type == "typing":
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
                message_ids = data.get("message_ids", [])
                db = next(get_db())
                try:
                    # 🔐 Read receipt gizleme: karşı tarafın izin durumuna bak
                    other_perm = _get_messaging_permission(db, conversation_id, other_user_id)
                    should_hide_receipt = other_perm.hide_read_receipt

                    query = db.query(models.Message).filter(
                        models.Message.conversation_id == conversation_id,
                        models.Message.sender_id != user_id,
                    )
                    if message_ids:
                        query = query.filter(models.Message.id.in_(message_ids))
                    else:
                        query = query.filter(models.Message.is_read == False)

                    updated_ids = [m.id for m in query.all()]
                    query.update({"is_read": True, "status": "read"}, synchronize_session=False)
                    db.commit()
                finally:
                    db.close()

                # 🔐 Sadece izin varsa karşı tarafa bildir
                if not should_hide_receipt and updated_ids:
                    await manager.send_to_user(conversation_id, other_user_id, {
                        "type": "message:status",
                        "message_ids": updated_ids,
                        "status": "read",
                        "reader_id": user_id,
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket hatası: %s", str(e))
    finally:
        manager.disconnect(websocket, conversation_id, user_id)
        if other_user_id is not None:
            try:
                await manager.send_to_user(conversation_id, other_user_id, {
                    "type": "user_offline",
                    "user_id": user_id,
                })
            except Exception:
                pass
