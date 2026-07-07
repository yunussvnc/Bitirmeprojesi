# 🚀 AsEmOs — Claude El Kitabı & Handoff Kılavuzu

Bu belge, **AsEmOs (Aktivite ve Semantik Arama Tabanlı Mekan Öneri & Sosyal Platform)** projesinde Claude'un projeyi hızlıca anlaması, mimariyi kavraması ve geliştirme yaparken dikkat etmesi gereken kritik detayları içermektedir.

---

## 📌 Proje Genel Bakış

*   **Projenin Adı:** AsEmOs
*   **Geliştiriciler:** Yunus Emre Sevinç & Ulaş Can Demirtaş
*   **Amaç:** İstanbul'da mekan keşfini kelime eşleme sınırlarından kurtarıp semantik (anlamsal) arama, kullanıcı duygu analizi ve LLM destekli RAG mimarisiyle kişiselleştiren, aynı zamanda kullanıcıların post/hikaye paylaşabildiği ve gerçek zamanlı eşleşip sohbet edebildiği dinamik bir mobil ekosistem.

---

## ⚙️ Mimari ve Teknoloji Stack

AsEmOs birbirine bağlı 5 ana bileşenden (modülden) oluşmaktadır:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Mobil Uygulama & Web Landing Page                        │
│          Expo SDK 54 (Zustand)  ·  Next.js 15 Admin  ·  Vite Web Client     │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
             Port 8000 (FastAPI)             Port 8080 (AI Servisi)
             REST API + WebSockets           REST API + RAG + Cache
                       │                               │
  ┌────────────────────▼───┐               ┌───────────▼─────────────────────┐
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

### Teknoloji Detayları

1.  **Mobil (App):** React Native + [Expo SDK 54](file:///d:/BitirmeProjesi/apps/mobile/package.json), Expo Router, Zustand (Global State), Leaflet JS & WebView Harita, Lucide Icons, i18next (Çoklu Dil).
2.  **Backend API:** Python 3.11, [FastAPI](file:///d:/BitirmeProjesi/backend/main.py), SQLAlchemy, Alembic, PostgreSQL, Redis Pub/Sub, WebSockets.
3.  **AI Servisi:** Python 3.11, [FastAPI (ai-llm)](file:///d:/BitirmeProjesi/ai-llm/app.py), Sentence Transformers (`paraphrase-multilingual-MiniLM-L12-v2`), Qdrant, HuggingFace Transformers, PyTorch.
4.  **LLM Katmanı:** Groq Cloud (`llama-3.1-8b-instant`) + HuggingFace Yerel Gemma 2 (hata durumunda fallback).
5.  **Tanıtım Web:** Vite, React 19, TypeScript, React Three Fiber & Drei, Framer Motion (3D Landing Page).
6.  **Admin:** Next.js 15 Web Yönetici Paneli.

---

## 📂 Dizin Yapısı ve Önemli Dosyalar

*   **[backend/](file:///d:/BitirmeProjesi/backend)**: Ana API servisi.
    *   **[backend/app/models.py](file:///d:/BitirmeProjesi/backend/app/models.py)**: PostgreSQL veritabanı modelleri (User, Venue, Story, Post, Message, Match vb.).
    *   **[backend/app/routers/](file:///d:/BitirmeProjesi/backend/app/routers)**: Endpoint tanımları (auth, feed, stories, match, venues).
    *   **[backend/app/websocket/](file:///d:/BitirmeProjesi/backend/app/websocket)**: Sohbet ve bildirimler için WebSocket bağlantı yöneticisi.
    *   **[backend/crud.py](file:///d:/BitirmeProjesi/backend/crud.py)**: Tüm veritabanı CRUD operasyonları, geofencing, caching ve sayfalama logic'leri.
    *   **[backend/llm_recommend.py](file:///d:/BitirmeProjesi/backend/llm_recommend.py)**: Groq niyet kontrolü ve kategori cezaları barındıran AI öneri motoru.
*   **[ai-llm/](file:///d:/BitirmeProjesi/ai-llm)**: Vektör arama ve NLP servisleri.
    *   **[ai-llm/app.py](file:///d:/BitirmeProjesi/ai-llm/app.py)**: Vektör araması, duygu analizi, RAG akışı ve içerik moderasyon endpoint'leri.
    *   **[ai-llm/review_analyzer.py](file:///d:/BitirmeProjesi/ai-llm/review_analyzer.py)**: NLP tabanlı yorum ve duygu analizi modülü.
    *   **[ai-llm/src/vector_db/](file:///d:/BitirmeProjesi/ai-llm/src/vector_db)**: Qdrant entegrasyonu.
*   **[apps/mobile/](file:///d:/BitirmeProjesi/apps/mobile)**: Expo mobil uygulaması.
    *   **[apps/mobile/app/](file:///d:/BitirmeProjesi/apps/mobile/app)**: Ekranlar (Tab navigation ve Stack sayfaları).
    *   **[apps/mobile/src/store/](file:///d:/BitirmeProjesi/apps/mobile/src/store)**: Zustand store'ları (auth, chat, theme vb.).
    *   **[apps/mobile/src/components/](file:///d:/BitirmeProjesi/apps/mobile/src/components)**: WebView harita component'i ve dinamik pinleme.

---

## 💡 Kritik Mekanizmalar & Algoritmalar

### 1. Kategori Cezalandırma Sistemi (Category Penalty Engine)
Kullanıcı "ders çalışabileceğim sakin bir yer" aradığında, semantik arama cosine benzerliği nedeniyle "konser/eğlence" mekanlarını da getirebilir. `backend/llm_recommend.py` ve `ai-llm/app.py` içinde yer alan akıllı ceza mekanizması:
*   Kullanıcı sakin bir ortam arıyorsa, `bar`, `pub`, `nightclub` veya yüksek sesli mekanların cosine skoru dinamik olarak düşürülür (`-5.0` ceza puanı uygulanır).
*   Gündüz/gece dengesi sağlanarak zaman farkındalığıyla arama sonuçları filtrelenir.

### 2. OOM (Out Of Memory) Önleme (Bulut Dağıtımı / Render.com)
`ai-llm` servisi Render'ın ücretsiz paketinde (2GB RAM sınırı) OOM vermeden çalışabilmesi için şu önlemler alınmıştır:
*   PyTorch thread sayısı sınırlandırılmıştır: `torch.set_num_threads(1)`
*   Cuda devre dışı bırakılmış ve model yüklemeleri Singleton deseniyle sarmalanmıştır (bellekte tek kopya tutulur).
*   Uvicorn worker sayısı `1`'e indirilmiştir.

### 3. WebView Tabanlı Leaflet JS Harita Entegrasyonu
Mobil tarafta yerel harita kütüphanelerinin (Google Maps / Mapbox) ağır bağımlılık yükü ve maliyetlerinden kaçınmak amacıyla WebView içinde çalışan hafif **Leaflet JS** harita altyapısı kurulmuştur.
*   Zoom seviyesine göre dinamik pin gruplama ve filtreleme yapar.
*   Yerel (native) konumu WebView'a köprü (bridge) aracılığıyla iletir.

### 4. WebSocket Sohbet ve Optimistic Sync
Kullanıcı mesaj gönderdiğinde arayüzde anında gösterilir (optimistic update). Arka planda sunucuya WebSocket üzerinden iletilir:
*   İnternet kesintisi durumunda mesajlar yerel veri havuzunda birikir.
*   Sunucudan başarılı onay alındığında `backendIdSet` ile geçici ID gerçek veritabanı ID'siyle eşleştirilerek mükerrer kayıtların oluşması önlenir.

---

## 🛠️ Kurulum ve Çalıştırma Adımları

### 1. Altyapıyı Başlatma (Docker)
```bash
docker compose up -d postgres qdrant redis
```

### 2. FastAPI Backend'i Çalıştırma
```bash
cd backend
# Sanal ortam oluşturup aktif edin
python -m venv .venv
.venv\Scripts\activate # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### 3. AI Servisini Çalıştırma
```bash
cd ai-llm
python -m venv .venv
.venv\Scripts\activate # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8080
```

### 4. Mobil Uygulamayı Çalıştırma
```bash
cd apps/mobile
npm install
npx expo start
```

---

## 🎓 Akademik Soru ve Cevap Referansları (Jüriye Özel)

Claude ile tez hazırlığı veya jüri revizyonu yaparken `HOCA_SORULARI_VE_CEVAPLAR.md` dosyasındaki verileri doğrudan referans alabilirsiniz. En önemli 3 teknik soru:

1.  **Benzerlik Eşiği neden >0.40 seçildi?**
    *   0.25 - 0.65 aralığında grid-search yapıldı. F1-Score analizinde en yüksek doğruluğun `%90 F1-Score` ile `0.40` eşiğinde (Sweet Spot) yakalandığı deneysel olarak kanıtlandı.
2.  **Halüsinasyon nasıl engellendi?**
    *   **Closed-Context RAG:** LLM'e sadece Qdrant'tan gelen 198 gerçek İstanbul mekanının detayları verilir. Dış veri kullanımı prompt ile yasaklanmıştır.
    *   **Low Temperature:** Görsel analiz ve niyet sınıflandırmasında `temperature: 0.1` kullanılarak yaratıcılık kapatılmış, olgusal tutarlılık sağlanmıştır.
    *   **Kural Tabanlı Ön Filtre:** Uygunsuz/siyasi sorgular LLM'e gitmeden yakalanır.
3.  **Performans Metrikleri Nelerdir?**
    *   Sistem 100 sorguluk test setinde `%98` niyet sınıflandırma doğruluğu ve `%92` Precision@3 değerine ulaşmıştır. Redis cache sayesinde ortalama yanıt süresi **140 ms** seviyesindedir (LLM Rerank durumunda ~1.25 sn).

---

## 📝 Son Geliştirme Notları

*   Sosyal medya akışı için Cloudinary medya depolama altyapısı ve local fallback çalışır durumdadır.
*   Otomatik hikaye silici zamanlayıcı arka planda FastAPI startup event'i olarak asenkron çalışır ve 24 saati dolan hikayeleri veri tabanından temizler.
*   Projeye dair ek testler `ai-llm/tests/` ve `backend/tests/` dizini altında yer almaktadır.

## 🧭 Davranışsal Kodlama İlkeleri (Karpathy)

LLM'lerin sık yaptığı kodlama hatalarını azaltmak için davranışsal rehber. Aşağıdaki proje-özel talimatlarla birlikte uygulanır.

**Denge:** Bu ilkeler hız yerine dikkati önceler. Basit görevlerde takdir kullanılabilir.

### 1. Kodlamadan Önce Düşün

**Varsayma. Kafa karışıklığını gizleme. Ödünleşimleri açıkça belirt.**

Uygulamadan önce:
*   Varsayımlarını açıkça belirt. Emin değilsen sor.
*   Birden fazla yorum mümkünse hepsini sun — sessizce birini seçme.
*   Daha basit bir yaklaşım varsa söyle. Gerekirse itiraz et.
*   Bir şey belirsizse dur. Neyin kafa karıştırdığını söyle. Sor.

### 2. Önce Basitlik

**Sorunu çözen minimum kod. Spekülatif hiçbir şey yok.**

*   İstenenin ötesinde özellik yok.
*   Tek kullanımlık kod için soyutlama yok.
*   İstenmeyen "esneklik" veya "yapılandırılabilirlik" yok.
*   İmkânsız senaryolar için hata yönetimi yok.
*   200 satır yazdıysan ve 50 satıra sığabiliyorsa, yeniden yaz.

Kendine sor: "Kıdemli bir mühendis bunun gereksiz karmaşık olduğunu söyler mi?" Evetse basitleştir.

### 3. Cerrahi Değişiklikler

**Sadece zorunlu olana dokun. Sadece kendi karmaşanı temizle.**

Mevcut kodu düzenlerken:
*   Bitişik kodu, yorumları veya biçimlendirmeyi "iyileştirme".
*   Bozuk olmayan şeyleri yeniden düzenleme.
*   Farklı yapardın bile olsa mevcut stile uy.
*   İlgisiz ölü kod fark edersen belirt — silme.

Değişikliklerin öksüz kod oluşturduğunda:
*   SENİN değişikliklerinin kullanılmaz hale getirdiği import/değişken/fonksiyonları kaldır.
*   İstenmedikçe önceden var olan ölü kodu kaldırma.

Test: Değiştirilen her satır doğrudan kullanıcının isteğine izlenebilmeli.

### 4. Hedef Odaklı Uygulama

**Başarı kriterlerini tanımla. Doğrulanana kadar döngüde kal.**

Görevleri doğrulanabilir hedeflere dönüştür:
*   "Doğrulama ekle" → "Geçersiz girdiler için testler yaz, sonra onları geçir"
*   "Hatayı düzelt" → "Hatayı yeniden üreten bir test yaz, sonra geçir"
*   "X'i yeniden düzenle" → "Testlerin öncesinde ve sonrasında geçtiğinden emin ol"

Çok adımlı görevlerde kısa bir plan belirt:

```text
1. [Adım] → doğrula: [kontrol]
2. [Adım] → doğrula: [kontrol]
3. [Adım] → doğrula: [kontrol]
```

Güçlü başarı kriterleri bağımsız döngü kurmanı sağlar. Zayıf kriterler ("çalışsın") sürekli netleştirme gerektirir.

**Bu ilkeler işe yarıyorsa:** diff'lerde daha az gereksiz değişiklik, aşırı karmaşıklıktan kaynaklanan daha az yeniden yazım, hatalardan sonra değil uygulamadan önce netleştirici sorular görülür.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
