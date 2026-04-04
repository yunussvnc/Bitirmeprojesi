# routers/places.py — Mekan CRUD + arama + keşif endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import requests
import httpx

import schemas, crud, models
from app.dependencies import get_db, get_current_user, get_admin_user
from config import get_settings

router = APIRouter(tags=["Places"])


@router.get("/places/search", response_model=schemas.PaginatedPlaces)
def search_places(
    q: str = Query("", description="Mekan adı araması"),
    category: Optional[str] = Query(None, description="Kategori filtresi"),
    city: Optional[str] = Query(None, description="Şehir filtresi"),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """Mekan arama — isim, kategori, şehir ile filtreleme."""
    items, total = crud.search_places(db, q=q, category=category, city=city, page=page, page_size=page_size)
    return schemas.PaginatedPlaces(items=items, total=total, page=page, page_size=page_size)


@router.get("/places/nearby", response_model=schemas.PaginatedPlaces)
def get_nearby_places(
    lat: float = Query(..., description="Kullanıcı enlemi"),
    lng: float = Query(..., description="Kullanıcı boylamı"),
    radius: float = Query(5.0, description="Yarıçap (km)"),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """Konum bazlı yakındaki mekanlar (Haversine mesafe sıralamasıyla)."""
    items, total = crud.get_nearby_places(db, lat=lat, lng=lng, radius_km=radius, page=page, page_size=page_size)
    return schemas.PaginatedPlaces(items=items, total=total, page=page, page_size=page_size)


@router.get("/places/popular", response_model=schemas.PaginatedPlaces)
def get_popular_places(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """Popüler mekanlar — puan × yorum bazlı sıralama."""
    items, total = crud.get_popular_places(db, page=page, page_size=page_size)
    return schemas.PaginatedPlaces(items=items, total=total, page=page, page_size=page_size)


@router.post("/places/", response_model=schemas.Place)
def create_new_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    return crud.create_place(db=db, place=place)


@router.get("/places/", response_model=schemas.PaginatedPlaces)
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


@router.get("/places/my-venue", response_model=schemas.Place)
def get_my_venue(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Mekan yetkilisinin kendisine ait olan mekanı getirir."""
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")
    
    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")
    
    # İstatistik eklemek için crud fonksiyonunu kullanalım
    enriched_places = crud._enrich_places_with_stats(db, [place])
    return enriched_places[0]


@router.get("/places/my-venue/stats")
def get_my_venue_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    İşletme sahibi için kapsamlı mekan istatistikleri:
    - Toplam yorum sayısı ve ortalama puan
    - Kayıt (bookmark) sayısı
    - Yıldız dağılımı (1-5)
    - Son 30 gün yorum trendi
    """
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")

    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")

    from sqlalchemy import func as sql_func
    from datetime import datetime, timedelta, timezone

    # Toplam yorum ve ortalama
    total_reviews = db.query(models.Review).filter(models.Review.place_id == place.id).count()
    avg_rating = db.query(sql_func.avg(models.Review.rating)).filter(
        models.Review.place_id == place.id
    ).scalar()

    # Kayıt sayısı
    saved_count = db.query(models.SavedPlace).filter(models.SavedPlace.place_id == place.id).count()

    # Yıldız dağılımı
    star_distribution = {}
    for star in range(1, 6):
        count = db.query(models.Review).filter(
            models.Review.place_id == place.id,
            models.Review.rating == star,
        ).count()
        star_distribution[star] = count

    # Son 30 gün yorum trendi
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_reviews = db.query(models.Review).filter(
        models.Review.place_id == place.id,
        models.Review.created_at >= thirty_days_ago,
    ).count()

    # Yanıtlanmamış yorumlar
    unanswered = db.query(models.Review).filter(
        models.Review.place_id == place.id,
        models.Review.owner_response.is_(None),
    ).count()

    return {
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0,
        "saved_count": saved_count,
        "star_distribution": star_distribution,
        "reviews_last_30_days": recent_reviews,
        "unanswered_reviews": unanswered,
    }


@router.put("/places/my-venue", response_model=schemas.Place)
def update_my_venue(
    data: schemas.PlaceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mekan yetkilisinin kendi mekanındaki bilgileri (kampanya, foto vs) güncellemesini sağlar."""
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")
        
    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")
        
    updated_place = crud.update_place(db, place.id, data.model_dump(exclude_unset=True))
    if not updated_place:
        raise HTTPException(status_code=400, detail="Mekan güncellenemedi.")
        
    enriched_places = crud._enrich_places_with_stats(db, [updated_place])
    return enriched_places[0]


@router.get("/places/{place_id}", response_model=schemas.Place)
def read_place(place_id: int, db: Session = Depends(get_db)):
    place = crud.get_place_by_id(db, place_id=place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place


@router.get("/places/{place_id}/photo")
def get_place_photo(place_id: int, max_width: int = 800, db: Session = Depends(get_db)):
    """Mekanın Google fotoğrafını güvenli bir şekilde sunar (API anahtarını gizler)."""
    place = crud.get_place_by_id(db, place_id=place_id)
    if not place or not place.photo_url:
        raise HTTPException(status_code=404, detail="Mekan veya fotoğraf bulunamadı.")
        
    if place.photo_url.startswith("google_photo_ref:"):
        ref = place.photo_url.split("google_photo_ref:")[1]
        api_key = get_settings().GOOGLE_MAPS_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Maps API Key yapılandırılmamış.")
            
        google_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={ref}&key={api_key}"
        
        # Fotoğrafı sunucudan indirip istemciye stream et (API anahtarını gizlemek için)
        try:
            response = requests.get(google_url, stream=True, timeout=10)
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=504, detail="Google API'sine bağlanılamadı.")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Fotoğraf Google'dan alınamadı.")
            
        return StreamingResponse(response.iter_content(chunk_size=8192), media_type=response.headers.get("content-type", "image/jpeg"))

    # Eğer normal bir URL ise (örn. Cloudinary), yönlendir
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=place.photo_url)


@router.put("/places/{place_id}", response_model=schemas.Place)
def update_place(
    place_id: int,
    data: schemas.PlaceUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """Mekan bilgilerini güncelle. (Sadece Yöneticiler)"""
    place = crud.update_place(db, place_id, data.model_dump(exclude_unset=True))
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place
