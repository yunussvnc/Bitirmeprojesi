"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from crud_core import _filter_non_flagged_posts
from crud_places import get_place_by_id
from crud_social import get_post_by_id
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
import models

def toggle_save_place(db: Session, user_id: int, place_id: int) -> bool:
    """Mekanı kaydet / kaydı kaldır. Returns is_now_saved."""
    existing = db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id,
        models.SavedPlace.place_id == place_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    saved = models.SavedPlace(user_id=user_id, place_id=place_id)
    db.add(saved)
    db.commit()
    return True


def toggle_save_post(db: Session, user_id: int, post_id: int) -> bool:
    """Postu kaydet / kaydı kaldır. Returns is_now_saved."""
    existing = db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id,
        models.SavedPost.post_id == post_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    saved = models.SavedPost(user_id=user_id, post_id=post_id)
    db.add(saved)
    db.commit()
    return True


def get_saved_places(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Kullanıcının kaydettiği mekanları döndürür (en yeniden eskiye)."""
    q = db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id
    ).order_by(models.SavedPlace.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    places = []
    for sp in items:
        place = get_place_by_id(db, sp.place_id)
        if place:
            places.append(place)
    return places, total


def get_saved_posts(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    """Kullanıcının kaydettiği postları döndürür (en yeniden eskiye)."""
    q = db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id
    ).order_by(models.SavedPost.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    posts = []
    for sp in items:
        post = get_post_by_id(db, sp.post_id)
        if post:
            posts.append(post)
    return posts, total


def clear_saved_places(db: Session, user_id: int) -> None:
    db.query(models.SavedPlace).filter(models.SavedPlace.user_id == user_id).delete(synchronize_session=False)
    db.commit()


def clear_saved_posts(db: Session, user_id: int) -> None:
    db.query(models.SavedPost).filter(models.SavedPost.user_id == user_id).delete(synchronize_session=False)
    db.commit()


def is_place_saved(db: Session, user_id: int, place_id: int) -> bool:
    return db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == user_id,
        models.SavedPlace.place_id == place_id,
    ).first() is not None


def is_post_saved(db: Session, user_id: int, post_id: int) -> bool:
    return db.query(models.SavedPost).filter(
        models.SavedPost.user_id == user_id,
        models.SavedPost.post_id == post_id,
    ).first() is not None


def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
    """Kendi yorumunu sil. Post comment_count'u azalt."""
    comment = db.query(models.PostComment).filter(
        models.PostComment.id == comment_id,
        models.PostComment.user_id == user_id,
    ).first()
    if not comment:
        return False
    post = db.query(models.Post).filter(models.Post.id == comment.post_id).first()
    if post and post.comment_count > 0:
        post.comment_count -= 1
    db.delete(comment)
    db.commit()
    return True


def create_report(db: Session, reporter_id: int, target_type: str, target_id: int, reason: str, description: str = None):
    """Rapor oluştur (post, comment, user, match_profile)."""
    report = models.Report(
        reporter_id=reporter_id,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        description=description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def toggle_block_user(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Kullanıcıyı engelle / engeli kaldır. Returns is_now_blocked."""
    existing = db.query(models.UserBlock).filter(
        models.UserBlock.blocker_id == blocker_id,
        models.UserBlock.blocked_id == blocked_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    block = models.UserBlock(blocker_id=blocker_id, blocked_id=blocked_id)
    db.add(block)
    
    # Engelleme durumunda her iki yöndeki takipler (follow ve follow_request) silinmeli
    db.query(models.Follow).filter(
        (
            (models.Follow.follower_id == blocker_id) & 
            (models.Follow.following_id == blocked_id)
        ) | (
            (models.Follow.follower_id == blocked_id) & 
            (models.Follow.following_id == blocker_id)
        )
    ).delete(synchronize_session=False)

    db.commit()
    return True


def is_blocked(db: Session, blocker_id: int, blocked_id: int) -> bool:
    return db.query(models.UserBlock).filter(
        models.UserBlock.blocker_id == blocker_id,
        models.UserBlock.blocked_id == blocked_id,
    ).first() is not None


def users_block_each_other(db: Session, user_a: int, user_b: int) -> bool:
    """Her iki yönde engel var mı (A→B veya B→A)."""
    return is_blocked(db, user_a, user_b) or is_blocked(db, user_b, user_a)


def get_blocked_user_ids(db: Session, user_id: int) -> list[int]:
    """Kullanıcının engellediği tüm ID'leri döndürür."""
    rows = db.query(models.UserBlock.blocked_id).filter(
        models.UserBlock.blocker_id == user_id
    ).all()
    return [r[0] for r in rows]


def update_place(db: Session, place_id: int, data: dict):
    """Mekan bilgilerini günceller. gallery_urls ve menu_items için JSON serileştirmesi yapar."""
    import json as _json
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        return None

    # Map schema field names to model column names & serialize lists
    if "gallery_urls" in data and data["gallery_urls"] is not None:
        place.gallery_urls = _json.dumps(data.pop("gallery_urls"))
    elif "gallery_urls" in data:
        data.pop("gallery_urls")

    if "menu_items" in data and data["menu_items"] is not None:
        place.menu_items_json = _json.dumps(data.pop("menu_items"))
    elif "menu_items" in data:
        data.pop("menu_items")

    if "opening_hours_json" in data and data["opening_hours_json"] is not None:
        place.opening_hours_json = _json.dumps(data.pop("opening_hours_json"), ensure_ascii=False)
    elif "opening_hours_json" in data:
        data.pop("opening_hours_json")

    for key, value in data.items():
        if hasattr(place, key) and value is not None:
            setattr(place, key, value)
    db.commit()
    db.refresh(place)
    return place


def get_discover_feed_paginated(db: Session, page: int = 1, page_size: int = 20):
    """
    HackerNews tarzı Etkileşim ve Zaman Aşımı (Time Decay) algoritması.
    Sadece is_flagged=False olan temiz içerikleri getirir.
    Formül: (likes*1 + comments*2) / POW(AgeInHours + 2, 1.5)
    """
    # pyrefly: ignore [missing-import]
    from sqlalchemy import extract, func, text

    offset = (page - 1) * page_size

    # SQLite compatible age calculation (julyan day or seconds difference)
    # Since we use sqlite mostly for dev, we use a simple text/func workaround 
    # For actual PostgreSQL it would be extract(epoch from (now() - created_at))
    # Assuming SQLite, we use julianday
    try:
        # PostgreSQL specific syntax (Munia recommendation)
        score_formula = (
            (models.Post.like_count * 1 + models.Post.comment_count * 2) /
            func.pow(
                func.extract('epoch', func.now() - models.Post.created_at) / 3600.0 + 2, 
                1.5
            )
        )
        
        base = _filter_non_flagged_posts(db.query(models.Post), db)

        # Order by computed score
        items = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
            )
            .order_by(score_formula.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return items, base.count()
    except Exception as e:
        # Fallback to simple chronological if DB doesn't support pow/extract epoch (like SQLite)
        base = _filter_non_flagged_posts(db.query(models.Post), db)
        items = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
            )
            .order_by(models.Post.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return items, base.count()
