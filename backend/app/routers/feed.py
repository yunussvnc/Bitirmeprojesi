# routers/feed.py — Post / Feed / Reels / Like / Comment endpoint'leri

import logging
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Feed"])
logger = logging.getLogger("asemos.feed")

FEED_PAGE_SIZE = 12  # Her sayfada kaç gönderi gelsin


def _post_to_schema(post: models.Post, db: Session, current_user_id: int | None) -> schemas.Post:
    is_following = False
    if current_user_id and post.user_id:
        is_following = crud.is_following(db, current_user_id, post.user_id)
    author = schemas.UserSummary(
        id=post.user.id,
        username=post.user.username,
        first_name=post.user.first_name,
        avatar_url=post.user.avatar_url,
        is_following=is_following,
    ) if post.user else None
    place = schemas.PlaceSummary(
        id=post.place.id,
        name=(post.place.name or "").strip() or "Mekan",
        category=post.place.category,
    ) if post.place else None
    media = []
    for m in post.media or []:
        if not m.media_url:
            continue
        media.append(
            schemas.PostMedia(
                id=m.id,
                post_id=m.post_id,
                media_type=m.media_type or "image",
                media_url=m.media_url,
                thumbnail_url=m.thumbnail_url,
                order_index=m.order_index or 0,
            )
        )
    # Serialize tagged users
    tagged_users = [
        schemas.UserSummary(
            id=tag.user.id,
            username=tag.user.username,
            first_name=tag.user.first_name,
            avatar_url=tag.user.avatar_url,
            is_following=crud.is_following(db, current_user_id, tag.user.id) if current_user_id else False,
        )
        for tag in (post.tags or [])
        if tag.user
    ]
    is_liked = crud.is_post_liked_by_user(db, post.id, current_user_id) if current_user_id else False
    return schemas.Post(
        id=post.id,
        user_id=post.user_id,
        place_id=post.place_id,
        caption=post.caption,
        post_type=post.post_type or "photo",
        comments_disabled=getattr(post, "comments_disabled", False),
        likes_hidden=getattr(post, "likes_hidden", False),
        like_count=post.like_count,
        comment_count=post.comment_count,
        created_at=post.created_at,
        is_liked=is_liked,
        author=author,
        place=place,
        media=media,
        tagged_users=tagged_users,
    )


# pyrefly: ignore [missing-import]
from fastapi.concurrency import run_in_threadpool
import json

def _get_feed_db_sync(
    db: Session,
    cursor: str | None,
    page_size: int,
    current_user_id: int | None,
    filter_mode: str,
):
    """DB işlemlerini threadpool'da güvenle çalıştırmak için kapsayıcı (cursor-based)"""
    posts, next_cursor, has_more = crud.get_feed_paginated_cursor(
        db,
        cursor=cursor,
        page_size=page_size,
        current_user_id=current_user_id,
        filter_mode=filter_mode,
    )
    items = [_post_to_schema(p, db, current_user_id) for p in posts]
    return {
        "items": [i.model_dump(mode="json") for i in items],
        "next_cursor": next_cursor,
        "has_more": has_more,
        "page_size": page_size,
    }


@router.get("/feed", response_model=schemas.CursorPaginatedPosts)
async def get_feed(
    cursor: Optional[str] = Query(None, description="Sayfalama cursor'u (önceki yanıttaki next_cursor)"),
    page_size: int = Query(FEED_PAGE_SIZE, ge=1, le=50),
    filter: str = Query("all", description="Filtre: all veya following"),
    # Geriye dönük uyumluluk: eski istemciler page gönderebilir, görmezden gel
    page: int = Query(1, ge=1, include_in_schema=False),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Ana akış (feed) için gönderileri cursor tabanlı sayfalama ile getirir."""
    from app.core.redis_client import get_redis
    redis = get_redis()

    filter_mode = "following" if filter == "following" else "all"
    current_uid = current_user.id if current_user else None
    user_id_str = str(current_uid) if current_uid else "anon"
    cursor_key = cursor or "start"
    cache_key = f"cache:feed_v2:{filter_mode}:{user_id_str}:c{cursor_key}:s{page_size}"

    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return schemas.CursorPaginatedPosts(**json.loads(cached))
        except Exception:
            pass

    try:
        result = await run_in_threadpool(
            _get_feed_db_sync, db, cursor, page_size, current_uid, filter_mode
        )
        payload = schemas.CursorPaginatedPosts(**result)
    except Exception as exc:
        logger.exception("GET /feed failed (filter=%s): %s", filter_mode, exc)
        return schemas.CursorPaginatedPosts(
            items=[], next_cursor=None, has_more=False, page_size=page_size
        )

    if redis:
        try:
            ttl = 60 if cursor else 30  # İlk sayfa daha kısa cache (yeni içerik gelir)
            await redis.setex(cache_key, ttl, json.dumps(payload.model_dump(mode="json"), default=str))
        except Exception:
            pass

    return payload


@router.get("/feed/reels", response_model=schemas.CursorPaginatedPosts)
def get_reels(
    cursor: Optional[str] = Query(None),
    page_size: int = Query(FEED_PAGE_SIZE, ge=1, le=50),
    filter: str = Query("all"),
    page: int = Query(1, ge=1, include_in_schema=False),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Reels içeriklerini cursor tabanlı sayfalama ile getirir."""
    filter_mode = "following" if filter == "following" else "all"
    current_uid = current_user.id if current_user else None
    posts, next_cursor, has_more = crud.get_feed_paginated_cursor(
        db,
        cursor=cursor,
        page_size=page_size,
        current_user_id=current_uid,
        filter_mode=filter_mode,
        post_type="reel",
    )
    items = [_post_to_schema(p, db, current_uid) for p in posts]
    return schemas.CursorPaginatedPosts(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
        page_size=page_size,
    )


@router.get("/feed/discover", response_model=schemas.PaginatedPosts)
def get_discover_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """
    Keşfet (Discover) akışı.
    Etkileşim skoru ve zaman aşımı (Time Decay) algoritmasına göre sıralanmış
    ve AI moderasyonundan geçmiş (is_flagged=False) postları getirir.
    """
    posts, total = crud.get_discover_feed_paginated(db, page=page, page_size=page_size)
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


async def invalidate_feed_cache():
    """Yeni post atıldığında feed önbelleğini temizler"""
    from app.core.redis_client import get_redis
    redis = get_redis()
    if not redis:
        return
    try:
        # scan_iter ile 'cache:feed:*' anahtarlarını bulup sil
        async for key in redis.scan_iter(match="cache:feed:*"):
            await redis.delete(key)
    except Exception:
        pass


@router.post("/posts", response_model=schemas.Post)
def create_post(
    data: schemas.PostCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.place_id and not crud.get_place_by_id(db, data.place_id):
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    post = crud.create_post(db, current_user.id, data)
    db.refresh(post)
    post = crud.get_post_by_id(db, post.id)
    
    # Cache Invalidation'ı arka plana at
    background_tasks.add_task(invalidate_feed_cache)
    
    return _post_to_schema(post, db, current_user.id)


@router.get("/posts/{post_id}", response_model=schemas.Post)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Tek bir gönderiyi detaylarıyla birlikte getirir."""
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    return _post_to_schema(post, db, current_user.id if current_user else None)


@router.delete("/posts/{post_id}")
def delete_post_endpoint(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not crud.delete_post(db, post_id, current_user.id):
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı veya yetkiniz yok.")
    return {"ok": True}


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Gönderiyi beğen / beğeniyi geri al (toggle). Beğeni bildirimi gönderir."""
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    post, liked = crud.toggle_post_like(db, post_id, current_user.id)
    post = crud.get_post_by_id(db, post_id)
    if liked and post.user_id != current_user.id:
        import json
        thumb = post.media[0].thumbnail_url or post.media[0].media_url if post.media else None
        payload = json.dumps({
            "actor_avatar": current_user.avatar_url,
            "actor_username": current_user.username,
            "post_thumbnail": thumb
        })
        crud.create_notification(db, post.user_id, "like", current_user.id, post_id=post_id, payload=payload)
    background_tasks.add_task(invalidate_feed_cache)
    return {"liked": liked, "like_count": post.like_count}


@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Gönderinin altındaki yorumları sayfalı olarak getirir."""
    blocked_ids = set()
    if current_user:
        blocked_by_me = {r[0] for r in db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == current_user.id).all()}
        blocked_me = {r[0] for r in db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == current_user.id).all()}
        blocked_ids = blocked_by_me | blocked_me

    # Normalde crud içinde yapılmalı ama basitlik için burada filtreleyebiliriz.
    # Doğru sayfalama için DB bazında filtrelemek daha iyi:
    comments_query = db.query(models.PostComment).filter(models.PostComment.post_id == post_id)
    if blocked_ids:
        comments_query = comments_query.filter(models.PostComment.user_id.notin_(blocked_ids))
        
    total = comments_query.count()
    comments = comments_query.order_by(models.PostComment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    out = []
    for c in comments:
        d = {"id": c.id, "user_id": c.user_id, "post_id": c.post_id, "text": c.text, "created_at": c.created_at}
        d["author_username"] = c.user.username if c.user else None
        out.append(d)
    return {"items": out, "total": total, "page": page, "page_size": page_size}


@router.post("/posts/{post_id}/comments", response_model=schemas.PostComment)
def add_comment(
    post_id: int,
    data: schemas.PostCommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    comment = crud.add_post_comment(db, post_id, current_user.id, data.text)
    if comment is None:
        raise HTTPException(status_code=403, detail="Bu gönderide yorumlar kapatılmıştır.")
    if post.user_id != current_user.id:
        import json
        thumb = post.media[0].thumbnail_url or post.media[0].media_url if post.media else None
        payload = json.dumps({
            "actor_avatar": current_user.avatar_url,
            "actor_username": current_user.username,
            "post_thumbnail": thumb,
            "text": data.text[:50]
        })
        crud.create_notification(db, post.user_id, "comment", current_user.id, post_id=post_id, payload=payload)
    background_tasks.add_task(invalidate_feed_cache)
    return schemas.PostComment(
        id=comment.id,
        user_id=comment.user_id,
        post_id=comment.post_id,
        text=comment.text,
        created_at=comment.created_at,
        author_username=current_user.username,
    )


@router.get("/users/{user_id}/posts", response_model=schemas.PaginatedPosts)
def get_user_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Belirli bir kullanıcının gönderilerini sayfalı olarak getirir."""
    # Gizlilik kontrolü (Munia Privacy Guard)
    from app.services.privacy_guard import PrivacyGuard
    viewer_id = current_user.id if current_user else None
    if not PrivacyGuard.can_view_content(db, user_id, viewer_id):
        return schemas.PaginatedPosts(items=[], total=0, page=page, page_size=page_size)
    
    posts, total = crud.get_posts_by_user(db, user_id, page, page_size)
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.get("/places/{place_id}/posts", response_model=schemas.PaginatedPosts)
def get_place_posts(
    place_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Belirli bir mekana ait gönderileri sayfalı olarak getirir."""
    posts, total = crud.get_posts_by_place(db, place_id, page, page_size)
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.delete("/posts/{post_id}/comments/{comment_id}")
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kendi yorumunu sil."""
    if not crud.delete_comment(db, comment_id, current_user.id):
        raise HTTPException(status_code=404, detail="Yorum bulunamadı veya yetkiniz yok.")
    return {"ok": True}


@router.post("/report")
def create_report(
    data: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Post, yorum, kullanıcı veya match profili raporla."""
    valid_types = ["post", "comment", "user", "match_profile"]
    if data.target_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Geçersiz hedef türü. Geçerli: {valid_types}")
    valid_reasons = ["spam", "inappropriate", "harassment", "other"]
    if data.reason not in valid_reasons:
        raise HTTPException(status_code=400, detail=f"Geçersiz sebep. Geçerli: {valid_reasons}")
    report = crud.create_report(
        db, current_user.id, data.target_type, data.target_id, data.reason, data.description
    )
    return {"ok": True, "report_id": report.id, "message": "Raporunuz alındı. İncelenecektir."}
