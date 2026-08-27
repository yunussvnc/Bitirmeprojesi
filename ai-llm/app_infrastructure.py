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
from app_state import RedisCacheManager
from app_state import runtime, logger, redis_url, redis_ttl

_ai_llm_root = os.path.dirname(os.path.abspath(__file__))
try:
    import psycopg2  # type: ignore[import]
    import psycopg2.extras  # type: ignore[import]
except ImportError:
    psycopg2 = None

def get_db_connection():
    """DATABASE_URL parametresine göre SQLite veya PostgreSQL bağlantısı döner."""
    db_url = settings.DATABASE_URL
    if not db_url:
        raise ValueError("DATABASE_URL .env dosyasında tanımlı değil.")

    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        if not os.path.isabs(db_path):
            db_path = os.path.abspath(os.path.join(_ai_llm_root, db_path))
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        # Türkçe karakterler için UTF-8
        conn.execute("PRAGMA encoding = 'UTF-8'")
        return conn
    else:
        # PostgreSQL
        if psycopg2 is None:
            raise ImportError("psycopg2-binary paketi yüklü değil.")
        normalized_url = db_url
        if normalized_url.startswith("postgres://"):
            normalized_url = "postgresql://" + normalized_url[len("postgres://"):]
        conn = psycopg2.connect(normalized_url)
        return conn


def execute_query(query: str, params: tuple = None) -> List[Dict]:
    """Sorguyu çalıştırır ve sütun isimleriyle eşleşen sözlük listesi döner."""
    db_url = settings.DATABASE_URL or ""
    is_sqlite = db_url.startswith("sqlite:///")
    
    conn = get_db_connection()
    try:
        if is_sqlite:
            cursor = conn.cursor()
            sqlite_query = query.replace("%s", "?")
            if params:
                cursor.execute(sqlite_query, params)
            else:
                cursor.execute(sqlite_query)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        else:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    finally:
        conn.close()


def get_places_from_db() -> List[Dict]:
    """Veritabanındaki tüm mekanları ve yorum sayısını/yorum metinlerini çeker."""
    db_url = settings.DATABASE_URL or ""
    is_sqlite = db_url.startswith("sqlite:///")
    
    if is_sqlite:
        query = """
            SELECT p.*, 
                   COUNT(r.id) AS review_count, 
                   GROUP_CONCAT(r.comment_text, ' ') AS concatenated_reviews
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.id
            GROUP BY p.id
        """
    else:
        query = """
            SELECT p.*, 
                   COUNT(r.id) AS review_count, 
                   string_agg(r.comment_text, ' ') AS concatenated_reviews
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.id
            GROUP BY p.id
        """
        
    rows = execute_query(query)
    
    normalized = []
    for idx, row in enumerate(rows):
        place_id = row.get("id") or (idx + 1)
        normalized.append({
            "id": place_id,
            "ad": row.get("name") or "",
            "kategori": row.get("category") or "Mekan",
            "aciklama": row.get("description") or "",
            "adres": f"{row.get('address', '')} {row.get('city', '')}".strip(),
            "enlem": float(row.get("latitude")) if row.get("latitude") is not None else None,
            "boylam": float(row.get("longitude")) if row.get("longitude") is not None else None,
            "rating": float(row.get("average_rating") or 0.0),
            "review_count": int(row.get("review_count") or row.get("user_ratings_total") or 0),
            "user_review": row.get("concatenated_reviews") or ""
        })
    return normalized


def get_db_reviews(place_id: int) -> List[Dict]:
    """Belirli bir mekan için veritabanındaki yorumları çeker."""
    query = """
        SELECT r.comment_text, r.rating, r.created_at, u.username
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.place_id = %s
        ORDER BY r.created_at DESC
    """
    return execute_query(query, (place_id,))


def _resolve_rag_data_path() -> str:
    data_path = settings.RAG_DATA_PATH or "data/loaded_places.json"
    if os.path.isabs(data_path):
        return data_path
    return os.path.join(_ai_llm_root, data_path)


def _count_places_in_json(data_path: Optional[str] = None) -> int:
    """loaded_places.json kayıt sayısı (bootstrap öncesi /health için)."""
    path = data_path or _resolve_rag_data_path()
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return len(data) if isinstance(data, list) else 0
    except Exception:
        return 0


def _bootstrap_rag_index_sync(force_reindex: Optional[bool] = None) -> Dict[str, Union[str, int, bool, None]]:
    """loaded_places.json snapshot'ını Qdrant'a güvenli şekilde indeksler."""
    if not settings.RAG_AUTO_INDEX:
        runtime.rag_bootstrap_status.update({"ready": False, "last_error": "RAG_AUTO_INDEX disabled"})
        return runtime.rag_bootstrap_status

    data_path = _resolve_rag_data_path()
    force = settings.RAG_FORCE_REINDEX if force_reindex is None else force_reindex

    try:
        rag = _get_rag_pipeline()
        if not rag:
            raise RuntimeError("RAG pipeline başlatılamadı")

        retriever = rag.retriever
        vector_db = retriever.vector_db
        embedding_model = retriever.embedding_model

        # Database'den mekanları çekmeyi dene, hata alırsan JSON fallback yap
        db_loaded = False
        try:
            mekanlar = get_places_from_db()
            if mekanlar:
                db_loaded = True
                data_path = f"database: {settings.DATABASE_URL.split('@')[-1]}"
                print(f"[RAG] Veritabanından {len(mekanlar)} mekan çekildi (Qdrant index için).")
        except Exception as db_exc:
            print(f"[RAG] Veritabanı çekimi başarısız ({db_exc}), JSON fallback yapılıyor...")
            
        if not db_loaded:
            mekanlar = get_mekanlar_from_json(json_path=data_path)

        if not mekanlar:
            raise RuntimeError(f"RAG veri kaynağında mekan bulunamadı (database/json).")

        vector_size = embedding_model.get_vector_size()
        vector_db.create_collection_if_not_exists(vector_size=vector_size)

        current_count = vector_db.count_vectors()
        source_count = len(mekanlar)
        if current_count >= source_count and not force:
            runtime.rag_bootstrap_status = {
                "ready": True,
                "indexed_count": current_count,
                "source_count": source_count,
                "storage_mode": getattr(vector_db, "storage_mode", "unknown"),
                "data_path": data_path,
                "last_error": None,
            }
            print(f"[RAG] Index hazır: {current_count}/{source_count} vektör")
            return runtime.rag_bootstrap_status

        print(f"[RAG] Index yükleniyor: {source_count} mekan ({data_path})")
        embedding_texts = [create_embedding_text(mekan) for mekan in mekanlar]
        embeddings = embedding_model.encode(embedding_texts)

        points = []
        for i, (embedding, mekan) in enumerate(zip(embeddings, mekanlar), 1):
            point_id = int(mekan.get("id") or i)
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "id": point_id,
                    "ad": mekan.get("ad", ""),
                    "aciklama": mekan.get("aciklama", ""),
                    "kategori": mekan.get("kategori", ""),
                    "enlem": mekan.get("enlem"),
                    "boylam": mekan.get("boylam"),
                    "adres": mekan.get("adres", ""),
                    "rating": mekan.get("rating", 0),
                    "review_count": mekan.get("review_count", 0),
                    "user_review": mekan.get("user_review", "")
                }
            ))

        batch_size = 100
        uploaded = 0
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            if vector_db.add_vectors(batch):
                uploaded += len(batch)
            else:
                raise RuntimeError(f"Qdrant batch yükleme başarısız: {i}-{i + len(batch)}")

        indexed_count = vector_db.count_vectors() or uploaded
        runtime.rag_bootstrap_status = {
            "ready": indexed_count > 0,
            "indexed_count": indexed_count,
            "source_count": source_count,
            "storage_mode": getattr(vector_db, "storage_mode", "unknown"),
            "data_path": data_path,
            "last_error": None,
        }
        print(f"[RAG] Index yüklendi: {indexed_count}/{source_count} vektör")
        return runtime.rag_bootstrap_status
    except Exception as e:
        runtime.rag_bootstrap_status.update({
            "ready": False,
            "last_error": str(e),
            "data_path": data_path,
        })
        print(f"[RAG] Index bootstrap hatası: {e}")
        return runtime.rag_bootstrap_status


async def ensure_rag_ready(force_reindex: Optional[bool] = None) -> Dict[str, Union[str, int, bool, None]]:
    """İlk RAG isteğinde veya startup arka planında index'in hazır olmasını sağlar."""
    if runtime.rag_bootstrap_status.get("ready") and not force_reindex:
        return runtime.rag_bootstrap_status

    async with runtime.rag_bootstrap_lock:
        if runtime.rag_bootstrap_status.get("ready") and not force_reindex:
            return runtime.rag_bootstrap_status
        return await asyncio.to_thread(_bootstrap_rag_index_sync, force_reindex)


def _rag_status_for_health() -> Dict[str, Union[str, int, bool, None]]:
    """Health/info: bootstrap henuz calismadiysa JSON ve Qdrant sayimini yansitir."""
    out: Dict[str, Union[str, int, bool, None]] = {
        "ready": runtime.rag_bootstrap_status.get("ready"),
        "indexed_count": runtime.rag_bootstrap_status.get("indexed_count") or 0,
        "source_count": runtime.rag_bootstrap_status.get("source_count") or 0,
        "storage_mode": runtime.rag_bootstrap_status.get("storage_mode"),
        "data_path": runtime.rag_bootstrap_status.get("data_path"),
        "last_error": runtime.rag_bootstrap_status.get("last_error"),
    }
    if not out["source_count"]:
        data_path = _resolve_rag_data_path()
        json_count = _count_places_in_json(data_path)
        if json_count:
            out["source_count"] = json_count
            out["data_path"] = data_path
    if runtime.rag_pipeline is not None:
        try:
            cnt = runtime.rag_pipeline.retriever.vector_db.count_vectors() or 0
            if cnt:
                out["indexed_count"] = cnt
                src = int(out["source_count"] or 0)
                out["ready"] = cnt > 0 and (src == 0 or cnt >= src)
                out["storage_mode"] = getattr(
                    runtime.rag_pipeline.retriever.vector_db, "storage_mode", out.get("storage_mode")
                )
        except Exception:
            pass
    return out


def _get_rag_pipeline() -> Optional[RAGPipeline]:
    """RAG pipeline'ını lazy init ile al"""
    if runtime.rag_pipeline is None:
        try:
            print("[RAG] RAG sistemi başlatılıyor...")
            runtime.rag_pipeline = RAGPipeline()
            print("[RAG] OK RAG sistemi hazır!")
            return runtime.rag_pipeline
        except Exception as e:
            print(f"[RAG] UYARI RAG başlatılamadı (devre dışı): {e}")
            return None
    return runtime.rag_pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan: startup ve shutdown işlemleri"""
    print("\n" + "="*60)
    print("FAZ 2: STARTUP - Sistem Başlatılıyor")
    print("="*60)

    data_path = _resolve_rag_data_path()
    json_count = _count_places_in_json(data_path)
    if json_count:
        runtime.rag_bootstrap_status["source_count"] = json_count
        runtime.rag_bootstrap_status["data_path"] = data_path
        print(f"[RAG] JSON snapshot: {json_count} mekan ({data_path})")

    # 1. Redis Cache - bağlantı yoksa fallback
    try:
        runtime.cache_manager = RedisCacheManager(redis_url=redis_url, ttl_seconds=redis_ttl)
        print(f"[Startup] Cache Manager (Redis): OK {redis_url}")
    except Exception as e:
        print(f"[Startup] Redis baglanamadi ({e}), in-memory fallback")
        runtime.cache_manager = None

    # 2. Model Preloading — ARKA PLANDA (servis hemen baslar)
    async def _load_models_bg():
        model_status = await runtime.model_manager.preload_models()
        print(f"[Model] Yukleme tamamlandi: {model_status['status']}")

    asyncio.create_task(_load_models_bg())
    print(f"[Startup] Model yukleme arka planda baslatildi...")

    # 3. RAG System - ARKA PLANDA (opsiyonel)
    async def _load_rag_bg():
        if settings.RAG_INDEX_ON_STARTUP:
            await ensure_rag_ready()
        else:
            _get_rag_pipeline()

    asyncio.create_task(_load_rag_bg())
    print(f"[Startup] RAG sistemi arka planda baslatiliyor...")

    # 4. Postgres place sync — JSON snapshot DB'den gerideyse arka planda upsert
    async def _sync_places_bg():
        if not settings.PLACES_SYNC_ON_STARTUP:
            return
        try:
            from scripts.serpapi_to_postgres import maybe_sync_places_on_startup
            await asyncio.to_thread(
                maybe_sync_places_on_startup,
                settings.database_url_normalized,
                _resolve_rag_data_path(),
                settings.PLACES_SYNC_MIN_RATIO,
            )
        except Exception as exc:
            print(f"[PlacesSync] Startup sync basarisiz: {exc}")

    sync_places_task = asyncio.create_task(_sync_places_bg())
    if settings.PLACES_SYNC_ON_STARTUP:
        print("[Startup] Postgres place sync arka planda kontrol edilecek...")

    # 5. BM25 Index (Hybrid Search) — ARKA PLANDA, places sync'ten sonra
    async def _load_bm25_bg():
        if not settings.HYBRID_SEARCH_ENABLED:
            return
        await sync_places_task
        try:
            rag = _get_rag_pipeline()
            if rag:
                await asyncio.to_thread(rag.retriever.bm25_index.build)
                print("[BM25] Index arka planda kuruldu.")
        except Exception as exc:
            print(f"[BM25] Index kurulumu basarisiz: {exc}")

    if settings.HYBRID_SEARCH_ENABLED:
        asyncio.create_task(_load_bm25_bg())
        print(f"[Startup] BM25 index arka planda baslatiliyor...")

    print(f"[Startup] Version: 2.1 (Performance Optimized + RAG)")
    print("="*60 + "\n")

    yield  # Uygulama burada çalışır

    # Shutdown
    print("[Shutdown] Sistem kapatiliyor...")
