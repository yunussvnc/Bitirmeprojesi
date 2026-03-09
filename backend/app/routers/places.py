# routers/places.py — Mekan CRUD + arama + keşif endpoint'leri

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import requests

import schemas, crud
from app.dependencies import get_db
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


@router.get("/places/{place_id}", response_model=schemas.Place)
def read_place(place_id: int, db: Session = Depends(get_db)):
    place = crud.get_place_by_id(db, place_id=place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place


@router.get("/places/{place_id}/photo")
def get_place_photo(place_id: int, max_width: int = 400, db: Session = Depends(get_db)):
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
        response = requests.get(google_url, stream=True)
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
):
    """Mekan bilgilerini güncelle."""
    place = crud.update_place(db, place_id, data.model_dump(exclude_unset=True))
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place
