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
from app_infrastructure import _bootstrap_rag_index_sync, _get_rag_pipeline, execute_query
from app_models import IndexVenueRequest
from app_state import runtime, logger, redis_url, redis_ttl

router = APIRouter()

@router.post("/api/admin/venues/index")
async def admin_index_venue(request: IndexVenueRequest):
    """
    Indexes a single venue by its ID in Qdrant.
    """
    venue_id = request.venue_id
    
    # 1. Fetch from Database
    db_url = settings.DATABASE_URL or ""
    is_sqlite = db_url.startswith("sqlite:///")
    
    if is_sqlite:
        query = """
            SELECT p.*, 
                   COUNT(r.id) AS review_count, 
                   GROUP_CONCAT(r.comment_text, ' ') AS concatenated_reviews
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.id
            WHERE p.id = %s
            GROUP BY p.id
        """
    else:
        query = """
            SELECT p.*, 
                   COUNT(r.id) AS review_count, 
                   string_agg(r.comment_text, ' ') AS concatenated_reviews
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.id
            WHERE p.id = %s
            GROUP BY p.id
        """
    try:
        rows = execute_query(query, (venue_id,))
        if not rows:
            raise HTTPException(status_code=404, detail="Mekan veritabanında bulunamadı.")
            
        row = rows[0]
        mekan = {
            "id": venue_id,
            "ad": row.get("name") or "",
            "kategori": row.get("category") or "Mekan",
            "aciklama": row.get("description") or "",
            "adres": f"{row.get('address', '')} {row.get('city', '')}".strip(),
            "enlem": float(row.get("latitude")) if row.get("latitude") is not None else None,
            "boylam": float(row.get("longitude")) if row.get("longitude") is not None else None,
            "rating": float(row.get("average_rating") or 0.0),
            "review_count": int(row.get("review_count") or row.get("user_ratings_total") or 0),
            "user_review": row.get("concatenated_reviews") or ""
        }
        
        # 2. Get RAG Pipeline
        rag = _get_rag_pipeline()
        if not rag:
            raise RuntimeError("RAG pipeline başlatılamadı")
            
        retriever = rag.retriever
        vector_db = retriever.vector_db
        embedding_model = retriever.embedding_model
        
        # 3. Create embedding
        embedding_text = create_embedding_text(mekan)
        embedding = embedding_model.encode([embedding_text])[0]
        
        # 4. Insert into Qdrant
        vector_size = embedding_model.get_vector_size()
        vector_db.create_collection_if_not_exists(vector_size=vector_size)
        
        point = PointStruct(
            id=venue_id,
            vector=embedding.tolist() if hasattr(embedding, "tolist") else list(embedding),
            payload={
                "id": venue_id,
                "ad": mekan["ad"],
                "aciklama": mekan["aciklama"],
                "kategori": mekan["kategori"],
                "enlem": mekan["enlem"],
                "boylam": mekan["boylam"],
                "adres": mekan["adres"],
                "rating": mekan["rating"],
                "review_count": mekan["review_count"],
                "user_review": mekan["user_review"]
            }
        )
        
        success = vector_db.add_vectors([point])
        if not success:
            raise RuntimeError("Qdrant point creation failed")
            
        return {"status": "success", "vector_id": str(venue_id)}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/admin/venues/bulk-index")
async def admin_bulk_index_venues():
    """
    Re-indexes all venues from the database to Qdrant.
    """
    try:
        status = await asyncio.to_thread(_bootstrap_rag_index_sync, force_reindex=True)
        return {"status": "success", "indexed_count": status.get("indexed_count")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
