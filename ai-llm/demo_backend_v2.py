"""
Mini Demo Backend - SerpApi + LLM Test (FAZ 2 - Performance Optimized)
Faz 2 Özellikleri:
- 2.1: Redis Cache (TTL desteği)
- 2.2: Model Preloading (startup'ta yükleme)
- 2.3: Async Pipeline (paralel işlemler)
"""

from fastapi import FastAPI, HTTPException  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import os
import math
import asyncio
import hashlib
import json
import httpx  # type: ignore[import]
from datetime import datetime
import redis  # type: ignore[import]

# .env dosyasını yükle
from dotenv import load_dotenv  # type: ignore[import]
load_dotenv()

# Yorum analizi modülü
from review_analyzer import fast_extract_insights  # type: ignore[import]

# ==================== FAZ 2.1: CACHE SYSTEM ====================

class RedisCacheManager:
    """Redis cache manager (TTL destekli)"""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        self.redis_url = redis_url
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
        self.client: redis.Redis = redis.Redis.from_url(redis_url, decode_responses=True)
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


# Global cache instance - lazy init, startup'ta bağlantı kurulur
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_ttl = int(os.getenv("REDIS_TTL_SECONDS", "3600"))
cache_manager: Optional[RedisCacheManager] = None

# ==================== FAZ 2.2: MODEL PRELOADING ====================

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
            import torch  # type: ignore[import]
            from sentence_transformers import SentenceTransformer  # type: ignore[import]
            
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
            import torch  # type: ignore[import]
            positive_refs = ["Harika bir mekan", "Çok lezzetli", "Kesinlikle tavsiye ederim", "Çok güzel", "Mükemmel", "Bayıldım", "Güler yüzlü", "good", "great", "excellent", "amazing", "delicious", "perfect"]
            negative_refs = ["Çok kötü", "Berbat", "Berbat bir yer", "Tavsiye etmem", "Pahalı", "Kötü hizmet", "Lezzetsiz", "bad", "terrible", "worst", "awful", "expensive"]
            
            # Eğer tek bir string geldiyse liste yap
            if isinstance(reviews, str):
                reviews = [reviews]
                
            # Embeddings hesapla (Batch Inference - Hızlı çalışır)
            review_embs = self.embedding_model.encode(reviews, convert_to_tensor=True)  # type: ignore[union-attr]
            pos_embs = self.embedding_model.encode(positive_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            neg_embs = self.embedding_model.encode(negative_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            
            from torch.nn.functional import cosine_similarity  # type: ignore[import]
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

# Global model manager
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

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Her yerden erisime izin ver (Demo icin)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== MODELS ====================

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
    analyze_reviews: bool = True   # Yorum analizi açık/kapalı (API kredi tasarrufu için)


class AnalyzeReviewRequest(BaseModel):
    """İsteğe bağlı yorum çekme ve analiz isteği"""
    data_id: str
    place_name: Optional[str] = None



# ==================== HELPER FUNCTIONS ====================

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
        'romantik':  ['romantik', 'sevgili', 'sevgilimle', 'özel gün', 'yıldönümü', 'evlilik teklifi', 'aşk'],
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
        'sevgili':    ['sevgilimle', 'sevgiliye', 'çift olarak', 'romantik'],
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
        sentiment_bonus = model_manager.analyze_review_sentiment(user_review)
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


# ==================== ENDPOINTS ====================

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


@app.get("/api/stats")
async def get_stats():
    """
    Detaylı sistem istatistikleri:
    - Cache hit/miss oranı
    - Redis bellek kullanımı
    - Kaç anahtar saklanıyor
    - Yorum insight cache sayısı
    - Uptime
    """
    stats = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "version": "2.1.0",
            "model_loaded": model_manager.is_loaded,
            "model_device": model_manager.device,
        },
        "cache": {},
        "review_insights": {},
        "nlp": {
            "categories": 6,
            "districts": 42,
            "features": 8,
            "moods": 5,
            "specialty_patterns": 23,   # review_analyzer kategorileri
        }
    }
    
    if cache_manager and cache_manager.is_connected:
        try:
            import redis as _redis
            r = _redis.Redis.from_url(cache_manager.redis_url)
            info = r.info()
            
            total_keys: int = int(r.dbsize())
            
            insight_keys: int = len(r.keys("review_insights_*"))  # type: ignore[arg-type]
            search_keys: int  = len(r.keys("smart_search*"))      # type: ignore[arg-type]
            
            # Redis info'dan direkt typed değerler al
            hits: int   = int(info.get("keyspace_hits", 0) or 0)
            misses: int = int(info.get("keyspace_misses", 0) or 0)
            hit_total: int = hits + misses
            hit_rate: float = float(round(hits / hit_total * 100, 1)) if hit_total > 0 else 0.0
            
            mem_used_mb:  float = float(round(int(info.get("used_memory", 0) or 0) / 1024 / 1024, 2))
            mem_peak_mb:  float = float(round(int(info.get("used_memory_peak", 0) or 0) / 1024 / 1024, 2))
            clients: int  = int(info.get("connected_clients", 0) or 0)
            
            stats["cache"] = {  # type: ignore[assignment]
                "status": "connected",
                "total_keys": total_keys,
                "search_cache_keys": search_keys,
                "insight_cache_keys": insight_keys,
                "memory_used_mb": mem_used_mb,
                "memory_peak_mb": mem_peak_mb,
                "connected_clients": clients,
                "hits": hits,
                "misses": misses,
                "hit_rate_pct": hit_rate,
            }
            
            stats["review_insights"] = {  # type: ignore[assignment]
                "cached_insights": insight_keys,
                "ttl_hours": 24,
                "note": "Her mekan için 24 saat cache tutulur"
            }
            
        except Exception as e:
            stats["cache"] = {"status": "error", "detail": str(e)}  # type: ignore[assignment]
    else:
        stats["cache"] = {"status": "not_connected", "detail": "Redis çalışmıyor"}  # type: ignore[assignment]
    
    return stats


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
        
        # Çalışma Saatleri Filtresi
        if parsed.get('want_open_now'):
            open_places = [p for p in filtered_places if is_place_open(p) is not False]
            if len(open_places) >= 3:
                filtered_places = open_places
                print(f"[OpenNow] {len(open_places)}/{len(filtered_places)} mekan açık")
        
        # Bütçe Filtresi (NLP'den alınan budget bilgisi)
        budget = parsed.get('budget', 'orta')
        if budget == 'ucuz':
            budget_filtered = [p for p in filtered_places if p.get('price_level', 2) <= 2]
            if len(budget_filtered) >= 3:
                filtered_places = budget_filtered
        elif budget == 'lüks':
            budget_filtered = [p for p in filtered_places if p.get('price_level', 2) >= 3]
            if len(budget_filtered) >= 2:
                filtered_places = budget_filtered
        
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
        
        # ==================== YORUM BAZLI INSIGHT ANALİZİ ====================
        # Her mekan için SerpAPI yorumlarını çekip ne ile övüldüğünü tespit et
        if request.analyze_reviews:
            await _enrich_with_review_insights(reranked_places)
        
        # Gerekçeler
        feature_names = {
            'wifi': '📶 Sınırsız Wi-Fi',
            'deniz': '🌊 Deniz Manzaralı',
            'sessiz': '🤫 Sessiz Ortam',
            'açık': '🌳 Açık Alan / Bahçe',
            'çalışma': '💻 Çalışmaya Uygun'
        }
        
        for place in reranked_places:
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
            
            # Yorum bazlı insight'ları gerekçeye ekle
            review_insights = place.get('review_insights', {})
            if review_insights and review_insights.get('specialties'):
                top_specs = review_insights['specialties'][:2]
                for spec in top_specs:
                    reasons.insert(0, spec['display'])  # Başa ekle - en önemli bilgi
            
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


# ==================== REVIEW INSIGHT HELPER ====================

async def _enrich_with_review_insights(places: List[Dict]) -> None:
    """
    Reranked mekanların yorumlarını paralel olarak çekip
    ne ile övüldüklerini tespit eder.
    
    Örnek çıktı:
      place['review_insights'] = {
          'specialties': [
              {'emoji': '☕', 'label': 'Kahvesiyle ünlü', 'mention_count': 8, ...},
              {'emoji': '🍔', 'label': 'Hamburgeriyle meşhur', 'mention_count': 5, ...}
          ],
          'top_specialty': '☕ Kahvesiyle ünlü (8 yorum)',
          'highlight_tags': ['☕ Kahve', '🍔 Hamburger'],
          'summary': 'Bu mekan özellikle kahvesi ile öne çıkıyor.'
      }
    """
    try:
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
    except Exception as e:
        print(f"[ReviewInsight] SerpApiClient başlatılamadı: {e}")
        return

    async def _fetch_and_analyze(place: Dict) -> None:
        """Tek mekan için yorum çek ve analiz et (async wrapper)"""
        data_id = place.get('data_id', '')
        if not data_id:
            place['review_insights'] = {'specialties': [], 'top_specialty': None,
                                        'highlight_tags': [], 'summary': ''}
            return

        # Redis cache'de var mı?
        insight_cache_key = f"review_insights_{data_id}"
        if cache_manager:
            cached = cache_manager.get(insight_cache_key)
            if cached:
                place['review_insights'] = cached
                print(f"[ReviewInsight] Cache hit: {place.get('name', data_id)}")
                return

        # Yorumları çek (sync → thread pool)
        try:
            loop = asyncio.get_event_loop()
            reviews = await loop.run_in_executor(
                None,
                lambda: client.get_place_reviews(data_id, max_reviews=20)  # 20 yorum yeterli
            )
        except Exception as e:
            print(f"[ReviewInsight] Yorum çekme hatası ({data_id}): {e}")
            reviews = []

        # Yorumları analiz et
        place_name = place.get('name', '')
        insights = fast_extract_insights(reviews, place_name)
        place['review_insights'] = insights

        # Specialties'i log'a yaz
        if insights.get('specialties'):
            specs = ', '.join([s['emoji'] + ' ' + s['key'] for s in insights['specialties'][:3]])
            print(f"[ReviewInsight] {place_name}: {specs}")
        else:
            print(f"[ReviewInsight] {place_name}: No specialties detected ({len(reviews)} reviews)")

        # Cache'e kaydet (24 saat TTL - yorum verileri sık değişmez)
        if cache_manager and reviews:
            try:
                cache_manager.client.setex(insight_cache_key, 86400, json.dumps(insights, ensure_ascii=False))
            except Exception:
                pass

    # Tüm mekanlar için paralel olarak çalıştır
    tasks = [_fetch_and_analyze(place) for place in places]
    await asyncio.gather(*tasks, return_exceptions=True)


@app.post("/api/analyze-place-reviews")
async def analyze_place_reviews(request: AnalyzeReviewRequest):
    """
    Seçilen mekan için derinlemesine yorum analizi:
    - Sentiment skoru
    - Mekanın neyle övüldüğü (kahve, hamburger, atmosfer vs.)
    - Örnek yorumlar
    """
    try:
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
        
        deep_reviews = client.get_place_reviews(request.data_id, max_reviews=50)
        
        if not deep_reviews:
            return {
                "success": False,
                "review_count": 0,
                "analysis_text": "Yapay zeka analizine elverişli yeterli müşteri geri bildirimi bulunamamıştır.",
                "specialties": []
            }
        
        count = len(deep_reviews)
        place_name = request.place_name or ""
        
        # 1. Keyword bazlı specialty çıkarma (hızlı, her zaman çalışır)
        insights = fast_extract_insights(deep_reviews, place_name)
        
        # 2. Embedding tabanlı sentiment (model yüklüyse)
        sentiment_bonus = model_manager.analyze_review_sentiment(deep_reviews)
        
        # 3. Analiz metni üret
        if insights.get('specialties'):
            top_labels = [s['emoji'] + ' ' + s['label'] for s in insights['specialties'][:3]]
            specialty_text = ', '.join(top_labels)
            
            if sentiment_bonus > 0.10:
                analysis_text = (
                    f"Yapay zeka {count} yorumu inceledi. Bu mekan özellikle şunlarla öne çıkıyor: "
                    f"{specialty_text}. Müşteri memnuniyeti genel olarak çok yüksek."
                )
            else:
                analysis_text = (
                    f"Yapay zeka {count} yorumu inceledi. Bu mekan özellikle şunlarla biliniyor: "
                    f"{specialty_text}."
                )
        else:
            # Specialty bulunamadıysa sentiment bazlı metin
            if sentiment_bonus > 0.15:
                analysis_text = (f"Yapay zeka analizine göre, {count} müşteri geri bildiriminde "
                                f"çok yüksek oranda memnuniyet saptanmıştır.")
            elif sentiment_bonus > 0.05:
                analysis_text = (f"Yapay zeka tarafından analiz edilen {count} yorumda müşteri "
                                f"memnuniyeti genel olarak pozitif yönde.")
            elif sentiment_bonus < -0.15:
                analysis_text = (f"{count} yorumda ciddi müşteri şikayetleri tespit edilmiştir. "
                                f"Ziyaret öncesi dikkatli değerlendirme önerilir.")
            else:
                analysis_text = (f"{count} yorum analiz edildi. Mekan ortalama standartlar "
                                f"etrafında şekilleniyor.")
        
        # Örnek yorumlar (her specialty için)
        example_reviews = []
        for spec in insights.get('specialties', [])[:3]:
            if spec.get('example_review'):
                example_reviews.append({
                    "specialty": spec['label'],
                    "emoji": spec['emoji'],
                    "review": spec['example_review']
                })
            
        return {
            "success": True,
            "review_count": count,
            "sentiment_score": round(sentiment_bonus, 3),
            "analysis_text": analysis_text,
            "specialties": insights.get('specialties', []),
            "highlight_tags": insights.get('highlight_tags', []),
            "example_reviews": example_reviews,
            "summary": insights.get('summary', '')
        }
    except Exception as e:
        print(f"❌ Yorum analizi hatası: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "review_count": 0,
            "analysis_text": "Yapay zeka sistemi yorumlara şu anda erişemiyor.",
            "specialties": []
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
