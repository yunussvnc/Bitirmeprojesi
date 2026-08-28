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
from app_infrastructure import _get_rag_pipeline
from app_state import runtime, logger, redis_url, redis_ttl
from app_models import SmartSearchRequest

async def analyze_image_with_llama(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Groq Llama-4-Scout (multimodal) ile gorseli analiz et.
    Ekstra API key gerektirmez — mevcut GROQ_API_KEY kullanilir.
    Doner: { query: str, category: str, keywords: list[str], description: str }
    """
    import re

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        return {
            "query": "kafe",
            "category": "kafe",
            "keywords": ["kafe"],
            "description": "GROQ_API_KEY eksik",
            "error": "no_key"
        }

    # base64 prefix temizle ve data URL olustur
    if "base64," in image_base64:
        image_base64 = image_base64.split("base64,")[1]

    data_url = f"data:{mime_type};base64,{image_base64}"

    prompt = (
        "Bu gorseli analiz et. Istanbul'da hangi tur mekan aranmali?\n"
        "Asagidaki JSON formatinda dondef (baska hicbir sey yazma):\n"
        '{"query":"turkce_arama_sorgusu","category":"kafe|restoran|bar|diger",'
        '"keywords":["kelime1","kelime2"],"description":"ne gordun"}\n\n'
        "Ornekler:\n"
        '- Kahve fincani -> {"query":"espresso latte sicak kahve","category":"kafe","keywords":["kahve","sicak"],"description":"Kahve fincani"}\n'
        '- Hamburger    -> {"query":"hamburger lezzetli fast food","category":"restoran","keywords":["hamburger"],"description":"Hamburger"}\n'
        '- Deniz manzarasi -> {"query":"deniz manzarali teras restorani","category":"restoran","keywords":["deniz","manzara"],"description":"Deniz manzarasi"}\n'
        '- Kokteyl, bar -> {"query":"kokteyl bar gece hayati","category":"bar","keywords":["alkol","bar"],"description":"Kokteyl icecek"}'
    )

    body = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_url}}
            ]
        }],
        "max_tokens": 200,
        "temperature": 0.1
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
            )

        if r.status_code != 200:
            print(f"[LlamaVision] Hata {r.status_code}: {r.text[:200]}")
            return {"query": "kafe", "category": "kafe", "keywords": [], "description": "Analiz basarisiz"}

        text = r.json()["choices"][0]["message"]["content"].strip()
        print(f"[LlamaVision] Ham yanit: {text[:200]}")

        json_match = re.search(r'\{[\s\S]+?\}', text)
        if json_match:
            result = json.loads(json_match.group())
            print(f"[LlamaVision] Gorsel analiz: {result}")
            return result

        return {"query": text[:80], "category": "kafe", "keywords": [], "description": text}

    except Exception as e:
        print(f"[LlamaVision] Hata: {e}")
        return {"query": "mekan", "category": "kafe", "keywords": [], "description": str(e)}


def parse_natural_query(query: str) -> Dict:
    """Doğal dil sorgusunu parse et"""
    query_lower = query.lower()
    
    # Kategori algılama
    categories = {
        'kafe': ['kafe', 'kahve', 'coffee', 'cafe'],
        'restoran': ['restoran', 'restaurant', 'yemek', 'lokanta', 'restorant', 'kebap', 'et', 'balık'],
        'bar': ['bar', 'drink', 'pub', 'meyhane', 'içki', 'bira', 'şarap', 'gece', 'night'],
        'tatlı': ['tatlı', 'pasta', 'dessert', 'tatli', 'baklava'],
        'pizza': ['pizza'],
        'burger': ['burger', 'hamburger', 'fast food', 'fastfood'],
    }
    
    detected_category = 'kafe'  # default
    for category, keywords in categories.items():
        if any(kw in query_lower for kw in keywords):
            detected_category = category
            break
    
    # Bölge algılama (İstanbul'un tüm ilçeleri ve alternatif yazılımları)
    district_map = {
        'adalar': 'Adalar', 'arnavutköy': 'Arnavutköy', 'arnavutkoy': 'Arnavutköy',
        'ataşehir': 'Ataşehir', 'atasehir': 'Ataşehir', 'avcılar': 'Avcılar', 'avcilar': 'Avcılar',
        'bağcılar': 'Bağcılar', 'bagcilar': 'Bağcılar', 'bahçelievler': 'Bahçelievler', 'bahcelievler': 'Bahçelievler',
        'bakırköy': 'Bakırköy', 'bakirkoy': 'Bakırköy', 'başakşehir': 'Başakşehir', 'basaksehir': 'Başakşehir',
        'bayrampaşa': 'Bayrampaşa', 'bayrampasa': 'Bayrampaşa', 'beşiktaş': 'Beşiktaş', 'besiktas': 'Beşiktaş',
        'beykoz': 'Beykoz', 'beylikdüzü': 'Beylikdüzü', 'beylikduzu': 'Beylikdüzü',
        'beyoğlu': 'Beyoğlu', 'beyoglu': 'Beyoğlu', 'büyükçekmece': 'Büyükçekmece', 'buyukcekmece': 'Büyükçekmece',
        'çatalca': 'Çatalca', 'catalca': 'Çatalca', 'çekmeköy': 'Çekmeköy', 'cekmekoy': 'Çekmeköy',
        'esenler': 'Esenler', 'esenyurt': 'Esenyurt', 'eyüp': 'Eyüpsultan', 'eyup': 'Eyüpsultan', 
        'eyüpsultan': 'Eyüpsultan', 'eyupsultan': 'Eyüpsultan', 'fatih': 'Fatih',
        'gaziosmanpaşa': 'Gaziosmanpaşa', 'gaziosmanpasa': 'Gaziosmanpaşa', 'güngören': 'Güngören', 'gungoren': 'Güngören',
        'kadıköy': 'Kadıköy', 'kadikoy': 'Kadıköy', 'kağıthane': 'Kağıthane', 'kagithane': 'Kağıthane',
        'kartal': 'Kartal', 'küçükçekmece': 'Küçükçekmece', 'kucukcekmece': 'Küçükçekmece',
        'maltepe': 'Maltepe', 'pendik': 'Pendik', 'sancaktepe': 'Sancaktepe',
        'sarıyer': 'Sarıyer', 'sariyer': 'Sarıyer', 'silivri': 'Silivri', 'sultanbeyli': 'Sultanbeyli',
        'sultangazi': 'Sultangazi', 'şile': 'Şile', 'sile': 'Şile', 'şişli': 'Şişli', 'sisli': 'Şişli',
        'tuzla': 'Tuzla', 'ümraniye': 'Ümraniye', 'umraniye': 'Ümraniye',
        'üsküdar': 'Üsküdar', 'uskudar': 'Üsküdar', 'zeytinburnu': 'Zeytinburnu',
        'eminönü': 'Eminönü', 'eminonu': 'Eminönü' # Sık aranan ilçe dışı semt
    }
    
    detected_district = None
    for key, proper_name in district_map.items():
        if key in query_lower:
            detected_district = proper_name
            break
    
    # Özellik algılama
    features = []
    feature_keywords = {
        'wifi': ['wifi', 'wi-fi', 'internet', 'bağlantı'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view', 'boğaz', 'göl'],
        'sessiz': ['quiet', 'sessiz', 'sakin', 'peaceful', 'huzurlu', 'tenha'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras', 'balkon', 'dış mekan'],
        'çalışma': ['work', 'study', 'çalışma', 'workspace', 'laptop', 'uzaktan'],
        'aile': ['aile', 'aileyle', 'çocuk', 'family', 'bebek', 'aile dostu'],
        'evcil': ['evcil', 'köpek', 'pet friendly', 'hayvan'],
        'park': ['park', 'otopark', 'park yeri'],
    }
    
    for feature, keywords in feature_keywords.items():
        if any(kw in query_lower for kw in keywords):
            features.append(feature)
    
    # ===================== GELİŞTİRİLMİŞ TÜRKÇE NLP =====================
    
    # 1. DUYGU / RUH HALİ ALGILAMA
    mood_map = {
        'yorgun':    ['yorgun', 'yoruğum', 'bitik', 'dinlenmek', 'dinginlik', 'stresliyim'],
        'mutlu':     ['mutlu', 'kutlama', 'kutlamak', 'eğlence', 'eğlenmek', 'parti'],
        'romantik':  ['romantik', 'sevgili', 'sevgilimle', 'kız arkadaşımla', 'kız arkadaşım', 'erkek arkadaşımla', 'erkek arkadaşım', 'özel gün', 'yıldönümü', 'evlilik teklifi', 'aşk'],
        'çalışma':  ['müşteri toplantısı', 'iş toplantısı', 'proje', 'online toplantı'],
        'kahvaltı': ['sabah', 'kahvaltı', 'uyandım', 'kahvaltıya', 'serpme'],
    }
    detected_mood = None
    for mood, keywords in mood_map.items():
        if any(kw in query_lower for kw in keywords):
            detected_mood = mood
            if mood == 'yorgun' and 'sessiz' not in features:
                features.append('sessiz')  # Yorgun → sessiz yer ekle
            if mood == 'romantik' and 'açık' not in features:
                features.append('manzara')  # Romantik → manzara tercih et
            break
    
    # 2. GRUP TİPİ ALGILAMA
    group_type = 'bireysel'
    group_keywords = {
        'aile':       ['aileyle', 'aile olarak', 'çocuklar', 'aileçe', 'anne baba'],
        'arkadaş':   ['arkadaşlarla', 'grup halinde', 'ekip'],
        'iş':         ['iş yemeği', 'meslektaş', 'patron', 'toplantı sonrası'],
        'sevgili':    ['sevgilimle', 'sevgiliye', 'çift olarak', 'romantik', 'kız arkadaşımla', 'kız arkadaşım', 'erkek arkadaşımla', 'erkek arkadaşım'],
        'kalabalık': ['kalabalık grup', '10 kişi', 'organizasyon', 'toplantı']
    }
    for gtype, keywords in group_keywords.items():
        if any(kw in query_lower for kw in keywords):
            group_type = gtype
            if gtype == 'aile' and 'aile' not in features:
                features.append('aile')
            break
    
    # 3. BÜÜ ALGILAMA
    budget = 'orta'  # varsayılan
    if any(kw in query_lower for kw in ['ucuz', 'ekonomik', 'uygun fiyat', 'bütçem kısıtlı', 'hesaplı']):
        budget = 'ucuz'
    elif any(kw in query_lower for kw in ['lüks', 'premium', 'özel', 'pahalı olsun', 'en iyi']):
        budget = 'lüks'
    
    # 4. ŞU AN AÇIK MI ALGILAMA
    want_open_now = any(kw in query_lower for kw in [
        'şu an açık', 'açık mı', 'gece', 'gece yarısı', 'geç saatte', "şu an", 'hemen'
    ])
    
    # --- Niyet ve Sohbet Tespiti (Intent Classification) ---
    is_chit_chat = False
    is_inappropriate = False
    
    # 1. Yasaklı/Alakasız Konular (Siyaset, Din, Küfür vb.)
    inappropriate_keywords = ['siyaset', 'din', 'küfür', 'argo', 'kavga', 'seçim', 'oy', 'başkan']
    import re
    words = set(re.findall(r'\w+', query_lower, flags=re.UNICODE))
    if any(kw in words for kw in inappropriate_keywords):
        is_inappropriate = True
        
    # 2. Günlük Sohbet (Chit-chat) Tespiti
    chit_chat_keywords = ['merhaba', 'selam', 'nasılsın', 'naber', 'iyi misin', 'hey', 'günaydın', 'iyi akşamlar']
    
    # Eğer cümle çok kısaysa VE chit_chat kelimelerinden biriyse
    if len(query_lower.split()) <= 3 and any(query_lower.startswith(kw) or query_lower == kw for kw in chit_chat_keywords):
        is_chit_chat = True
        
    # Eğer cümlede hiç mekan kelimesi veya özelliği geçmiyorsa ve chit-chat ise
    mekan_anlami = detected_category != 'kafe' or any(kw in query_lower for kw in ['kafe', 'kahve', 'mekan', 'yer', 'restoran', 'yemek'])
    if not mekan_anlami and any(kw in query_lower for kw in chit_chat_keywords):
        is_chit_chat = True
    
    return {
        'category': detected_category,
        'district': detected_district,
        'features': features,
        'mood': detected_mood,
        'group_type': group_type,
        'budget': budget,
        'want_open_now': want_open_now,
        'is_chit_chat': is_chit_chat,
        'is_inappropriate': is_inappropriate
    }


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """İki nokta arası mesafe (Haversine formülü)"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def is_place_open(place: Dict) -> Optional[bool]:
    """
    SerpAPI'dan gelen mekan verisindeki çalışma saatlerini parse eder.
    
    Returns:
        True  → kesinlikle açık
        False → kesinlikle kapalı
        None  → bilinmiyor (bilgi yok)
    """
    hours_raw = place.get('hours') or place.get('opening_hours') or place.get('open_state')
    
    if not hours_raw:
        return None
    
    hours_str = str(hours_raw).lower()
    
    # Açık sinyalleri
    if any(kw in hours_str for kw in ['open now', 'şu an açık', 'opens soon']):
        return True
    if 'open' in hours_str and 'closed' not in hours_str:
        return True
    
    # Kapalı sinyalleri
    if any(kw in hours_str for kw in ['closed', 'kapalı']):
        return False
    
    # Saat aralığı parse et (örn: "08:00-22:00")
    import re
    time_match = re.search(r'(\d{1,2})[:\.]?(\d{2})\s*[-–]\s*(\d{1,2})[:\.]?(\d{2})', hours_str)
    if time_match:
        try:
            open_h, open_m = int(time_match.group(1)), int(time_match.group(2))
            close_h, close_m = int(time_match.group(3)), int(time_match.group(4))
            now = datetime.now()
            current_minutes = now.hour * 60 + now.minute
            open_minutes = open_h * 60 + open_m
            close_minutes = close_h * 60 + close_m
            
            if close_minutes < open_minutes:  # Gece yarısını geçiyor
                return current_minutes >= open_minutes or current_minutes < close_minutes
            return open_minutes <= current_minutes < close_minutes
        except Exception:
            pass
    
    return None  # Parse edilemedi


def hybrid_score(place: Dict, features: List[str], user_lat=None, user_lng=None, time_of_day=None) -> Dict[str, float]:
    """Hibrit skorlama (feature + distance + popularity + time)"""
    scores: Dict[str, float] = {
        "feature_score": 0.0,
        "distance_score": 0.0,
        "popularity_score": 0.0,
        "time_score": 0.0,
        "total_score": 0.0,
        "distance_km": 0.0
    }
    
    # 1. Feature matching (%35)
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    feature_keywords = {
        'wifi': ['wifi', 'wi-fi', 'internet'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view'],
        'sessiz': ['quiet', 'sessiz', 'sakin'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras'],
        'çalışma': ['work', 'study', 'çalışma'],
    }
    
    matched: int = 0
    for feature in features:
        if feature in feature_keywords:
            if any(kw in place_desc for kw in feature_keywords[feature]):
                matched += 1  # type: ignore[operator]
    
    if features:
        scores["feature_score"] = float(matched / len(features)) * 0.35
    
    # 2. Distance score (%30)
    if user_lat and user_lng and place.get('latitude') and place.get('longitude'):
        dist = calculate_distance(user_lat, user_lng, place['latitude'], place['longitude'])
        scores["distance_km"] = float(round(dist, 2))  # type: ignore[call-overload]
        
        if dist <= 1:
            dist_score = 1.0
        elif dist <= 3:
            dist_score = 0.8
        elif dist <= 5:
            dist_score = 0.5
        else:
            dist_score = 0.2
        
        scores["distance_score"] = dist_score * 0.3
    
    # 3. Popularity (%20)
    rating: float = float(place.get('rating', 0) or 0)
    review_count: int = int(place.get('review_count', 0) or 0)
    
    rating_score = (rating / 5.0) * 0.5
    
    if review_count > 1000:
        review_score = 0.5
    elif review_count > 500:
        review_score = 0.4
    elif review_count > 100:
        review_score = 0.3
    elif review_count > 50:
        review_score = 0.2
    else:
        review_score = 0.1
    
    scores["popularity_score"] = (rating_score + review_score) * 0.2
    
    # 4. Time & Weather Intelligence (%10)
    time_score_val = 0.0
    weather_condition = "Unknown"
    
    if isinstance(time_of_day, dict):
        hour = time_of_day.get('hour', int(datetime.now().hour))
        weather = time_of_day.get('weather', {})
        weather_condition = weather.get('condition', 'Unknown').lower()
    else:
        hour = int(datetime.now().hour)
        
    category = place.get('category', '').lower()
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    
    # --- Saat Zekası ---
    if 6 <= hour < 11 and ('cafe' in category or 'kahve' in category or 'fırın' in category):
        time_score_val += 0.05
    elif 11 <= hour < 15 and 'restaurant' in category:
        time_score_val += 0.05
    elif 18 <= hour <= 23 and ('bar' in category or 'restaurant' in category or 'pub' in category):
        time_score_val += 0.08
    elif hour >= 23 or hour < 6:
        if 'bar' in category or 'pub' in category or 'gece' in place_desc:
            time_score_val += 0.10
        elif 'cafe' in category:
            time_score_val -= 0.10
            
    # --- Hava Durumu Zekası ---
    is_outdoor = any(kw in place_desc for kw in ['açık', 'bahçe', 'teras', 'outdoor', 'sahil', 'deniz'])
    
    if 'rain' in weather_condition or 'snow' in weather_condition or 'storm' in weather_condition:
        if is_outdoor:
            time_score_val -= 0.15
        else:
            time_score_val += 0.05
            
    elif 'clear' in weather_condition or 'sun' in weather_condition:
        if is_outdoor:
            time_score_val += 0.10
            
    scores["time_score"] = max(min(time_score_val, 0.10), -0.15)
    
    # 5. Review AI Sentiment (%15)
    review_score_val = 0.0
    user_review = place.get('user_review', '')
    if user_review:
        sentiment_bonus = runtime.model_manager.analyze_review_sentiment(user_review)
        if sentiment_bonus > 0.05:
            review_score_val = 0.15
        elif sentiment_bonus < -0.05:
            review_score_val = -0.15
        else:
            review_score_val = 0.05
    
    scores["review_ai_score"] = review_score_val
    
    # Tüm skorları topla
    scores["total_score"] = float(min(
        max(
            scores["feature_score"] +
            scores["distance_score"] +
            scores["popularity_score"] +
            scores["time_score"] +
            scores.get("review_ai_score", 0.0),
            0.0
        ),
        1.0
    ))
    
    return scores


def strict_category_match(user_category: str, place_category: str) -> bool:
    """Sıkı kategori eşleştirme"""
    user_cat = user_category.lower()
    place_cat = place_category.lower()
    
    category_synonyms = {
        'kafe': ['cafe', 'coffee', 'kahve', 'kahvehane', 'coffeehouse', 'coffee shop'],
        'restoran': ['restaurant', 'restoran', 'food', 'lokanta', 'restorant', 'yemek', 'kebap', 'steakhouse'],
        'bar': ['bar', 'pub', 'drink', 'meyhane', 'night club', 'lounge'],
        'burger': ['burger', 'hamburger', 'fast food'],
    }
    
    if user_cat in category_synonyms:
        synonyms = category_synonyms[user_cat]
        return any(syn in place_cat for syn in synonyms)
    
    return user_cat in place_cat


def rerank_places(places: List[Dict], query: str, top_k: int = 5) -> List[Dict]:
    """Reranking algoritması - importance keywords ile"""
    importance_keywords = set(query.lower().split())
    importance_keywords.discard('ve')
    importance_keywords.discard('bir')
    importance_keywords.discard('için')
    
    reranked = []
    
    for place in places:
        base_score = place.get('match_score', 0)
        bonus = 0
        
        place_text = (place.get('name', '') + ' ' + place.get('description', '')).lower()
        
        premium_words = ['muhteşem', 'premium', 'özel', 'lüks', 'manzara', 'güzel', 'harika']
        for word in premium_words:
            if word in query.lower() and word in place_text:
                bonus += 0.05
        
        final_score = min(base_score + bonus, 1.0)
        
        reranked.append({
            **place,
            'rerank_score': round(final_score, 3)
        })
    
    reranked.sort(key=lambda x: x['rerank_score'], reverse=True)
    
    return reranked[:top_k]  # type: ignore[return-value]


def _normalize_place_name(name: Optional[str]) -> str:
    """Birleştirme için mekan adını normalize et."""
    if not name:
        return ""
    return re.sub(r"\s+", " ", name.strip().lower())


def _is_complete_recommendation(place: Dict) -> bool:
    """Mobil PlaceCard için eksik Groq/RAG kartlarını eler."""
    name = (place.get("name") or "").strip()
    if len(name) < 2:
        return False
    try:
        lat = float(place.get("latitude") if place.get("latitude") is not None else 0)
        lng = float(place.get("longitude") if place.get("longitude") is not None else 0)
    except (TypeError, ValueError):
        return False
    if abs(lat) < 0.0001 and abs(lng) < 0.0001:
        return False
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return False
    category = (place.get("category") or "").strip()
    address = (place.get("address") or "").strip()
    if not category and not address:
        return False
    return True


def _sanitize_recommendations(places: List[Dict]) -> List[Dict]:
    return [p for p in places if _is_complete_recommendation(p)]


def _rag_oneri_to_recommendation(oneri: Dict) -> Dict:
    """RAG onerisini smart-search-v2 / mobil Place formatına çevir."""
    mekan_id = oneri.get("mekan_id") or oneri.get("id")
    similarity = float(oneri.get("benzerlik_skoru", 0) or 0)
    reason = oneri.get("gerekce") or f"RAG benzerlik: {similarity:.2f}"
    return {
        "name": oneri.get("ad") or "",
        "address": oneri.get("adres") or "",
        "latitude": float(oneri.get("enlem") or 0),
        "longitude": float(oneri.get("boylam") or 0),
        "rating": float(oneri.get("rating") or 0),
        "review_count": int(oneri.get("review_count") or 0),
        "price_level": int(oneri.get("price_level") or 2),
        "category": oneri.get("kategori") or "Mekan",
        "description": oneri.get("aciklama") or "",
        "photo_url": oneri.get("photo_url"),
        "data_id": str(mekan_id) if mekan_id is not None else "",
        "match_score": round(similarity, 3),
        "rerank_score": round(similarity, 3),
        "recommendation_reason": reason,
        "source": "rag",
    }


def _build_rag_context(
    rag_status: Dict[str, Union[str, int, bool, None]],
    rag_result: Optional[Dict],
    used_for_results: bool,
) -> Dict:
    """Mobil uyumlu RAG metadata."""
    oneriler = (rag_result or {}).get("oneriler") or []
    return {
        "rag_enhanced": used_for_results and len(oneriler) > 0,
        "rag_source_count": rag_status.get("source_count", 0),
        "rag_indexed_count": rag_status.get("indexed_count", 0),
        "storage_mode": rag_status.get("storage_mode"),
        "similar_places_count": len(oneriler),
        "analysis": (rag_result or {}).get("sorgu_analizi", ""),
        "top_matches": [
            {
                "name": place.get("ad"),
                "category": place.get("kategori"),
                "score": place.get("benzerlik_skoru", 0),
            }
            for place in oneriler[:3]
        ],
    }


def _merge_recommendations(
    primary: List[Dict],
    supplemental: List[Dict],
    limit: int,
) -> List[Dict]:
    """SerpAPI sonuçlarını koruyup RAG ile eksikleri tamamla (isim bazlı dedupe)."""
    merged = list(primary)
    seen = {_normalize_place_name(p.get("name")) for p in merged if p.get("name")}
    for place in supplemental:
        if len(merged) >= limit:
            break
        key = _normalize_place_name(place.get("name"))
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        merged.append(place)
    return merged[:limit]


def _score_rag_recommendations(
    places: List[Dict],
    parsed: Dict,
    request: "SmartSearchRequest",
    time_weather_context: Optional[Dict] = None,
) -> List[Dict]:
    """RAG mekanlarına hibrit skor ve mesafe filtresi uygula."""
    scored: List[Dict] = []
    for place in places:
        scores = hybrid_score(
            place,
            parsed.get("features", []),
            user_lat=request.user_lat,
            user_lng=request.user_lng,
            time_of_day=time_weather_context,
        )
        distance_km = scores.get("distance_km", 0)
        if request.max_distance_km and distance_km > 0 and distance_km > request.max_distance_km:
            continue
        rag_score = float(place.get("rerank_score") or place.get("match_score") or 0)
        total = min(max(scores["total_score"] * 0.6 + rag_score * 0.4, 0.0), 1.0)
        scored.append({
            **place,
            "match_score": round(total, 3),
            "rerank_score": round(total, 3),
            "distance_km": distance_km,
            "score_breakdown": {
                "feature": round(scores["feature_score"], 3),
                "distance": round(scores["distance_score"], 3),
                "popularity": round(scores["popularity_score"], 3),
                "time": round(scores["time_score"], 3),
                "rag_similarity": round(rag_score, 3),
            },
        })
    scored.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)
    return scored


async def _fetch_rag_results(
    query: str,
    request: "SmartSearchRequest",
    response_language: str,
    rag_status: Dict[str, Union[str, int, bool, None]],
    limit: int,
    parsed_query: Optional[Dict] = None,
) -> tuple[List[Dict], Optional[Dict], str]:
    """RAG pipeline ile öneri listesi döndür."""
    rag = _get_rag_pipeline()
    if not rag or not rag_status.get("ready"):
        return [], None, ""

    location = None
    if request.user_lat is not None and request.user_lng is not None:
        location = {"lat": request.user_lat, "lng": request.user_lng}

    try:
        rag_result = await asyncio.to_thread(
            rag.process,
            user_query=query,
            location=location,
            language=response_language,
            parsed_query=parsed_query,
            kullanici_id=request.user_id,
        )
    except Exception as e:
        print(f"[RAG] Arama hatası (atlanıyor): {e}")
        return [], None, ""

    if not rag_result or not rag_result.get("oneriler"):
        return [], rag_result, ""

    recommendations = [
        _rag_oneri_to_recommendation(oneri)
        for oneri in rag_result["oneriler"][:limit]
    ]
    return recommendations, rag_result, rag_result.get("sorgu_analizi", "") or ""
