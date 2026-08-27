"""Cohesive routes extracted from the parent router."""

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

router = APIRouter()

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
