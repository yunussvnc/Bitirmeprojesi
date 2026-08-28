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

from demo_v2_search_helpers import (
    calculate_distance,
    hybrid_score,
    parse_natural_query,
    rerank_places,
    strict_category_match,
)

"""
Mini Demo Backend - SerpApi + LLM Test (FAZ 2 - Performance Optimized)
Faz 2 Özellikleri:
- 2.1: Redis Cache (TTL desteği)
- 2.2: Model Preloading (startup'ta yükleme)
- 2.3: Async Pipeline (paralel işlemler)
"""


load_dotenv()


class RedisCacheManager:
    """Redis cache manager (TTL destekli)"""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        self.redis_url = redis_url
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
        self.client: Redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.is_connected = False
        self._connect()

    def _connect(self) -> None:
        try:
            self.client.ping()
            self.is_connected = True
        except Exception as exc:
            self.is_connected = False
            raise RuntimeError(f"Redis baglantisi kurulamadi: {exc}")

    def generate_key(self, query: str, location: str, **kwargs) -> str:
        """Sorgu parametrelerine gore unique cache key olustur"""
        key_str = f"{query}|{location}|{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Dict]:
        """Redis'ten veri al"""
        try:
            raw = self.client.get(key)
            if raw is None:
                self.misses += 1
                return None

            self.hits += 1
            return json.loads(raw)
        except Exception:
            self.misses += 1
            return None

    def set(self, key: str, data: Dict) -> None:
        """Redis'e veri yaz (TTL ile)"""
        payload = json.dumps(data, ensure_ascii=False)
        self.client.setex(key, self.ttl, payload)

    def clear(self) -> None:
        """Redis DB temizle"""
        self.client.flushdb()

    def get_stats(self) -> Dict:
        """Cache istatistikleri"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        try:
            total_items = self.client.dbsize()
        except Exception:
            total_items = 0

        return {
            "backend": "redis",
            "redis_url": self.redis_url,
            "total_items": total_items,
            "ttl_seconds": self.ttl,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "last_updated": datetime.now().isoformat()
        }


redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")


redis_ttl = int(os.getenv("REDIS_TTL_SECONDS", "3600"))


cache_manager: Optional[RedisCacheManager] = None


class ModelManager:
    """Model preloading ve management"""
    
    def __init__(self):
        self.embedding_model = None
        self.llm_model = None
        self.tokenizer = None
        self.device: Optional[str] = None
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

    def analyze_review_sentiment(self, reviews: Union[str, List[str]]) -> float:
        """Kısa yorum veya yorum listesi üzerinden kabaca pozitif/negatif duygu analizi skorlaması (-0.2 ile +0.2)"""
        if not reviews or not self.embedding_model:
            return 0.0
            
        try:
            import torch
            positive_refs = ["Harika bir mekan", "Çok lezzetli", "Kesinlikle tavsiye ederim", "Çok güzel", "Mükemmel", "Bayıldım", "Güler yüzlü", "good", "great", "excellent", "amazing", "delicious", "perfect"]
            negative_refs = ["Çok kötü", "Berbat", "Berbat bir yer", "Tavsiye etmem", "Pahalı", "Kötü hizmet", "Lezzetsiz", "bad", "terrible", "worst", "awful", "expensive"]
            
            # Eğer tek bir string geldiyse liste yap
            if isinstance(reviews, str):
                reviews = [reviews]
                
            # Embeddings hesapla (Batch Inference - Hızlı çalışır)
            review_embs = self.embedding_model.encode(reviews, convert_to_tensor=True)
            pos_embs = self.embedding_model.encode(positive_refs, convert_to_tensor=True)
            neg_embs = self.embedding_model.encode(negative_refs, convert_to_tensor=True)
            
            from torch.nn.functional import cosine_similarity
            total_bonus = 0.0
            
            # Her bir yorumu analiz edip ortalamasını alıyoruz
            for review_emb in review_embs:
                pos_scores = cosine_similarity(review_emb.unsqueeze(0), pos_embs)
                neg_scores = cosine_similarity(review_emb.unsqueeze(0), neg_embs)
                
                max_pos = pos_scores.max().item()
                max_neg = neg_scores.max().item()
                
                sentiment_diff = max_pos - max_neg
                # Eskiden 0.4 ile çarpıp +-0.20'ye sınırlandırıyorduk.
                # Kullanıcı etkinin artmasını istediği için çarpanı 0.8 yapıp sınırı +-0.40 yapıyoruz.
                bonus = min(max(sentiment_diff * 0.8, -0.40), 0.40)
                total_bonus += bonus
                
            avg_bonus = total_bonus / len(reviews)
            print(f"🧐 {len(reviews)} adet yorum Analizi Ortalama Bonus: {avg_bonus:.3f}")
            return avg_bonus
            
        except Exception as e:
            print(f"[Model] Yorum analizi başarısız: {e}")
            return 0.0


model_manager = ModelManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan: startup ve shutdown işlemleri"""
    global cache_manager
    print("\n" + "="*60)
    print("FAZ 2: STARTUP - Sistem Başlatılıyor")
    print("="*60)

    # 1. Redis Cache - bağlantı yoksa fallback
    try:
        cache_manager = RedisCacheManager(redis_url=redis_url, ttl_seconds=redis_ttl)
        print(f"[Startup] Cache Manager (Redis): ✓ {redis_url}")
    except Exception as e:
        print(f"[Startup] Redis bağlanamadı ({e}), in-memory fallback kullanılıyor")
        cache_manager = None

    # 2. Model Preloading
    model_status = await model_manager.preload_models()
    print(f"[Startup] Model Preloading: {model_status['status']}")
    print(f"[Startup] Version: 2.1 (Performance Optimized)")
    print("="*60 + "\n")

    yield  # Uygulama burada çalışır

    # Shutdown
    print("[Shutdown] Sistem kapatılıyor...")


app = FastAPI(
    title="AI-LLM Demo Backend (FAZ 2)",
    version="2.1.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Her yerden erisime izin ver (Demo icin)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    review_count: int = 0
    user_review: Optional[str] = None


class SmartSearchRequest(BaseModel):
    """Akıllı arama isteği"""
    query: str
    location: str = "Istanbul"
    limit: int = 10
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    max_distance_km: float = 10.0


class AnalyzeReviewRequest(BaseModel):
    """İsteğe bağlı yorum çekme ve analiz isteği"""
    data_id: str


@app.get("/health")
async def health():
    """Health check"""
    cache_ok = cache_manager is not None and cache_manager.is_connected
    return {
        "status": "ok",
        "version": "2.1.0",
        "cache": "redis" if cache_ok else "none (fallback)",
        "model_loaded": model_manager.is_loaded
    }


@app.get("/api/info")
async def get_info():
    """Sistem bilgileri ve istatistikler (Faz 2)"""
    cache_stats = cache_manager.get_stats() if cache_manager else {"backend": "none (no redis)"}
    return {
        "version": "2.1.0",
        "phase": "Faz 2 - Performance Optimized",
        "features": [
            "2.1: Redis Cache with TTL",
            "2.2: Model Preloading at Startup",
            "2.3: Async Pipeline Support"
        ],
        "cache_stats": cache_stats,
        "model_stats": {
            "is_loaded": model_manager.is_loaded,
            "device": model_manager.device
        },
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/smart-search-v2")
async def smart_search_v2(request: SmartSearchRequest):
    """
    Akıllı mekan arama - Faz 2 Optimized (Async + Cache)
    
    Yeni Özellikler:
    - Cache: Aynı sorgu 2. kez çok hızlı
    - Preloading: Modeller startup'ta yüklü
    - Async: Paralel işlemler
    """
    try:
        # 1. CACHE CHECK
        cache_key = None
        if cache_manager:
            cache_key = cache_manager.generate_key(
                request.query,
                request.location,
                user_lat=str(request.user_lat),
                user_lng=str(request.user_lng)
            )
            cached_result = cache_manager.get(cache_key)
            if cached_result:
                return {
                    **cached_result,
                    "_cache": {
                        "hit": True,
                        "timestamp": datetime.now().isoformat()
                    }
                }
        
        # 2. SEARCH
        start_time = datetime.now()
        
        from serpapi_client import SerpApiClient
        
        parsed = parse_natural_query(request.query)
        
        # --- Niyet Kontrolü (Intent Check) ---
        if parsed.get('is_inappropriate'):
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": "Üzgünüm, ben sadece bir mekan öneri asistanıyım. Siyasi, dini veya argo sohbetlere katılamıyorum. Lütfen bana mekanlarla ilgili bir soru sor. 🤖🍔",
                "recommendations": [],
                "_cache": {"hit": False}
            }
            
        if parsed.get('is_chit_chat'):
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": "Merhaba! İyiyim, teşekkür ederim. Ben seni aradığın en güzel mekanlara götürmek için buradayım. Bugün nasıl bir yere gitmek istersin? (Örn: Beşiktaş'ta deniz manzaralı sakin bir kafe) ☕",
                "recommendations": [],
                "_cache": {"hit": False}
            }
        
        search_location = parsed['district'] or request.location
        
        # Sadece kategori yerine çıkartılan özellikleri de Google Maps aramasına dahil et
        # Eğer hiç özellik yoksa, tüm query'i aratmak daha spesifik sonuç verebilir
        if parsed['features']:
            feature_str = " ".join(parsed['features'])
            search_query = f"{feature_str} {parsed['category']} in {search_location}"
        else:
            # Doğrudan NLP'nin kaçırdığı detaylar için orijinal query'i kullan ama lokasyon ekle
            search_query = f"{request.query} in {search_location}"
            
        client = SerpApiClient()
        places = client.search_places(
            query=search_query,
            location=f"{search_location}, Turkey",
            limit=request.limit * 2,
            lat=request.user_lat,
            lng=request.user_lng
        )
        
        if not places:
            return {
                "query": request.query,
                "found": 0,
                "recommendations": [],
                "_cache": {"hit": False}
            }
        
        # Kategori filtresi
        filtered_places = [p for p in places if strict_category_match(parsed['category'], p.get('category', ''))]
        if len(filtered_places) < 3:
            filtered_places = places
        
        # Mesafe filtresi
        if request.user_lat and request.user_lng:
            distance_filtered = [
                p for p in filtered_places
                if p.get('latitude') and p.get('longitude')
                and calculate_distance(request.user_lat, request.user_lng, p['latitude'], p['longitude']) <= request.max_distance_km
            ]
            if len(distance_filtered) >= 5:
                filtered_places = distance_filtered
        
        # Hava Durumu Çekme (Open-Meteo API - Ücretsiz, Limitsiz)
        weather_data = {"condition": "Unknown", "temp": None}
        if request.user_lat and request.user_lng:
            try:
                # WMO Weather interpretation codes
                weather_codes = {
                    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Fog", 48: "Depositing rime fog",
                    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
                    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
                    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
                    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                }
                
                with httpx.Client(timeout=3.0) as w_client:
                    w_res = w_client.get(f"https://api.open-meteo.com/v1/forecast?latitude={request.user_lat}&longitude={request.user_lng}&current_weather=true")
                    if w_res.status_code == 200:
                        current = w_res.json().get("current_weather", {})
                        code = current.get("weathercode", -1)
                        weather_data["condition"] = weather_codes.get(code, "Unknown")
                        weather_data["temp"] = current.get("temperature")
            except Exception as e:
                print(f"[Weather] Hava durumu çekilemedi: {e}")

        # Skorlama İçin Zaman ve Hava Durumu Paketi
        time_weather_context = {
            "hour": int(datetime.now().hour),
            "weather": weather_data
        }
        
        scored_places = []
        for place in filtered_places:
            scores = hybrid_score(
                place,
                parsed['features'],
                user_lat=request.user_lat,
                user_lng=request.user_lng,
                time_of_day=time_weather_context
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
        
        scored_places.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Reranking
        reranked_places = rerank_places(scored_places[:min(20, len(scored_places))], request.query, top_k=5)
        
        # Gerekçeler
        feature_names = {
            'wifi': '📶 Sınırsız Wi-Fi',
            'deniz': '🌊 Deniz Manzaralı',
            'sessiz': '🤫 Sessiz Ortam',
            'açık': '🌳 Açık Alan / Bahçe',
            'çalışma': '💻 Çalışmaya Uygun'
        }
        
        for place in reranked_places:
            scores = place.get('scores', {})
            reasons = []
            
            if place.get('rating', 0) >= 4.8:
                reasons.append(f"⭐ Yüksek puan ({place['rating']})")
            
            if place.get('review_count', 0) > 500:
                reasons.append(f"💬 Çok yorumlu ({place['review_count']} yorum)")
            
            if place.get('distance_km') and place['distance_km'] > 0:
                if place['distance_km'] <= 2:
                    reasons.append(f"📍 Çok yakın ({place['distance_km']}km)")
                elif place['distance_km'] <= 5:
                    reasons.append(f"📍 Yakın ({place['distance_km']}km)")
            
            if parsed['features']:
                for feature in parsed['features']:
                    if feature in feature_names:
                        reasons.append(feature_names[feature])
            
            if place.get('recommendation_reason_bonus'):
                reasons.append(place['recommendation_reason_bonus'])
            
            place['recommendation_reason'] = " • ".join(reasons) if reasons else "Genel uygunluk"
        
        response = {
            "query": request.query,
            "found": len(places),
            "recommendations": reranked_places,
            "context": {
                "weather": weather_data.get("condition"),
                "temperature": weather_data.get("temp")
            },
            "_cache": {"hit": False}
        }

        # Cache'e kaydet (Redis varsa)
        if cache_manager and cache_key:
            cache_manager.set(cache_key, response)

        elapsed = (datetime.now() - start_time).total_seconds()
        response["_performance"] = {
            "response_time_seconds": round(elapsed, 3),
            "cached": False
        }
        
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-place-reviews")
async def analyze_place_reviews(request: AnalyzeReviewRequest):
    """
    Seçilen mekan için isteğe bağlı derinlemesine bağımsız (tarafsız) yorum analizi
    """
    try:
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
        
        deep_reviews = client.get_place_reviews(request.data_id, max_reviews=50)
        
        if not deep_reviews:
            return {
                "success": False,
                "review_count": 0,
                "analysis_text": "Yapay zeka analizine elverişli yeterli müşteri geri bildirimi bulunamamıştır."
            }
            
        sentiment_bonus = model_manager.analyze_review_sentiment(deep_reviews)
        
        # Tarafsız, analitik ve yapay zeka/üçüncü şahıs ağzıyla (nesnel) metin üretimi
        # sentiment_bonus: ortalama duygu oranı. Genelde -0.40 ile +0.40 arasında.
        
        count = len(deep_reviews)
        if sentiment_bonus > 0.15:
            analysis_text = f"Yapay zeka analizine göre, bu mekan için toplanan son {count} müşteri geri bildiriminde çok yüksek oranda memnuniyet saptanmıştır. Özellikle hizmet kalitesi ve genel deneyim müşteriler tarafından şiddetle tavsiye edilmektedir."
        elif sentiment_bonus > 0.05:
            analysis_text = f"Yapay zeka tarafından analiz edilen son {count} yoruma dayanarak, müşteri memnuniyetinin genel itibarıyla pozitif yönde olduğu, mekanın standart beklentileri karşıladığı gözlemlenmiştir."
        elif sentiment_bonus < -0.15:
            analysis_text = f"Yapay zeka analiz raporuna göre, incelenen {count} güncel yorumda ciddi ve tutarlı müşteri şikayetleri tespit edilmiştir. Kalite, hijyen veya bekleme süresi gibi unsurlar doğrultusunda ziyaret deneyiminin olumsuz olabileceği analiz edilmektedir."
        elif sentiment_bonus < -0.05:
            analysis_text = f"Yapay zeka metin analizlerine göre incelenen {count} yorumda, genel işleyiş ve ürüne dair bazı kronik memnuniyetsizlikler mevcuttur. Deneyim kalitesinde dalgalanmalar olduğu saptanmıştır."
        else:
            analysis_text = f"Sistem tarafında analiz edilen son {count} yorum doğrultusunda, mekanın belirgin bir pozitif veya negatif uçta yer almadığı, hizmetin ortalama standartlar etrafında şekillendiği tespit edilmiştir."
            
        return {
            "success": True,
            "review_count": count,
            "sentiment_score": round(sentiment_bonus, 3),
            "analysis_text": analysis_text
        }
    except Exception as e:
        print(f"❌ Yorum analizi hatası: {e}")
        return {
            "success": False,
            "review_count": 0,
            "analysis_text": "Yapay zeka sistemi yorumlara şu anda erişemiyor. Teknik bir aksaklık saptandı."
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
