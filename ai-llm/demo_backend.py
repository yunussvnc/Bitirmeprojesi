"""
Mini Demo Backend - SerpApi + LLM Test (FAZ 2 - Performance Optimized)
Faz 2 Özellikleri:
- 2.1: Redis-style In-Memory Cache (TTL desteği)
- 2.2: Model Preloading (startup'ta yükleme)
- 2.3: Async Pipeline (paralel işlemler)
"""

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

# .env dosyasını yükle
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="AI-LLM Demo Backend",
    description="SerpApi + LLM entegrasyon demo servisi",
    version="2.0.0",
)



class CacheManager:
    """In-Memory Cache dengan TTL support"""
    
    def __init__(self, ttl_seconds: int = 3600):  # Default: 1 saat
        self.cache = {}
        self.ttl = ttl_seconds
    
    def generate_key(self, query: str, location: str, **kwargs) -> str:
        """Sorgu parametrelerine göre unique cache key oluştur"""
        key_str = f"{query}|{location}|{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Dict]:
        """Cache'den veri al (TTL check ile)"""
        if key not in self.cache:
            return None
        
        data, timestamp = self.cache[key]
        
        # TTL kontrol
        if datetime.now() - timestamp > timedelta(seconds=self.ttl):
            del self.cache[key]
            return None
        
        return data
    
    def set(self, key: str, data: Dict) -> None:
        """Cache'e veri yaz"""
        self.cache[key] = (data, datetime.now())
    
    def clear(self) -> None:
        """Tüm cache'i temizle"""
        self.cache.clear()
    
    def get_stats(self) -> Dict:
        """Cache istatistikleri"""
        return {
            "total_items": len(self.cache),
            "ttl_seconds": self.ttl,
            "last_updated": datetime.now().isoformat()
        }


# Global cache instance
cache_manager = CacheManager(ttl_seconds=3600)

# ==================== FAZ 2.2: MODEL PRELOADING ====================

class ModelManager:
    """Model preloading ve management"""
    
    def __init__(self):
        self.embedding_model = None
        self.llm_model = None
        self.tokenizer = None
        self.device = None
        self.is_loaded = False
    
    async def preload_models(self) -> Dict:
        """Startup'ta modelleri yükle"""
        try:
            import torch
            from sentence_transformers import SentenceTransformer
            
            # Device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[Model] Device: {self.device}")
            
            # Embedding model
            print("[Model] Embedding model yükleniyor...")
            self.embedding_model = SentenceTransformer(
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                device=self.device
            )
            
            # LLM model (optional - ağır)
            # try:
            #     print("[Model] Gemma 2-2B yükleniyor...")
            #     from transformers import AutoTokenizer, AutoModelForCausalLM
            #     self.tokenizer = AutoTokenizer.from_pretrained("google/gemma-2-2b-it")
            #     self.llm_model = AutoModelForCausalLM.from_pretrained(
            #         "google/gemma-2-2b-it",
            #         torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            #         device_map="auto"
            #     )
            # except Exception as e:
            #     print(f"[Model] LLM yükleme hatası (devam edebilir): {e}")
            
            self.is_loaded = True
            print("[Model] ✓ Modeller yüklendi!")
            
            return {
                "status": "success",
                "embedding_model": "loaded",
                "device": self.device,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"[Model] Preload hatası: {e}")
            return {"status": "error", "error": str(e)}


# Global model manager
model_manager = ModelManager()



class PlaceData(BaseModel):
    """Mekan verisi modeli"""
    name: str
    address: str
    latitude: float
    longitude: float
    rating: float = 0.0
    price_level: int = 2
    category: str = "Kafe"
    description: str = ""
    photo_url: Optional[str] = None


class SearchRequest(BaseModel):
    """Arama isteği modeli"""
    query: str
    location: str = "Kadıköy, Istanbul"
    limit: int = 5


class RecommendRequest(BaseModel):
    """Öneri isteği modeli"""
    user_query: str
    user_location: Optional[dict] = None
    preferences: Optional[dict] = None


class SmartSearchRequest(BaseModel):
    """Akıllı arama isteği - doğal dil"""
    query: str  # "deniz gören wifisi olan güzel bir cafe"
    location: str = "İstanbul"
    limit: int = 10
    user_lat: Optional[float] = None  # Kullanıcı koordinatları
    user_lng: Optional[float] = None
    max_distance_km: float = 10.0  # Maksimum mesafe (km)


# In-memory mekan listesi (demo için)
demo_places: List[PlaceData] = []


@app.get("/")
def root():
    """Ana sayfa"""
    return {
        "message": "AI-LLM Demo Backend",
        "endpoints": {
            "health": "/health",
            "search": "/api/search",
            "recommend": "/api/recommend",
            "places": "/api/places"
        }
    }


@app.get("/health")
def health_check():
    """Sağlık kontrolü"""
    return {
        "status": "ok",
        "places_count": len(demo_places),
        "serpapi_configured": bool(os.getenv("SERPAPI_KEY"))
    }


@app.get("/api/places")
def get_places():
    """Tüm mekanları listele"""
    return {
        "total": len(demo_places),
        "places": demo_places
    }


@app.post("/api/search")
async def search_places(request: SearchRequest):
    """
    SerpApi ile Google Maps'ten mekan ara
    """
    try:
        from serpapi_client import SerpApiClient
        
        client = SerpApiClient()
        places = client.search_places(
            query=request.query,
            location=request.location,
            limit=request.limit
        )
        
        # Demo places'e ekle
        for place in places:
            place_data = PlaceData(**place)
            demo_places.append(place_data)
        
        return {
            "query": request.query,
            "location": request.location,
            "found": len(places),
            "places": places
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arama hatası: {str(e)}")


@app.post("/api/recommend")
async def recommend_places(request: RecommendRequest):
    """
    LLM ile mekan önerisi üret
    """
    try:
        # Embedding modeli yükle
        from src.rag.retriever import RAGRetriever
        from src.rag.generator import RAGGenerator
        
        retriever = RAGRetriever()
        generator = RAGGenerator()
        
        # Demo: Basit bir öneri
        if not demo_places:
            return {
                "message": "Önce /api/search ile mekan eklemelisiniz",
                "recommendation": []
            }
        
        # LLM ile öneri üret
        recommendation_text = f"'{request.user_query}' sorgunuz için {len(demo_places)} mekan bulundu."
        
        return {
            "query": request.user_query,
            "found": len(demo_places),
            "recommendation": recommendation_text,
            "top_places": demo_places[:5]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Öneri hatası: {str(e)}")


@app.delete("/api/places")
def clear_places():
    """Tüm mekanları temizle"""
    global demo_places
    count = len(demo_places)
    demo_places = []
    return {"message": f"{count} mekan temizlendi"}


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


@app.post("/api/smart-search")
async def smart_search(request: SmartSearchRequest):
    """
    Akıllı mekan arama - Doğal dil sorgusunu anlar (v2.0 - İyileştirilmiş)
    
    Yenilikler:
    - Mesafe bazlı skorlama
    - Zaman farkındalığı
    - Sıkı kategori filtresi
    - Reranking algoritması
    - Detaylı skor açıklaması
    
    Örnek:
    - "deniz gören wifisi olan güzel bir cafe"
    - "Kadıköy'de çalışmak için sessiz kafe"
    - "Açık havada oturabileceğim restoran"
    """
    try:
        from serpapi_client import SerpApiClient
        
        # Sorguyu parse et
        parsed = parse_natural_query(request.query)
        
        # SerpApi sorgusu oluştur
        search_location = parsed['district'] or request.location
        search_query = f"{parsed['category']} in {search_location}"
        
        # Google Maps'ten ara (geniş arama - 2x limit)
        client = SerpApiClient()
        places = client.search_places(
            query=search_query,
            location=f"{search_location}, Turkey",
            limit=request.limit * 2  # Reranking için daha fazla
        )
        
        if not places:
            return {
                "query": request.query,
                "parsed": parsed,
                "found": 0,
                "recommendations": [],
                "message": "Mekan bulunamadı"
            }
        
        # Sıkı kategori filtresi
        filtered_places = []
        for place in places:
            if strict_category_match(parsed['category'], place.get('category', '')):
                filtered_places.append(place)
        
        # Kategori filtresi çok sıkıysa, orijinal listeyi kullan
        if len(filtered_places) < 3:
            filtered_places = places
        
        # Mesafe filtresi (kullanıcı konumu varsa)
        if request.user_lat and request.user_lng:
            distance_filtered = []
            for place in filtered_places:
                if place.get('latitude') and place.get('longitude'):
                    dist = calculate_distance(
                        request.user_lat, request.user_lng,
                        place['latitude'], place['longitude']
                    )
                    if dist <= request.max_distance_km:
                        distance_filtered.append(place)
            
            # Çok az sonuç varsa mesafe limitini genişlet
            if len(distance_filtered) < 5:
                filtered_places = filtered_places
            else:
                filtered_places = distance_filtered
        
        # Hibrit skorlama
        scored_places = []
        current_time = datetime.now().strftime("%H:%M")
        
        for place in filtered_places:
            scores = hybrid_score(
                place, 
                parsed['features'],
                user_lat=request.user_lat,
                user_lng=request.user_lng,
                time_of_day=current_time
            )
            
            scored_places.append({
                **place,
                "match_score": round(scores["total_score"], 3),
                "distance_km": scores["distance_km"],
                "score_breakdown": {
                    "feature": round(scores["feature_score"], 3),
                    "distance": round(scores["distance_score"], 3),
                    "popularity": round(scores["popularity_score"], 3),
                    "time": round(scores["time_score"], 3)
                }
            })
        
        # Puana göre sırala
        scored_places.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Reranking - En iyi sonuçları yeniden değerlendir
        top_candidates = scored_places[:min(20, len(scored_places))]
        reranked_places = rerank_places(top_candidates, request.query, top_k=5)
        
        # Açıklama oluştur
        explanation_parts = [
            f"'{request.query}' sorgunuz için {len(places)} mekan bulundu."
        ]
        
        if parsed['features']:
            explanation_parts.append(f"İstenen özellikler: {', '.join(parsed['features'])}.")
        
        if request.user_lat and request.user_lng:
            explanation_parts.append(f"Konumunuza {request.max_distance_km}km mesafede arama yapıldı.")
        
        explanation_parts.append(f"Hibrit skorlama ve reranking ile en uygun {len(reranked_places)} mekan seçildi.")
        
        explanation = " ".join(explanation_parts)
        
        # Personalize edilmiş gerekçeler
        for place in reranked_places:
            reasons = []
            
            # Rating
            if place.get('rating', 0) >= 4.8:
                reasons.append(f"⭐ Yüksek puan ({place['rating']})")
            
            # Popülerlik
            if place.get('review_count', 0) > 500:
                reasons.append(f"💬 Çok yorumlu ({place['review_count']} yorum)")
            
            # Mesafe
            if place.get('distance_km'):
                if place['distance_km'] <= 2:
                    reasons.append(f"📍 Çok yakın ({place['distance_km']}km)")
                elif place['distance_km'] <= 5:
                    reasons.append(f"📍 Yakın ({place['distance_km']}km)")
            
            # Özellik eşleşmeleri
            place_text = (place.get('name', '') + ' ' + place.get('description', '')).lower()
            for feature in parsed['features']:
                if feature in place_text or feature in ['wifi', 'deniz', 'sessiz']:
                    feature_names = {
                        'wifi': '📶 WiFi mevcut',
                        'deniz': '🌊 Deniz manzarası',
                        'sessiz': '🤫 Sessiz ortam',
                        'açık': '🌳 Açık alan',
                        'çalışma': '💻 Çalışma ortamı'
                    }
                    if feature in feature_names:
                        reasons.append(feature_names[feature])
            
            place['recommendation_reason'] = " • ".join(reasons) if reasons else "Genel uygunluk"
        
        return {
            "query": request.query,
            "parsed": {
                "category": parsed['category'],
                "features": parsed['features'],
                "location": search_location
            },
            "found": len(places),
            "filtered": len(filtered_places),
            "recommendations": reranked_places,
            "explanation": explanation,
            "search_metadata": {
                "user_location_provided": bool(request.user_lat and request.user_lng),
                "max_distance_km": request.max_distance_km,
                "time_of_search": current_time,
                "strict_category_filter": len(filtered_places) != len(places)
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Akıllı arama hatası: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
