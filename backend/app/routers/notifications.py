# routers/notifications.py — Bildirim endpoint'leri

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
    items, total = crud.get_notifications_paginated(db, current_user.id, page, page_size)
    out = []
    for n in items:
        actor_username = None
        if n.actor_id:
            actor = crud.get_user_by_id(db, n.actor_id)
            actor_username = actor.username if actor else None
        place_id = None
        if n.post_id:
            post = crud.get_post_by_id(db, n.post_id)
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
    return {"count": crud.get_unread_notification_count(db, current_user.id)}


@router.post("/read")
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    crud.mark_notifications_read(db, current_user.id)
    return {"ok": True}
