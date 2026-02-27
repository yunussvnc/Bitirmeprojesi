# main.py

from llm_recommend import recommend_pipeline
import os
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, crud
from database import engine, Base, SessionLocal
from config import get_settings
from auth import create_access_token, create_refresh_token, decode_token, oauth2_scheme
import cloud_storage

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AsEmOs - Mekan Öneri Sistemi API")

# Serve locally uploaded files
_uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not token:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor.")
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not token:
        return None
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        return None
    return db.query(models.User).filter(models.User.id == int(user_id)).first()


# -------------------------
# HEALTH & ROOT
# -------------------------
@app.get("/")
def home():
    return {"mesaj": "AsEmOs Backend API Aktif"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(models.Place.__table__.select().limit(1))
        db_ok = True
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "timestamp": datetime.utcnow().isoformat(),
    }

# -------------------------
# AUTH
# -------------------------
@app.post("/auth/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    if user.username and crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    db_user = crud.create_user(db=db, user=user)
    return schemas.Token(
        access_token=create_access_token(db_user.id),
        refresh_token=create_refresh_token(db_user.id),
        user=schemas.User.model_validate(db_user),
    )

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Auth bypass: herhangi email/şifreyle giriş, yoksa otomatik kayıt
    user = crud.get_or_create_user_for_login(
        db, user_data.email, user_data.password
    )
    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=schemas.User.model_validate(user),
    )

@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Geçersiz refresh token.")
    user = crud.get_user_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=schemas.User.model_validate(user),
    )

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/auth/me", response_model=schemas.User)
def update_me(
    data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.username and data.username != current_user.username:
        existing = crud.get_user_by_username(db, data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    updated = crud.update_user(db, current_user.id, data)
    return updated


# -------------------------
# USER PROFİL + TAKİP (Kademe 5)
# -------------------------
@app.get("/users/{user_id}", response_model=schemas.UserProfile)
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


@app.get("/users/{user_id}/stats", response_model=schemas.UserStats)
def get_user_stats_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return crud.get_user_stats(db, user_id)


@app.post("/users/{user_id}/follow")
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


@app.get("/users/{user_id}/followers")
def get_followers(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    ids = crud.get_follower_ids(db, user_id)
    total = len(ids)
    offset = (page - 1) * page_size
    paginated_ids = ids[offset : offset + page_size]
    users = [crud.get_user_by_id(db, uid) for uid in paginated_ids]
    users = [u for u in users if u]
    items = [schemas.UserSummary.model_validate(u) for u in users]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@app.get("/users/{user_id}/following")
def get_following(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    ids = crud.get_following_ids(db, user_id)
    total = len(ids)
    offset = (page - 1) * page_size
    paginated_ids = ids[offset : offset + page_size]
    users = [crud.get_user_by_id(db, uid) for uid in paginated_ids]
    users = [u for u in users if u]
    items = [schemas.UserSummary.model_validate(u) for u in users]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# -------------------------
# BİLDİRİMLER (Kademe 5)
# -------------------------
@app.get("/notifications", response_model=schemas.PaginatedNotifications)
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


@app.get("/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return {"count": crud.get_unread_notification_count(db, current_user.id)}


@app.post("/notifications/read")
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    crud.mark_notifications_read(db, current_user.id)
    return {"ok": True}


# -------------------------
# PLACE CRUD
# -------------------------
@app.post("/places/", response_model=schemas.Place)
def create_new_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    return crud.create_place(db=db, place=place)

@app.get("/places/", response_model=schemas.PaginatedPlaces)
def read_places(
    page: int = 1,
    page_size: int = 20,
    skip: Optional[int] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if skip is not None or limit is not None:
        items = crud.get_places(db, skip=skip or 0, limit=limit or 500)
        return schemas.PaginatedPlaces(
            items=items, total=len(items), page=1, page_size=len(items)
        )
    items, total = crud.get_places_paginated(db, page=page, page_size=page_size)
    return schemas.PaginatedPlaces(
        items=items, total=total, page=page, page_size=page_size
    )

@app.get("/places/{place_id}", response_model=schemas.Place)
def read_place(place_id: int, db: Session = Depends(get_db)):
    place = crud.get_place_by_id(db, place_id=place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place

# -------------------------
# REVIEW CRUD
# -------------------------
def _haversine_distance_meters(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    İki koordinasyon arasındaki yaklaşık mesafeyi (metre) hesaplar.
    Frontend ile aynı Haversine yaklaşımını kullanır.
    """
    from math import radians, sin, cos, atan2, sqrt

    R = 6371000.0  # metre
    φ1, φ2 = radians(lat1), radians(lat2)
    dφ = radians(lat2 - lat1)
    dλ = radians(lon2 - lon1)

    a = (
        sin(dφ / 2) * sin(dφ / 2)
        + cos(φ1) * cos(φ2) * sin(dλ / 2) * sin(dλ / 2)
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


@app.post("/reviews/", response_model=schemas.Review)
def post_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else 1

    place: Optional[models.Place] = (
        db.query(models.Place)
        .filter(models.Place.id == review.place_id)
        .first()
    )
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    # Varsayılanlar
    is_verified = False
    verify_method: Optional[str] = None
    distance_meters: Optional[int] = None

    if (
        place.latitude is not None
        and place.longitude is not None
        and review.user_lat is not None
        and review.user_lng is not None
    ):
        # Mesafeyi hesapla
        distance = _haversine_distance_meters(
            review.user_lat,
            review.user_lng,
            place.latitude,
            place.longitude,
        )
        distance_meters = int(distance)

        # Backend doğrulama yarıçapı (UI: 100m, Backend: 150m tampon)
        is_verified = distance_meters <= 150
        verify_method = "geofence"

    created = crud.create_review(
        db=db,
        review=review,
        user_id=user_id,
        is_verified=is_verified,
        verify_method=verify_method,
        distance_meters=distance_meters,
    )
    return created

@app.get("/places/{place_id}/reviews", response_model=List[schemas.Review])
def get_place_reviews(place_id: int, db: Session = Depends(get_db)):
    return crud.get_reviews_by_place(db, place_id=place_id)

# -------------------------
# ✅ TR -> EN normalize (chip'ler Türkçe geldiğinde backend patlamasın)
# -------------------------
# -------------------------
# RECOMMEND (LLM Pipeline)
# -------------------------
@app.post("/recommend", response_model=schemas.RecommendResponse)
def recommend_places(req: schemas.RecommendRequest, db: Session = Depends(get_db)):
    places = crud.get_places(db, skip=0, limit=500)

    user_lat = req.location.lat if req.location else None
    user_lng = req.location.lng if req.location else None

    result = recommend_pipeline(
        places=places,
        query=req.queryText,
        vibe=req.preferences.vibe or "quiet",
        purpose=req.preferences.purpose or "work",
        budget=req.preferences.budget or "mid",
        user_lat=user_lat,
        user_lng=user_lng,
        radius_m=req.radius_m,
        category=req.category,
    )

    items = [schemas.RecommendItem(**it) for it in result["items"]]
    return schemas.RecommendResponse(
        items=items,
        summary=result.get("summary", ""),
        cached=result.get("cached", False),
    )


# -------------------------
# POST / FEED (Sosyal Akış)
# -------------------------
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


@app.get("/feed", response_model=schemas.PaginatedPosts)
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


@app.get("/feed/reels", response_model=schemas.PaginatedPosts)
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


@app.post("/posts", response_model=schemas.Post)
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


@app.get("/posts/{post_id}", response_model=schemas.Post)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    return _post_to_schema(post, db, current_user.id if current_user else None)


@app.delete("/posts/{post_id}")
def delete_post_endpoint(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not crud.delete_post(db, post_id, current_user.id):
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı veya yetkiniz yok.")
    return {"ok": True}


@app.post("/posts/{post_id}/like")
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


@app.get("/posts/{post_id}/comments")
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


@app.post("/posts/{post_id}/comments", response_model=schemas.PostComment)
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


@app.get("/users/{user_id}/posts", response_model=schemas.PaginatedPosts)
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


@app.get("/places/{place_id}/posts", response_model=schemas.PaginatedPosts)
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


# -------------------------
# STORY (Hikaye)
# -------------------------
def _story_to_schema(s):
    author = None
    if s.user:
        author = schemas.UserSummary(
            id=s.user.id,
            username=s.user.username,
            first_name=s.user.first_name,
            avatar_url=s.user.avatar_url,
        )
    place = None
    if s.place:
        place = schemas.PlaceSummary(id=s.place.id, name=s.place.name, category=s.place.category)
    return schemas.Story(
        id=s.id,
        user_id=s.user_id,
        place_id=s.place_id,
        media_type=s.media_type,
        media_url=s.media_url,
        thumbnail_url=s.thumbnail_url,
        created_at=s.created_at,
        expires_at=s.expires_at,
        author=author,
        place=place,
    )


@app.post("/stories", response_model=schemas.Story)
def create_story(
    data: schemas.StoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.place_id is not None and not crud.get_place_by_id(db, data.place_id):
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    story = crud.create_story(db, current_user.id, data)
    return _story_to_schema(story)


@app.get("/places/{place_id}/stories", response_model=schemas.PaginatedStories)
def get_place_stories(
    place_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    stories, total = crud.get_stories_by_place(db, place_id, page, page_size)
    items = [_story_to_schema(s) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


@app.get("/feed/stories", response_model=schemas.PaginatedStories)
def get_feed_stories(
    page: int = 1,
    page_size: int = 50,
    filter: str = "all",
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Akış (feed) için hikayeler – Herkes veya Takip Ettiklerim."""
    filter_mode = "following" if filter == "following" else "all"
    stories, total = crud.get_feed_stories(
        db,
        page=page,
        page_size=page_size,
        current_user_id=current_user.id if current_user else None,
        filter_mode=filter_mode,
    )
    items = [_story_to_schema(s) for s in stories]
    return schemas.PaginatedStories(items=items, total=total, page=page, page_size=page_size)


# -------------------------
# UPLOAD (Cloudinary)
# -------------------------
@app.get("/upload/status")
def upload_status():
    return {"configured": cloud_storage.is_configured()}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Dosya 10MB'dan büyük olamaz.")

    if cloud_storage.is_configured():
        try:
            result = cloud_storage.upload_image(contents)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")
    else:
        # Local fallback — Cloudinary yoksa uploads/ klasörüne kaydet
        import uuid
        uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        ext = (file.filename or "image.jpg").rsplit(".", 1)[-1] if file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(uploads_dir, filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        # Return URL relative to the static mount
        return {"url": f"/uploads/{filename}", "public_id": filename}

@app.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    if not cloud_storage.is_configured():
        raise HTTPException(status_code=503, detail="Cloud storage yapılandırılmamış.")
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video 100MB'dan büyük olamaz.")
    try:
        result = cloud_storage.upload_video(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")


# -------------------------
# EŞLEŞME SİSTEMİ (Kademe 6)
# -------------------------
import json

@app.post("/match-profile", response_model=schemas.MatchProfileResponse)
def create_or_update_match_profile(
    data: schemas.MatchProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Eşleşme profili oluştur veya güncelle"""
    existing = db.query(models.MatchProfile).filter(
        models.MatchProfile.user_id == current_user.id
    ).first()

    photo_urls_json = json.dumps(data.photo_urls) if data.photo_urls else "[]"
    interests_json = json.dumps(data.interests) if data.interests else "[]"
    prompts_json = json.dumps(data.prompts) if data.prompts else "[]"

    if existing:
        existing.display_name = data.display_name
        existing.age = data.age
        existing.bio = data.bio
        existing.photo_urls = photo_urls_json
        existing.height = data.height
        existing.gender = data.gender
        existing.education = data.education
        existing.location_text = data.location_text
        existing.smoking = data.smoking
        existing.drinking = data.drinking
        existing.looking_for = data.looking_for
        existing.interests = interests_json
        existing.star_sign = data.star_sign
        existing.family_plans = data.family_plans
        existing.exercise = data.exercise
        existing.prompts = prompts_json
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        profile = existing
    else:
        profile = models.MatchProfile(
            user_id=current_user.id,
            display_name=data.display_name,
            age=data.age,
            bio=data.bio,
            photo_urls=photo_urls_json,
            height=data.height,
            gender=data.gender,
            education=data.education,
            location_text=data.location_text,
            smoking=data.smoking,
            drinking=data.drinking,
            looking_for=data.looking_for,
            interests=interests_json,
            star_sign=data.star_sign,
            family_plans=data.family_plans,
            exercise=data.exercise,
            prompts=prompts_json,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return _match_profile_to_response(profile)


def _match_profile_to_response(profile: models.MatchProfile) -> schemas.MatchProfileResponse:
    """MatchProfile model → response schema dönüşümü"""
    photo_urls = []
    if profile.photo_urls:
        try:
            photo_urls = json.loads(profile.photo_urls)
        except (json.JSONDecodeError, TypeError):
            photo_urls = []
    interests = []
    if profile.interests:
        try:
            interests = json.loads(profile.interests)
        except (json.JSONDecodeError, TypeError):
            interests = []
    
    prompts = []
    if profile.prompts:
        try:
            prompts = json.loads(profile.prompts)
        except (json.JSONDecodeError, TypeError):
            prompts = []
    return schemas.MatchProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        display_name=profile.display_name,
        age=profile.age,
        bio=profile.bio,
        photo_urls=photo_urls,
        height=profile.height,
        gender=profile.gender,
        education=profile.education,
        location_text=profile.location_text,
        smoking=profile.smoking,
        drinking=profile.drinking,
        looking_for=profile.looking_for,
        interests=interests,
        star_sign=profile.star_sign,
        family_plans=profile.family_plans,
        exercise=profile.exercise,
        prompts=prompts,
        is_active=profile.is_active,
        created_at=profile.created_at,
    )


@app.get("/match-profile/me", response_model=schemas.MatchProfileResponse)
def get_my_match_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kendi eşleşme profilini getir"""
    profile = db.query(models.MatchProfile).filter(
        models.MatchProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Eşleşme profiliniz henüz oluşturulmamış.")
    return _match_profile_to_response(profile)


@app.delete("/match-profile")
def delete_match_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Eşleşme profilini sil (eşleşmeden çık)"""
    profile = db.query(models.MatchProfile).filter(
        models.MatchProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Eşleşme profiliniz bulunamadı.")
    profile.is_active = False
    db.commit()
    return {"ok": True}


@app.post("/venue/qr-verify", response_model=schemas.QRVerifyResponse)
def verify_qr(
    data: schemas.QRVerifyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """QR kod doğrulama — kullanıcının mekanda olduğunu kanıtlar"""
    place = db.query(models.Place).filter(models.Place.id == data.place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    from datetime import timedelta
    active_until = datetime.utcnow() + timedelta(hours=2)

    return schemas.QRVerifyResponse(
        verified=True,
        place_id=place.id,
        place_name=place.name,
        active_until=active_until,
    )


@app.get("/match/candidates", response_model=List[schemas.MatchCandidateResponse])
def get_match_candidates(
    place_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Eşleşme adaylarını getir.
    Sıralama: 1) Aynı mekanda QR doğrulanmış, 2) Yakın, 3) Diğer
    """
    # Kullanıcının kendi profilini kontrol et
    my_profile = db.query(models.MatchProfile).filter(
        models.MatchProfile.user_id == current_user.id,
        models.MatchProfile.is_active == True,
    ).first()
    if not my_profile:
        raise HTTPException(status_code=400, detail="Önce eşleşme profilinizi oluşturun.")

    # Aktif profilleri getir (kendisi hariç)
    profiles = db.query(models.MatchProfile).filter(
        models.MatchProfile.user_id != current_user.id,
        models.MatchProfile.is_active == True,
    ).all()

    # Daha önce beğenilen/geçilen kullanıcıları filtrele
    already_acted = db.query(models.MatchLike.to_user_id).filter(
        models.MatchLike.from_user_id == current_user.id
    ).all()
    already_acted_ids = {row[0] for row in already_acted}

    candidates = []
    for profile in profiles:
        if profile.user_id in already_acted_ids:
            continue

        photo_urls = []
        if profile.photo_urls:
            try:
                photo_urls = json.loads(profile.photo_urls)
            except (json.JSONDecodeError, TypeError):
                photo_urls = []
        interests = []
        if profile.interests:
            try:
                interests = json.loads(profile.interests)
            except (json.JSONDecodeError, TypeError):
                interests = []
        prompts = []
        if profile.prompts:
            try:
                prompts = json.loads(profile.prompts)
            except (json.JSONDecodeError, TypeError):
                prompts = []

        candidates.append(schemas.MatchCandidateResponse(
            user_id=profile.user_id,
            display_name=profile.display_name,
            age=profile.age,
            bio=profile.bio,
            photo_urls=photo_urls,
            height=profile.height,
            gender=profile.gender,
            education=profile.education,
            smoking=profile.smoking,
            drinking=profile.drinking,
            looking_for=profile.looking_for,
            interests=interests,
            star_sign=profile.star_sign,
            exercise=profile.exercise,
            prompts=prompts,
            active_place_name=None,
            is_qr_verified=False,
            distance_priority=2,
        ))

    return candidates


@app.post("/match/like", response_model=schemas.MatchActionResponse)
def like_user(
    data: schemas.MatchLikeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcıyı beğen veya geç"""
    if data.to_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinizi beğenemezsiniz.")

    # Mevcut kayıt varsa güncelle
    existing = db.query(models.MatchLike).filter(
        models.MatchLike.from_user_id == current_user.id,
        models.MatchLike.to_user_id == data.to_user_id,
    ).first()

    if existing:
        existing.action = data.action
        existing.place_id = data.place_id
        db.commit()
    else:
        like = models.MatchLike(
            from_user_id=current_user.id,
            to_user_id=data.to_user_id,
            place_id=data.place_id,
            action=data.action,
        )
        db.add(like)
        db.commit()

    # Karşılıklı beğenme kontrolü
    matched = False
    conversation_id = None

    if data.action == "like":
        reverse = db.query(models.MatchLike).filter(
            models.MatchLike.from_user_id == data.to_user_id,
            models.MatchLike.to_user_id == current_user.id,
            models.MatchLike.action == "like",
        ).first()

        if reverse:
            matched = True
            # Sohbet kanalı oluştur
            u1 = min(current_user.id, data.to_user_id)
            u2 = max(current_user.id, data.to_user_id)

            existing_conv = db.query(models.MatchConversation).filter(
                models.MatchConversation.user1_id == u1,
                models.MatchConversation.user2_id == u2,
            ).first()

            if not existing_conv:
                place_name = None
                if data.place_id:
                    place = db.query(models.Place).filter(models.Place.id == data.place_id).first()
                    place_name = place.name if place else None

                conv = models.MatchConversation(
                    user1_id=u1,
                    user2_id=u2,
                    place_id=data.place_id,
                    place_name=place_name,
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)
                conversation_id = conv.id
            else:
                conversation_id = existing_conv.id

    return schemas.MatchActionResponse(
        action=data.action,
        matched=matched,
        conversation_id=conversation_id,
    )


@app.get("/match/conversations", response_model=List[schemas.MatchConversationResponse])
def get_match_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Eşleşme konuşmalarını getir"""
    convs = db.query(models.MatchConversation).filter(
        (models.MatchConversation.user1_id == current_user.id) |
        (models.MatchConversation.user2_id == current_user.id),
        models.MatchConversation.is_active == True,
    ).order_by(models.MatchConversation.last_message_at.desc().nullslast()).all()

    result = []
    for conv in convs:
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        is_user1 = conv.user1_id == current_user.id

        other_profile = db.query(models.MatchProfile).filter(
            models.MatchProfile.user_id == other_user_id
        ).first()

        other_name = other_profile.display_name if other_profile else "Bilinmeyen"
        other_photo = None
        if other_profile and other_profile.photo_urls:
            try:
                photos = json.loads(other_profile.photo_urls)
                other_photo = photos[0] if photos else None
            except (json.JSONDecodeError, TypeError):
                pass

        result.append(schemas.MatchConversationResponse(
            id=conv.id,
            other_user_display_name=other_name,
            other_user_photo=other_photo,
            other_user_id=other_user_id,
            place_name=conv.place_name,
            my_profile_revealed=conv.user1_revealed if is_user1 else conv.user2_revealed,
            other_profile_revealed=conv.user2_revealed if is_user1 else conv.user1_revealed,
            is_active=conv.is_active,
            created_at=conv.created_at,
            last_message_at=conv.last_message_at,
        ))

    return result


@app.post("/match/reveal-profile/{conversation_id}")
def reveal_profile(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Eşleşme konuşmasında gerçek profilini göster"""
    conv = db.query(models.MatchConversation).filter(
        models.MatchConversation.id == conversation_id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı.")
    if current_user.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(status_code=403, detail="Bu konuşmaya erişiminiz yok.")

    if conv.user1_id == current_user.id:
        conv.user1_revealed = True
    else:
        conv.user2_revealed = True

    db.commit()
    return {"ok": True, "revealed": True}