# routers/notifications.py — Bildirim endpoint'leri (N+1 optimized)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


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
    """
    items, total = crud.get_notifications_paginated(db, current_user.id, page, page_size)

    # --- Toplu veri çekme (N+1 yerine 2 sorgu) ---
    actor_ids = {n.actor_id for n in items if n.actor_id}
    post_ids = {n.post_id for n in items if n.post_id}

    # Tüm actor'ları tek sorguda getir
    actors_map = {}
    if actor_ids:
        actors = db.query(models.User).filter(models.User.id.in_(actor_ids)).all()
        actors_map = {a.id: a for a in actors}

    # Tüm post'ları tek sorguda getir (place_id için)
    posts_map = {}
    if post_ids:
        posts = db.query(models.Post).filter(models.Post.id.in_(post_ids)).all()
        posts_map = {p.id: p for p in posts}

    out = []
    for n in items:
        actor = actors_map.get(n.actor_id)
        actor_username = actor.username if actor else None

        post = posts_map.get(n.post_id)
        place_id = post.place_id if post else None

        out.append(
            schemas.Notification(
                id=n.id,
                user_id=n.user_id,
                type=n.type,
                actor_id=n.actor_id,
                post_id=n.post_id,
                place_id=place_id,
                is_read=n.is_read,
                created_at=n.created_at,
                actor_username=actor_username,
            )
        )
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
