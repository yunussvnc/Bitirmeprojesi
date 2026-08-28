"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from crud_core import get_or_create_preferences
from crud_core import get_user_by_id
from datetime import datetime
from sqlalchemy.orm import Session
import models

def _build_rich_payload(
    db: Session,
    actor_id: int,
    post_id: int | None = None,
    comment_text: str | None = None,
    extra: dict | None = None,
) -> str:
    """
    Munia-tarzı zengin JSON payload oluşturur.
    Bildirim kartında avatar, kullanıcı adı, post thumbnail ve yorum önizlemesi gösterilir.
    """
    import json
    actor = get_user_by_id(db, actor_id)
    data: dict = {
        "actor_username": actor.username if actor else None,
        "actor_avatar": actor.avatar_url if actor else None,
    }

    if post_id:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post and post.media:
            first_media = (
                db.query(models.PostMedia)
                .filter(models.PostMedia.post_id == post_id)
                .order_by(models.PostMedia.order_index)
                .first()
            )
            if first_media:
                data["post_thumbnail"] = first_media.thumbnail_url or first_media.media_url

    if comment_text:
        data["text"] = comment_text[:100]

    if extra:
        data.update(extra)

    return json.dumps(data)


def _compute_group_key(notif_type: str, post_id: int | None = None) -> str | None:
    """
    Novu digest mantığı: Aynı gruba ait bildirimleri birleştirmek için anahtar üret.
    Örn: "like:post:42" — 42 nolu post'a gelen tüm beğeniler gruplandırılır.
    """
    if notif_type in ("like", "comment") and post_id:
        return f"{notif_type}:post:{post_id}"
    return None


def _get_digest_count(db: Session, user_id: int, group_key: str) -> int:
    """Aynı group_key'e sahip bildirim sayısını döner (digest count)."""
    if not group_key:
        return 0
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.group_key == group_key,
    ).count()


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    actor_id: int,
    post_id: int | None = None,
    push_extra: dict | None = None,
    payload: str | None = None,
    comment_text: str | None = None,
):
    """
    Bildirim oluştur + push notification gönder + websocket üzerinden anlık fırlat.
    Munia & Novu mimarisi: OmnichannelManager'a delege eder.
    Novu Subscriber Preferences: Kullanıcının tercihlerine göre bildirim gönderilmeyebilir.
    """
    # Novu Subscriber Preferences kontrolü
    NOTIF_PREF_MAP = {
        "like": "notify_likes",
        "comment": "notify_comments",
        "follow": "notify_follows",
        "follow_request": "notify_follows",
        "follow_accepted": "notify_follows",
        "message": "notify_messages",
    }
    pref_field = NOTIF_PREF_MAP.get(type)
    if pref_field:
        prefs = get_or_create_preferences(db, user_id)
        if not getattr(prefs, pref_field, True):
            return None  # Kullanıcı bu tür bildirimi kapattı

    from app.repositories.notification_repo import PostgresNotificationRepository
    from app.services.notification_provider import OmnichannelManager

    repo = PostgresNotificationRepository(db)
    manager = OmnichannelManager(repo, db=db)


    place_id = None
    if post_id:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post:
            place_id = post.place_id

    return manager.notify(
        user_id=user_id,
        type=type,
        actor_id=actor_id,
        post_id=post_id,
        place_id=place_id,
        payload=payload,
        comment_text=comment_text,
        push_extra=push_extra
    )


def get_notifications_paginated(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_paginated(user_id, page, page_size)


def get_follow_requests(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Sadece bekleyen takip isteklerini getirir (Novu: ayrı kanal)."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_follow_requests(user_id, page, page_size)


def mark_notifications_read(db: Session, user_id: int):
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    repo.mark_all_read(user_id)


def mark_single_notification_read(db: Session, notification_id: int, user_id: int) -> bool:
    """Tekil bildirimi okundu olarak işaretle."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.mark_read(notification_id, user_id)


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Tekil bildirimi sil."""
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.delete(notification_id, user_id)


def delete_like_notification(db: Session, user_id: int, actor_id: int, post_id: int) -> bool:
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.delete_like_notification(user_id, actor_id, post_id)


def get_unread_notification_count(db: Session, user_id: int) -> int:
    from app.repositories.notification_repo import PostgresNotificationRepository
    repo = PostgresNotificationRepository(db)
    return repo.get_unread_count(user_id)


def get_user_stats(db: Session, user_id: int) -> dict:
    """
    Kullanıcı istatistiklerini tek SQL sorgusuyla getirir.
    7 ayrı round-trip yerine 1 CTE sorgusu → cloud DB gecikmesi minimize edilir.
    """
    # pyrefly: ignore [missing-import]
    from sqlalchemy import text as sa_text
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    sql = sa_text("""
        WITH
        counts AS (
            SELECT
                (SELECT COUNT(*) FROM posts         WHERE user_id = :uid)                                          AS post_count,
                (SELECT COUNT(*) FROM follows        WHERE following_id = :uid AND status = 'accepted')            AS follower_count,
                (SELECT COUNT(*) FROM follows        WHERE follower_id  = :uid AND status = 'accepted')            AS following_count,
                (SELECT COUNT(*) FROM follows f1 JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id WHERE f1.follower_id = :uid AND f1.status = 'accepted' AND f2.status = 'accepted') AS friends_count,
                (SELECT COUNT(*) FROM reviews        WHERE user_id = :uid)                                         AS review_count,
                (SELECT COUNT(*) FROM reviews        WHERE user_id = :uid AND created_at >= :start_of_month)       AS visits_this_month
        ),
        fav_category AS (
            SELECT p.category
            FROM reviews r JOIN places p ON p.id = r.place_id
            WHERE r.user_id = :uid AND p.category IS NOT NULL
            GROUP BY p.category ORDER BY COUNT(*) DESC LIMIT 1
        ),
        fav_region AS (
            SELECT p.city
            FROM reviews r JOIN places p ON p.id = r.place_id
            WHERE r.user_id = :uid AND p.city IS NOT NULL
            GROUP BY p.city ORDER BY COUNT(*) DESC LIMIT 1
        )
        SELECT
            c.post_count, c.follower_count, c.following_count, c.friends_count,
            c.review_count, c.visits_this_month,
            fc.category AS favorite_category,
            fr.city     AS favorite_region
        FROM counts c
        LEFT JOIN fav_category fc ON true
        LEFT JOIN fav_region   fr ON true;
    """)

    row = db.execute(sql, {"uid": user_id, "start_of_month": start_of_month}).fetchone()
    if row is None:
        return {
            "post_count": 0, "follower_count": 0, "following_count": 0, "friends_count": 0,
            "review_count": 0, "visit_count": 0, "visits_this_month": 0,
            "favorite_category": None, "favorite_region": None,
        }
    return {
        "post_count": row.post_count or 0,
        "follower_count": row.follower_count or 0,
        "following_count": row.following_count or 0,
        "friends_count": row.friends_count or 0,
        "review_count": row.review_count or 0,
        "visit_count": row.review_count or 0,
        "visits_this_month": row.visits_this_month or 0,
        "favorite_category": row.favorite_category,
        "favorite_region": row.favorite_region,
    }


def limit_user_notifications(db: Session, user_id: int):
    """Kullanıcının bildirim sayısını en fazla 50'da tutar, eskileri siler."""
    total_count = db.query(models.Notification).filter(models.Notification.user_id == user_id).count()
    if total_count > 50:
        excess = total_count - 50
        oldest_notifications = (
            db.query(models.Notification.id)
            .filter(models.Notification.user_id == user_id)
            .order_by(models.Notification.created_at.asc())
            .limit(excess)
            .all()
        )
        oldest_ids = [notif[0] for notif in oldest_notifications]
        if oldest_ids:
            db.query(models.Notification).filter(
                models.Notification.id.in_(oldest_ids)
            ).delete(synchronize_session=False)
            db.commit()
