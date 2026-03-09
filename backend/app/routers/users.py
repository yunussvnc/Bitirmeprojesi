# routers/users.py — Kullanıcı profil, takip ve arama endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Users"])


@router.get("/users/search")
def search_users(
    q: str = Query(..., min_length=1, description="Aranacak kullanıcı adı veya isim"),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kullanıcı arama — username veya isim ile."""
    query = db.query(models.User).filter(models.User.is_active == True)
    query = query.filter(
        (models.User.username.ilike(f"%{q}%")) |
        (models.User.first_name.ilike(f"%{q}%")) |
        (models.User.last_name.ilike(f"%{q}%"))
    )
    total = query.count()
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()
    current_uid = current_user.id if current_user else None
    items = []
    for u in users:
        item = schemas.UserSummary.model_validate(u)
        if current_uid:
            item.is_following = crud.is_following(db, current_uid, u.id)
        items.append(item)
    return {"items": items, "total": total, "page": page, "page_size": page_size}



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
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    followers_count = len(crud.get_follower_ids(db, user_id))
    following_count = len(crud.get_following_ids(db, user_id))
    is_following = crud.is_following(db, current_user.id if current_user else 0, user_id)
    return schemas.UserProfile(
        **schemas.User.model_validate(user).model_dump(),
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
    )


@router.get("/users/{user_id}/stats", response_model=schemas.UserStats)
def get_user_stats_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return crud.get_user_stats(db, user_id)


@router.post("/users/{user_id}/follow")
def toggle_follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = crud.get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    is_following_now, was_created = crud.toggle_follow(db, current_user.id, user_id)
    if was_created and is_following_now:
        crud.create_notification(db, user_id, "follow", current_user.id)
    return {"following": is_following_now}


@router.get("/users/{user_id}/followers")
def get_followers(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    ids = crud.get_follower_ids(db, user_id)
    total = len(ids)
    offset = (page - 1) * page_size
    paginated_ids = ids[offset : offset + page_size]
    users = [crud.get_user_by_id(db, uid) for uid in paginated_ids]
    users = [u for u in users if u]
    current_uid = current_user.id if current_user else None
    items = []
    for u in users:
        item = schemas.UserSummary.model_validate(u)
        if current_uid is not None:
            item.is_following = crud.is_following(db, current_uid, u.id)
        items.append(item)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/users/{user_id}/following")
def get_following(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    ids = crud.get_following_ids(db, user_id)
    total = len(ids)
    offset = (page - 1) * page_size
    paginated_ids = ids[offset : offset + page_size]
    users = [crud.get_user_by_id(db, uid) for uid in paginated_ids]
    users = [u for u in users if u]
    current_uid = current_user.id if current_user else None
    items = []
    for u in users:
        item = schemas.UserSummary.model_validate(u)
        if current_uid is not None:
            item.is_following = crud.is_following(db, current_uid, u.id)
        items.append(item)
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
