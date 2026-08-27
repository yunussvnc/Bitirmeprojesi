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
from app_infrastructure import get_db_reviews
from app_language import _get_llm, lang_name, localize_review_insights
from app_state import runtime, logger, redis_url, redis_ttl

async def _enrich_with_review_insights(places: List[Dict], language: str = "tr") -> None:
    """
    Reranked mekanların yorumlarını paralel olarak çekip
    ne ile övüldüklerini tespit eder.
    """
    async def _fetch_and_analyze(place: Dict) -> None:
        """Tek mekan için yorum çek ve analiz et"""
        place_id = place.get('id')
        data_id = place.get('data_id', '')
        if not place_id and not data_id:
            place['review_insights'] = {'specialties': [], 'top_specialty': None,
                                        'highlight_tags': [], 'summary': ''}
            return

        cache_id = str(place_id or data_id)
        insight_cache_key = f"review_insights_{cache_id}_{language}"
        if runtime.cache_manager:
            cached = runtime.cache_manager.get(insight_cache_key)
            if cached:
                place['review_insights'] = cached
                print(f"[ReviewInsight] Cache hit: {place.get('name', cache_id)}")
                return

        # 1. Database'den çekmeyi dene
        reviews = []
        db_success = False
        if settings.DATABASE_URL and place_id:
            try:
                loop = asyncio.get_event_loop()
                db_reviews = await loop.run_in_executor(
                    None,
                    lambda: get_db_reviews(int(place_id))
                )
                reviews = [r.get("comment_text", "") for r in db_reviews if r.get("comment_text")]
                db_success = True
                print(f"[ReviewInsight] Database reviews loaded: {place.get('name')} ({len(reviews)} reviews)")
            except Exception as e:
                print(f"[ReviewInsight] Database reviews failed for {place_id}: {e}")

        # 2. Fallback: SerpAPI'den çekmeyi dene
        if not db_success or not reviews:
            try:
                from serpapi_client import SerpApiClient
                client = SerpApiClient()
                if data_id:
                    loop = asyncio.get_event_loop()
                    reviews = await loop.run_in_executor(
                        None,
                        lambda: client.get_place_reviews(data_id, max_reviews=20)
                    )
                    print(f"[ReviewInsight] SerpAPI reviews loaded: {place.get('name')} ({len(reviews)} reviews)")
            except Exception as e:
                print(f"[ReviewInsight] SerpAPI reviews failed for {data_id}: {e}")

        # Yorumları analiz et
        place_name = place.get('name', '')
        insights = fast_extract_insights(reviews, place_name)
        insights = localize_review_insights(insights, language)
        place['review_insights'] = insights

        # Specialties'i log'a yaz
        if insights.get('specialties'):
            specs = ', '.join([s['emoji'] + ' ' + s['key'] for s in insights['specialties'][:3]])
            print(f"[ReviewInsight] {place_name}: {specs}")
        else:
            print(f"[ReviewInsight] {place_name}: No specialties detected ({len(reviews)} reviews)")

        # Cache'e kaydet (24 saat TTL)
        if runtime.cache_manager and reviews:
            try:
                runtime.cache_manager.client.setex(insight_cache_key, 86400, json.dumps(insights, ensure_ascii=False))
            except Exception:
                pass

    tasks = [_fetch_and_analyze(place) for place in places]
    await asyncio.gather(*tasks, return_exceptions=True)


async def generate_review_analysis_llm(place_name: str, reviews: List[str], language: str = "tr") -> Dict:
    """
    Groq LLM ile detaylı yorum analizi yapar (JSON Modunda).
    Döner:
    {
       "sentiment_score": float, # 1.0 - 5.0
       "analysis_text": str, # Değerlendirme metni
       "specialties": List[Dict], # [{"emoji": "☕", "label": "Kahvesiyle ünlü"}, ...]
       "summary": str # Kısa özet metni
    }
    """
    if not reviews:
        return {}

    # Yorumları birleştir (limit 20 yorum ki prompt/tokens sınırı aşılmasın)
    joined_reviews = "\n".join([f"- {r}" for r in reviews[:20]])
    prompt = (
        f"Aşağıda '{place_name}' isimli mekan için yapılmış gerçek kullanıcı yorumları verilmiştir:\n"
        f"{joined_reviews}\n\n"
        f"Lütfen bu yorumları analiz et ve mekan hakkında JSON formatında şu alanları içeren bir yanıt döndür:\n"
        f"1. \"sentiment_score\": Müşteri memnuniyet skoru (1.0 ile 5.0 arasında float bir değer).\n"
        f"2. \"analysis_text\": Yorumlara dayalı detaylı, samimi, akıcı ve tarafsız bir değerlendirme metni (en az 2-3 cümle).\n"
        f"3. \"specialties\": Mekanın yorumlarda en çok övüldüğü veya öne çıktığı özellikleri temsil eden en fazla 3 adet obje içeren liste. Her obje 'emoji' ve 'label' (etiket metni, örn: 'Harika kahve') içermelidir.\n"
        f"4. \"summary\": Mekanı özetleyen tek cümlelik kısa bir açıklama.\n\n"
        f"Yanıt dilini kesinlikle '{lang_name(language)}' yap. Yalnızca geçerli bir JSON objesi döndür."
    )

    groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        print("[ReviewInsight] GROQ_API_KEY eksik, local wrapper fallback.")
        try:
            llm = _get_llm()
            response = await llm.generate_async(prompt)
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            parsed = json.loads(clean_response)
            return parsed
        except Exception as e:
            print(f"[ReviewInsight] Local LLM yorum analizi hatası: {e}")
            return {}

    groq_model = settings.GROQ_MODEL or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    import httpx
    
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": groq_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    f"Sen AsEmOs adlı mekan öneri uygulamasının yapay zeka asistanısın. "
                    f"Mekan yorumlarını analiz ederek sadece JSON formatında yanıt verirsin. "
                    f"Yanıt dilini kesinlikle '{lang_name(language)}' yapmalısın."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1000
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Groq API hatası: {resp.status_code} — {resp.text[:200]}")
            
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content.strip())
            return parsed
    except Exception as e:
        print(f"[ReviewInsight] Groq JSON API call failed: {e}")
        try:
            llm = _get_llm()
            response = await llm.generate_async(prompt)
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            return json.loads(clean_response)
        except Exception as fallback_e:
            print(f"[ReviewInsight] Fallback LLM also failed: {fallback_e}")
            return {}
