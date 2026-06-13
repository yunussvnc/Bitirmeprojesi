# routers/users.py — Kullanıcı profil, takip ve arama endpoint'leri

from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy import case
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user
from app.services.rate_limiter import follow_rate_limiter

router = APIRouter(tags=["Users"])


@router.get("/users/search")
def search_users(
    q: str = Query(..., min_length=1, max_length=100, description="Aranacak kullanıcı adı veya isim"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """
    Kullanıcı arama — username, isim veya soyisim ile.

    **Premium özellikler:**
    - Engellenen/engelleyen kullanıcılar sonuçlardan çıkarılır
    - Venue hesapları (mekan sahipleri) sonuçlara dahil edilmez
    - Tam eşleşme önce, sonra prefix, sonra içeren sıralaması
    - Sayfalama ve toplam sayı bilgisi
    """
    # ── 1. Güvenli sorgu hazırla ──
    safe_q = q.replace("%", "\\%").replace("_", "\\_")
    lower_q = q.strip().lower()

    # ── 2. Engellenen kullanıcıları topla (çift yönlü) ──
    blocked_ids: set[int] = set()
    if current_user:
        # Benim engellediğim + beni engelleyen
        blocked_by_me = db.query(models.UserBlock.blocked_id).filter(
            models.UserBlock.blocker_id == current_user.id
        ).all()
        blocked_me = db.query(models.UserBlock.blocker_id).filter(
            models.UserBlock.blocked_id == current_user.id
        ).all()
        blocked_ids = {r[0] for r in blocked_by_me} | {r[0] for r in blocked_me}

    # ── 3. Temel sorgu: aktif + normal kullanıcılar ──
    base_query = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.role != "venue",  # Venue hesaplarını hariç tut
    )

    # Kendi kendini aramayı hariç tut
    if current_user:
        base_query = base_query.filter(models.User.id != current_user.id)

    # Engellenen kullanıcıları hariç tut
    if blocked_ids:
        base_query = base_query.filter(models.User.id.notin_(blocked_ids))

    # ── 4. İsim/kullanıcı adı filtresi ──
    base_query = base_query.filter(
        (models.User.username.ilike(f"%{safe_q}%")) |
        (models.User.first_name.ilike(f"%{safe_q}%")) |
        (models.User.last_name.ilike(f"%{safe_q}%"))
    )

    total = base_query.count()

    # ── 5. DB seviyesinde sıralama + sayfalama ──
    prefix = f"{lower_q}%"
    relevance = case(
        (
            (models.User.username.ilike(lower_q))
            | (models.User.first_name.ilike(lower_q))
            | (models.User.last_name.ilike(lower_q)),
            0,
        ),
        (
            (models.User.username.ilike(prefix))
            | (models.User.first_name.ilike(prefix))
            | (models.User.last_name.ilike(prefix)),
            1,
        ),
        else_=2,
    )
    offset = (page - 1) * page_size
    paginated = (
        base_query.order_by(relevance, models.User.username.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # ── 7. Batch follows kontrolü (N+1 sorgusu yerine tek sorgu) ──
    current_uid = current_user.id if current_user else None
    following_map: dict[int, str] = {}
    if current_uid and paginated:
        paginated_ids = [u.id for u in paginated]
        follow_rows = db.query(models.Follow.following_id, models.Follow.status).filter(
            models.Follow.follower_id == current_uid,
            models.Follow.following_id.in_(paginated_ids),
        ).all()
        following_map = {r[0]: r[1] for r in follow_rows}

    # ── 8. Sonuçları serialize et ──
    items = []
    for u in paginated:
        item = schemas.UserSummary.model_validate(u)
        status = following_map.get(u.id)
        item.is_following = status == "accepted"
        item.follow_status = status
        
        # Privacy check
        prefs = db.query(models.UserPreferences).filter(
            models.UserPreferences.user_id == u.id
        ).first()
        item.is_private = prefs.is_private_account if prefs else False
        
        items.append(item)

    return {"items": items, "total": total, "page": page, "page_size": page_size}
from pydantic import BaseModel

class UserBatchRequest(BaseModel):
    user_ids: list[int]


@router.post("/users/batch")
def get_users_batch(
    req: UserBatchRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Batch fetch user profiles by user IDs, checking block lists."""
    blocked_ids = set()
    if current_user and req.user_ids:
        blocked_by_me = db.query(models.UserBlock.blocked_id).filter(
            models.UserBlock.blocker_id == current_user.id,
            models.UserBlock.blocked_id.in_(req.user_ids)
        ).all()
        blocked_me = db.query(models.UserBlock.blocker_id).filter(
            models.UserBlock.blocked_id == current_user.id,
            models.UserBlock.blocker_id.in_(req.user_ids)
        ).all()
        blocked_ids = {r[0] for r in blocked_by_me} | {r[0] for r in blocked_me}

    valid_ids = [uid for uid in req.user_ids if uid not in blocked_ids]
    if not valid_ids:
        return {"items": [], "total": 0}

    users = db.query(models.User).filter(
        models.User.id.in_(valid_ids),
        models.User.is_active == True
    ).all()

    current_uid = current_user.id if current_user else None
    items = []
    for u in users:
        items.append(_enrich_user_summary(db, u, current_uid))

    return {"items": items, "total": len(items)}



@router.get("/users/blocked")
def get_blocked_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Engellenen kullanıcılar listesi."""
    blocked_ids = crud.get_blocked_user_ids(db, current_user.id)
    items = []
    for uid in blocked_ids:
        u = crud.get_user_by_id(db, uid)
        if u:
            items.append(schemas.UserSummary.model_validate(u))
    return {"items": items, "total": len(items)}


@router.get("/users/{user_id}", response_model=schemas.UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kullanıcı profil detaylarını takipçi/takip sayılarıyla birlikte getirir."""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    if current_user:
        # Hard block (Tam Görünmezlik) kontrolü
        block_exists = db.query(models.UserBlock).filter(
            (
                (models.UserBlock.blocker_id == current_user.id) & 
                (models.UserBlock.blocked_id == user_id)
            ) | (
                (models.UserBlock.blocker_id == user_id) & 
                (models.UserBlock.blocked_id == current_user.id)
            )
        ).first()
        if block_exists:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
            
    followers_count = db.query(models.Follow).filter(
        models.Follow.following_id == user_id,
        models.Follow.status == "accepted"
    ).count()
    following_count = db.query(models.Follow).filter(
        models.Follow.follower_id == user_id,
        models.Follow.status == "accepted"
    ).count()
    # Karşılıklı takip (arkadaş) sayısı: subquery ile tam SQL'de hesaplanır
    following_ids_subq = db.query(models.Follow.following_id).filter(
        models.Follow.follower_id == user_id,
        models.Follow.status == "accepted"
    ).subquery()
    friends_count = db.query(models.Follow).filter(
        models.Follow.following_id == user_id,
        models.Follow.status == "accepted",
        models.Follow.follower_id.in_(following_ids_subq)
    ).count()
    place_follow_count = db.query(models.PlaceFollow).filter(
        models.PlaceFollow.user_id == user_id
    ).count()

    
    # Dummygram-style: follow_status hesapla (pending, accepted, veya None)
    follow_status = None
    is_following = False
    if current_user:
        follow_row = db.query(models.Follow).filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.following_id == user_id,
        ).first()
        if follow_row:
            follow_status = follow_row.status  # "pending" or "accepted"
            is_following = follow_row.status == "accepted"
    
    # Gizlilik kontrolü (Munia Privacy Guard)
    from app.services.privacy_guard import PrivacyGuard
    viewer_id = current_user.id if current_user else None
    can_view = PrivacyGuard.can_view_content(db, user_id, viewer_id)
    
    profile = schemas.UserProfile(
        **schemas.User.model_validate(user).model_dump(),
        followers_count=followers_count,
        following_count=following_count,
        friends_count=friends_count,
        place_follow_count=place_follow_count,
        is_following=is_following,
        follow_status=follow_status,
    )
    
    # Gizli profil & takipçi değilse → post/istatistik gizlenir
    if not can_view:
        return PrivacyGuard.filter_profile_for_non_follower(profile.model_dump())
    
    return profile


@router.get("/users/{user_id}/stats", response_model=schemas.UserStats)
def get_user_stats_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    if current_user:
        # Hard block (Tam Görünmezlik) kontrolü
        block_exists = db.query(models.UserBlock).filter(
            (
                (models.UserBlock.blocker_id == current_user.id) & 
                (models.UserBlock.blocked_id == user_id)
            ) | (
                (models.UserBlock.blocker_id == user_id) & 
                (models.UserBlock.blocked_id == current_user.id)
            )
        ).first()
        if block_exists:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
            
    return crud.get_user_stats(db, user_id)


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
    from fastapi.concurrency import run_in_threadpool
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
    
    query = query.order_by(models.Post.created_at.desc())
    total = query.count()
    posts = query.offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    from app.routers.feed import format_post_response
    for p in posts:
        items.append(format_post_response(db, p, current_uid))
        
    return {"items": items, "total": total, "page": page, "page_size": page_size}
