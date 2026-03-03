# routers/reviews.py — Yorum endpoint'leri (geofence doğrulaması dahil)

from typing import List, Optional
from math import radians, sin, cos, atan2, sqrt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_optional_user

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


@router.get("/places/{place_id}/reviews", response_model=List[schemas.Review])
def get_place_reviews(place_id: int, db: Session = Depends(get_db)):
    return crud.get_reviews_by_place(db, place_id=place_id)
