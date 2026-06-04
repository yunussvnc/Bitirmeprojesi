# routers/places.py — Mekan CRUD + arama + keşif + takip + gönderi/hikaye endpoint'leri

from typing import Optional
from datetime import datetime, timedelta, timezone

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import requests

import schemas, crud, models
from app.dependencies import get_db, get_current_user, get_admin_user, get_optional_user
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
def create_new_place(
    place: schemas.PlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
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
    
    enriched_places = crud._enrich_places_with_stats(db, [place], current_user_id=current_user.id)
    return enriched_places[0]


@router.get("/places/my-venue/stats")
def get_my_venue_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    İşletme sahibi için kapsamlı mekan istatistikleri.
    """
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")

    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")

    from sqlalchemy import func as sql_func

    total_reviews = db.query(models.Review).filter(models.Review.place_id == place.id).count()
    avg_rating = db.query(sql_func.avg(models.Review.rating)).filter(
        models.Review.place_id == place.id
    ).scalar()

    saved_count = db.query(models.SavedPlace).filter(models.SavedPlace.place_id == place.id).count()
    follower_count = db.query(models.PlaceFollow).filter(models.PlaceFollow.place_id == place.id).count()
    post_count = db.query(models.Post).filter(models.Post.place_id == place.id).count()

    star_distribution = {}
    for star in range(1, 6):
        count = db.query(models.Review).filter(
            models.Review.place_id == place.id,
            models.Review.rating == star,
        ).count()
        star_distribution[star] = count

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_reviews = db.query(models.Review).filter(
        models.Review.place_id == place.id,
        models.Review.created_at >= thirty_days_ago,
    ).count()

    unanswered = db.query(models.Review).filter(
        models.Review.place_id == place.id,
        models.Review.owner_response.is_(None),
    ).count()

    return {
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0,
        "saved_count": saved_count,
        "follower_count": follower_count,
        "post_count": post_count,
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
    """Mekan yetkilisinin kendi mekanındaki bilgileri güncellemesini sağlar."""
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri erişebilir.")
        
    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")
        
    updated_place = crud.update_place(db, place.id, data.model_dump(exclude_unset=True))
    if not updated_place:
        raise HTTPException(status_code=400, detail="Mekan güncellenemedi.")
        
    enriched_places = crud._enrich_places_with_stats(db, [updated_place], current_user_id=current_user.id)
    return enriched_places[0]


# ── MEKAN TAKİP SİSTEMİ ─────────────────────────────────────────────────────

@router.post("/places/{place_id}/follow")
def toggle_place_follow(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mekanı takip et / takipten çık (toggle). Mekanlar kullanıcıları takip edemez."""
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    
    result = crud.toggle_place_follow(db, user_id=current_user.id, place_id=place_id)
    return result


@router.get("/places/{place_id}/follow-status")
def get_place_follow_status(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının bu mekanı takip edip etmediğini ve toplam takipçi sayısını döner."""
    follower_count = db.query(models.PlaceFollow).filter(
        models.PlaceFollow.place_id == place_id
    ).count()
    is_following = db.query(models.PlaceFollow).filter(
        models.PlaceFollow.user_id == current_user.id,
        models.PlaceFollow.place_id == place_id,
    ).first() is not None
    return {"is_following": is_following, "follower_count": follower_count}


# ── MEKAN KARTINDA GÖNDERI & HİKAYELER ─────────────────────────────────────

@router.get("/places/{place_id}/posts", response_model=schemas.PaginatedPosts)
def get_place_posts(
    place_id: int,
    page: int = 1,
    page_size: int = 18,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Mekana ait (veya mekanda çekilmiş) tüm gönderileri döner."""
    posts, total = crud.get_place_posts(
        db,
        place_id=place_id,
        current_user_id=current_user.id if current_user else None,
        page=page,
        page_size=page_size,
    )
    return schemas.PaginatedPosts(items=posts, total=total, page=page, page_size=page_size)


@router.get("/places/{place_id}/stories", response_model=schemas.PaginatedStories)
def get_place_stories(
    place_id: int,
    db: Session = Depends(get_db),
):
    """Mekana ait aktif (24 saat dolmamış) hikayeleri döner."""
    stories = crud.get_place_stories(db, place_id=place_id)
    return schemas.PaginatedStories(items=stories, total=len(stories), page=1, page_size=len(stories))


# ── MEKAN ETKILEŞIM İZLEME ──────────────────────────────────────────────────

@router.post("/places/{place_id}/interact")
def record_interaction(
    place_id: int,
    interaction_type: str = Query("view", description="view | search | review | like"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Mekan etkileşim skoru kaydeder (arka planda). Frontend her kart açmada çağırır."""
    if current_user:
        background_tasks.add_task(
            crud.record_place_interaction, db, current_user.id, place_id, interaction_type
        )
    return {"ok": True}


# ── MEKAN SAHİBİ: GÖNDERI & HİKAYE PAYLAŞIMI ───────────────────────────────

@router.post("/places/my-venue/posts", response_model=schemas.Post)
def create_venue_post(
    data: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mekan sahibi adına gönderi paylaş (place_id otomatik set edilir)."""
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri gönderi paylaşabilir.")
    
    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")
    
    # place_id'yi zorla mekan ID'si yap
    data_dict = data.model_dump()
    data_dict["place_id"] = place.id
    post_schema = schemas.PostCreate(**data_dict)
    
    return crud.create_post(db, data=post_schema, user_id=current_user.id)


@router.post("/places/my-venue/stories")
def create_venue_story(
    data: schemas.StoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mekan sahibi adına hikaye paylaş (place_id otomatik set edilir)."""
    if current_user.role != "venue":
        raise HTTPException(status_code=403, detail="Sadece mekan yetkilileri hikaye paylaşabilir.")
    
    place = db.query(models.Place).filter(models.Place.owner_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Size ait bir mekan bulunamadı.")
    
    data.place_id = place.id
    story = crud.create_story(db, data=data, user_id=current_user.id)
    return story


# ── MEKAN DETAY ─────────────────────────────────────────────────────────────

@router.get("/places/{place_id}", response_model=schemas.Place)
def read_place(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    place = crud.get_place_by_id(
        db,
        place_id=place_id,
        current_user_id=current_user.id if current_user else None,
    )
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    return place


@router.get("/places/{place_id}/google-reviews", response_model=schemas.GoogleReviewsResponse)
def get_place_google_reviews(
    place_id: int,
    limit: int = Query(5, ge=1, le=50, description="İstemciye döndürülecek yorum sayısı"),
    db: Session = Depends(get_db),
):
    """
    SerpAPI ile Google Maps yorumlarını çeker (en fazla 50), önbelleğe alır,
    istemciye `limit` kadar döner (varsayılan 5).
    """
    place = crud.get_place_by_id(db, place_id=place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    data_id = (place.vector_id or "").strip()
    if not data_id:
        return schemas.GoogleReviewsResponse(reviews=[], total_fetched=0, display_limit=limit)

    from services.google_reviews import fetch_google_reviews

    settings = get_settings()
    all_reviews = fetch_google_reviews(
        data_id,
        max_reviews=50,
        api_key=settings.SERPAPI_KEY or None,
    )
    items = [schemas.GoogleReviewItem(**r) for r in all_reviews[:limit]]
    return schemas.GoogleReviewsResponse(
        reviews=items,
        total_fetched=len(all_reviews),
        display_limit=limit,
    )


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
        
        try:
            response = requests.get(google_url, stream=True, timeout=10)
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=504, detail="Google API'sine bağlanılamadı.")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Fotoğraf Google'dan alınamadı.")
            
        return StreamingResponse(response.iter_content(chunk_size=8192), media_type=response.headers.get("content-type", "image/jpeg"))

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
