"""Pure search/scoring helpers extracted from the demo backend."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import os
import math
import asyncio
import hashlib
import json
import httpx
from datetime import datetime
import redis
from redis import Redis
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

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
        'wifi': ['wifi', 'wi-fi', 'internet'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view'],
        'sessiz': ['quiet', 'sessiz', 'sakin', 'peaceful'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras'],
        'çalışma': ['work', 'study', 'çalışma', 'workspace'],
    }
    
    for feature, keywords in feature_keywords.items():
        if any(kw in query_lower for kw in keywords):
            features.append(feature)
    
    # --- Niyet ve Sohbet Tespiti (Intent Classification) ---
    is_chit_chat = False
    is_inappropriate = False
    
    # 1. Yasaklı/Alakasız Konular (Siyaset, Din, Küfür vb.)
    inappropriate_keywords = ['siyaset', 'parti', 'din', 'küfür', 'argo', 'kavga', 'seçim', 'oy', 'başkan']
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
        'is_chit_chat': is_chit_chat,
        'is_inappropriate': is_inappropriate
    }


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """İki nokta arası mesafe (Haversine formülü)"""
    R = 6371  # Dünya yarıçapı (km)
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def hybrid_score(place: Dict, features: List[str], user_lat=None, user_lng=None, time_of_day=None) -> Dict[str, Union[int, float]]:
    """Hibrit skorlama (feature + distance + popularity + time)"""
    scores: Dict[str, Union[int, float]] = {
        "feature_score": 0.0,
        "distance_score": 0.0,
        "popularity_score": 0.0,
        "time_score": 0.0,
        "total_score": 0.0,
        "distance_km": 0.0
    }
    
    # 1. Feature matching (%35 - biraz düşürüldü ki yoruma yer açılsın)
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    feature_keywords = {
        'wifi': ['wifi', 'wi-fi', 'internet'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view'],
        'sessiz': ['quiet', 'sessiz', 'sakin'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras'],
        'çalışma': ['work', 'study', 'çalışma'],
    }
    
    matched = 0
    for feature in features:
        if feature in feature_keywords:
            if any(kw in place_desc for kw in feature_keywords[feature]):
                matched += 1
    
    if features:
        scores["feature_score"] = (matched / len(features)) * 0.35
    
    # 2. Distance score (%30)
    if user_lat and user_lng and place.get('latitude') and place.get('longitude'):
        dist = calculate_distance(user_lat, user_lng, place['latitude'], place['longitude'])
        scores["distance_km"] = round(dist, 2)
        
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
    rating = place.get('rating', 0)
    review_count = place.get('review_count', 0)
    
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
        # Eğer sözlük olarak verilmişse (yeni yapı)
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
    elif 18 <= hour <= 23 and ('bar' in category or 'restaurant' in category or 'pub' in category or 'meyhane' in category):
        time_score_val += 0.08
    elif hour >= 23 or hour < 6:
        # Gece yarısı kahveci açık olma ihtimali düşük, pub/bar/gece kulübüne puan ver
        if 'bar' in category or 'pub' in category or 'gece' in place_desc:
            time_score_val += 0.10
        elif 'cafe' in category:
            time_score_val -= 0.10 # Gece kapalı olma riski
            
    # --- Hava Durumu Zekası ---
    is_outdoor = any(kw in place_desc for kw in ['açık', 'bahçe', 'teras', 'outdoor', 'sahil', 'deniz'])
    
    if 'rain' in weather_condition or 'snow' in weather_condition or 'storm' in weather_condition:
        # Yağmurlu/Karlıysa açık alanlara eksi puan, kapalı alanlara artı puan
        if is_outdoor:
            time_score_val -= 0.15
            place['recommendation_reason_bonus'] = "🌧️ Yağmurlu hava uyarısı: Açık alanlı olabilir"
        else:
            time_score_val += 0.05
            place['recommendation_reason_bonus'] = "🌧️ Yağmurlu havaya uygun kapalı mekan"
            
    elif 'clear' in weather_condition or 'sun' in weather_condition:
        # Güneşliyse açık alanlara artı puan
        if is_outdoor:
            time_score_val += 0.10
            place['recommendation_reason_bonus'] = "☀️ Güzel havaya uygun açık alan"
            
    scores["time_score"] = max(min(time_score_val, 0.10), -0.20) # Max %10 eklenti
    
    # 5. Review (Yorum) LLM Duygu Analizi Zekası (%15)
    review_score_val = 0.0
    user_review = place.get('user_review', '')
    if user_review:
        # LLM üzerinden sentiment çıkarıyoruz (embedding tabanlı kosinüs benzerliği)
        sentiment_bonus = model_manager.analyze_review_sentiment(user_review)
        
        # Sadece pozitifleri veya çok negatifleri etki ettir
        if sentiment_bonus > 0.05:
            review_score_val = 0.15 # Max yorum bonusu
            place['recommendation_reason_bonus'] = "✨ Harika müşteri yorumlarına sahip"
        elif sentiment_bonus < -0.05:
            review_score_val = -0.15 # Kötü yorum cezası
            place['recommendation_reason_bonus'] = "⚠️ Müşteri yorumlarında olumsuz referanslar var"
        else:
            review_score_val = 0.05
    
    scores["review_ai_score"] = review_score_val
    
    # Tüm skorları topla
    scores["total_score"] = min(
        max(
            scores["feature_score"] + 
            scores["distance_score"] + 
            scores["popularity_score"] + 
            scores["time_score"] +
            scores.get("review_ai_score", 0.0), 
            0.0
        ),
        1.0
    )
    
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
    
    return reranked[:top_k]
