"""Cohesive module extracted from the original AI FastAPI application."""

import os
import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, UploadFile, File, Form  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import math
import asyncio
import hashlib
import json
import re
import httpx  # type: ignore[import]
from datetime import datetime
import redis  # type: ignore[import]
import sqlite3
from dotenv import load_dotenv  # type: ignore[import]
import pathlib as _pl
import logging
from review_analyzer import fast_extract_insights  # type: ignore[import]
import sys, os as _os
from src.models.llm.llm_wrapper import LayeredLLMWrapper  # type: ignore[import]
from src.config import settings  # type: ignore[import]
from scripts.prepare_vector_db import (  # type: ignore[import]
    get_mekanlar_from_json,
    create_embedding_text,
)
from qdrant_client.models import PointStruct  # type: ignore[import]
from src.rag.pipeline import RAGPipeline  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from app_infrastructure import _rag_status_for_health
from app_state import runtime, logger, redis_url, redis_ttl

router = APIRouter()

@router.get("/", include_in_schema=False)
@router.get("/ui", include_in_schema=False)
async def serve_ui():
    """Chat UI'yi doğrudan backend üzerinden serve et (CORS sorunu olmaz).
    Bu internal bir AI servisi — debug chat arayüzü herkese açık production'da
    varsayılan olarak kapalı (ENABLE_CHAT_UI ile açılabilir)."""
    from fastapi.responses import HTMLResponse  # type: ignore[import]
    if not settings.ENABLE_CHAT_UI:
        return HTMLResponse("<h1>404 Not Found</h1>", status_code=404)
    ui_path = os.path.join(os.path.dirname(__file__), "chat_ui.html")
    if not os.path.exists(ui_path):
        return HTMLResponse("<h1>chat_ui.html bulunamadı</h1>", status_code=404)
    with open(ui_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)


@router.get("/health")
async def health():
    """Health check"""
    cache_ok = runtime.cache_manager is not None and runtime.cache_manager.is_connected
    return {
        "status": "ok",
        "version": "2.1.0",
        "cache": "redis" if cache_ok else "none (fallback)",
        "model_loaded": runtime.model_manager.is_loaded,
        "rag": {
            **_rag_status_for_health(),
            "auto_index": settings.RAG_AUTO_INDEX,
            "index_on_startup": settings.RAG_INDEX_ON_STARTUP,
        }
    }


@router.get("/api/info")
async def get_info():
    """Sistem bilgileri ve istatistikler (Faz 2)"""
    cache_stats = runtime.cache_manager.get_stats() if runtime.cache_manager else {"backend": "none (no redis)"}
    return {
        "version": "2.1.0",
        "phase": "Faz 2 - Performance Optimized",
        "features": [
            "2.1: Redis Cache with TTL",
            "2.2: Model Preloading at Startup",
            "2.3: Async Pipeline Support"
        ],
        "cache_stats": cache_stats,
        "model_stats": {
            "is_loaded": runtime.model_manager.is_loaded,
            "device": runtime.model_manager.device
        },
        "rag": {
            **runtime.rag_bootstrap_status,
            "auto_index": settings.RAG_AUTO_INDEX,
            "index_on_startup": settings.RAG_INDEX_ON_STARTUP,
            "collection": settings.QDRANT_COLLECTION_NAME,
            "qdrant_url": settings.QDRANT_URL or ":memory:"
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/stats")
async def get_stats():
    """
    Detaylı sistem istatistikleri:
    - Cache hit/miss oranı
    - Redis bellek kullanımı
    - Kaç anahtar saklanıyor
    - Yorum insight cache sayısı
    - Uptime
    """
    stats = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "version": "2.1.0",
            "model_loaded": runtime.model_manager.is_loaded,
            "model_device": runtime.model_manager.device,
        },
        "cache": {},
        "review_insights": {},
        "nlp": {
            "categories": 6,
            "districts": 42,
            "features": 8,
            "moods": 5,
            "specialty_patterns": 23,   # review_analyzer kategorileri
        }
    }
    
    if runtime.cache_manager and runtime.cache_manager.is_connected:
        try:
            import redis as _redis
            r = _redis.Redis.from_url(runtime.cache_manager.redis_url)
            info = r.info()
            
            total_keys: int = int(r.dbsize())
            
            insight_keys: int = len(r.keys("review_insights_*"))  # type: ignore[arg-type]
            search_keys: int  = len(r.keys("smart_search*"))      # type: ignore[arg-type]
            
            # Redis info'dan direkt typed değerler al
            hits: int   = int(info.get("keyspace_hits", 0) or 0)
            misses: int = int(info.get("keyspace_misses", 0) or 0)
            hit_total: int = hits + misses
            hit_rate: float = float(round(hits / hit_total * 100, 1)) if hit_total > 0 else 0.0
            
            mem_used_mb:  float = float(round(int(info.get("used_memory", 0) or 0) / 1024 / 1024, 2))
            mem_peak_mb:  float = float(round(int(info.get("used_memory_peak", 0) or 0) / 1024 / 1024, 2))
            clients: int  = int(info.get("connected_clients", 0) or 0)
            
            stats["cache"] = {  # type: ignore[assignment]
                "status": "connected",
                "total_keys": total_keys,
                "search_cache_keys": search_keys,
                "insight_cache_keys": insight_keys,
                "memory_used_mb": mem_used_mb,
                "memory_peak_mb": mem_peak_mb,
                "connected_clients": clients,
                "hits": hits,
                "misses": misses,
                "hit_rate_pct": hit_rate,
            }
            
            stats["review_insights"] = {  # type: ignore[assignment]
                "cached_insights": insight_keys,
                "ttl_hours": 24,
                "note": "Her mekan için 24 saat cache tutulur"
            }
            
        except Exception as e:
            stats["cache"] = {"status": "error", "detail": str(e)}  # type: ignore[assignment]
    else:
        stats["cache"] = {"status": "not_connected", "detail": "Redis çalışmıyor"}  # type: ignore[assignment]
    
    return stats
