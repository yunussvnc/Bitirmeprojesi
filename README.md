# AsEmOs — Yapay Zeka Destekli Mekan Öneri & Sosyal Platform

> **Bitirme Projesi** | İstanbul'da mekan keşfini yapay zeka ile kişiselleştiren, gerçek zamanlı sosyal etkileşim ve eşleşme platformu.

AsEmOs; kullanıcıların doğal dilde mekan arayabildiği, sosyal etkileşime girebildiği (post, hikaye), anlık eşleşmeler yapabildiği ve sohbet edebildiği modern bir mobil uygulama ekosistemidir. Altyapısında **FastAPI**, **Expo SDK 54**, **Groq & Gemma LLM**, **Qdrant vektör veritabanı**, **PostgreSQL & Redis**, **Cloudinary** ve **Sentence Transformers** teknolojileri kullanılmaktadır.

---

## 🚀 Öne Çıkan Yeni Özellikler

Projenin son fazında sisteme entegre edilen modern ve performans odaklı özellikler:

*   **Hikayeler (Stories) Sistemi:** Kullanıcıların 24 saat süreli görsel/video hikayeler paylaşabilmesi. Backend'de çalışan asenkron arka plan görevleri (Scheduler) ile süresi dolan hikayelerin otomatik silinmesi ve mobil arayüz entegrasyonu.
*   **Keşfet Haritası & İlçe Filtreleme:** Harita üzerinde İstanbul'un ilçelerine (Beşiktaş, Kadıköy vb.) göre filtreleme yapabilme, kullanıcının GPS konumuna göre otomatik odaklanma ve yüksek performanslı harita pinleri.
*   **Redis Caching (Performans):** Mekan listeleme ve arama sorgularının hızlandırılması amacıyla Redis önbelleği (15 dakika TTL). Yeni bir mekan eklendiğinde önbelleğin otomatik temizlenmesi (Cache Invalidation) mekanizması.
*   **Akıllı AI İçerik Filtreleme & Çok Dilli Destek:** Groq ve yerel Gemma modelleri üzerinde çalışan, siyasi, dini veya saldırgan içerikleri engelleyen çok dilli içerik filtresi. Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Arapça ve Rusça (7 dil) desteği.
*   **Sohbet Algılama (Chit-chat Bypass):** "Naber", "nasılsın" gibi sohbet sorgularında anlamsız mekan önermek yerine kullanıcıya dostane ve kendi dilinde sohbet yanıtı veren akıllı diyalog yönetimi.
*   **AI Öneri Geçmişi Puanlaması:** Kullanıcıya yapılan mekan önerilerinde, kullanıcının daha önceki öneri ve etkileşim geçmişinin puanlanması (tekrarlayan önerileri azaltma ve çeşitliliği artırma algoritması).
*   **PostGIS Geofence Fallback:** Kullanıcıların mekan yorumlarının doğrulanabilmesi için coğrafi sınır (geofence) doğrulaması. PostGIS modülü bulunmayan ortamlarda matematiksel Haversine mesafe formülü ile sorunsuz çalışan geri çekilme (fallback) mimarisi.
*   **Google Sign-In Entegrasyonu:** Mobil APK ve bağımsız (standalone) build'lerdeki Google kimlik doğrulama ve yönlendirme (redirect URI) süreçlerinin tamamen düzeltilmesi.
*   **Medya Yükleme & Blurhash:** Cloudinary entegrasyonlu profil ve post görseli yükleme, yüklenen görsellerin mobil tarafta anında yüklenmesi için Blurhash (bulanık önizleme) kodlama desteği.

---

## 📐 Mimari Genel Bakış

```text
┌──────────────────────────────────────────────────────────────┐
│                   Mobil Uygulama (Expo SDK 54)               │
│              React Native · iOS · Android · Web · Zustand    │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
          Port 8000 (FastAPI)     Port 8080 (AI Servisi)
          REST API + WebSockets   REST API + RAG + Cache
                 │                      │
┌────────────────▼───────┐   ┌──────────▼──────────────────────┐
│     BACKEND            │   │         AI-LLM                  │
│     FastAPI            │   │         FastAPI                 │
│                        │   │                                 │
│  • Auth & Google Login │   │  • Doğal Dil Mekan Arama        │
│  • Mekan CRUD & Cache  │   │  • SerpAPI → Google Maps        │
│  • Hikaye & Sosyal Akış│   │  • Qdrant Vektör Araması        │
│  • Gerçek Zamanlı Chat │   │    (198 Gerçek İstanbul Mekanı) │
│  • Coğrafi Doğrulama   │   │  • Redis Cache & Model Preload  │
│  • Bildirimler (WS)    │   │  • Çok Dilli İçerik Filtresi    │
│  • AI Öneri Geçmişi    │   │  • Katmanlı LLM (Groq -> Gemma) │
└────────────┬───────────┘   └──────────────────┬──────────────┘
             │                                  │
     PostgreSQL (5432)             Qdrant (6333) + Redis (6379)
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| **Mobil (App)** | React Native, Expo SDK 54, TypeScript, Expo Router, Zustand, React Native Maps, Lucide Icons, i18next | Tam modüler, performanslı ve yerel (native) harita/kamera entegrasyonlu modern mobil arayüz. |
| **Backend API** | Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis Pub/Sub, Websockets | JWT + Google Auth, CRUD, gerçek zamanlı sohbet ve bildirim sunucusu. |
| **AI Servisi** | Python 3.11, FastAPI, Sentence Transformers, Qdrant, HuggingFace Transformers, PyTorch | Semantik arama, vektör indeksleme, yerel duygu analizi ve LLM yönetim servisi. |
| **LLM Katmanı** | Groq Cloud (`llama-3.1-8b-instant`) + HuggingFace Local Gemma 2 | Hızlı cloud yanıtı alan, hata durumunda yerel modele veya puanlama motoruna düşen dayanıklı zincir. |
| **Vektör Arama** | Qdrant + `paraphrase-multilingual-MiniLM-L12-v2` | Çok dilli (multilingual) semantik arama yeteneği ve 198 doğrulanmış İstanbul mekanı. |
| **Önbellek (Cache)** | Redis (FastAPI + AI-LLM katmanlarında ayrı ayrı caching) | Mekan sorgularını ve oturum verilerini milisaniyeler seviyesine indiren önbellek yapısı. |
| **Medya Depolama**| Cloudinary & Local Storage Fallback | Kullanıcı profil resimleri, postlar ve hikaye medyaları için CDN destekli depolama. |
| **Kapsülleme** | Docker Compose | Çoklu servis mimarisini tek komutla ayağa kaldıran yapı. |

---

## 🤖 LLM Katman Mimarisi (Resilient Flow)

Sistem, API limitlerine ve ağ kesintilerine karşı dayanıklı hibrit bir LLM akışı kullanır:

```text
Kullanıcı Doğal Dil Sorgusu Gönderdi
                ↓
┌─────────────────────────────────────────┐
│     Katman 1: Groq Cloud LLM            │  ← llama-3.1-8b-instant (~0.4 - 0.6 sn)
│     (Çok hızlı, bulut tabanlı API)      │
└───────────────┬─────────────────────────┘
                │ Başarısız / Kota Aşımı / Ağ Hatası
                ↓
┌─────────────────────────────────────────┐
│     Katman 2: Gemma 2 (Local / RAG)     │  ← HuggingFace yerel modeli (Güvenli Fallback)
│     veya Algoritmik Scoring Fallback    │  ← Çevrimdışı çalışabilirlik garantisi
└─────────────────────────────────────────┘
```

---

## 📂 Proje Dizin Yapısı

```text
BitirmeProjesi/
├── backend/                  # FastAPI Ana API Servisi (Port 8000)
│   ├── app/
│   │   ├── core/             # Redis client, güvenlik ayarları
│   │   ├── middleware/       # Hata ayıklama, rate limiting, logging
│   │   ├── routers/          # Modüler endpoint'ler (auth, stories, match, feed...)
│   │   ├── services/         # Push bildirimleri, arka plan işleri (scheduler)
│   │   └── websocket/        # Real-time chat ve bildirim websocket yönetimi
│   ├── models.py             # SQLAlchemy DB Modelleri
│   ├── crud.py               # Veritabanı sorguları (caching, geofencing, pagination)
│   ├── llm_client.py         # Groq / OpenAI / Ollama API adaptörleri
│   └── llm_recommend.py      # Geçmiş puanlama destekli AI öneri motoru
│
├── ai-llm/                   # AI & Semantik Arama Servisi (Port 8080)
│   ├── app.py                # FastAPI uygulaması (Redis cache & preload entegreli)
│   ├── review_analyzer.py    # NLP tabanlı yorum analizi ve duygu analizi
│   ├── serpapi_client.py     # Google Maps'ten gerçek veri çekme modülü
│   └── src/
│       ├── models/llm/       # LayeredLLMWrapper (Groq -> Gemma)
│       └── rag/              # Qdrant entegrasyonu ve RAG akışı
│
├── apps/mobile/              # React Native Expo Mobil Uygulaması
│   ├── app/                  # Expo Router sayfaları (Tabs ve Stack Yapısı)
│   └── src/
│       ├── components/       # UI bileşenleri (domain bazlı modüller)
│       ├── services/         # API ve AI servisleri istemci katmanı (Axios + WS)
│       └── store/            # Zustand global state (Auth, UI, Theme, Chat)
│
├── docker-compose.yml        # PostgreSQL, Redis ve Qdrant konteyner ayarları
└── .env.example              # Gerekli çevre değişkenleri şablonu
```

---

## ⚙️ Hızlı Başlangıç

### 1. Ortam Değişkenleri
Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli API anahtarlarını doldurun:
```bash
cp .env.example .env
```
Gerekli alanlar:
*   `GROQ_API_KEY`: Groq bulut servis anahtarı.
*   `SERPAPI_KEY`: Google Maps mekan verilerini güncellemek için.
*   `JWT_SECRET_KEY`: Güvenli token üretimi için gizli anahtar.
*   `CLOUDINARY_URL`: Görsel yüklemeleri için Cloudinary API URL'i.

### 2. Docker Konteynerlerini Başlatın
PostgreSQL, Qdrant vektör veritabanı ve Redis servislerini Docker üzerinde ayağa kaldırın:
```bash
docker compose up -d postgres qdrant redis
```

### 3. Backend API'yi Çalıştırın
```bash
cd backend
python -m venv .venv
source .venv/bin/activate # Windows için: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head # Veritabanı tablolarını güncelleyin
uvicorn main:app --reload --port 8000
```

### 4. AI Servisini Çalıştırın
```bash
cd ai-llm
python -m venv .venv
source .venv/bin/activate # Windows için: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8080

# Vektör veritabanına mekanları yükleyin (İlk kurulumda)
python scripts/prepare_vector_db.py --json data/loaded_places.json --force
```

### 5. Mobil Uygulamayı Başlatın
```bash
cd apps/mobile
npm install
npx expo start
```

---

## 📖 Dokümantasyon Bağlantıları

Geliştirici kılavuzları ve detaylı API dokümantasyonları için alt dizinlerdeki README dosyalarını inceleyebilirsiniz:

1.  **Backend API Detayları:** [backend/README.md](file:///d:/BitirmeProjesi/backend/README.md)
2.  **AI Servisi & RAG Yapısı:** [ai-llm/README.md](file:///d:/BitirmeProjesi/ai-llm/README.md)
3.  **Mobil Uygulama Kurulumu:** [apps/mobile/README.md](file:///d:/BitirmeProjesi/apps/mobile/README.md) (Yeni)
