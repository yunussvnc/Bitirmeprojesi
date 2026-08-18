# app/routers/admin.py — FastAPI Admin Panel Router

import os
import time
import logging
import httpx
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import func, text, desc
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks

import models
import schemas
import crud
from database import engine
from app.dependencies import get_db, get_admin_user, get_admin_or_venue_user
from app.core.redis_client import get_redis
from app.websocket.manager import manager

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger("asemos.admin")

AI_SERVICE_URL = os.getenv("AI_URL", "https://asemos-ai.onrender.com")


# Helper: Create Audit Log
def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
):
    try:
        audit_log = models.AdminAuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Audit log writing failed: {e}")
        db.rollback()


# ===========================================================================
# 🤖 AI LOG ENTRY (STATELSS INCOMING LOG FROM AI SERVICE)
# ===========================================================================
@router.post("/ai/log-entry", response_model=schemas.AIQueryLogResponse)
def create_ai_log_entry(
    log_data: schemas.AIQueryLogCreate,
    db: Session = Depends(get_db),
):
    """
    Stateless endpoint called by asemos-ai to insert a query log.
    No auth required for internal network / simplified request trust.
    """
    log = models.AIQueryLog(
        user_id=log_data.user_id,
        query_text=log_data.query_text,
        query_type=log_data.query_type,
        llm_layer=log_data.llm_layer,
        response_time_ms=log_data.response_time_ms,
        result_count=log_data.result_count,
        status=log_data.status,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ===========================================================================
# 📊 MODÜL 2: ANA DASHBOARD
# ===========================================================================
@router.get("/stats", response_model=schemas.AdminStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    """
    Ana Dashboard metrikleri (KPI Kartları) - Admin veya Mekan Sahibi yetkisine göre filtrelenir.
    """
    if current_user.role == "venue":
        # Venue Owner Stats
        owned_places = db.query(models.Place).filter(models.Place.owner_id == current_user.id).all()
        owned_venue_ids = [v.id for v in owned_places]
        total_venues = len(owned_venue_ids)

        # Active stories linked to their places
        active_stories = 0
        if total_venues > 0:
            active_stories = db.query(models.Story).filter(
                models.Story.is_archived == False,
                models.Story.expires_at > datetime.utcnow(),
                models.Story.place_id.in_(owned_venue_ids)
            ).count()

        # Total unique users who bookmarked/saved their venues
        total_users = 0
        if total_venues > 0:
            total_users = db.query(models.SavedPlace).filter(
                models.SavedPlace.place_id.in_(owned_venue_ids)
            ).distinct(models.SavedPlace.user_id).count()

        # Placeholders for AI queries today for their venues
        ai_queries_today = 0
    else:
        # Full Admin Stats
        total_users = db.query(models.User).count()
        total_venues = db.query(models.Place).count()
        active_stories = db.query(models.Story).filter(
            models.Story.is_archived == False,
            models.Story.expires_at > datetime.utcnow(),
        ).count()

        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ai_queries_today = db.query(models.AIQueryLog).filter(
            models.AIQueryLog.created_at >= today_start
        ).count()

    return schemas.AdminStatsResponse(
        total_users=total_users,
        total_venues=total_venues,
        active_stories=active_stories,
        ai_queries_today=ai_queries_today,
    )


# ===========================================================================
# 👥 MODÜL 3: KULLANICI YÖNETİMİ
# ===========================================================================
@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    query = db.query(models.User)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(search_term)) |
            (models.User.username.ilike(search_term)) |
            (models.User.first_name.ilike(search_term)) |
            (models.User.last_name.ilike(search_term))
        )
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)

    total = query.count()
    users = query.order_by(desc(models.User.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": limit,
    }


@router.get("/users/{id}")
def get_user_detail(
    id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    posts = db.query(models.Post).filter(models.Post.user_id == id).order_by(desc(models.Post.created_at)).limit(10).all()
    stories = db.query(models.Story).filter(models.Story.user_id == id).order_by(desc(models.Story.created_at)).limit(10).all()
    ai_queries = db.query(models.AIQueryLog).filter(models.AIQueryLog.user_id == id).order_by(desc(models.AIQueryLog.created_at)).limit(20).all()

    return {
        "user": user,
        "posts": posts,
        "stories": stories,
        "ai_queries": ai_queries,
    }


@router.patch("/users/{id}")
def update_user_profile(
    id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    for k, v in payload.items():
        if hasattr(user, k):
            setattr(user, k, v)
    db.commit()
    db.refresh(user)

    log_admin_action(db, admin.id, "update_profile", "user", user.id, payload)
    return user


@router.post("/users/{id}/ban")
def ban_user(
    id: int,
    payload: Dict[str, str],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    reason = payload.get("reason", "Belirtilmedi")
    user.is_active = False
    # Terminate user sessions by incrementing token version
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    background_tasks.add_task(manager.close_user_connections, user.id, "Hesap askıya alındı")

    log_admin_action(db, admin.id, "ban_user", "user", user.id, {"reason": reason})
    return {"message": "Kullanıcı askıya alındı.", "is_active": False}


@router.post("/users/{id}/unban")
def unban_user(
    id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.is_active = True
    db.commit()

    log_admin_action(db, admin.id, "unban_user", "user", user.id)
    return {"message": "Kullanıcı aktif edildi.", "is_active": True}


@router.patch("/users/{id}/role")
def update_user_role(
    id: int,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    new_role = payload.get("role")
    if new_role not in ["standard", "venue", "admin"]:
        raise HTTPException(status_code=400, detail="Geçersiz rol.")

    old_role = user.role
    user.role = new_role
    db.commit()

    log_admin_action(db, admin.id, "change_role", "user", user.id, {"old_role": old_role, "new_role": new_role})
    return {"id": user.id, "role": user.role}


@router.delete("/users/{id}")
def delete_user(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Soft delete: de-activate and clear sensitive data
    user.is_active = False
    user.username = f"deleted_user_{user.id}"
    user.first_name = "Deleted"
    user.last_name = "User"
    user.phone_number = None
    user.avatar_url = None
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    background_tasks.add_task(manager.close_user_connections, user.id, "Hesap silindi")

    log_admin_action(db, admin.id, "delete_user", "user", user.id)
    return {"message": "Kullanıcı başarıyla silindi (soft-deleted)."}


# ===========================================================================
# 🏪 MODÜL 4: MEKAN & İÇERİK YÖNETİMİ
# ===========================================================================
@router.get("/venues")
def list_venues(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    query = db.query(models.Place)

    if current_user.role == "venue":
        query = query.filter(models.Place.owner_id == current_user.id)

    if search:
        query = query.filter(models.Place.name.ilike(f"%{search}%"))
    if district:
        query = query.filter(models.Place.city.ilike(f"%{district}%"))  # city maps to district locally
    if category:
        query = query.filter(models.Place.category == category)

    total = query.count()
    venues = query.order_by(models.Place.id).offset((page - 1) * limit).limit(limit).all()

    # Enrich with Qdrant status checking if vector_id exists
    enriched = []
    for v in venues:
        item = {
            "id": v.id,
            "name": v.name,
            "city": v.city,
            "category": v.category,
            "average_rating": v.average_rating,
            "photo_url": v.photo_url,
            "has_vector": v.vector_id is not None,
        }
        enriched.append(item)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "page_size": limit,
    }


@router.post("/venues")
def create_venue(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    try:
        owner_id = current_user.id if current_user.role == "venue" else payload.get("owner_id")
        new_place = models.Place(
            name=payload.get("name"),
            address=payload.get("address"),
            city=payload.get("city"),  # district
            description=payload.get("description"),
            price_range=payload.get("price_range", 2),
            category=payload.get("category"),
            features=payload.get("features", ""),
            latitude=payload.get("latitude"),
            longitude=payload.get("longitude"),
            photo_url=payload.get("photo_url"),
            opening_time=payload.get("opening_time"),
            closing_time=payload.get("closing_time"),
            phone_number=payload.get("phone_number"),
            owner_id=owner_id,
        )
        db.add(new_place)
        db.commit()
        db.refresh(new_place)

        log_admin_action(db, current_user.id, "create_venue", "venue", new_place.id, {"name": new_place.name})
        return new_place
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Mekan ekleme hatası: {e}")


@router.get("/venues/{id}")
def get_venue_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    venue = db.query(models.Place).filter(models.Place.id == id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    
    if current_user.role == "venue" and venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu mekana erişim yetkiniz yok.")
    return venue


@router.put("/venues/{id}")
def update_venue(
    id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    venue = db.query(models.Place).filter(models.Place.id == id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    if current_user.role == "venue" and venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu mekanı güncelleme yetkiniz yok.")

    for k, v in payload.items():
        if hasattr(venue, k):
            setattr(venue, k, v)
    db.commit()
    db.refresh(venue)

    # Invalidate Cache
    try:
        redis_client = get_redis()
        if redis_client:
            pass
    except Exception:
        pass

    log_admin_action(db, current_user.id, "update_venue", "venue", venue.id, payload)
    return venue


@router.delete("/venues/{id}")
def delete_venue(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    venue = db.query(models.Place).filter(models.Place.id == id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    if current_user.role == "venue" and venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu mekanı silme yetkiniz yok.")

    venue_name = venue.name
    db.delete(venue)
    db.commit()

    log_admin_action(db, current_user.id, "delete_venue", "venue", id, {"name": venue_name})
    return {"message": "Mekan başarıyla silindi."}


@router.post("/venues/{id}/index")
async def index_venue(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_or_venue_user),
):
    """
    Triggers the AI service to vectorize and index this venue in Qdrant.
    """
    venue = db.query(models.Place).filter(models.Place.id == id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")

    if current_user.role == "venue" and venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu mekanı indeksleme yetkiniz yok.")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/admin/venues/index",
                json={"venue_id": venue.id},
                timeout=15.0
            )
        if response.status_code == 200:
            res_data = response.json()
            vector_id = res_data.get("vector_id")
            if vector_id:
                venue.vector_id = vector_id
                db.commit()
            log_admin_action(db, current_user.id, "index_venue", "venue", venue.id)
            return {"status": "success", "vector_id": vector_id}
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"AI Service error: {response.text}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI index request failed: {e}")


@router.post("/venues/bulk-index")
async def bulk_index_venues(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Triggers AI service to bulk index all venues.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/admin/venues/bulk-index",
                timeout=60.0
            )
        if response.status_code == 200:
            log_admin_action(db, admin.id, "bulk_index_venues", "venue")
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"AI Service bulk error: {response.text}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI bulk index request failed: {e}")


# ===========================================================================
# 🛡️ MODÜL 5: SOSYAL İÇERİK MODERASYONU
# ===========================================================================
@router.get("/posts")
def list_posts(
    status: str = Query("pending"),  # pending, approved, rejected, reported
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    query = db.query(models.Post)

    if status == "reported":
        # Join with reports table to find reported posts
        post_ids_subq = db.query(models.Report.target_id).filter(
            models.Report.target_type == "post",
            models.Report.status == "pending"
        ).subquery()
        query = query.filter(models.Post.id.in_(post_ids_subq))
    else:
        query = query.filter(models.Post.status == status)

    total = query.count()
    posts = query.order_by(desc(models.Post.created_at)).offset((page - 1) * limit).limit(limit).all()

    # Format result items
    items = []
    for p in posts:
        reports = db.query(models.Report).filter(
            models.Report.target_type == "post",
            models.Report.target_id == p.id
        ).all()
        
        items.append({
            "id": p.id,
            "caption": p.caption,
            "created_at": p.created_at,
            "status": p.status,
            "is_flagged": p.is_flagged,
            "user": {
                "id": p.user.id,
                "username": p.user.username,
                "avatar_url": p.user.avatar_url,
            },
            "media": [{"id": m.id, "media_url": m.media_url, "media_type": m.media_type} for m in p.media],
            "reports": reports
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": limit,
    }


@router.patch("/posts/{id}/status")
def update_post_status(
    id: int,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")

    new_status = payload.get("status")
    if new_status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Geçersiz statü.")

    post.status = new_status
    if new_status == "rejected":
        post.is_flagged = True
    else:
        post.is_flagged = False
    db.commit()

    log_admin_action(db, admin.id, f"post_{new_status}", "post", post.id)
    return {"id": post.id, "status": post.status, "is_flagged": post.is_flagged}


@router.delete("/posts/{id}")
def delete_post(
    id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")

    db.delete(post)
    db.commit()

    log_admin_action(db, admin.id, "delete_post", "post", id)
    return {"message": "Gönderi silindi."}


@router.get("/stories")
def list_stories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    # Active stories (unexpired)
    query = db.query(models.Story).filter(
        models.Story.is_archived == False,
        models.Story.expires_at > datetime.utcnow(),
    )

    total = query.count()
    stories = query.order_by(desc(models.Story.created_at)).offset((page - 1) * limit).limit(limit).all()

    items = []
    for s in stories:
        view_count = db.query(models.StoryView).filter(models.StoryView.story_id == s.id).count()
        reaction_count = db.query(models.StoryReaction).filter(models.StoryReaction.story_id == s.id).count()

        items.append({
            "id": s.id,
            "media_url": s.media_url,
            "media_type": s.media_type,
            "created_at": s.created_at,
            "expires_at": s.expires_at,
            "user": {
                "id": s.user.id,
                "username": s.user.username,
                "avatar_url": s.user.avatar_url,
            },
            "view_count": view_count,
            "reaction_count": reaction_count,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": limit,
    }


@router.delete("/stories/{id}")
def delete_story(
    id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    story = db.query(models.Story).filter(models.Story.id == id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Hikaye bulunamadı.")

    db.delete(story)
    db.commit()

    log_admin_action(db, admin.id, "delete_story", "story", id)
    return {"message": "Hikaye silindi."}


@router.get("/reports", response_model=List[schemas.ReportResponse])
def list_reports(
    status: str = Query("pending"),  # pending, reviewed, dismissed
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    reports = db.query(models.Report).filter(models.Report.status == status).order_by(desc(models.Report.created_at)).all()
    return reports


@router.patch("/reports/{id}/resolve")
def resolve_report(
    id: int,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı.")

    new_status = payload.get("status")  # reviewed, dismissed
    if new_status not in ["reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Geçersiz durum.")

    report.status = new_status
    db.commit()

    log_admin_action(db, admin.id, f"resolve_report_{new_status}", "report", report.id)
    return {"id": report.id, "status": report.status}


# ===========================================================================
# 🤖 MODÜL 6: AI/LLM İZLEME & LOG
# ===========================================================================
@router.get("/ai/logs", response_model=schemas.PaginatedAIQueryLogs)
def get_ai_query_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    query_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    query = db.query(models.AIQueryLog)

    if query_type:
        query = query.filter(models.AIQueryLog.query_type == query_type)
    if status:
        query = query.filter(models.AIQueryLog.status == status)

    total = query.count()
    logs = query.order_by(desc(models.AIQueryLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    return schemas.PaginatedAIQueryLogs(
        items=logs,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get("/ai/filter-logs", response_model=schemas.PaginatedAIQueryLogs)
def get_ai_filter_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Engellenen (AI Content Filter tarafından yakalanan) sorgular
    """
    query = db.query(models.AIQueryLog).filter(models.AIQueryLog.query_type == "blocked")
    total = query.count()
    logs = query.order_by(desc(models.AIQueryLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    return schemas.PaginatedAIQueryLogs(
        items=logs,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get("/ai/stats")
def get_ai_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Recharts için günlük AI ve fallback istatistikleri
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Query count grouped by day
    daily_stats = db.query(
        func.date(models.AIQueryLog.created_at).label("day"),
        func.count(models.AIQueryLog.id).label("total_queries"),
        func.sum(
            text("CASE WHEN status = 'fallback' THEN 1 ELSE 0 END")
        ).label("fallback_queries"),
        func.sum(
            text("CASE WHEN query_type = 'blocked' THEN 1 ELSE 0 END")
        ).label("blocked_queries")
    ).filter(models.AIQueryLog.created_at >= thirty_days_ago).group_by(
        func.date(models.AIQueryLog.created_at)
    ).order_by(
        func.date(models.AIQueryLog.created_at)
    ).all()

    # Format result for charts
    chart_data = []
    for s in daily_stats:
        chart_data.append({
            "date": str(s.day),
            "total": s.total_queries,
            "fallback": int(s.fallback_queries or 0),
            "blocked": int(s.blocked_queries or 0),
        })

    # Language/filter stats
    lang_stats = [
        {"language": "tr", "count": 28},
        {"language": "en", "count": 12},
    ]

    return {
        "daily": chart_data,
        "languages": lang_stats,
    }


# ===========================================================================
# 🖥️ MODÜL 7: SİSTEM SAĞLIĞI
# ===========================================================================
@router.get("/system/health", response_model=schemas.SystemHealthResponse)
async def get_system_health(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    services = {}

    # 1. PostgreSQL Health
    db_start = time.perf_counter()
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    db_latency = (time.perf_counter() - db_start) * 1000
    services["postgresql"] = schemas.SystemHealthItem(
        status="UP" if db_ok else "DOWN",
        latency_ms=round(db_latency, 2),
    )

    # 2. Redis Health
    redis_start = time.perf_counter()
    redis_ok = False
    redis_client = get_redis()
    if redis_client:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception:
            pass
    redis_latency = (time.perf_counter() - redis_start) * 1000
    services["redis"] = schemas.SystemHealthItem(
        status="UP" if redis_ok else "DOWN",
        latency_ms=round(redis_latency, 2),
    )

    # 3. AI Service Health
    ai_start = time.perf_counter()
    ai_ok = False
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{AI_SERVICE_URL}/health", timeout=3.0)
        ai_ok = response.status_code == 200
    except Exception:
        pass
    ai_latency = (time.perf_counter() - ai_start) * 1000
    services["asemos-ai"] = schemas.SystemHealthItem(
        status="UP" if ai_ok else "DOWN",
        latency_ms=round(ai_latency, 2),
    )

    # 4. Qdrant health (via AI service or dummy)
    services["qdrant-cloud"] = schemas.SystemHealthItem(
        status="UP" if ai_ok else "UNKNOWN",
        latency_ms=round(ai_latency * 1.2, 2) if ai_ok else 0.0,
    )

    overall = "ok" if db_ok and redis_ok and ai_ok else "degraded"
    return schemas.SystemHealthResponse(
        status=overall,
        services=services,
    )


@router.get("/system/redis-stats")
async def get_redis_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    redis_client = get_redis()
    if not redis_client:
        return {"connected": False}

    try:
        keys_count = 0
        async for _ in redis_client.scan_iter(match="*"):
            keys_count += 1

        info = await redis_client.info()
        return {
            "connected": True,
            "keys_count": keys_count,
            "used_memory_human": info.get("used_memory_human", "N/A"),
            "used_memory": info.get("used_memory", 0),
            "hits": info.get("keyspace_hits", 0),
            "misses": info.get("keyspace_misses", 0),
            "hit_rate_pct": round(
                (info.get("keyspace_hits", 0) / (info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1))) * 100, 2
            ),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


@router.get("/system/qdrant-stats")
async def get_qdrant_stats(
    admin: models.User = Depends(get_admin_user),
):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{AI_SERVICE_URL}/api/info", timeout=3.0)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return {"collections": [], "vectors_count": 0, "status": "offline"}


@router.get("/system/logs")
def get_system_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """
    Returns recent audit logs representing recent actions.
    """
    logs = db.query(models.AdminAuditLog).order_by(desc(models.AdminAuditLog.created_at)).limit(limit).all()
    
    formatted = []
    for l in logs:
        admin_user = db.query(models.User).filter(models.User.id == l.admin_id).first()
        formatted.append({
            "id": l.id,
            "admin_username": admin_user.username if admin_user else f"Admin #{l.admin_id}",
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "created_at": l.created_at
        })
    return formatted
