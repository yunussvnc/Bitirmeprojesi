# routers/notifications.py — Bildirim endpoint'leri (N+1 optimized, Novu + Munia enhanced)

import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session

import models, schemas, crud
from auth import decode_token
from app.dependencies import get_db, get_current_user
from app.websocket.manager import manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _serialize_notification(
    n: models.Notification,
    actors_map: dict,
    posts_map: dict,
    db: Session,
) -> schemas.Notification:
    """
    Tek bir Notification ORM objesini zengin schema'ya dönüştürür.
    Munia-tarzı payload parse + Novu digest group_count hesaplaması yapar.
    """
    actor = actors_map.get(n.actor_id)
    actor_username = actor.username if actor else None
    actor_avatar = actor.avatar_url if actor else None

    post = posts_map.get(n.post_id)
    place_id = n.place_id or (post.place_id if post else None)

    # Munia: payload'dan zengin alanları parse et
    post_thumbnail = None
    if n.payload:
        try:
            p = json.loads(n.payload)
            actor_username = p.get("actor_username", actor_username)
            actor_avatar = p.get("actor_avatar", actor_avatar)
            post_thumbnail = p.get("post_thumbnail")
        except (json.JSONDecodeError, TypeError):
            pass

    # Novu digest: group_count hesapla
    group_count = 0
    if n.group_key:
        group_count = crud._get_digest_count(db, n.user_id, n.group_key)

    return schemas.Notification(
        id=n.id,
        user_id=n.user_id,
        type=n.type,
        actor_id=n.actor_id,
        post_id=n.post_id,
        place_id=place_id,
        is_read=n.is_read,
        payload=n.payload,
        created_at=n.created_at,
        actor_username=actor_username,
        actor_avatar=actor_avatar,
        post_thumbnail=post_thumbnail,
        group_count=group_count,
    )


def _batch_serialize(
    items: list[models.Notification],
    db: Session,
) -> list[schemas.Notification]:
    """Toplu veri çekme ile N+1 problemini önler."""
    # Tüm actor'ları tek sorguda getir
    actor_ids = {n.actor_id for n in items if n.actor_id}
    actors_map = {}
    if actor_ids:
        actors = db.query(models.User).filter(models.User.id.in_(actor_ids)).all()
        actors_map = {a.id: a for a in actors}

    # Tüm post'ları tek sorguda getir
    post_ids = {n.post_id for n in items if n.post_id}
    posts_map = {}
    if post_ids:
        posts = db.query(models.Post).filter(models.Post.id.in_(post_ids)).all()
        posts_map = {p.id: p for p in posts}

    return [_serialize_notification(n, actors_map, posts_map, db) for n in items]


@router.get("", response_model=schemas.PaginatedNotifications)
def get_notifications(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Kullanıcının bildirimlerini sayfalı olarak getirir.
    Toplu sorgu ile N+1 problemi çözülmüştür.
    Munia zengin payload + Novu digest group_count dahil.
    """
    items, total = crud.get_notifications_paginated(db, current_user.id, page, page_size)
    out = _batch_serialize(items, db)
    return schemas.PaginatedNotifications(
        items=out, total=total, page=page, page_size=page_size
    )


@router.get("/follow-requests", response_model=schemas.PaginatedNotifications)
def get_follow_requests(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Novu ayrı kanal mantığı: Sadece bekleyen takip isteklerini getirir.
    NotificationsScreen'deki 'Takip İstekleri' sekmesi için.
    """
    items, total = crud.get_follow_requests(db, current_user.id, page, page_size)
    out = _batch_serialize(items, db)
    return schemas.PaginatedNotifications(
        items=out, total=total, page=page, page_size=page_size
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Okunmamış bildirim sayısını döner."""
    return {"count": crud.get_unread_notification_count(db, current_user.id)}


@router.post("/read")
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Tüm bildirimleri okundu olarak işaretler."""
    crud.mark_notifications_read(db, current_user.id)
    return {"ok": True}


@router.post("/{notification_id}/read")
def mark_single_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Tekil bildirimi okundu olarak işaretler."""
    success = crud.mark_single_notification_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")
    return {"ok": True}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Tekil bildirimi siler."""
    success = crud.delete_notification(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")
    return {"ok": True}


@router.websocket("/ws")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(default=None),
):
    """
    Global bildirimler için WebSocket endpoint'i (Munia / Novu Real-time).
    Bağlantı: ws://host/notifications/ws?token=JWT_TOKEN
    """
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

    await manager.connect_global(websocket, user_id)

    try:
        while True:
            # Sadece ping/pong veya istemciden gelen basit mesajları dinle
            # Genelde sunucudan istemciye tek yönlü akış olur
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect_global(websocket, user_id)
