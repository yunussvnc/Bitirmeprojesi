"""Messaging authorization and response helpers."""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
import models, schemas
import crud
from app.dependencies import get_db, get_current_user
from app.websocket.auth import authenticate_websocket_token, websocket_session_is_current
from app.websocket.manager import manager

_BLOCK_OPEN_DETAIL = "Bu kullanıcıyla mesajlaşamazsınız. Engelleme nedeniyle erişim kapalı."


_BLOCK_SEND_DETAIL = "Bu kullanıcıyla mesaj gönderemezsiniz. Engel mevcut."


def _raise_if_users_blocked(db: Session, user_a: int, user_b: int) -> None:
    if crud.users_block_each_other(db, user_a, user_b):
        raise HTTPException(status_code=403, detail=_BLOCK_OPEN_DETAIL)


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
