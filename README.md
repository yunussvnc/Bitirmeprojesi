# AsEmOs — Yapay Zeka Destekli Mekan Öneri & Sosyal Platform

> **Bitirme Projesi** | İstanbul'da mekan keşfini yapay zeka ile kişiselleştiren, gerçek zamanlı sosyal etkileşim ve eşleşme platformu.

AsEmOs; kullanıcıların doğal dilde mekan arayabildiği, sosyal etkileşime girebildiği (post, hikaye), anlık eşleşmeler yapabildiği ve sohbet edebildiği modern bir mobil uygulama ekosistemidir. Altyapısında **FastAPI**, **Expo SDK 54**, **Groq & Gemma LLM**, **Qdrant vektör veritabanı**, **PostgreSQL & Redis (Valkey)**, **Cloudinary** ve **Sentence Transformers** teknolojileri kullanılmaktadır.

---

## 🚀 Öne Çıkan Yeni Özellikler

Projenin son fazında sisteme entegre edilen modern ve performans odaklı özellikler:

*   **Hikayeler (Stories) Sistemi:** Kullanıcıların 24 saat süreli görsel/video hikayeler paylaşabilmesi. Backend'de çalışan asenkron arka plan görevleri (Scheduler) ile süresi dolan hikayelerin otomatik silinmesi ve mobil arayüz entegrasyonu.
*   **Keşfet Haritası & İlçe Filtreleme:** Harita üzerinde İstanbul'un ilçelerine (Beşiktaş, Kadıköy vb.) göre filtreleme yapabilme, kullanıcının GPS konumuna göre otomatik odaklanma ve yüksek performanslı harita pinleri.
*   **Dinamik WebView Haritası & Marker Çözümleri:**
    *   **Marker Drift Giderimi:** Leaflet marker'ının flexbox stilleriyle Leaflet absolute koordinat motorunu bozması engellenmiştir. Leaflet wrapper sınıfı boş bırakılıp alt `.custom-marker-inner` div yerleşimiyle marker kaymaları çözülmüştür.
    *   **Harita Kontrast ve Etiketleri:** Harita dark modda iken sokak isimlerinin görünmesi için CartoDB'nin `dark_all` tile sunucuları entegre edilmiştir.
    *   **Zoom Duyarlı Etiketler:** Pinlerin altında yer alan mekan isim etiketleri, harita zoom seviyesi `>= 14` olduğunda görünecek şekilde optimize edilmiştir.
    *   **Harita Performansı:** Pin çizimleri `requestAnimationFrame` (`addBatch`) ile asenkron gruplandırılmış, WebView'e aktarılan payload küçültülmüş ve pin güncellemeleri **120ms debounce** ile filtrelenmiştir.
*   **Redis Caching (Performans):** Mekan listeleme ve arama sorgularının hızlandırılması amacıyla Redis önbelleği (15 dakika TTL). Yeni bir mekan eklendiğinde önbelleğin otomatik temizlenmesi (Cache Invalidation) mekanizması.
*   **Akıllı AI İçerik Filtreleme & Çok Dilli Destek:** Groq ve yerel Gemma modelleri üzerinde çalışan, siyasi, dini veya saldırgan içerikleri engelleyen çok dilli içerik filtresi. Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Arapça ve Rusça (7 dil) desteği.
*   **Sohbet Algılama (Chit-chat Bypass):** "Naber", "nasılsın" gibi sohbet sorgularında anlamsız mekan önermek yerine kullanıcıya dostane ve kendi dilinde sohbet yanıtı veren akıllı diyalog yönetimi.
*   **AI Öneri Geçmişi Puanlaması:** Kullanıcıya yapılan mekan önerilerinde, kullanıcının daha önceki öneri ve etkileşim geçmişinin puanlanması (tekrarlayan önerileri azaltma ve çeşitliliği artırma algoritması).
*   **Kategori Cezalandırma Sistemi (Semantik Doğruluk):** Gündüz aktiviteleri arandığında ('kahvaltı', 'kahve' vb.) gece mekanlarının ('bar', 'pub', 'meyhane', 'gece kulübü') arama sonuçlarında en üstte çıkması ("Meyhane Sofrası" anomalisi), bu kategorilere otomatik **`-5.0` ceza puanı** uygulanarak engellenmiştir.
*   **Groq Llama 3.1 Niyet Sınıflandırıcı:** Kullanıcının sorgularının mekan arama veya yemekle ilgili olup olmadığını analiz eden, genel sohbet sorgularında rehberlik asistanı dönen Groq LLM katmanı eklenmiştir.
*   **PostGIS Geofence Fallback:** Kullanıcıların mekan yorumlarının doğrulanabilmesi için coğrafi sınır (geofence) doğrulaması. PostGIS modülü bulunmayan ortamlarda matematiksel Haversine mesafe formülü ile sorunsuz çalışma.
*   **Vite + React Landing Page (`frontend/`):** 3D grafikler (React Three Fiber & Drei) ve Framer Motion animasyonları içeren modern web tanıtım sitesi sisteme eklenmiştir.
*   **Görsel Sunum Slayt Oluşturucu (`generate_presentation.py`):** Projenin jüri ve tez sunumları için premium tasarımlı 17 slaytlık PowerPoint (`.pptx`) sunumunu programatik olarak üreten araç. Uygulama ekran görüntülerini (`screenshot_map.png`, `screenshot_ai.png` vb.) otomatik algılayıp ilgili slaytlara yerleştirir.
*   **Android Arayüz & BlurView Kırpılma Çözümü:** Giriş ve kayıt kartlarındaki `BlurView` bileşeninin Android'de köşe yuvarlama ve kenarlık kırpma sorunları, BlurView'ün standard bir `View` içine absolute yerleştirilmesiyle çözülmüştür.
*   **Input Şifre Göz İkonu Tıklanma Revizyonu:** Şifre gizleme/gösterme ikonunun tıklama alanını genişletmek için `hitSlop` eklendi, boyutu `22`ye çıkarıldı ve dikey metin kesilmeleri engellendi.
*   **Chat Senkronizasyonu & Görüldü Bildirimleri:** WebSocket ve polling üzerinden yürüyen DMs/sohbet ekranında optimistic (geçici ID'li) yerel kullanıcı mesajlarının kaybolması, `backendIdSet` polling entegrasyonuyla engellenmiştir.

---

## 📐 Mimari Genel Bakış

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Mobil Uygulama & Web Landing Page                        │
│          Expo SDK 54 (Zustand)  ·  Next.js 15 Admin  ·  Vite Web Client     │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
             Port 8000 (FastAPI)             Port 8080 (AI Servisi)
             REST API + WebSockets           REST API + RAG + Cache
                       │                               │
 ┌─────────────────────▼───┐               ┌───────────▼─────────────────────┐
 │     BACKEND             │               │         AI-LLM                  │
 │     FastAPI             │               │         FastAPI                 │
 │                         │               │                                 │
 │  • Auth & Google Login  │               │  • Doğal Dil Mekan Arama        │
 │  • Mekan CRUD & Cache   │               │  • SerpAPI → Google Maps        │
 │  • Hikaye & Sosyal Akış │               │  • Qdrant Vektör Araması        │
 │  • Gerçek Zamanlı Chat  │               │    (198 Gerçek İstanbul Mekanı) │
 │  • Coğrafi Doğrulama    │               │  • Redis Cache & Model Preload  │
 │  • Bildirimler (WS)     │               │  • Çok Dilli İçerik Filtresi    │
 │  • Kategori Cezaları    │               │  • Katmanlı LLM (Groq -> Gemma) │
 └───────────┬─────────────┘               └─────────────────┬───────────────┘
             │                                               │
     PostgreSQL (5432)                          Qdrant (6333) + Redis (6379)
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| **Mobil (App)** | React Native, Expo SDK 54, TypeScript, Expo Router, Zustand, Leaflet JS & WebView Harita, Lucide Icons, i18next | Tam modüler, performanslı ve yerel (native) kamera entegrasyonlu modern mobil arayüz. |
| **Tanıtım Web** | Vite, React 19, TypeScript, React Three Fiber & Drei, Framer Motion | 3D etkileşimli modern landing page. |
| **Backend API** | Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis Pub/Sub, Websockets | JWT + Google Auth, CRUD, asenkron background tasks ve sohbet sunucusu. |
| **AI Servisi** | Python 3.11, FastAPI, Sentence Transformers, Qdrant, HuggingFace Transformers, PyTorch | Semantik arama, vektör indeksleme, yerel duygu analizi ve LLM yönetim servisi. |
| **LLM Katmanı** | Groq Cloud (`llama-3.1-8b-instant`) + HuggingFace Local Gemma 2 | Hızlı cloud yanıtı alan, hata durumunda yerel modele veya puanlama motoruna düşen dayanıklı zincir. |
| **Vektör Arama** | Qdrant + `paraphrase-multilingual-MiniLM-L12-v2` | Çok dilli (multilingual) semantik arama yeteneği ve 198 doğrulanmış İstanbul mekanı. |
| **Önbellek (Cache)**| Redis (FastAPI + AI-LLM katmanlarında ayrı ayrı caching) | Mekan sorgularını ve oturum verilerini milisaniyeler seviyesine indiren önbellek yapısı. |
| **Medya Depolama**| Cloudinary & Local Storage Fallback | Kullanıcı profil resimleri, postlar ve hikaye medyaları için CDN destekli depolama. |
| **Kapsülleme** | Docker & Docker Compose | Yerel geliştirmede servisleri tek komutla ayağa kaldırır. Bulutta (Render.com) ise Dockerfile'lar üzerinden konteyner tabanlı otomatik dağıtım sağlar. |

---

## 🐳 Bulut Dağıtımı & Bellek Optimizasyonları (OOM Önleme)
AsEmOs platformunun tüm sunucu servisleri bulutta (Render.com) **Docker** ile çalışmaktadır:
*   **Bellek & CPU Optimizasyonları:** AI Servisi (`asemos-ai`) gibi bellek sınırı bulunan (Render Free - 2GB RAM) ortamlarda, PyTorch thread sayısı sınırlandırılmış (`torch.set_num_threads(1)`), model yükleme Singleton tasarımıyla sarmalanmış ve Uvicorn worker sayısı `1`'e indirilerek bellek aşımı (OOM) tamamen engellenmiştir.

---

## 📂 Proje Dizin Yapısı

```text
BitirmeProjesi/
├── backend/                  # FastAPI Ana API Servisi (Port 8000)
│   ├── app/
│   │   ├── core/             # Redis client, JWT güvenlik, konfigürasyon (config.py)
│   │   ├── middleware/       # Hata ayıklama, rate limiting, logging
│   │   ├── routers/          # Modüler endpoint'ler (auth, stories, match, feed...)
│   │   ├── services/         # Push bildirimleri, asenkron background tasks (scheduler, moderator)
│   │   └── websocket/        # Real-time chat ve bildirim websocket yönetimi
│   ├── crud.py               # Veritabanı sorguları (caching, geofencing, pagination)
│   └── llm_recommend.py      # Kategori cezaları ve Groq niyet kontrolü destekli AI öneri motoru
│
├── ai-llm/                   # AI & Semantik Arama Servisi (Port 8080)
│   ├── app.py                # FastAPI uygulaması (Redis cache & preload entegreli)
│   ├── review_analyzer.py    # NLP tabanlı yorum analizi ve duygu analizi
│   └── src/
│       ├── models/embeddings/# Singleton sarmalanmış SentenceTransformers
│       └── rag/              # Qdrant entegrasyonu ve RAG akışı
│
├── apps/mobile/              # React Native Expo Mobil Uygulaması
│   ├── app/                  # Expo Router sayfaları (Tabs ve Stack Yapısı)
│   └── src/
│       ├── components/       # Domain bazlı WebView harita, chat ve ui bileşenleri
│       └── store/            # Zustand global state (Auth, UI, Theme, Chat)
│
├── frontend/                 # Vite + React 19 3D Landing Page
│   ├── src/                  # App.tsx ve React Three Fiber 3D bileşenleri
│   └── index.html            # Web sitesi giriş sayfası
│
├── admin/                    # Next.js 15 Web Yönetim Paneli
│   ├── app/                  # (auth) ve (dashboard) Next.js router yapısı
│   └── components/           # Yönetici paneli UI bileşenleri
│
├── docker-compose.yml        # PostgreSQL, Redis ve Qdrant konteyner ayarları
└── .env.example              # Gerekli çevre değişkenleri şablonu
```

---

## ⚙️ Hızlı Başlangıç

### 1. Ortam Değişkenleri
Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli API anahtarlarını doldurun.

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
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8080
```

### 5. Mobil Uygulamayı Başlatın
```bash
cd apps/mobile
npm install
npx expo start
```

### 6. Web Tanıtım Sitesini Başlatın
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Dokümantasyon Bağlantıları

1.  **Backend API Detayları:** [backend/README.md](file:///d:/BitirmeProjesi/backend/README.md)
2.  **AI Servisi & RAG Yapısı:** [ai-llm/README.md](file:///d:/BitirmeProjesi/ai-llm/README.md)
3.  **Mobil Uygulama Kurulumu:** [apps/mobile/README.md](file:///d:/BitirmeProjesi/apps/mobile/README.md)
4.  **Web Tanıtım Sitesi:** [frontend/README.md](file:///d:/BitirmeProjesi/frontend/README.md)
