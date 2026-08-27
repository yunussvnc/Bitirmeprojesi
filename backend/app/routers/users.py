from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import case, or_, and_
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
    for_tagging: bool = Query(False, description="Eğer true ise mekanlar da dahil edilir ve gizlilik/takip kuralları etiketleme önceliklerine göre işler."),
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
        ~models.User.email.startswith("serpapi_"),  # Google'dan gelen sahte kullanıcıları (bot) gizle
        ~models.User.email.startswith("google_review_"),  # Diğer Google review dummy kullanıcılarını gizle
        ~models.User.email.endswith("@reviews.placeholder"),
        ~models.User.email.endswith("@placeholder.com")
    )

    if not for_tagging:
        base_query = base_query.filter(models.User.role != "venue")

    # Kendi kendini aramayı hariç tut
    if current_user:
        base_query = base_query.filter(models.User.id != current_user.id)

    # Engellenen kullanıcıları hariç tut
    if blocked_ids:
        base_query = base_query.filter(models.User.id.notin_(blocked_ids))

    # For tagging: We need mutual followers for privacy and sorting
    mutual_ids = set()
    followed_by_me_ids = set()
    if for_tagging and current_user:
        following_me = db.query(models.Follow.follower_id).filter(
            models.Follow.following_id == current_user.id,
            models.Follow.status == "accepted"
        ).all()
        followed_by_me = db.query(models.Follow.following_id).filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.status == "accepted"
        ).all()
        
        following_me_set = {r[0] for r in following_me}
        followed_by_me_ids = {r[0] for r in followed_by_me}
        mutual_ids = following_me_set.intersection(followed_by_me_ids)

        # Filter out private accounts if they are not mutual followers
        base_query = base_query.outerjoin(models.UserPreferences, models.UserPreferences.user_id == models.User.id)
        
        # Kullanıcı mekan ise VEYA tercihleri yoksa (gizli değil) VEYA is_private_account=False ise VEYA karşılıklı takipleşiyorsak
        base_query = base_query.filter(
            or_(
                models.User.role == "venue",
                models.UserPreferences.is_private_account == False,
                models.UserPreferences.is_private_account == None,
                models.User.id.in_(mutual_ids) if mutual_ids else False
            )
        )

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

    if for_tagging and current_user:
        # Önceliklendirme: 1. Karşılıklı takip (0), 2. Sadece takip edilen (1), 3. Diğer (2)
        is_mutual_sort = case(
            (models.User.id.in_(list(mutual_ids)), 0) if mutual_ids else [],
            else_=1
        )
        is_followed_sort = case(
            (models.User.id.in_(list(followed_by_me_ids)), 0) if followed_by_me_ids else [],
            else_=1
        )
        order_clauses = [is_mutual_sort, is_followed_sort, relevance, models.User.username.asc()]
    else:
        order_clauses = [relevance, models.User.username.asc()]

    offset = (page - 1) * page_size
    paginated = (
        base_query.order_by(*order_clauses)
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
    if not user or not user.is_active:
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
    
    # Apple Private Relay e-postalarını başka kullanıcılardan gizle (sunucu tarafı gizlilik)
    is_own_profile = current_user and current_user.id == user_id
    if not is_own_profile and profile.email and profile.email.endswith("@privaterelay.appleid.com"):
        profile.email = None
    
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

from app.routers.users_relationships import (
    router as extracted_router,
    toggle_follow_user,
    accept_follow_request,
    reject_follow_request,
    _enrich_user_summary,
    _privacy_check_list,
    get_followers,
    get_following,
    get_friends,
    toggle_block_user,
    get_hidden_story_users,
    update_hidden_story_users,
    get_notification_subscriptions,
    update_notification_subscriptions,
    get_user_tagged_posts,
)

router.include_router(extracted_router)
