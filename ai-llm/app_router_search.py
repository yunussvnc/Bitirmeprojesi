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
from app_infrastructure import _bootstrap_rag_index_sync, execute_query, get_db_reviews
from app_language import FEATURE_LABELS, generate_llm_response, localized, reason_label, resolve_response_language
from app_models import SmartSearchRequest
from app_review import _enrich_with_review_insights
from app_search import _build_rag_context, _fetch_rag_results, _merge_recommendations, _sanitize_recommendations, _score_rag_recommendations, calculate_distance, hybrid_score, is_place_open, parse_natural_query, rerank_places, strict_category_match
from app_state import runtime, logger, redis_url, redis_ttl

router = APIRouter()

async def log_to_backend_bg(
    query_text: str,
    query_type: str,
    llm_layer: str,
    response_time_ms: int,
    result_count: int,
    status: str,
    user_id: Optional[int] = None,
):
    backend_url = os.getenv("BACKEND_API_URL", "https://asemos-backend.onrender.com")
    url = f"{backend_url}/admin/ai/log-entry"
    payload = {
        "user_id": user_id,
        "query_text": query_text,
        "query_type": query_type,
        "llm_layer": llm_layer,
        "response_time_ms": response_time_ms,
        "result_count": result_count,
        "status": status,
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload, timeout=5.0)
    except Exception as e:
        print(f"[AI-Logger] Failed to log query to backend: {e}")


@router.post("/api/smart-search-v2")
async def smart_search_v2(request: SmartSearchRequest, background_tasks: BackgroundTasks):
    """
    Akıllı mekan arama - Faz 2 Optimized (Async + Cache)
    
    Yeni Özellikler:
    - Cache: Aynı sorgu 2. kez çok hızlı
    - Preloading: Modeller startup'ta yüklü
    - Async: Paralel işlemler
    """
    try:
        response_language = resolve_response_language(request.query, request.language, request.locale)
        # 1. CACHE CHECK
        cache_key = None
        if runtime.cache_manager:
            cache_key = runtime.cache_manager.generate_key(
                request.query,
                request.location,
                user_lat=str(request.user_lat),
                user_lng=str(request.user_lng),
                language=response_language
            )
            cached_result = runtime.cache_manager.get(cache_key)
            if cached_result:
                return {
                    **cached_result,
                    "_cache": {
                        "hit": True,
                        "timestamp": datetime.now().isoformat()
                    }
                }
        
        # 2. SEARCH (SerpAPI + RAG hibrit)
        start_time = datetime.now()
        parsed = parse_natural_query(request.query)
        result_limit = min(max(request.limit, 5), 10)
        
        # --- Niyet Kontrolü (Intent Check) ---
        if parsed.get('is_inappropriate'):
            background_tasks.add_task(
                log_to_backend_bg,
                request.query,
                "blocked",
                "none",
                0,
                0,
                "blocked",
                request.user_id
            )
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": localized("inappropriate", response_language),
                "recommendations": [],
                "_cache": {"hit": False}
            }
            
        if parsed.get('is_chit_chat'):
            background_tasks.add_task(
                log_to_backend_bg,
                request.query,
                "chit_chat",
                "none",
                0,
                0,
                "success",
                request.user_id
            )
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": localized("chit_chat", response_language),
                "recommendations": [],
                "_cache": {"hit": False}
            }

        rag_status: Dict[str, Union[str, int, bool, None]] = runtime.rag_bootstrap_status.copy()
        
        # 1. DATABASE SEARCH
        db_search_success = False
        reranked_places: List[Dict] = []
        rag_used_for_results = False
        rag_context = {}
        weather_data = {"condition": "Unknown", "temp": None}

        if settings.DATABASE_URL:
            try:
                print(f"[SmartSearch] Database search starting (query: '{request.query}')...")
                if not rag_status.get("ready"):
                    try:
                        rag_status = await asyncio.to_thread(_bootstrap_rag_index_sync)
                    except Exception:
                        pass

                # Qdrant semantic search
                rag_recommendations = []
                rag_result = None
                rag_analysis = ""
                
                if rag_status.get("ready"):
                    rag_recommendations, rag_result, rag_analysis = await _fetch_rag_results(
                        request.query,
                        request,
                        response_language,
                        rag_status,
                        result_limit * 2,
                        parsed_query=parsed,
                    )

                place_ids_with_scores = []
                if rag_recommendations:
                    for rec in rag_recommendations:
                        pid = rec.get("data_id") or rec.get("id")
                        if pid:
                            place_ids_with_scores.append((int(pid), rec.get("match_score", 1.0)))

                # Keyword SQL fallback
                if not place_ids_with_scores:
                    keywords = [k.strip() for k in request.query.split() if len(k.strip()) > 1]
                    if keywords:
                        where_clauses = []
                        sql_params = []
                        for k in keywords:
                            where_clauses.append("(name LIKE %s OR category LIKE %s OR description LIKE %s)")
                            sql_params.extend([f"%{k}%", f"%{k}%", f"%{k}%"])
                        where_str = " OR ".join(where_clauses)
                        sql = f"SELECT id FROM places WHERE {where_str} LIMIT %s"
                        fallback_rows = execute_query(sql, tuple(sql_params) + (result_limit,))
                        place_ids_with_scores = [(int(r["id"]), 1.0) for r in fallback_rows]

                # Average rating fallback
                if not place_ids_with_scores:
                    sql = "SELECT id FROM places ORDER BY average_rating DESC, user_ratings_total DESC LIMIT %s"
                    fallback_rows = execute_query(sql, (result_limit,))
                    place_ids_with_scores = [(int(r["id"]), 0.5) for r in fallback_rows]

                if place_ids_with_scores:
                    db_places = []
                    seen_ids = set()
                    unique_ids_with_scores = []
                    for pid, score in place_ids_with_scores:
                        if pid not in seen_ids:
                            seen_ids.add(pid)
                            unique_ids_with_scores.append((pid, score))

                    for pid, score in unique_ids_with_scores:
                        p_rows = execute_query("SELECT * FROM places WHERE id = %s", (pid,))
                        if not p_rows:
                            continue
                        row = p_rows[0]

                        r_rows = get_db_reviews(pid)
                        reviews_list = []
                        for r in r_rows:
                            reviews_list.append({
                                "username": r.get("username") or "Anonim",
                                "rating": r.get("rating") or 5,
                                "comment_text": r.get("comment_text") or "",
                                "created_at": str(r.get("created_at") or "")
                            })

                        dist_km = 0.0
                        if request.user_lat and request.user_lng and row.get("latitude") and row.get("longitude"):
                            dist_km = calculate_distance(request.user_lat, request.user_lng, row["latitude"], row["longitude"])
                            dist_km = round(dist_km, 2)

                        gallery = []
                        if row.get("gallery_urls"):
                            try:
                                gallery = json.loads(row["gallery_urls"]) if isinstance(row["gallery_urls"], str) else row["gallery_urls"]
                            except Exception:
                                pass

                        menu = []
                        if row.get("menu_items_json"):
                            try:
                                menu = json.loads(row["menu_items_json"]) if isinstance(row["menu_items_json"], str) else row["menu_items_json"]
                            except Exception:
                                pass

                        hours = {}
                        if row.get("opening_hours_json"):
                            try:
                                hours = json.loads(row["opening_hours_json"]) if isinstance(row["opening_hours_json"], str) else row["opening_hours_json"]
                            except Exception:
                                pass

                        place_dict = {
                            "id": pid,
                            "name": row.get("name") or "",
                            "address": row.get("address") or "",
                            "city": row.get("city") or "",
                            "description": row.get("description") or "",
                            "price_level": int(row.get("price_range") or 2),
                            "category": row.get("category") or "Mekan",
                            "features": row.get("features") or "",
                            "latitude": float(row["latitude"]) if row.get("latitude") is not None else 0.0,
                            "longitude": float(row["longitude"]) if row.get("longitude") is not None else 0.0,
                            "rating": float(row.get("average_rating") or 0.0),
                            "review_count": len(reviews_list) or int(row.get("user_ratings_total") or 0),
                            "photo_url": row.get("photo_url") or "",
                            "video_url": row.get("video_url") or "",
                            "campaign_text": row.get("campaign_text") or "",
                            "opening_time": row.get("opening_time") or "",
                            "closing_time": row.get("closing_time") or "",
                            "opening_hours_json": hours,
                            "is_open": bool(row.get("is_open", True)),
                            "phone_number": row.get("phone_number") or "",
                            "gallery_urls": gallery,
                            "menu_items": menu,
                            "reviews": reviews_list,
                            "data_id": str(pid),
                            "match_score": score,
                            "distance_km": dist_km,
                            "source": "database"
                        }
                        db_places.append(place_dict)

                    def get_sort_key(p):
                        score_val = p.get("match_score", 0.0) * 10.0
                        rating_val = p.get("rating", 0.0)
                        reviews_val = math.log(p.get("review_count", 0) + 1) * 0.1
                        return score_val + rating_val + reviews_val

                    db_places.sort(key=get_sort_key, reverse=True)
                    reranked_places = db_places[:result_limit]
                    rag_used_for_results = True

                rag_context = _build_rag_context(
                    rag_status,
                    rag_result,
                    rag_used_for_results or bool(rag_recommendations)
                )

                db_search_success = True
                print(f"[SmartSearch] Database search success: {len(reranked_places)} places found.")
            except Exception as db_err:
                print(f"[SmartSearch] Database search error (falling back to SerpAPI): {db_err}")
                import traceback
                traceback.print_exc()

        # 2. SERPAPI FALLBACK (Run if DB fails or returned no places)
        if not db_search_success or not reranked_places:
            print("[SmartSearch] Falling back to SerpAPI...")
            search_location = parsed['district'] or request.location
            if parsed['features']:
                feature_str = " ".join(parsed['features'])
                search_query = f"{feature_str} {parsed['category']} in {search_location}"
            else:
                search_query = f"{request.query} in {search_location}"

            places: List[Dict] = []
            try:
                from serpapi_client import SerpApiClient
                client = SerpApiClient()
                places = client.search_places(
                    query=search_query,
                    location=f"{search_location}, Turkey",
                    limit=request.limit * 2,
                    lat=request.user_lat,
                    lng=request.user_lng
                )
            except Exception as e:
                print(f"[SerpApi] Kullanılamıyor, RAG fallback denenecek: {e}")

            # Weather
            weather_data = {"condition": "Unknown", "temp": None}
            if request.user_lat and request.user_lng:
                try:
                    weather_codes = {
                        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                        45: "Fog", 48: "Depositing rime fog",
                        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
                        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
                        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
                        95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                    }
                    with httpx.Client(timeout=3.0) as w_client:
                        w_res = w_client.get(
                            f"https://api.open-meteo.com/v1/forecast?latitude={request.user_lat}&longitude={request.user_lng}&current_weather=true"
                        )
                        if w_res.status_code == 200:
                            current = w_res.json().get("current_weather", {})
                            code = current.get("weathercode", -1)
                            weather_data["condition"] = weather_codes.get(code, "Unknown")
                            weather_data["temp"] = current.get("temperature")
                except Exception as e:
                    print(f"[Weather] Hava durumu çekilemedi: {e}")

            time_weather_context = {
                "hour": int(datetime.now().hour),
                "weather": weather_data
            }

            if places:
                filtered_places = [p for p in places if strict_category_match(parsed['category'], p.get('category', ''))]
                if len(filtered_places) < 3:
                    filtered_places = places

                if request.user_lat and request.user_lng:
                    distance_filtered = [
                        p for p in filtered_places
                        if p.get('latitude') and p.get('longitude')
                        and calculate_distance(request.user_lat, request.user_lng, p['latitude'], p['longitude']) <= request.max_distance_km
                    ]
                    if len(distance_filtered) >= 5:
                        filtered_places = distance_filtered

                if parsed.get('want_open_now'):
                    open_places = [p for p in filtered_places if is_place_open(p) is not False]
                    if len(open_places) >= 3:
                        filtered_places = open_places

                budget = parsed.get('budget', 'orta')
                if budget == 'ucuz':
                    budget_filtered = [p for p in filtered_places if p.get('price_level', 2) <= 2]
                    if len(budget_filtered) >= 3:
                        filtered_places = budget_filtered
                elif budget == 'lüks':
                    budget_filtered = [p for p in filtered_places if p.get('price_level', 2) >= 3]
                    if len(budget_filtered) >= 2:
                        filtered_places = budget_filtered

                scored_places = []
                for place in filtered_places:
                    scores = hybrid_score(
                        place,
                        parsed['features'],
                        user_lat=request.user_lat,
                        user_lng=request.user_lng,
                        time_of_day=time_weather_context
                    )
                    distance_km = scores.get("distance_km", 0)
                    if request.max_distance_km and distance_km > 0 and distance_km > request.max_distance_km:
                        continue
                    scored_places.append({
                        **place,
                        "source": "serpapi",
                        "match_score": round(scores["total_score"], 3),
                        "distance_km": distance_km,
                        "score_breakdown": {
                            "feature": round(scores["feature_score"], 3),
                            "distance": round(scores["distance_score"], 3),
                            "popularity": round(scores["popularity_score"], 3),
                            "time": round(scores["time_score"], 3)
                        }
                    })

                scored_places.sort(key=lambda x: x['match_score'], reverse=True)
                reranked_places = rerank_places(
                    scored_places[:min(20, len(scored_places))],
                    request.query,
                    top_k=result_limit
                )

            # RAG fallback
            rag_result: Optional[Dict] = None
            rag_analysis = ""
            rag_used_for_results = False
            rag_recommendations, rag_result, rag_analysis = await _fetch_rag_results(
                request.query,
                request,
                response_language,
                rag_status,
                result_limit,
                parsed_query=parsed,
            )

            if rag_recommendations:
                scored_rag = _score_rag_recommendations(
                    rag_recommendations, parsed, request, time_weather_context
                )
                if not reranked_places:
                    reranked_places = scored_rag[:result_limit]
                    rag_used_for_results = True
                elif len(reranked_places) < result_limit:
                    reranked_places = _merge_recommendations(reranked_places, scored_rag, result_limit)
                    rag_used_for_results = True

            rag_context = _build_rag_context(
                rag_status,
                rag_result,
                rag_used_for_results or bool(rag_recommendations),
            )

            if not reranked_places:
                empty_msg = rag_analysis or localized("no_vector_match", response_language)
                return {
                    "query": request.query,
                    "found": 0,
                    "recommendations": [],
                    "message": empty_msg,
                    "ai_message": empty_msg,
                    "source": "RAG" if rag_status.get("ready") else "none",
                    "hybrid_mode": False,
                    "rag_enhanced": False,
                    "rag_source_count": rag_status.get("source_count", 0),
                    "rag_indexed_count": rag_status.get("indexed_count", 0),
                    "rag_context": rag_context,
                    "context": {
                        "weather": weather_data.get("condition"),
                        "temperature": weather_data.get("temp"),
                        "rag_enhanced": False,
                        "rag_source_count": rag_status.get("source_count", 0),
                        "rag_indexed_count": rag_status.get("indexed_count", 0),
                        "language": response_language,
                    },
                    "_cache": {"hit": False},
                }

        # ==================== YORUM BAZLI INSIGHT ANALİZİ ====================
        # Her mekan için SerpAPI yorumlarını çekip ne ile övüldüğünü tespit et
        if request.analyze_reviews:
            await _enrich_with_review_insights(reranked_places, response_language)
        
        # Gerekçeler
        feature_names = {
            key: labels.get(response_language, labels["tr"])
            for key, labels in FEATURE_LABELS.items()
        }
        
        for place in reranked_places:
            reasons = []
            
            if place.get('rating', 0) >= 4.8:
                reasons.append(f"⭐ {reason_label('high_rating', response_language)} ({place['rating']})")
            
            if place.get('review_count', 0) > 500:
                reasons.append(f"💬 {reason_label('many_reviews', response_language)} ({place['review_count']} {reason_label('reviews', response_language)})")
            
            if place.get('distance_km') and place['distance_km'] > 0:
                if place['distance_km'] <= 2:
                    reasons.append(f"📍 {reason_label('very_near', response_language)} ({place['distance_km']}km)")
                elif place['distance_km'] <= 5:
                    reasons.append(f"📍 {reason_label('near', response_language)} ({place['distance_km']}km)")
            
            if parsed['features']:
                for feature in parsed['features']:
                    if feature in feature_names:
                        reasons.append(feature_names[feature])
            
            if place.get('recommendation_reason_bonus'):
                reasons.append(place['recommendation_reason_bonus'])
            
            # Yorum bazlı insight'ları gerekçeye ekle
            review_insights = place.get('review_insights', {})
            if review_insights and review_insights.get('specialties'):
                top_specs = review_insights['specialties'][:2]
                for spec in top_specs:
                    reasons.insert(0, spec['display'])  # Başa ekle - en önemli bilgi
            
            place['recommendation_reason'] = " • ".join(reasons) if reasons else reason_label("general_fit", response_language)
        
        reranked_places = _sanitize_recommendations(reranked_places)
        if not reranked_places:
            empty_msg = rag_analysis or localized("no_vector_match", response_language)
            return {
                "query": request.query,
                "found": 0,
                "recommendations": [],
                "message": empty_msg,
                "ai_message": empty_msg,
                "source": "RAG" if rag_status.get("ready") else "none",
                "hybrid_mode": False,
                "rag_enhanced": False,
                "rag_source_count": rag_status.get("source_count", 0),
                "rag_indexed_count": rag_status.get("indexed_count", 0),
                "rag_context": rag_context,
                "context": {
                    "weather": weather_data.get("condition"),
                    "temperature": weather_data.get("temp"),
                    "rag_enhanced": False,
                    "rag_source_count": rag_status.get("source_count", 0),
                    "rag_indexed_count": rag_status.get("indexed_count", 0),
                    "language": response_language,
                },
                "_cache": {"hit": False},
            }

        # ==================== GROQ LLM DOĞAL DİL CEVABI (kısa zaman aşımı) ====================
        llm_message = rag_analysis if rag_used_for_results else ""
        if settings.GROQ_API_KEY and reranked_places:
            try:
                llm_message = await asyncio.wait_for(
                    generate_llm_response(
                        request.query, reranked_places, parsed, response_language
                    ),
                    timeout=3.0,
                ) or llm_message
            except asyncio.TimeoutError:
                print("[Groq] LLM zaman aşımı (3s) — özet atlandı")
            except Exception as e:
                print(f"[Groq] LLM atlandı: {e}")

        has_serp = any(p.get("source") == "serpapi" for p in reranked_places)
        has_rag = any(p.get("source") == "rag" for p in reranked_places)
        has_db = any(p.get("source") == "database" for p in reranked_places)

        if has_db:
            if has_rag or rag_status.get("ready"):
                data_source = "Database+RAG"
            else:
                data_source = "Database"
        elif has_serp and has_rag:
            data_source = "SerpAPI+RAG"
        elif has_rag:
            data_source = "RAG (Vector Database)"
        else:
            data_source = "SerpAPI"

        response = {
            "query": request.query,
            "found": len(reranked_places),
            "recommendations": reranked_places,
            "ai_message": llm_message,
            "message": llm_message,
            "source": data_source,
            "hybrid_mode": has_serp and has_rag,
            "rag_enhanced": rag_context.get("rag_enhanced", False),
            "rag_source_count": rag_status.get("source_count", 0),
            "rag_indexed_count": rag_status.get("indexed_count", 0),
            "rag_context": rag_context,
            "context": {
                "weather": weather_data.get("condition"),
                "temperature": weather_data.get("temp"),
                "rag_enhanced": rag_context.get("rag_enhanced", False),
                "rag_source_count": rag_status.get("source_count", 0),
                "rag_indexed_count": rag_status.get("indexed_count", 0),
                "language": response_language
            },
            "_cache": {"hit": False}
        }

        # Cache'e kaydet (Redis varsa)
        if runtime.cache_manager and cache_key:
            runtime.cache_manager.set(cache_key, response)

        elapsed = (datetime.now() - start_time).total_seconds()
        response["_performance"] = {
            "response_time_seconds": round(elapsed, 3),
            "cached": False
        }
        
        latency_ms = int(elapsed * 1000)
        llm_layer = "groq" if settings.GROQ_API_KEY else "gemma_fallback"
        status_str = "success" if reranked_places else "fallback"
        background_tasks.add_task(
            log_to_backend_bg,
            request.query,
            "venue_search",
            llm_layer,
            latency_ms,
            len(reranked_places),
            status_str,
            request.user_id
        )
        
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
