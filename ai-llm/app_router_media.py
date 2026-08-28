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
from app_infrastructure import execute_query, get_db_reviews
from app_language import _get_llm, build_review_analysis_text, localize_review_insights, localized, resolve_response_language
from app_models import AnalyzeReviewRequest
from app_review import generate_review_analysis_llm
from app_state import runtime, logger, redis_url, redis_ttl

router = APIRouter()

@router.post("/api/v1/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("tr")
):
    """Gelen ses dosyasını Groq Whisper üzerinden metne çevirir."""
    llm = _get_llm()
    try:
        audio_bytes = await file.read()
        filename = file.filename or "audio.m4a"
        # LayeredLLMWrapper üzerinden asenkron transcribe çağır
        text = await llm.transcribe_audio_async(audio_bytes, filename, language)
        return {"text": text}
    except Exception as e:
        logger.error(f"[Transcribe] Hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Ses metne çevrilemedi")


@router.post("/api/analyze-place-reviews")
async def analyze_place_reviews(request: AnalyzeReviewRequest):
    """
    Seçilen mekan için derinlemesine yorum analizi:
    - Sentiment skoru
    - Mekanın neyle övüldüğü (kahve, hamburger, atmosfer vs.)
    - Örnek yorumlar
    """
    try:
        response_language = resolve_response_language(
            request.place_name or "",
            request.language,
            request.locale
        )
        
        place_id = None
        try:
            place_id = int(request.data_id)
        except Exception:
            pass

        cache_id = str(place_id or request.data_id)
        llm_cache_key = f"groq_review_analysis_{cache_id}_{response_language}"
        
        # 1. CACHE CHECK (Redis)
        if runtime.cache_manager:
            cached_analysis = runtime.cache_manager.get(llm_cache_key)
            if cached_analysis:
                print(f"[ReviewInsight] Groq Analysis Cache Hit: {request.place_name or cache_id}")
                return cached_analysis

        # 2. LOAD REVIEWS
        reviews = []
        db_success = False
        google_place_id = request.data_id
        
        # Query database first
        if settings.DATABASE_URL and place_id:
            try:
                # Resolve google_place_id from local database first
                p_rows = execute_query("SELECT google_place_id FROM places WHERE id = %s", (place_id,))
                if p_rows and p_rows[0].get("google_place_id"):
                    google_place_id = p_rows[0]["google_place_id"]

                db_reviews = get_db_reviews(place_id)
                reviews = [r.get("comment_text", "") for r in db_reviews if r.get("comment_text")]
                db_success = True
                print(f"[ReviewInsight] Loaded {len(reviews)} reviews from DB for {request.place_name}")
            except Exception as db_err:
                print(f"[ReviewInsight] DB query failed in analyze: {db_err}")

        # Fallback to SerpAPI if database fails or returns no reviews
        if not db_success or not reviews:
            try:
                from serpapi_client import SerpApiClient
                client = SerpApiClient()
                deep_reviews = client.get_place_reviews(google_place_id, max_reviews=50)
                reviews = deep_reviews
                print(f"[ReviewInsight] Loaded {len(reviews)} reviews from SerpAPI for {request.place_name}")
            except Exception as e:
                print(f"[ReviewInsight] SerpAPI query failed in analyze: {e}")

        if not reviews:
            return {
                "success": False,
                "review_count": 0,
                "analysis_text": localized("not_enough_reviews", response_language),
                "specialties": []
            }

        count = len(reviews)
        place_name = request.place_name or ""

        # 3. GROQ LLM ANALYSIS (Premium Dynamic Analysis)
        llm_analysis = {}
        if settings.GROQ_API_KEY:
            try:
                # If reviews are dicts (from DB), extract text. If strings (from SerpAPI), keep as is.
                reviews_text = [r.get("comment_text") if isinstance(r, dict) else r for r in reviews]
                reviews_text = [r for r in reviews_text if r]
                
                llm_analysis = await generate_review_analysis_llm(place_name, reviews_text, response_language)
            except Exception as llm_err:
                print(f"[ReviewInsight] Groq review analysis failed: {llm_err}")

        # Construct final response
        if llm_analysis and llm_analysis.get("analysis_text"):
            # Use Groq response
            sentiment_score = float(llm_analysis.get("sentiment_score") or 4.5)
            analysis_text = llm_analysis.get("analysis_text")
            specialties = llm_analysis.get("specialties") or []
            summary = llm_analysis.get("summary") or ""
            
            # Map specialties to include required keys (key, display, etc. for frontend compatibility)
            for spec in specialties:
                spec["key"] = spec.get("label", "")
                spec["display"] = f"{spec.get('emoji', '⭐')} {spec.get('label', '')}"
                spec["mention_count"] = count // 4 or 1

            highlight_tags = [spec.get("label", "") for spec in specialties]
            
            response_payload = {
                "success": True,
                "review_count": count,
                "sentiment_score": sentiment_score,
                "analysis_text": analysis_text,
                "specialties": specialties,
                "highlight_tags": highlight_tags,
                "example_reviews": [],
                "summary": summary,
                "language": response_language,
                "source": "groq_llm"
            }
        else:
            # Fallback to local keyword/sentiment-based analyzer
            reviews_text = [r.get("comment_text") if isinstance(r, dict) else r for r in reviews]
            reviews_text = [r for r in reviews_text if r]
            
            insights = fast_extract_insights(reviews_text, place_name)
            insights = localize_review_insights(insights, response_language)
            sentiment_bonus = runtime.model_manager.analyze_review_sentiment(reviews_text)
            
            analysis_text = build_review_analysis_text(
                count,
                insights.get('specialties', []),
                sentiment_bonus,
                response_language
            )
            
            example_reviews = []
            for spec in insights.get('specialties', [])[:3]:
                if spec.get('example_review'):
                    example_reviews.append({
                        "specialty": spec['label'],
                        "emoji": spec['emoji'],
                        "review": spec['example_review']
                    })
            
            response_payload = {
                "success": True,
                "review_count": count,
                "sentiment_score": round(3.0 + sentiment_bonus * 2.0, 3), # Map to 1-5 scale
                "analysis_text": analysis_text,
                "specialties": insights.get('specialties', []),
                "highlight_tags": insights.get('highlight_tags', []),
                "example_reviews": example_reviews,
                "summary": insights.get('summary', ''),
                "language": response_language,
                "source": "fallback_keyword"
            }

        # Cache response in Redis (24h TTL)
        if runtime.cache_manager:
            try:
                runtime.cache_manager.set(llm_cache_key, response_payload, ex=86400)
            except Exception as cache_err:
                print(f"[ReviewInsight] Cache write failed: {cache_err}")

        return response_payload
    except Exception as e:
        print(f"[ReviewInsight] HATA Yorum analizi hatası: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "review_count": 0,
            "analysis_text": localized("reviews_unavailable", response_language if 'response_language' in locals() else "tr"),
            "specialties": []
        }
