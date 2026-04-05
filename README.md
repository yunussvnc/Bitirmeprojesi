# AsEmOs — Yapay Zeka Destekli Mekan Öneri & Sosyal Platform

> **Bitirme Projesi** | İstanbul'da mekan keşfini yapay zeka ile kişiselleştiren sosyal platform.

AsEmOs; kullanıcıların doğal dilde mekan arayabildiği, sosyal etkileşime girebildiği ve gerçek zamanlı eşleşme yapabildiği modern bir mobil uygulamadır. Altyapısında **Groq LLM**, **Qdrant vektör veritabanı**, **SerpAPI** ve **Sentence Transformers** teknolojileri kullanılmaktadır.

---

## Mimari Genel Bakış

```
┌──────────────────────────────────────────────────────────────┐
│                   Mobil Uygulama (Expo)                      │
│              React Native · iOS · Android · Web              │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
          Port 8000               Port 8080
          REST API               AI/Arama
                 │                      │
┌────────────────▼───────┐   ┌──────────▼──────────────────────┐
│     BACKEND             │   │         AI-LLM                  │
│     FastAPI             │   │         FastAPI                  │
│                         │   │                                  │
│  • Kullanıcı & Auth     │   │  • Doğal dil mekan arama         │
│  • Mekan CRUD           │   │  • SerpAPI → Google Maps         │
│  • Sosyal akış & Story  │   │  • Qdrant vektör araması         │
│  • Eşleşme sistemi      │   │    (198 gerçek İstanbul mekanı)  │
│  • Gerçek zamanlı chat  │   │  • Redis önbellekleme            │
│  • Groq LLM önerileri  │   │  • Yorum analizi (NLP)           │
│                         │   │  • Groq + Gemma 2 LLM           │
└────────────┬────────────┘   └──────────────────┬─────────────┘
             │                                    │
     PostgreSQL (5432)             Qdrant (6333) + Redis (6379)
```

---

## Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| **Mobil** | React Native, Expo SDK 52, TypeScript, Expo Router |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| **AI Servisi** | Python 3.11, FastAPI, Sentence Transformers, Qdrant |
| **LLM** | Groq Cloud (llama-3.1-8b-instant) + HuggingFace Gemma 2 |
| **Vektör Arama** | Qdrant + paraphrase-multilingual-MiniLM-L12-v2 (çok dilli) |
| **Mekan Verisi** | SerpAPI → Google Maps (198 gerçek İstanbul mekanı) |
| **Önbellekleme** | Redis |
| **Medya** | Cloudinary |
| **Konteyner** | Docker Compose |

---

## LLM Katman Mimarisi

Her iki serviste de aynı dayanıklı zincir çalışır:

```
Kullanıcı isteği geldi
        ↓
┌───────────────────────────────┐
│  Katman 1: Groq Cloud LLM    │  ← llama-3.1-8b-instant, ~0.5 sn
│  (Hızlı, ücretsiz kota)      │
└──────────────┬────────────────┘
               │ başarısız / timeout
               ↓
┌───────────────────────────────┐
│  Katman 2: Gemma 2 (ai-llm)  │  ← HuggingFace local model
│  veya Scoring Fallback        │  ← ya da puan sıralaması (backend)
│  (Her zaman çalışır)          │
└───────────────────────────────┘
```

---

## Servisler

| Servis | Port | Klasör | Açıklama |
|---|---|---|---|
| **Backend** | 8000 | `backend/` | Auth, CRUD, sosyal özellikler, chat |
| **AI Servisi** | 8080 | `ai-llm/` | Semantik arama, LLM, yorum analizi |
| **PostgreSQL** | 5432 | Docker | Ana veritabanı |
| **Qdrant** | 6333 | Docker | Vektör veritabanı (198 mekan) |
| **Redis** | 6379 | Docker | Önbellekleme |

---

## Hızlı Başlangıç

### 1. Ortam değişkenleri

```bash
# Kök .env oluştur
cp .env.example .env
```

`.env` içine ekle:
```env
GROQ_API_KEY=gsk_...          # groq.com/keys → ücretsiz
SERPAPI_KEY=...               # serpapi.com → ücretsiz kota
JWT_SECRET_KEY=...            # güvenli rastgele string
```

### 2. Altyapıyı başlat (Docker)

```bash
# Veritabanları ve cache
docker compose up -d postgres qdrant redis
```

### 3. Backend başlat

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head           # veritabanı migration
uvicorn main:app --reload --port 8000
```

### 4. AI Servisini başlat

```bash
cd ai-llm
pip install -r requirements.txt
uvicorn app:app --reload --port 8080

# Qdrant'a veri yükle (ilk kurulumda)
python scripts/load_data.py --source serpapi --limit 20
```

### 5. Mobil uygulamayı başlat

```bash
cd apps/mobile
npm install
npx expo start
```

### Tek komutla (Docker — tüm servisler)

```bash
docker compose up -d
```

---

## Proje Yapısı

```
BitirmeProjesi/
├── backend/                ← Ana API (Port 8000)
│   ├── main.py             ← FastAPI + lifespan
│   ├── models.py           ← Veritabanı modelleri
│   ├── crud.py             ← CRUD operasyonları
│   ├── llm_client.py       ← Groq → scoring fallback
│   ├── llm_recommend.py    ← AI öneri pipeline
│   └── app/routers/        ← auth, users, places, match, messages...
│
├── ai-llm/                 ← AI Servisi (Port 8080)
│   ├── app.py              ← FastAPI uygulaması
│   ├── serpapi_client.py   ← Google Maps veri çekme
│   ├── review_analyzer.py  ← Yorum analizi (NLP)
│   ├── test_sistem.py      ← Semantik arama testi
│   └── src/
│       ├── models/llm/     ← Groq + HuggingFace wrapper
│       ├── rag/            ← RAG retriever
│       └── vector_db/      ← Qdrant client
│
├── apps/mobile/            ← React Native (Expo)
│   ├── app/                ← Expo Router sayfaları
│   └── src/
│       ├── services/       ← API + AI servis bağlantıları
│       └── store/          ← Zustand state
│
├── docker-compose.yml      ← Tüm servisleri yönetir
└── .env.example            ← Gerekli environment değişkenleri
```

---

## API Endpoint'leri

### Backend (Port 8000)

| Endpoint | Method | Açıklama |
|---|---|---|
| `/health` | GET | Sağlık kontrolü |
| `/auth/login` | POST | Kullanıcı girişi |
| `/auth/register` | POST | Kullanıcı kaydı |
| `/places` | GET/POST | Mekan listele / oluştur |
| `/recommend` | POST | AI destekli öneri |
| `/match` | GET/POST | Eşleşme sistemi |
| `/messages` | WS | Gerçek zamanlı chat |
| `/feed` | GET | Sosyal akış |

### AI Servisi (Port 8080)

| Endpoint | Method | Açıklama |
|---|---|---|
| `/health` | GET | Sağlık kontrolü |
| `/api/smart-search-v2` | POST | Doğal dil mekan arama |
| `/api/analyze-place-reviews` | POST | Yorum analizi |
| `/api/info` | GET | Sistem durumu ve istatistikler |

---

## Semantik Arama — Örnek Sonuçlar

> Qdrant'taki 198 gerçek İstanbul mekanı üzerinde test edildi.

| Sorgu | En İyi Sonuç | Benzerlik | Puan |
|---|---|---|---|
| "Canlı müzik olan bar Beyoğlu" | **The Wall Bar** (Canlı müzik mekanı) | 0.749 | ⭐4.4 |
| "Ailecek kahvaltı yeri" | **Bop Breakfast Of Pan** (Kahvaltı) | 0.630 | ⭐4.6 |
| "WiFi olan sakin çalışma mekanı" | **CoBAC WorkSpace** (Ortak çalışma) | 0.344 | ⭐4.6 |
| "Romantik Boğaz manzarası yemek" | **Garden 1897** (Restoran) | 0.507 | ⭐4.9 |

---

## Güvenlik Notları

- `JWT_SECRET_KEY` üretimde mutlaka `secrets.token_hex(32)` ile oluşturulmalı
- `.env` dosyaları `.gitignore`'da — asla commit'lenmemeli
- `ALLOWED_ORIGINS=*` sadece geliştirme için — üretimde spesifik origin tanımla
- API key'ler (Groq, SerpAPI) `.env`'de — koda gömülmemeli

---

## Docker Komutları

```bash
docker compose up -d                      # Tüm servisleri başlat
docker compose up -d postgres qdrant redis # Sadece altyapı
docker compose logs -f backend ai-llm     # Logları izle
docker compose up -d --build backend      # Backend'i yeniden derle
docker compose down                       # Durdur
docker compose down -v                    # Durdur + verileri sil
```

---

## Detaylı Dokümantasyon

| Bileşen | README |
|---|---|
| Ana API | [backend/README.md](./backend/README.md) |
| AI Servisi | [ai-llm/README.md](./ai-llm/README.md) |
| Mobil Uygulama | [apps/mobile/README.md](./apps/mobile/README.md) |
