# routers/places.py — Mekan CRUD + arama + keşif + takip + gönderi/hikaye endpoint'leri

from typing import Optional
from datetime import datetime, timedelta, timezone
import json
import logging
import time
from collections import OrderedDict

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
# pyrefly: ignore [missing-import]
from fastapi.responses import RedirectResponse
# pyrefly: ignore [missing-import]
from fastapi.concurrency import run_in_threadpool
# pyrefly: ignore [missing-import]
from fastapi.encoders import jsonable_encoder
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import func as sql_func
import requests

import schemas, crud, models
from app.dependencies import get_db, get_current_user, get_admin_user, get_optional_user
from app.core.redis_client import get_redis
from config import get_settings

router = APIRouter(tags=["Places"])

# ── In-memory LRU cache for Google photo proxy ──
# Her yeniden istek yerine bellekten sunar; max 150 görsel, 1 saat TTL.
_PHOTO_CACHE_MAX = 150
_PHOTO_CACHE_TTL = 3600  # saniye
_photo_cache: OrderedDict[str, tuple[bytes, str, float]] = OrderedDict()  # key -> (content, content_type, timestamp)

def _photo_cache_get(key: str) -> tuple[bytes, str] | None:
    """Cache'den oku, TTL geçmişse sil."""
    entry = _photo_cache.get(key)
    if entry is None:
        return None
    content, ct, ts = entry
    if time.time() - ts > _PHOTO_CACHE_TTL:
        _photo_cache.pop(key, None)
        return None
    # LRU: en son kullanılanı sona taşı
    _photo_cache.move_to_end(key)
    return (content, ct)

def _photo_cache_put(key: str, content: bytes, content_type: str) -> None:
    """Cache'e yaz, limit aşılırsa en eski kaydı sil."""
    _photo_cache[key] = (content, content_type, time.time())
    _photo_cache.move_to_end(key)
    while len(_photo_cache) > _PHOTO_CACHE_MAX:
        _photo_cache.popitem(last=False)


@router.get("/places/search", response_model=schemas.PaginatedPlaces)
def search_places(
    q: str = Query("", description="Mekan adı araması"),
    category: Optional[str] = Query(None, description="Kategori filtresi"),
    city: Optional[str] = Query(None, description="Şehir filtresi"),
    page: int = 1,
    page_size: int = 20,
    minimal: bool = Query(False, description="True ise stats/enrich atlanır (hızlı listeleme)"),
    db: Session = Depends(get_db),
):
    """Mekan arama — isim, kategori, şehir ile filtreleme."""
    items, total = crud.search_places(db, q=q, category=category, city=city, page=page, page_size=page_size, minimal=minimal)
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


@router.get("/places/foryou", response_model=schemas.PaginatedPlaces)
def get_foryou_places_api(
    lat: Optional[float] = Query(None, description="Kullanıcı enlemi"),
    lng: Optional[float] = Query(None, description="Kullanıcı boylamı"),
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Kişiselleştirilmiş mekan önerileri (Uzaklık + Rating + Etkileşim)"""
    user_id = current_user.id if current_user else None
    # crud.get_foryou_places zaten limit(12) dönüyor.
    # Eğer sayfalama istenirse crud fonksiyonunu limit yerine slice ile değiştirebiliriz.
    items = crud.get_foryou_places(db, user_id, lat, lng, limit=page_size)
    total = len(items)
    return schemas.PaginatedPlaces(items=items, total=total, page=1, page_size=page_size)


@router.post("/places/interactions", response_model=dict)
def log_place_interaction(
    payload: schemas.InteractionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının mekanla olan etkileşimini (harita tıklaması, kart açma vs.) kaydeder."""
    crud.log_interaction(
        db=db,
        user_id=current_user.id,
        place_id=payload.place_id,
        interaction_type=payload.interaction_type,
        weight=payload.weight or 1
    )
    return {"status": "ok"}



async def invalidate_places_cache():
    """Yeni mekan eklendiğinde önbellekteki mekan aramalarını temizler"""
    logger = logging.getLogger("asemos")
    redis = get_redis()
    if not redis:
        return
    try:
        async for key in redis.scan_iter(match="cache:places:*"):
            await redis.delete(key)
        logger.info("🧹 Mekan önbelleği (places cache) başarıyla temizlendi.")
    except Exception as e:
        logger.error(f"Mekan önbellek temizleme hatası: {e}")


@router.post("/places/", response_model=schemas.Place)
def create_new_place(
    place: schemas.PlaceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    background_tasks.add_task(invalidate_places_cache)
    return crud.create_place(db=db, place=place)


@router.get("/places/lite", response_model=schemas.PaginatedPlacesLite)
async def read_places_lite(
    limit: int = 6000,
    db: Session = Depends(get_db),
):
    """Harita/liste görünümü için minimal payload — tam Place şemasının
    gallery_urls/menu_items/opening_hours_json gibi ağır alanlarını taşımaz.
    Binlerce kayıtlık toplu istekler (örn. landing page interaktif haritası)
    için /places/ yerine bu endpoint kullanılmalı."""
    logger = logging.getLogger("asemos")
    redis = get_redis()
    cache_key = f"cache:places:lite:limit:{limit}"

    if redis:
        try:
            cached_data = await redis.get(cache_key)
            if cached_data:
                logger.info(f"⚡ Places lite cache hit: {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Places lite cache read error: {e}")

    rows, total = await run_in_threadpool(crud.get_places_lite, db, skip=0, limit=limit)
    items = [
        schemas.PlaceLite(
            id=r.id, name=r.name, address=r.address, city=r.city, category=r.category,
            latitude=r.latitude, longitude=r.longitude, price_range=r.price_range,
            photo_url=f"/api/v1/places/{r.id}/photo" if r.photo_url and r.photo_url.startswith("google_photo_ref:") else r.photo_url,
            average_rating=r.average_rating or 0.0,
            review_count=r.user_ratings_total or 0,
        )
        for r in rows
    ]
    res = schemas.PaginatedPlacesLite(items=items, total=total)

    if redis:
        try:
            res_json = json.dumps(jsonable_encoder(res))
            await redis.set(cache_key, res_json, ex=900)
            logger.info(f"💾 Places lite cached in Redis: {cache_key}")
        except Exception as e:
            logger.error(f"Places lite cache write error: {e}")

    return res


@router.get("/places/", response_model=schemas.PaginatedPlaces)
async def read_places(
    page: int = 1,
    page_size: int = 20,
    skip: Optional[int] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
):
    logger = logging.getLogger("asemos")
    redis = get_redis()
    cache_key = f"cache:places:page:{page}:size:{page_size}:skip:{skip}:limit:{limit}"

    if redis:
        try:
            cached_data = await redis.get(cache_key)
            if cached_data:
                logger.info(f"⚡ Places cache hit: {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Places cache read error: {e}")

    if skip is not None or limit is not None:
        items = await run_in_threadpool(crud.get_places, db, skip=skip or 0, limit=limit or 500)
        res = schemas.PaginatedPlaces(
            items=items, total=len(items), page=1, page_size=len(items)
        )
    else:
        items, total = await run_in_threadpool(crud.get_places_paginated, db, page=page, page_size=page_size)
        res = schemas.PaginatedPlaces(
            items=items, total=total, page=page, page_size=page_size
        )

    if redis:
        try:
            res_json = json.dumps(jsonable_encoder(res))
            await redis.setex(cache_key, 900, res_json)  # 15 dakika
            logger.info(f"💾 Places cached in Redis: {cache_key}")
        except Exception as e:
            logger.error(f"Places cache write error: {e}")

    return res


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
        
    old_campaign = place.campaign_text
    new_campaign = data.campaign_text
        
    updated_place = crud.update_place(db, place.id, data.model_dump(exclude_unset=True))
    if not updated_place:
        raise HTTPException(status_code=400, detail="Mekan güncellenemedi.")
        
    campaign_changed = (new_campaign is not None) and (new_campaign != old_campaign)
    if campaign_changed and new_campaign.strip():
        import json
        followers = db.query(models.PlaceFollow).filter(models.PlaceFollow.place_id == place.id).all()
        payload_data = {
            "place_id": place.id,
            "place_name": place.name,
            "campaign_text": new_campaign.strip(),
        }
        for follow in followers:
            crud.create_notification(
                db=db,
                user_id=follow.user_id,
                type="campaign",
                actor_id=current_user.id,
                push_extra=payload_data,
                payload=json.dumps(payload_data),
            )

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






@router.get("/places/{place_id}/photo")
async def get_place_photo(place_id: int, max_width: int = 800, db: Session = Depends(get_db)):
    """Mekanın Google fotoğrafını güvenli bir şekilde sunar (API anahtarını gizler).
    In-memory LRU cache ile aynı fotoğraf tekrar Google'dan çekilmez."""
    from fastapi.responses import Response
    import httpx

    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place or not place.photo_url:
        raise HTTPException(status_code=404, detail="Mekan veya fotoğraf bulunamadı.")

    if place.photo_url.startswith("google_photo_ref:"):
        ref = place.photo_url.split("google_photo_ref:")[1]
        cache_key = f"photo:{place_id}:{max_width}"

        # ── Cache hit? ──
        cached = _photo_cache_get(cache_key)
        if cached:
            return Response(
                content=cached[0],
                media_type=cached[1],
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )

        settings = get_settings()

        actual_google_id = place.google_place_id or place.vector_id
        if (actual_google_id or "").startswith("ChIJ") and settings.GOOGLE_PLACES_API_KEY:
            google_url = (
                f"https://places.googleapis.com/v1/places/{actual_google_id}/photos/{ref}/media"
                f"?maxWidthPx={max_width}&key={settings.GOOGLE_PLACES_API_KEY}"
            )
        else:
            api_key = settings.GOOGLE_MAPS_API_KEY
            if not api_key:
                raise HTTPException(status_code=500, detail="Google Maps API Key yapılandırılmamış.")
            google_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={ref}&key={api_key}"

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
                resp = await client.get(google_url)

                if resp.status_code != 200:
                    logging.warning(
                        f"[photo_proxy] Google API {resp.status_code} for place {place_id}: "
                        f"url={google_url[:120]}... body={resp.text[:200]}"
                    )
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=f"Fotoğraf Google'dan alınamadı (HTTP {resp.status_code})."
                    )

                content_type = resp.headers.get("content-type", "image/jpeg")

                # ── Cache'e kaydet ──
                _photo_cache_put(cache_key, resp.content, content_type)

                return Response(
                    content=resp.content,
                    media_type=content_type,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"},
                )
        except httpx.RequestError as exc:
            logging.error(f"[photo_proxy] Google API connection error for place {place_id}: {exc}")
            raise HTTPException(status_code=504, detail="Google API'sine bağlanılamadı.")

    return RedirectResponse(url=place.photo_url, headers={"Cache-Control": "public, max-age=31536000, immutable"})


@router.get("/places/{place_id}/gallery/{photo_index}")
async def get_place_gallery_photo(place_id: int, photo_index: int, max_width: int = 800, db: Session = Depends(get_db)):
    """Mekanın galeri fotoğrafını proxy üzerinden sunar (Google API anahtarını gizler)."""
    from fastapi.responses import Response
    import httpx
    import json as _json

    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    # gallery_urls JSON string olabilir — parse et
    raw_gallery = place.gallery_urls
    if isinstance(raw_gallery, str):
        try:
            raw_gallery = _json.loads(raw_gallery)
        except Exception:
            raw_gallery = []

    if not isinstance(raw_gallery, list) or photo_index < 0 or photo_index >= len(raw_gallery):
        raise HTTPException(status_code=404, detail="Galeri fotoğrafı bulunamadı.")

    gallery_url = raw_gallery[photo_index]
    if not isinstance(gallery_url, str):
        raise HTTPException(status_code=404, detail="Geçersiz galeri URL'i.")

    # google_photo_ref: olmayan URL'ler için redirect
    if not gallery_url.startswith("google_photo_ref:"):
        return RedirectResponse(url=gallery_url, headers={"Cache-Control": "public, max-age=31536000, immutable"})

    ref = gallery_url.split("google_photo_ref:")[1]
    settings = get_settings()

    actual_google_id = place.google_place_id or place.vector_id
    if (actual_google_id or "").startswith("ChIJ") and settings.GOOGLE_PLACES_API_KEY:
        google_url = (
            f"https://places.googleapis.com/v1/places/{actual_google_id}/photos/{ref}/media"
            f"?maxWidthPx={max_width}&key={settings.GOOGLE_PLACES_API_KEY}"
        )
    else:
        api_key = settings.GOOGLE_MAPS_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Maps API Key yapılandırılmamış.")
        google_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={ref}&key={api_key}"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(google_url)

            if resp.status_code != 200:
                logging.warning(
                    f"[gallery_proxy] Google API {resp.status_code} for place {place_id} gallery {photo_index}: "
                    f"body={resp.text[:200]}"
                )
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Galeri fotoğrafı Google'dan alınamadı (HTTP {resp.status_code})."
                )

            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )
    except httpx.RequestError as exc:
        logging.error(f"[gallery_proxy] Google API connection error for place {place_id} gallery {photo_index}: {exc}")
        raise HTTPException(status_code=504, detail="Google API'sine bağlanılamadı.")

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
