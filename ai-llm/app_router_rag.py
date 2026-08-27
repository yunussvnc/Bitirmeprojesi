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
from app_infrastructure import _get_rag_pipeline, ensure_rag_ready
from app_language import localized, resolve_response_language
from app_models import SmartSearchRequest
from app_state import runtime, logger, redis_url, redis_ttl

router = APIRouter()

@router.post("/api/rag-search")
async def rag_search(request: SmartSearchRequest):
    """
    Pure RAG search - Sadece vektör veritabanı araması
    SerpAPI kullanmadan, sadece yerel veritabanından semantik arama yapar
    """
    try:
        response_language = resolve_response_language(request.query, request.language, request.locale)
        rag_status = await ensure_rag_ready()
        if not rag_status.get("ready"):
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "RAG index hazır değil.",
                    "rag": rag_status
                }
            )

        rag = _get_rag_pipeline()
        if not rag:
            raise HTTPException(
                status_code=503,
                detail="RAG sistemi kullanılamıyor. Vektör veritabanı yüklenmemiş olabilir."
            )

        # RAG ile ara
        result = rag.process(
            user_query=request.query,
            location={
                "lat": request.user_lat,
                "lng": request.user_lng
            } if request.user_lat and request.user_lng else None,
            language=response_language,
            kullanici_id=request.user_id,
        )

        if not result or not result.get("oneriler"):
            return {
                "query": request.query,
                "found": 0,
                "recommendations": [],
                "message": localized("no_vector_match", response_language),
                "source": "RAG (Vector Database)",
                "rag": rag_status
            }

        # Format response
        recommendations = []
        for oneri in result["oneriler"]:
            recommendations.append({
                "name": oneri.get("ad"),
                "address": oneri.get("adres"),
                "latitude": oneri.get("enlem"),
                "longitude": oneri.get("boylam"),
                "category": oneri.get("kategori"),
                "description": oneri.get("aciklama"),
                "similarity_score": round(oneri.get("benzerlik_skoru", 0), 3),
                "recommendation_reason": oneri.get("gerekce", "")
            })

        return {
            "query": request.query,
            "found": len(recommendations),
            "recommendations": recommendations,
            "analysis": result.get("sorgu_analizi", ""),
            "source": "RAG (Vector Database)",
            "hybrid_mode": False,
            "rag_context": {
                "rag_enhanced": True,
                "rag_source_count": rag_status.get("source_count", 0),
                "rag_indexed_count": rag_status.get("indexed_count", 0),
                "storage_mode": rag_status.get("storage_mode")
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
