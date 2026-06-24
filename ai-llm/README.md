# AsEmOs — Yapay Zeka & Semantik Arama Servisi (AI-LLM)

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) doğal dil işleme, semantik arama ve LLM tabanlı akıllı öneri servisidir. FastAPI kullanılarak yüksek performanslı bir mikroservis olarak tasarlanmıştır.

---

## 💡 Çözülen Problem ve Temel Amacı

Geleneksel arama motorları anahtar kelime eşleşmelerine dayalıdır ve kırılgandır. Örneğin, *"sessiz ve interneti hızlı ders çalışılacak kafe"* araması yapıldığında geleneksel motorlar içinde sadece "ders" veya "kafe" geçen yerleri ararken; AsEmOs yapay zeka servisi:
*   Kullanıcının doğal dildeki niyetini ve ihtiyacını anlar.
*   İstanbul'daki mekanların açıklamaları, özellikleri ve kullanıcı yorumları üzerinden çok dilli (multilingual) semantik benzerlik hesaplar.
*   Coğrafi konum (GPS) mesafesini ve kullanıcı etkileşim geçmişini ağırlıklandırarak en uygun mekanları listeler ve bunları neden önerdiğini doğal dilde açıklar.

---

## ⚡ Öne Çıkan Gelişmiş Özellikler

### 1. Bellek Optimizasyonları & OOM (Out Of Memory) Önleme
Bulut ortamlarındaki (örneğin Render.com Free katmanı - 2GB RAM sınırı) kısıtlı bellek kaynaklarını aşmamak için özel optimizasyonlar uygulanmıştır:
*   **PyTorch Thread Sınırlandırması:** PyTorch'un çoklu CPU çekirdeğinde kontrolsüz iş parçacığı (thread) açarak RAM'i tüketmesi engellenmiştir. Model yüklenirken `torch.set_num_threads(1)` ve `torch.set_num_interop_threads(1)` ayarlanarak bellek kullanımı sınırlandırılmıştır.
*   **Singleton Tasarım Deseni:** `SentenceTransformer` gömme (embedding) modeli yalnızca bir kez, lazy loading (ihtiyaç anında yükleme) ve Singleton yapısıyla belleğe alınır.
*   **Garbage Collector Tetikleme:** Model belleğe yüklendikten hemen sonra Python çöp toplayıcısı (`gc.collect()`) manuel tetiklenerek geçici yükleme artıkları RAM'den temizlenir. Bu sayede servis RAM kullanımı stabil bir şekilde **1.2GB - 1.4GB** bandında tutulur ve OOM kaynaklı çökmeler önlenir.

### 2. Katmanlı LLM (Groq & Gemma Fallback)
Platform, kararlı ve kesintisiz hizmet sunabilmek için katmanlı bir LLM mimarisi kullanır:
*   **Birincil Model (Groq Cloud):** İstekler son derece hızlı çalışan Groq Cloud (`llama-3.1-8b-instant`) servisi ile işlenir ve milisaniyeler içinde yanıtlanır.
*   **İkincil Model (Yerel Gemma 2):** Bulut API'sinde bir kota aşımı, ağ kesintisi veya hata yaşanırsa, sistem otomatik olarak yerel olarak çalışan HuggingFace Gemma 2 modeline veya pure algoritmik skorlama motoruna düşer (fallback).

### 3. Çok Dilli İçerik Filtresi (Content Moderation)
Kullanıcıların yapay zekaya uygunsuz veya alakasız sorgular girmesini önlemek için 7 dilde (Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Rusça, Arapça) çalışan bir içerik filtresi bulunur:
*   Siyaset, din, argo, küfür veya şiddet içerikli sorgular daha yapay zeka motoruna gitmeden elenir ve kullanıcıya uyarı dönülür.

### 4. Redis Akıllı Önbellek (Cache)
*   Sorguların ve semantik yanıtların çift yönlü Redis cache kaydı tutulur (TTL: 15 dakika).
*   Aynı veya çok benzer bir arama tekrar yapıldığında, embedding hesaplama ve LLM açıklama üretme adımları atlanarak yanıt süresi **75 milisaniyeye** kadar düşürülür.

### 5. Qdrant Vektör Veritabanı Entegrasyonu
*   İstanbul'daki doğrulanmış 198 mekanın semantik vektörleri Qdrant üzerinde depolanır.
*   PostgreSQL veritabanı ile otomatik senkronizasyon yeteneği mevcuttur. Çevrimdışı testler için yerel JSON dosyası (`data/loaded_places.json`) üzerinden in-memory Qdrant vektör tabanı oluşturma desteği de sağlanmıştır.

---

## 📂 AI-LLM Dizin Yapısı

```text
ai-llm/
├── app.py                     # Ana FastAPI Servis Uygulaması (Port 8080)
├── chatbot_interaktif.py      # CLI üzerinden çalışan etkileşimli deneme asistanı
├── requirements.txt           # Python kütüphane bağımlılıkları listesi
├── data/                      # Yerel mekan yedekleri ve test JSON verileri
├── docs/                      # Performans test raporları ve metrikler
├── scripts/                   # Vektör veritabanı hazırlama ve veri kazıma betikleri
├── src/
│   ├── api/                   # API rotaları ve istek şemaları
│   ├── models/                # Singleton Embedding ve LLM yükleyiciler
│   ├── rag/                   # Qdrant arama ve RAG (Retrieval-Augmented Generation) akışı
│   ├── recommendation/        # Yorum duygu analizi ve benzerlik skorlama
│   └── vector_db/             # Vektör DB bağlantı yöneticisi
└── tests/                     # Semantik doğruluk ve yük testleri
```

---

## 📍 API Uç Noktaları (Endpoints)

| Endpoint | Metot | Açıklama |
|---|---|---|
| `/health` | GET | Servis sağlık durumunu ve çalışma süresini (uptime) döner. |
| `/api/info` | GET | Aktif embedding modeli, cihaz tipi ve Redis cache istatistiklerini gösterir. |
| `/api/smart-search-v2` | POST | Doğal dildeki mekan arama sorgusunu semantik analiz edip öneri ve LLM açıklamalarıyla döner. |
| `/api/rag-search` | POST | Doğrudan Qdrant vektör tabanından salt semantik mekan eşleşmeleri getirir. |
| `/api/analyze-place-reviews` | POST | Belirli bir mekana ait yorumları NLP ile analiz edip güçlü/zayıf yön özetleri çıkarır. |

---

## ⚙️ Yerel Kurulum ve Çalıştırma

### 1. Bağımlılıkların Kurulması
```bash
cd ai-llm
python -m venv .venv
source .venv/bin/activate # Windows için: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Ortam Değişkenleri Yapılandırması
`ai-llm/` dizininde bir `.env` dosyası oluşturun:
```env
EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_DEVICE=cpu # GPU varsa 'cuda' yazabilirsiniz

# Qdrant Vektör DB
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=mekan_embeddings
RAG_AUTO_INDEX=true
RAG_INDEX_ON_STARTUP=false

# LLM ve API Anahtarları
GROQ_API_KEY=gsk_...
LLM_PROVIDER=groq
LLM_ENABLED=true

# Redis Cache
REDIS_URL=redis://localhost:6379/0
```

### 3. API Sunucusunun Başlatılması
```bash
uvicorn app:app --reload --port 8080
```
Servis `http://localhost:8080` portu üzerinde çalışmaya başlayacaktır.

---

## 💬 Etkileşimli CLI Test Asistanı (`chatbot_interaktif.py`)

Servisi tarayıcı veya mobil olmadan doğrudan terminal üzerinden test etmek için etkileşimli bir sohbet aracı geliştirilmiştir:
```bash
python chatbot_interaktif.py
```

### CLI Kontrol Komutları:
*   `ornek` : Kullanabileceğiniz örnek doğal dil sorgularını listeler.
*   `konum` : Simüle edilen mevcut GPS konumunuzu değiştirmenizi sağlar (örn: Kadıköy, Taksim, Beşiktaş vb.).
*   `yardim` : Yardım menüsünü ekrana basar.
*   `cikis` : Sohbet asistanından güvenli bir şekilde ayrılır.

### Örnek Test Arama Sorguları:
*   *"Sessiz sakin ders çalışmalık bir yer arıyorum wifi olsun"*
*   *"Kadıköy'de deniz manzaralı romantik akşam yemeği mekanları"*
*   *"Çocuk oyun alanı olan aileyle gidilecek restorant"*
*   *"Arkadaşlarla bira içip maç izleyeceğimiz pub"*
