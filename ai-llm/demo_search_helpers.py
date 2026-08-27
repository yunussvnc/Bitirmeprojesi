"""Pure search/scoring helpers extracted from the demo backend."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import math
import asyncio
import hashlib
import json
from datetime import datetime, timedelta
from functools import lru_cache
from dotenv import load_dotenv

def parse_natural_query(query: str):
    """
    Doğal dil sorgusunu anahtar kelimelere çevir
    
    Örnek: "deniz gören wifisi olan güzel bir cafe" ->
    {
        "category": "cafe",
        "features": ["deniz", "wifi", "manzara"],
        "vibe": "güzel"
    }
    """
    query_lower = query.lower()
    
    # Kategori tespiti
    categories = {
        "kafe": ["kafe", "cafe", "kahve", "coffee"],
        "restoran": ["restoran", "restaurant", "yemek", "lokanta"],
        "bar": ["bar", "pub", "meyhane", "içki"],
        "kütüphane": ["kütüphane", "library"],
    }
    
    detected_category = "cafe"  # varsayılan
    for cat, keywords in categories.items():
        if any(kw in query_lower for kw in keywords):
            detected_category = cat
            break
    
    # Özellik tespiti
    features = []
    feature_map = {
        "wifi": ["wifi", "wi-fi", "internet"],
        "deniz": ["deniz", "boğaz", "sahil", "kıyı", "manzara"],
        "sessiz": ["sessiz", "sakin", "huzurlu", "quiet"],
        "canlı": ["canlı", "eğlence", "müzik"],
        "açık": ["açık hava", "bahçe", "teras", "outdoor"],
        "çalışma": ["çalışma", "ders", "study", "work"],
    }
    
    for feature, keywords in feature_map.items():
        if any(kw in query_lower for kw in keywords):
            features.append(feature)
    
    # Bölge tespiti
    istanbul_districts = [
        "kadıköy", "beşiktaş", "şişli", "beyoğlu", "üsküdar",
        "bebek", "ortaköy", "moda", "caddebostan", "karaköy"
    ]
    
    detected_district = None
    for district in istanbul_districts:
        if district in query_lower:
            detected_district = district.title()
            break
    
    return {
        "category": detected_category,
        "features": features,
        "district": detected_district,
        "original_query": query
    }


def score_place(place: dict, required_features: list) -> float:
    """
    Mekanı istenen özelliklere göre puanla
    
    Args:
        place: Mekan verisi
        required_features: İstenen özellikler listesi
    
    Returns:
        Puan (0.0 - 1.0)
    """
    score = 0.0
    
    # Temel puan: Rating
    if place.get('rating'):
        score += place['rating'] / 5.0 * 0.3  # %30 ağırlık
    
    # Yorum sayısı (popülerlik)
    review_count = place.get('review_count', 0)
    if review_count > 100:
        score += 0.2
    elif review_count > 50:
        score += 0.15
    elif review_count > 10:
        score += 0.1
    
    # Özellik eşleşmesi
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    
    feature_keywords = {
        "wifi": ["wifi", "wi-fi", "internet"],
        "deniz": ["deniz", "sea", "ocean", "sahil", "beach", "boğaz", "bosphorus"],
        "sessiz": ["quiet", "sessiz", "sakin", "peaceful"],
        "açık": ["outdoor", "açık", "garden", "bahçe", "teras", "terrace"],
        "çalışma": ["work", "study", "çalışma", "workspace"],
    }
    
    matched_features = 0
    for feature in required_features:
        if feature in feature_keywords:
            keywords = feature_keywords[feature]
            if any(kw in place_desc for kw in keywords):
                matched_features += 1
    
    # Her eşleşen özellik için bonus
    if required_features:
        feature_score = (matched_features / len(required_features)) * 0.4
        score += feature_score
    
    # Fotoğraf varsa bonus
    if place.get('photo_url'):
        score += 0.05
    
    return min(score, 1.0)


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    İki nokta arası mesafe (Haversine formülü)
    
    Returns:
        Mesafe (km)
    """
    R = 6371  # Dünya yarıçapı (km)
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def hybrid_score(
    place: dict, 
    required_features: list,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    time_of_day: Optional[str] = None
) -> Dict:
    """
    Hibrit skorlama: Özellik + Mesafe + Zaman + Popülerlik
    
    Returns:
        {
            "total_score": float,
            "feature_score": float,
            "distance_score": float,
            "popularity_score": float,
            "time_score": float,
            "distance_km": float
        }
    """
    scores = {
        "feature_score": 0.0,
        "distance_score": 0.0,
        "popularity_score": 0.0,
        "time_score": 1.0,
        "distance_km": None
    }
    
    # 1. Özellik skoru (40%)
    feature_score = score_place(place, required_features)
    scores["feature_score"] = feature_score * 0.4
    
    # 2. Mesafe skoru (30%)
    if user_lat and user_lng and place.get('latitude') and place.get('longitude'):
        distance = calculate_distance(
            user_lat, user_lng,
            place['latitude'], place['longitude']
        )
        scores["distance_km"] = round(distance, 2)
        
        # Mesafe skoru: 0-2km: 1.0, 2-5km: 0.8, 5-10km: 0.5, >10km: 0.2
        if distance <= 2:
            dist_score = 1.0
        elif distance <= 5:
            dist_score = 0.8
        elif distance <= 10:
            dist_score = 0.5
        else:
            dist_score = 0.2
        
        scores["distance_score"] = dist_score * 0.3
    
    # 3. Popülerlik skoru (20%)
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
    
    # 4. Zaman skoru (10%)
    if time_of_day:
        hour = int(datetime.now().hour)
        
        # Sabah (6-11): Kahvaltı mekanları bonus
        # Öğle (11-15): Restoran bonus
        # Akşam (18-23): Bar/Restaurant bonus
        
        category = place.get('category', '').lower()
        
        if 6 <= hour < 11 and ('cafe' in category or 'kahve' in category):
            scores["time_score"] = 1.2
        elif 11 <= hour < 15 and 'restaurant' in category:
            scores["time_score"] = 1.2
        elif 18 <= hour <= 23 and ('bar' in category or 'restaurant' in category):
            scores["time_score"] = 1.2
    
    scores["time_score"] *= 0.1
    
    # Toplam skor
    scores["total_score"] = min(
        scores["feature_score"] + 
        scores["distance_score"] + 
        scores["popularity_score"] + 
        scores["time_score"],
        1.0
    )
    
    return scores


def strict_category_match(user_category: str, place_category: str) -> bool:
    """
    Sıkı kategori eşleştirme + alt kategori desteği
    
    Args:
        user_category: Kullanıcının istediği kategori
        place_category: Mekanın kategorisi
    
    Returns:
        bool: Eşleşiyor mu?
    """
    user_cat = user_category.lower()
    place_cat = place_category.lower()
    
    # Alt kategori haritası
    category_synonyms = {
        'kafe': ['cafe', 'coffee', 'kahve', 'kafeterya', 'kahvehane', 'coffee shop'],
        'restoran': ['restaurant', 'restoran', 'yemek', 'lokanta', 'dining'],
        'bar': ['bar', 'pub', 'meyhane', 'tavern', 'lounge'],
        'kütüphane': ['library', 'kütüphane', 'kitap'],
        'fast food': ['fast food', 'burger', 'pizza', 'sandwich'],
    }
    
    # Direkt eşleşme
    if user_cat in place_cat or place_cat in user_cat:
        return True
    
    # Sinonim kontrolü
    for main_cat, synonyms in category_synonyms.items():
        if user_cat in synonyms:
            return any(syn in place_cat for syn in synonyms)
    
    return False


def rerank_places(places: List[dict], query: str, top_k: int = 5) -> List[dict]:
    """
    İlk aramadan gelen mekanları yeniden sırala
    
    1. İlk arama: Geniş (Top-50)
    2. Reranking: Daha detaylı skorlama ile en iyi top_k'yi seç
    
    Args:
        places: Mekan listesi
        query: Kullanıcı sorgusu
        top_k: Kaç mekan döndürülecek
    
    Returns:
        En iyi top_k mekan
    """
    # Query'den önemli kelimeleri çıkar
    important_words = []
    query_lower = query.lower()
    
    importance_keywords = {
        'high': ['romantik', 'özel', 'lüks', 'premium', 'deniz', 'manzara'],
        'medium': ['sessiz', 'sakin', 'güzel', 'temiz', 'nezih'],
        'low': ['uygun', 'ucuz', 'hızlı']
    }
    
    for priority, keywords in importance_keywords.items():
        for keyword in keywords:
            if keyword in query_lower:
                important_words.append((keyword, priority))
    
    # Reranking skoru
    reranked = []
    for place in places:
        base_score = place.get('match_score', 0.5)
        
        # İsim ve açıklama matching
        place_text = (place.get('name', '') + ' ' + place.get('description', '')).lower()
        
        bonus = 0.0
        for word, priority in important_words:
            if word in place_text:
                if priority == 'high':
                    bonus += 0.15
                elif priority == 'medium':
                    bonus += 0.10
                else:
                    bonus += 0.05
        
        # Fotoğraf bonusu
        if place.get('photo_url'):
            bonus += 0.05
        
        final_score = min(base_score + bonus, 1.0)
        
        reranked.append({
            **place,
            'rerank_score': round(final_score, 3)
        })
    
    # Sırala
    reranked.sort(key=lambda x: x['rerank_score'], reverse=True)
    
    return reranked[:top_k]
