# main.py

from llm_recommend import recommend_pipeline

from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
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
# UPLOAD (Cloudinary)
# -------------------------
@app.get("/upload/status")
def upload_status():
    return {"configured": cloud_storage.is_configured()}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if not cloud_storage.is_configured():
        raise HTTPException(status_code=503, detail="Cloud storage yapılandırılmamış.")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Dosya 10MB'dan büyük olamaz.")
    try:
        result = cloud_storage.upload_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")

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