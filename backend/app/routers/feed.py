# routers/feed.py — Post / Feed / Reels / Like / Comment endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user, get_optional_user

router = APIRouter(tags=["Feed"])


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
        name=post.place.name,
        category=post.place.category,
    ) if post.place else None
    media = [
        schemas.PostMedia(
            id=m.id,
            post_id=m.post_id,
            media_type=m.media_type,
            media_url=m.media_url,
            thumbnail_url=m.thumbnail_url,
            order_index=m.order_index,
        )
        for m in (post.media or [])
    ]
    is_liked = crud.is_post_liked_by_user(db, post.id, current_user_id) if current_user_id else False
    return schemas.Post(
        id=post.id,
        user_id=post.user_id,
        place_id=post.place_id,
        caption=post.caption,
        post_type=post.post_type,
        like_count=post.like_count,
        comment_count=post.comment_count,
        created_at=post.created_at,
        is_liked=is_liked,
        author=author,
        place=place,
        media=media,
    )


@router.get("/feed", response_model=schemas.PaginatedPosts)
def get_feed(
    page: int = 1,
    page_size: int = 20,
    filter: str = "all",
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    filter_mode = "following" if filter == "following" else "all"
    posts, total = crud.get_feed_paginated(
        db,
        page=page,
        page_size=page_size,
        current_user_id=current_user.id if current_user else None,
        filter_mode=filter_mode,
    )
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.get("/feed/reels", response_model=schemas.PaginatedPosts)
def get_reels(
    page: int = 1,
    page_size: int = 20,
    filter: str = "all",
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    filter_mode = "following" if filter == "following" else "all"
    posts, total = crud.get_feed_paginated(
        db,
        page=page,
        page_size=page_size,
        current_user_id=current_user.id if current_user else None,
        filter_mode=filter_mode,
        post_type="reel",
    )
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.post("/posts", response_model=schemas.Post)
def create_post(
    data: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.place_id and not crud.get_place_by_id(db, data.place_id):
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    post = crud.create_post(db, current_user.id, data)
    db.refresh(post)
    post = crud.get_post_by_id(db, post.id)
    return _post_to_schema(post, db, current_user.id)


@router.get("/posts/{post_id}", response_model=schemas.Post)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    post, liked = crud.toggle_post_like(db, post_id, current_user.id)
    post = crud.get_post_by_id(db, post_id)
    if liked and post.user_id != current_user.id:
        crud.create_notification(db, post.user_id, "like", current_user.id, post_id=post_id)
    return {"liked": liked, "like_count": post.like_count}


@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    comments, total = crud.get_comments_paginated(db, post_id, page, page_size)
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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    comment = crud.add_post_comment(db, post_id, current_user.id, data.text)
    if post.user_id != current_user.id:
        crud.create_notification(db, post.user_id, "comment", current_user.id, post_id=post_id)
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
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    posts, total = crud.get_posts_by_user(db, user_id, page, page_size)
    items = [_post_to_schema(p, db, current_user.id if current_user else None) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.get("/places/{place_id}/posts", response_model=schemas.PaginatedPosts)
def get_place_posts(
    place_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
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
