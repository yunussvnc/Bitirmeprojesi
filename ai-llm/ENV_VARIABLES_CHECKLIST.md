# AI-LLM Service - Environment Variables Checklist

Bu dokument AI-LLM servisinin deployment için gereken tüm environment variable'ları açıklar.

## 🔴 Kritik - Zorunlu

Bu değişkenler olmadan servis çalışmaz:

| Variable | Açıklama | Örnek Değer | Nereden Alınır |
|----------|----------|-------------|----------------|
| `GROQ_API_KEY` | Groq API anahtarı (LLM responses için) | `gsk_...` | [console.groq.com](https://console.groq.com) |
| `SERPAPI_KEY` | SerpAPI anahtarı (Google Maps data) | `7611394b...` | [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Render PostgreSQL dashboard |

## 🟡 Önemli - Tavsiye Edilen

Bu değişkenler olmadan bazı özellikler çalışmaz:

| Variable | Açıklama | Örnek Değer | Default |
|----------|----------|-------------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Maps Places API | `AIzaSy...` | Boş (SerpAPI kullanılır) |
| `BACKEND_API_URL` | Backend servisi URL'i | `https://asemos-backend.onrender.com` | `http://localhost:8000` |

## 🟢 Standart - Varsayılan Değerler

Bu değişkenler genelde default değerlerde bırakılabilir:

| Variable | Açıklama | Default Değer |
|----------|----------|---------------|
| `GROQ_MODEL` | Kullanılacak Groq model | `llama-3.1-8b-instant` |
| `LLM_PROVIDER` | LLM provider türü | `layered` (Groq → Local fallback) |
| `HUGGINGFACE_MODEL` | Yerel model (fallback) | `google/gemma-2-2b-it` |
| `USE_4BIT_QUANTIZATION` | Model quantization (RAM tasarrufu) | `true` |
| `EMBEDDING_MODEL` | Embedding model | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| `EMBEDDING_DEVICE` | Device (cpu/cuda) | `cpu` |
| `TOP_K_RESULTS` | Vector search sonuç sayısı | `5` |
| `SIMILARITY_THRESHOLD` | Minimum benzerlik skoru | `0.4` |
| `CORS_ORIGINS` | İzin verilen origin'ler | `*` |

## ⚪ Opsiyonel - Harici Servisler

Bu değişkenler Render.com free tier'da kullanılamaz (harici servisler bağlanamaz):

| Variable | Açıklama | Default | Not |
|----------|----------|---------|-----|
| `QDRANT_URL` | Qdrant vector DB URL | Boş | Free tier'da kullanılamaz, kod otomatik skip eder |
| `QDRANT_COLLECTION_NAME` | Qdrant collection | `mekan_embeddings` | Qdrant aktifse kullanılır |
| `REDIS_URL` | Redis cache URL | Boş | Free tier'da kullanılamaz, kod fallback yapar |
| `REDIS_TTL_SECONDS` | Cache TTL | `3600` | Redis aktifse kullanılır |

---

## 📋 Render.com Environment Variables Setup

### 1. Dashboard → Environment Tab

Render.com'daki servisinizin Environment tab'ından şu değişkenleri ekleyin:

### 2. Kritik Değişkenler (Manuel Giriş)

```bash
# LLM API
GROQ_API_KEY=GROQ_API_KEY_PLACEHOLDER
GROQ_MODEL=llama-3.1-8b-instant

# Google Maps Data
SERPAPI_KEY=SERPAPI_KEY_PLACEHOLDER
GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY_PLACEHOLDER

# Database (Backend ile aynı)
DATABASE_URL=<RENDER_POSTGRESQL_INTERNAL_URL>

# Backend Communication
BACKEND_API_URL=https://asemos-backend.onrender.com
```

### 3. Standart Değişkenler (Copy-Paste)

```bash
# LLM Configuration
LLM_PROVIDER=layered
HUGGINGFACE_MODEL=google/gemma-2-2b-it
USE_4BIT_QUANTIZATION=true

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_DEVICE=cpu

# RAG Settings
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.4

# CORS
CORS_ORIGINS=*

# Optional (boş bırakılabilir)
QDRANT_URL=
QDRANT_COLLECTION_NAME=mekan_embeddings
REDIS_URL=
REDIS_TTL_SECONDS=3600
```

---

## 🔒 Güvenlik Notları

### Kritik API Key'ler

1. **GROQ_API_KEY**: 
   - Aylık 10,000 token limit (free)
   - Rate limit: 30 requests/minute
   - [console.groq.com](https://console.groq.com) → API Keys

2. **SERPAPI_KEY**:
   - Aylık 100 search limit (free)
   - Rate limit: 5 requests/second
   - [serpapi.com](https://serpapi.com/manage-api-key) → API Key

3. **GOOGLE_MAPS_API_KEY**:
   - $200/month free credit
   - Places API: $17 per 1000 requests
   - [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → API Keys

### Database Connection

```bash
# ✅ DOĞRU: Internal URL (Render içi servisler arası)
DATABASE_URL=postgresql://user:pass@dpg-xxx-a/dbname

# ❌ YANLIŞ: External URL (dışarıdan erişim için, Render içinde KULLANMAYIN)
DATABASE_URL=postgresql://user:pass@dpg-xxx-a.frankfurt-postgres.render.com/dbname
```

---

## 🚨 Sorun Giderme

### Problem: "GROQ_API_KEY not found"

**Çözüm**: 
- Render dashboard → Environment → `GROQ_API_KEY` ekleyin
- Manuel Deploy yapın (değişiklik algılanır)

### Problem: "SERPAPI_KEY invalid"

**Çözüm**:
- SerpAPI dashboard'dan yeni key alın
- Key aktif mi kontrol edin (monthly limit dolmamış olmalı)

### Problem: "Database connection failed"

**Çözüm**:
- `DATABASE_URL` backend ile aynı mı kontrol edin
- Internal URL kullanıldığından emin olun (External değil)
- PostgreSQL servisi çalışıyor mu kontrol edin

### Problem: "Redis connection failed"

**Çözüm**:
- Normal! Free tier'da Redis yok
- Kod otomatik fallback yapar (çalışmaya devam eder)
- Cache özelliği devre dışı kalır ama servis çalışır

---

## 🎯 Production Checklist

Deployment öncesi kontrol listesi:

- [ ] `GROQ_API_KEY` doğru ve aktif
- [ ] `SERPAPI_KEY` doğru ve limit dolmamış
- [ ] `DATABASE_URL` backend ile aynı (Internal URL)
- [ ] `BACKEND_API_URL` backend servisinin production URL'i
- [ ] `GOOGLE_MAPS_API_KEY` (opsiyonel ama tavsiye edilir)
- [ ] Tüm standart değişkenler eklendi
- [ ] `/health` endpoint test edildi
- [ ] `/api/info` endpoint test edildi

---

## 📊 API Key Kullanım Limitleri

### Free Tier Limitleri

| Servis | Free Limit | Rate Limit | Link |
|--------|------------|------------|------|
| Groq | 10,000 tokens/month | 30 req/min | [console.groq.com](https://console.groq.com) |
| SerpAPI | 100 searches/month | 5 req/sec | [serpapi.com](https://serpapi.com) |
| Google Maps | $200/month credit | ~10,000 req/month | [cloud.google.com](https://console.cloud.google.com) |
| Render.com | 512 MB RAM, Sleep after 15 min | - | [render.com](https://render.com) |

### Kullanım Tavsiyeleri

1. **Cache kullanın**: Redis olmasa da backend'de cache mekanizması kurun
2. **Rate limiting**: Aynı sorguyu tekrar tekrar göndermeyin
3. **Batch requests**: Mümkünse istekleri batch'leyin
4. **Monitoring**: API kullanımını takip edin (dashboard'lar)

---

## 🔗 Faydalı Linkler

- [Groq Console](https://console.groq.com)
- [SerpAPI Dashboard](https://serpapi.com/manage-api-key)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Render.com Dashboard](https://dashboard.render.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Son Güncelleme**: 2026-05-22
