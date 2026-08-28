"""Cohesive routes extracted from the parent router."""

from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import case, or_, and_
from sqlalchemy.orm import Session
import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user
from app.services.rate_limiter import follow_rate_limiter

router = APIRouter()

@router.post("/users/{user_id}/follow", dependencies=[Depends(follow_rate_limiter)])
async def toggle_follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcıyı takip et / takibi bırak (toggle). Takip bildirim gönderir."""
    # Run DB-blocking target fetch in a fast way
    target = crud.get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinizi takip edemezsiniz.")
    
    # Run heavy toggle logic in a thread pool so it doesn't block asyncio
    is_following, was_created = await run_in_threadpool(crud.toggle_follow, db, current_user.id, user_id)
    
    # determine status string for notifications/UI
    follow_row = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.following_id == user_id,
    ).first()
    follow_status = follow_row.status if follow_row else None

    if was_created and follow_status:
        import json
        payload = json.dumps({
            "actor_avatar": current_user.avatar_url,
            "actor_username": current_user.username
        })
        notif_type = "follow" if follow_status == "accepted" else "follow_request"
        crud.create_notification(db, user_id, notif_type, current_user.id, payload=payload)
    elif not was_created:
        # Unfollowed — remove any pending follow_request notification
        stale = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.actor_id == current_user.id,
            models.Notification.type.in_(["follow_request", "follow"]),
        ).all()
        for s in stale:
            db.delete(s)
        db.commit()
    
    # Dummygram: Anlık UI güncellemesi için güncel followers_count ve friends_count dön
    def _get_counts():
        return len(crud.get_follower_ids(db, user_id)), len(crud.get_mutual_friend_ids(db, user_id))
        
    followers_count, friends_count = await run_in_threadpool(_get_counts)
    
    return {
        "status": follow_status,
        "followers_count": followers_count,
        "following": is_following,
        "friends_count": friends_count
    }


@router.post("/users/{user_id}/follow/accept")
def accept_follow_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Bize gelen takip isteğini kabul eder."""
    # user_id follower'dır, current_user ise following_id'dir.
    success = crud.accept_follow_request(db, follower_id=user_id, following_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Takip isteği bulunamadı.")
    
    # İstek kabul edilince bildirim gönder
    import json
    payload = json.dumps({
        "actor_avatar": current_user.avatar_url,
        "actor_username": current_user.username
    })
    crud.create_notification(db, user_id, "follow_accepted", current_user.id, payload=payload)
    return {"success": True}


@router.post("/users/{user_id}/follow/reject")
def reject_follow_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Bize gelen takip isteğini reddeder."""
    success = crud.reject_follow_request(db, follower_id=user_id, following_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Takip isteği bulunamadı.")
    return {"success": True}


def _enrich_user_summary(
    db, user, current_uid: int | None
) -> "schemas.UserSummary":
    """UserSummary'ye follow_status ve is_private ekler. N+1 yerine çağrı başına 2 sorgu."""
    item = schemas.UserSummary.model_validate(user)
    if current_uid is not None and current_uid != user.id:
        follow_row = db.query(models.Follow).filter(
            models.Follow.follower_id == current_uid,
            models.Follow.following_id == user.id,
        ).first()
        if follow_row:
            item.is_following = follow_row.status == "accepted"
            item.follow_status = follow_row.status
        else:
            item.is_following = False
            item.follow_status = None
    # Gizlilik bayrağını ekle
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == user.id
    ).first()
    item.is_private = prefs.is_private_account if prefs else False
    return item


def _privacy_check_list(db, user_id: int, current_uid: int | None) -> bool:
    """
    Takipçi/takip/arkadaş listesini görebilme yetkisi:
    - kendi hesabı → True
    - hedef public → True
    - hedef private + ben takip ediyorum (accepted) → True
    - diğer → False (gizli hesap)
    """
    from app.services.privacy_guard import PrivacyGuard
    if current_uid and current_uid == user_id:
        return True
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == user_id
    ).first()
    is_private = prefs.is_private_account if prefs else False
    if not is_private:
        return True
    if current_uid is None:
        return False
    return PrivacyGuard.is_follower(db, current_uid, user_id)


@router.get("/users/{user_id}/followers")
def get_followers(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kullanıcının takipçi listesini sayfalı olarak getirir (gizlilik kontrolüyle)."""
    current_uid = current_user.id if current_user else None
    if not _privacy_check_list(db, user_id, current_uid):
        raise HTTPException(status_code=403, detail="Bu hesap gizlidir.")
    ids = crud.get_follower_ids(db, user_id)
    total = len(ids)
    paginated_ids = ids[(page - 1) * page_size : page * page_size]
    users = [u for u in (crud.get_user_by_id(db, uid) for uid in paginated_ids) if u]
    items = [_enrich_user_summary(db, u, current_uid) for u in users]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/users/{user_id}/following")
def get_following(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kullanıcının takip ettiklerinin listesini sayfalı olarak getirir (Mekanlar dahil)."""
    current_uid = current_user.id if current_user else None
    if not _privacy_check_list(db, user_id, current_uid):
        raise HTTPException(status_code=403, detail="Bu hesap gizlidir.")
        
    user_ids = crud.get_following_ids(db, user_id)
    place_ids = crud.get_followed_place_ids(db, user_id)
    
    all_items = [("user", uid) for uid in user_ids] + [("place", pid) for pid in place_ids]
    total = len(all_items)
    
    paginated_items = all_items[(page - 1) * page_size : page * page_size]
    
    items = []
    for item_type, idx in paginated_items:
        if item_type == "user":
            u = crud.get_user_by_id(db, idx)
            if u:
                items.append(_enrich_user_summary(db, u, current_uid))
        elif item_type == "place":
            p = crud.get_place_by_id(db, idx)
            if p:
                is_following_place = True
                if current_uid and current_uid != user_id:
                    is_following_place = db.query(models.PlaceFollow).filter(
                        models.PlaceFollow.user_id == current_uid,
                        models.PlaceFollow.place_id == p.id
                    ).first() is not None
                    
                place_summary = schemas.UserSummary(
                    id=p.id,
                    username=p.category or "Mekan",
                    first_name=p.name,
                    last_name="",
                    avatar_url=p.photo_url,
                    is_following=is_following_place,
                    follow_status="accepted" if is_following_place else None,
                    is_private=False,
                    item_type="place"
                )
                items.append(place_summary)

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/users/{user_id}/friends")
def get_friends(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Karşılıklı takip eden kullanıcılar (arkadaşlar) listesi (gizlilik kontrolüyle)."""
    current_uid = current_user.id if current_user else None
    if not _privacy_check_list(db, user_id, current_uid):
        raise HTTPException(status_code=403, detail="Bu hesap gizlidir.")
    ids = crud.get_mutual_friend_ids(db, user_id)
    total = len(ids)
    paginated_ids = ids[(page - 1) * page_size : page * page_size]
    users = [u for u in (crud.get_user_by_id(db, uid) for uid in paginated_ids) if u]
    items = [_enrich_user_summary(db, u, current_uid) for u in users]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/users/{user_id}/block")
def toggle_block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcıyı engelle / engeli kaldır (toggle)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinizi engelleyemezsiniz.")
    target = crud.get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    is_blocked = crud.toggle_block_user(db, current_user.id, user_id)
    # Engelleme sonrası takipten de çıkar
    if is_blocked:
        if crud.is_following(db, current_user.id, user_id):
            crud.toggle_follow(db, current_user.id, user_id)
        if crud.is_following(db, user_id, current_user.id):
            crud.toggle_follow(db, user_id, current_user.id)
    return {"blocked": is_blocked}


@router.get("/users/me/hidden-story-users", response_model=schemas.StoryHiddenUsersResponse)
def get_hidden_story_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının hikayesini gizlediği kişileri getirir."""
    hidden_users = crud.get_hidden_story_users(db, current_user.id)
    # _enrich_user_summary kullanarak user_summary formatına çevirelim
    items = [_enrich_user_summary(db, user, current_user.id) for user in hidden_users]
    return {"hidden_users": items}


@router.post("/users/me/hidden-story-users", response_model=schemas.StoryHiddenUsersResponse)
def update_hidden_story_users(
    data: schemas.StoryHiddenUsersUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının hikayesini gizlediği kişilerin listesini günceller."""
    # Listeyi crud fonksiyonu ile güncelle
    hidden_users = crud.update_hidden_story_users(db, current_user.id, data.hidden_user_ids)
    items = [_enrich_user_summary(db, user, current_user.id) for user in hidden_users]
    return {"hidden_users": items}


@router.get("/users/{user_id}/notification-subscriptions", response_model=schemas.NotificationSubscriptionResponse)
def get_notification_subscriptions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının başka bir kullanıcı için bildirim zili ayarlarını getirir."""
    target = crud.get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    sub = db.query(models.NotificationSubscription).filter(
        models.NotificationSubscription.subscriber_id == current_user.id,
        models.NotificationSubscription.target_id == user_id
    ).first()

    return {
        "subscriber_id": current_user.id,
        "target_id": user_id,
        "notify_posts": sub.notify_posts if sub else False,
        "notify_stories": sub.notify_stories if sub else False
    }


@router.put("/users/{user_id}/notification-subscriptions", response_model=schemas.NotificationSubscriptionResponse)
def update_notification_subscriptions(
    user_id: int,
    data: schemas.NotificationSubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının başka bir kullanıcı için bildirim zili ayarlarını günceller."""
    target = crud.get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Kendinize abone olamazsınız.")

    sub = db.query(models.NotificationSubscription).filter(
        models.NotificationSubscription.subscriber_id == current_user.id,
        models.NotificationSubscription.target_id == user_id
    ).first()

    if not sub:
        sub = models.NotificationSubscription(
            subscriber_id=current_user.id,
            target_id=user_id,
            notify_posts=data.notify_posts if data.notify_posts is not None else False,
            notify_stories=data.notify_stories if data.notify_stories is not None else False
        )
        db.add(sub)
    else:
        if data.notify_posts is not None:
            sub.notify_posts = data.notify_posts
        if data.notify_stories is not None:
            sub.notify_stories = data.notify_stories

    db.commit()
    db.refresh(sub)

    return sub


@router.get("/users/{user_id}/tagged-posts", response_model=schemas.PaginatedPosts)
def get_user_tagged_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kullanıcının etiketlendiği gönderileri getirir."""
    current_uid = current_user.id if current_user else None
    
    if not _privacy_check_list(db, user_id, current_uid):
        raise HTTPException(status_code=403, detail="Bu hesap gizlidir.")

    # Etiketlenen post ID'lerini çek
    post_ids = db.query(models.PostTag.post_id).filter(
        models.PostTag.user_id == user_id
    ).all()
    post_ids = [r[0] for r in post_ids]
    
    if not post_ids:
        return {"items": [], "total": 0, "page": page, "page_size": page_size}
        
    query = db.query(models.Post).filter(
        models.Post.id.in_(post_ids)
    )

    # ── Gönderi sahibinin gizlilik kontrolü ──
    query = query.outerjoin(models.UserPreferences, models.UserPreferences.user_id == models.Post.user_id)
    
    if current_uid:
        # Bakan kişi oturum açmışsa
        following_query = db.query(models.Follow.following_id).filter(
            models.Follow.follower_id == current_uid,
            models.Follow.status == "accepted"
        )

        query = query.filter(
            or_(
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None,
                models.Post.user_id == current_uid,
                models.Post.user_id.in_(following_query)
            )
        )
    else:
        # Misafir kullanıcı
        query = query.filter(
            or_(
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None
            )
        )
    query = query.order_by(models.Post.created_at.desc())
    total = query.count()
    posts = query.offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    from app.routers.feed import _post_to_schema
    for p in posts:
        items.append(_post_to_schema(p, db, current_uid))
        
    return {"items": items, "total": total, "page": page, "page_size": page_size}
