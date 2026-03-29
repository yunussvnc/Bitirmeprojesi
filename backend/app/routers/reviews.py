# routers/reviews.py — Yorum endpoint'leri (geofence doğrulaması + pagination + stats)

from typing import List, Optional
from math import radians, sin, cos, atan2, sqrt

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

import models, schemas, crud
from app.dependencies import get_db, get_current_user

router = APIRouter(tags=["Reviews"])


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


@router.post("/reviews/", response_model=schemas.Review)
def post_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Yeni yorum oluşturur. Kullanıcı konumu verilmişse geofence doğrulaması yapar."""
    user_id = current_user.id

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


@router.get("/places/{place_id}/reviews", response_model=List[schemas.Review])
def get_place_reviews(
    place_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("newest", description="Sıralama: newest, oldest, highest, lowest"),
    db: Session = Depends(get_db),
):
    """
    Mekanın yorumlarını sayfalı ve sıralı getirir.
    
    Sıralama seçenekleri:
    - `newest`: En yeni (varsayılan)
    - `oldest`: En eski
    - `highest`: En yüksek puanlı
    - `lowest`: En düşük puanlı
    """
    query = db.query(models.Review).filter(models.Review.place_id == place_id)

    if sort == "oldest":
        query = query.order_by(models.Review.created_at.asc())
    elif sort == "highest":
        query = query.order_by(models.Review.rating.desc(), models.Review.created_at.desc())
    elif sort == "lowest":
        query = query.order_by(models.Review.rating.asc(), models.Review.created_at.desc())
    else:  # newest
        query = query.order_by(models.Review.created_at.desc())

    offset = (page - 1) * page_size
    reviews = query.offset(offset).limit(page_size).all()
    return reviews


@router.get("/places/{place_id}/reviews/summary")
def get_review_summary(
    place_id: int,
    db: Session = Depends(get_db),
):
    """
    Mekanın yorum istatistiklerini döner:
    - Toplam yorum sayısı
    - Ortalama genel puan
    - Yıldız dağılımı (1-5)
    - Kategorik ortalamalar (yemek, servis, ambiyans, f/p, temizlik)
    """
    base = db.query(models.Review).filter(models.Review.place_id == place_id)
    total = base.count()

    if total == 0:
        return {
            "total_reviews": 0,
            "average_rating": 0,
            "star_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "category_averages": {},
        }

    avg_rating = db.query(sql_func.avg(models.Review.rating)).filter(
        models.Review.place_id == place_id
    ).scalar()

    # Yıldız dağılımı
    star_dist = {}
    for star in range(1, 6):
        count = base.filter(models.Review.rating == star).count()
        star_dist[star] = count

    # Kategorik ortalamalar
    cat_avgs = {}
    for col_name, label in [
        ("food_rating", "food"),
        ("service_rating", "service"),
        ("atmosphere_rating", "atmosphere"),
        ("value_rating", "value"),
        ("cleanliness_rating", "cleanliness"),
    ]:
        col = getattr(models.Review, col_name)
        avg_val = db.query(sql_func.avg(col)).filter(
            models.Review.place_id == place_id,
            col.isnot(None),
        ).scalar()
        if avg_val is not None:
            cat_avgs[label] = round(float(avg_val), 1)

    return {
        "total_reviews": total,
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0,
        "star_distribution": star_dist,
        "category_averages": cat_avgs,
    }


@router.get("/my-venue/reviews", response_model=List[schemas.Review])
def get_my_venue_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("newest"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    İşletme sahibi kendi mekanına gelen tüm yorumları görüntüler.
    """
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")

    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")

    query = db.query(models.Review).filter(models.Review.place_id == place.id)

    if sort == "oldest":
        query = query.order_by(models.Review.created_at.asc())
    elif sort == "highest":
        query = query.order_by(models.Review.rating.desc(), models.Review.created_at.desc())
    elif sort == "lowest":
        query = query.order_by(models.Review.rating.asc(), models.Review.created_at.desc())
    else:
        query = query.order_by(models.Review.created_at.desc())

    offset = (page - 1) * page_size
    reviews = query.offset(offset).limit(page_size).all()
    return reviews


class OwnerReplyRequest(BaseModel):
    reply_text: str = Field(..., min_length=1, max_length=1000, description="İşletme yanıtı")


@router.put("/reviews/{review_id}/reply", response_model=schemas.Review)
def reply_to_review(
    review_id: int,
    body: OwnerReplyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    İşletme sahibi bir yoruma yanıt verir (her yoruma 1 yanıt hakkı).
    """
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri yanıt verebilir.")

    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    # Yorumun ait olduğu mekanın sahibi mi kontrol et
    place = db.query(models.Place).filter(models.Place.id == review.place_id).first()
    if not place or place.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu yoruma yanıt verme yetkiniz yok.")

    # 1 yanıt hakkı kontrolü
    if review.owner_response:
        raise HTTPException(status_code=400, detail="Bu yoruma zaten yanıt verilmiş. Her yoruma yalnızca 1 yanıt hakkı vardır.")

    from datetime import datetime, timezone
    review.owner_response = body.reply_text
    review.owner_response_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)
    return review
