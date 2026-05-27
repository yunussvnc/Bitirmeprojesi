# AI-LLM Service Deployment Guide

Bu dokuman AI-LLM servisinin Render.com'a deployment için kapsamlı rehberdir.

## 📦 Servis Özeti

**AI-LLM Service** - Akıllı mekan öneri sistemi için yapay zeka ve makine öğrenmesi servisi.

### Temel Özellikler

- 🤖 **LLM Integration**: Groq API (Llama-3.1) ile doğal dil yanıtları
- 🔍 **Smart Search**: SerpAPI ile Google Maps verisi + AI scoring
- 📊 **Review Analysis**: Sentiment analysis ve specialty detection
- 🖼️ **Image Search**: Llama-Vision ile görsel analiz
- 🧠 **Embedding Models**: Multilingual semantic search
- 💾 **Cache System**: Redis ile performans optimizasyonu (opsiyonel)
- 🗄️ **Vector DB**: Qdrant ile RAG pipeline (opsiyonel)

### Tech Stack

- **Framework**: FastAPI + Uvicorn
- **ML**: PyTorch, Transformers, Sentence-Transformers
- **LLM**: Groq API (Llama-3.1-8b-instant)
- **Data**: SerpAPI (Google Maps), Google Maps Places API
- **Database**: PostgreSQL (shared with backend)
- **Cache**: Redis (optional)
- **Vector DB**: Qdrant (optional)

---

## 🚀 Hızlı Başlangıç

### 1. Dosyaları Hazırla

```bash
# Repository'ye deployment dosyalarını ekle
cd ai-llm
ls -la

# Olması gerekenler:
# - runtime.txt
# - build.sh
# - render.yaml
# - requirements.txt
# - app.py
```

### 2. Git Push

```bash
git add ai-llm/runtime.txt ai-llm/build.sh ai-llm/render.yaml
git commit -m "Add AI-LLM Render deployment config"
git push origin main
```

### 3. Render.com Setup

1. **Dashboard** → **New** → **Web Service**
2. Repository: `BitirmeProjesi` (GitHub)
3. Branch: `main`
4. **Root Directory**: `ai-llm` ⚠️
5. Runtime: `Python 3`
6. Region: `Frankfurt`
7. Build Command: `chmod +x build.sh && ./build.sh`
8. Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
9. Instance Type: `Free`

### 4. Environment Variables

Environment tab'dan ekle (detaylar için `ENV_VARIABLES_CHECKLIST.md` bakın):

**Kritik:**
```bash
GROQ_API_KEY=<your-groq-key>
SERPAPI_KEY=<your-serpapi-key>
DATABASE_URL=<render-postgresql-internal-url>
BACKEND_API_URL=https://asemos-backend.onrender.com
```

**Standart:**
```bash
GROQ_MODEL=llama-3.1-8b-instant
LLM_PROVIDER=layered
EMBEDDING_DEVICE=cpu
CORS_ORIGINS=*
```

### 5. Deploy & Test

```bash
# Health check
curl https://asemos-ai.onrender.com/health

# System info
curl https://asemos-ai.onrender.com/api/info

# Test search
curl -X POST https://asemos-ai.onrender.com/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d '{"query": "Beşiktaş yakınında deniz manzaralı kafe"}'
```

---

## 📁 Dosya Yapısı

```
ai-llm/
├── app.py                      # Ana FastAPI uygulaması
├── requirements.txt            # Python dependencies
├── runtime.txt                 # Python version (3.11.11)
├── build.sh                    # Build script
├── render.yaml                 # Render.com config
├── .env                        # Local environment variables (GIT'E EKLEMEYİN)
├── env.example                 # Environment variables template
├── serpapi_client.py           # SerpAPI wrapper
├── review_analyzer.py          # Review analysis module
├── QUICK_DEPLOY_STEPS.txt      # Hızlı deployment adımları (Türkçe)
├── ENV_VARIABLES_CHECKLIST.md  # Environment variables detayları
├── DEPLOYMENT_README.md        # Bu dosya
└── src/
    ├── config.py               # Configuration settings
    ├── models/
    │   └── llm/
    │       └── llm_wrapper.py  # LLM wrapper (Groq + Local)
    └── ...
```

---

## 🔧 Build Process

Render.com deployment sırasında şu adımlar çalışır:

### 1. Build Phase (`build.sh`)

```bash
#!/usr/bin/env bash
set -o errexit

echo "🔧 Python paketleri yükleniyor..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build tamamlandı!"
```

**Süre**: ~10-15 dakika (ML kütüphaneleri ağır)

### 2. Startup Phase (`app.py`)

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Redis cache
    try:
        cache_manager = RedisCacheManager(redis_url=redis_url)
    except:
        cache_manager = None  # Fallback
    
    # Model preloading (arka planda)
    asyncio.create_task(model_manager.preload_models())
    
    yield
```

**Süre**: ~5-10 dakika (model indirme)

### 3. Ready

Service `/health` endpoint'e OK yanıt vermeye başlar.

---

## 🌐 API Endpoints

### Health & Info

```bash
GET /health
# Response: {"status": "ok", "version": "2.1.0", ...}

GET /api/info
# Response: Sistem bilgileri, cache stats, model info

GET /api/stats
# Response: Detaylı cache ve NLP istatistikleri
```

### Smart Search

```bash
POST /api/smart-search-v2
Content-Type: application/json

{
  "query": "Beşiktaş yakınında sakin kafe",
  "location": "Istanbul",
  "limit": 10,
  "user_lat": 41.0082,
  "user_lng": 29.0176,
  "max_distance_km": 5.0,
  "analyze_reviews": true
}

# Response:
{
  "query": "...",
  "found": 25,
  "recommendations": [
    {
      "name": "Kafe X",
      "rating": 4.8,
      "address": "...",
      "distance_km": 1.2,
      "match_score": 0.95,
      "recommendation_reason": "⭐ Yüksek puan • 📍 Çok yakın • 🤫 Sessiz Ortam",
      "review_insights": {
        "specialties": [
          {"emoji": "☕", "label": "Kahvesiyle ünlü", "mention_count": 8}
        ]
      }
    }
  ],
  "ai_message": "Doğal dil cevabı...",
  "_performance": {
    "response_time_seconds": 2.5
  }
}
```

### Review Analysis

```bash
POST /api/analyze-place-reviews
Content-Type: application/json

{
  "data_id": "0x14cab9a42eb244c1:0x14a63072a...",
  "place_name": "Kafe X"
}

# Response:
{
  "success": true,
  "review_count": 50,
  "sentiment_score": 0.35,
  "analysis_text": "Bu mekan özellikle kahvesi ile öne çıkıyor...",
  "specialties": [
    {
      "emoji": "☕",
      "label": "Kahvesiyle ünlü",
      "key": "kahve",
      "mention_count": 8,
      "display": "☕ Kahvesiyle ünlü (8 yorum)"
    }
  ]
}
```

### Image Search

```bash
POST /api/image-search
Content-Type: application/json

{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "mime_type": "image/jpeg",
  "location": "Istanbul",
  "limit": 5
}

# Response: Smart search sonucu + image analysis
{
  "image_analysis": {
    "detected_query": "espresso latte sicak kahve",
    "category": "kafe",
    "description": "Kahve fincani"
  },
  "recommendations": [...]
}
```

---

## 🔐 Environment Variables

Detaylı açıklama için `ENV_VARIABLES_CHECKLIST.md` bakın.

### Kritik

| Variable | Required | Açıklama |
|----------|----------|----------|
| `GROQ_API_KEY` | ✅ | Groq API key |
| `SERPAPI_KEY` | ✅ | SerpAPI key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BACKEND_API_URL` | ⚠️ | Backend servisi URL (önemli) |

### Opsiyonel

| Variable | Default | Açıklama |
|----------|---------|----------|
| `QDRANT_URL` | Boş | Qdrant vector DB (free tier'da yok) |
| `REDIS_URL` | Boş | Redis cache (free tier'da yok) |
| `GOOGLE_MAPS_API_KEY` | Boş | Google Maps Places API (opsiyonel) |

---

## 🚨 Render.com Free Tier Limitations

### Resource Limits

- **RAM**: 512 MB (ML modelleri için az)
- **CPU**: Shared
- **Storage**: 1 GB
- **Bandwidth**: 100 GB/month
- **Sleep**: 15 dakika inaktivite sonrası uyur

### Impact on AI Service

❌ **Çalışmayan Özellikler**:
- Local model loading (RAM yetersiz)
- Large ML models (PyTorch modelleri çok ağır)
- Redis cache (harici servis bağlanamaz)
- Qdrant vector DB (harici servis bağlanamaz)

✅ **Çalışan Özellikler**:
- Groq API ile LLM responses
- SerpAPI ile mekan arama
- Review analysis (keyword-based)
- Image analysis (Llama-Vision via Groq)
- Smart scoring algoritması
- NLP parsing

### Optimizations

```python
# 1. Quantization
USE_4BIT_QUANTIZATION=true  # RAM tasarrufu

# 2. CPU-only
EMBEDDING_DEVICE=cpu  # GPU yok zaten

# 3. Minimal model
HUGGINGFACE_MODEL=google/gemma-2-2b-it  # En küçük model

# 4. Background loading
asyncio.create_task(preload_models())  # Non-blocking

# 5. Fallback logic
try:
    cache_manager = RedisCacheManager()
except:
    cache_manager = None  # No Redis? No problem!
```

---

## 📊 Service Architecture

```
┌──────────────┐
│  Mobile App  │
└──────┬───────┘
       │
       ▼
┌──────────────┐        ┌──────────────┐
│   Backend    │───────▶│   AI-LLM     │
│  (Main API)  │        │   Service    │
└──────┬───────┘        └──────┬───────┘
       │                       │
       │    ┌──────────────┐   │
       └───▶│  PostgreSQL  │◀──┘
            └──────────────┘
            
External Services:
├─ Groq API (LLM)
├─ SerpAPI (Google Maps)
└─ Google Maps API (optional)
```

### Inter-Service Communication

**Backend → AI Service**:

```python
# Backend'de
import httpx

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8080")

async def get_ai_recommendations(query: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{AI_SERVICE_URL}/api/smart-search-v2",
            json={"query": query}
        )
        return response.json()
```

**AI Service → Backend**:

```python
# AI Service'de
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")

async def get_venue_details(venue_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BACKEND_API_URL}/api/venues/{venue_id}"
        )
        return response.json()
```

---

## 🧪 Testing

### Local Testing

```bash
# Start service
cd ai-llm
uvicorn app:app --reload --port 8080

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/info
```

### Production Testing

```bash
# Health check
curl https://asemos-ai.onrender.com/health

# Info
curl https://asemos-ai.onrender.com/api/info

# Smart search
curl -X POST https://asemos-ai.onrender.com/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Kadıköy yakınında çalışmak için sessiz kafe",
    "location": "Istanbul",
    "user_lat": 40.9904,
    "user_lng": 29.0255,
    "limit": 5
  }'
```

---

## 🐛 Troubleshooting

### Problem: Build fails with "Out of memory"

**Symptom**: Build process crashes during `pip install`

**Cause**: PyTorch ve ML kütüphaneleri çok ağır

**Solution**: 
- Normal, Render bazen başarısız olabilir
- Retry deployment (2-3 kere deneme gerekebilir)
- requirements.txt'i optimize et (gereksiz paketleri kaldır)

---

### Problem: Service crashes on startup

**Symptom**: Service starts then immediately crashes

**Cause**: RAM yetersiz, model loading başarısız

**Solution**:
- Normal behavior for free tier
- Kod otomatik fallback yapar (Groq API kullanır)
- Service yine de çalışır (local model devre dışı)

---

### Problem: "GROQ_API_KEY not found"

**Symptom**: `/health` returns error

**Cause**: Environment variable eksik

**Solution**:
1. Render Dashboard → Environment
2. `GROQ_API_KEY` ekle
3. Manuel Deploy

---

### Problem: Slow cold starts

**Symptom**: İlk istek 30+ saniye sürüyor

**Cause**: Free tier sleep after 15 min inactivity

**Solution**:
- Normal behavior
- Sonraki istekler hızlı olur
- Workaround: Cron job ile her 10 dk ping at

---

### Problem: Redis/Qdrant connection errors

**Symptom**: Logs'da connection errors

**Cause**: Free tier'da harici servis yok

**Solution**:
- Normal! Ignore this error
- Kod otomatik fallback yapar
- Servis çalışmaya devam eder

---

## 📈 Monitoring

### Render Dashboard

- **Logs**: Realtime application logs
- **Metrics**: CPU, Memory, Network usage
- **Events**: Deploys, restarts, errors

### Health Checks

```bash
# Manuel check
curl https://asemos-ai.onrender.com/health

# Automated monitoring (cron)
*/5 * * * * curl -f https://asemos-ai.onrender.com/health || echo "Service down!"
```

### Performance Metrics

```bash
# Detailed stats
curl https://asemos-ai.onrender.com/api/stats

# Response:
{
  "system": {
    "version": "2.1.0",
    "model_loaded": false
  },
  "cache": {
    "status": "not_connected"
  },
  "nlp": {
    "categories": 6,
    "districts": 42,
    "features": 8
  }
}
```

---

## 🔄 Updates & Redeployment

### Code Updates

```bash
# 1. Make changes
git add .
git commit -m "Update AI service"
git push origin main

# 2. Render auto-deploys (if enabled)
# OR: Dashboard → Manual Deploy → "Deploy latest commit"
```

### Environment Variable Updates

```bash
# 1. Dashboard → Environment
# 2. Update variable
# 3. Automatically triggers redeploy
```

---

## 📚 Additional Resources

### Documentation

- `QUICK_DEPLOY_STEPS.txt`: Hızlı başlangıç (Türkçe)
- `ENV_VARIABLES_CHECKLIST.md`: Environment variables detayları
- `DEPLOYMENT_README.md`: Bu dosya

### External Docs

- [Render.com Docs](https://render.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Groq API Docs](https://console.groq.com/docs)
- [SerpAPI Docs](https://serpapi.com/google-local-results)

---

## ✅ Deployment Checklist

Pre-deployment:
- [ ] Git repository güncel
- [ ] `runtime.txt` mevcut
- [ ] `build.sh` executable
- [ ] `render.yaml` doğru
- [ ] `requirements.txt` tüm dependencies içeriyor

Render.com Setup:
- [ ] Web Service oluşturuldu
- [ ] Root directory: `ai-llm` seçildi
- [ ] Build/Start commands doğru
- [ ] Region: Frankfurt

Environment Variables:
- [ ] `GROQ_API_KEY` eklendi
- [ ] `SERPAPI_KEY` eklendi
- [ ] `DATABASE_URL` eklendi (backend ile aynı)
- [ ] `BACKEND_API_URL` eklendi
- [ ] Standart değişkenler eklendi

Testing:
- [ ] `/health` endpoint OK
- [ ] `/api/info` endpoint OK
- [ ] `/api/smart-search-v2` test edildi
- [ ] Backend'den AI servise istek atılabiliyor

Backend Integration:
- [ ] Backend'e `AI_SERVICE_URL` eklendi
- [ ] Backend yeniden deploy edildi
- [ ] Mobile app backend URL'i güncel

---

**Hazırlayan**: AI Agent  
**Tarih**: 2026-05-22  
**Versiyon**: 1.0  
**Service**: AI-LLM (asemos-ai)
