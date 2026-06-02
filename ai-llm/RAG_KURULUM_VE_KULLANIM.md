# RAG Sistemi Kurulum ve Kullanım Rehberi

## 🎯 Özet

RAG (Retrieval Augmented Generation) sistemi artık **AKTIF**! 

- ✅ Qdrant vektör veritabanı: In-memory mode (Docker/Cloud gerekmez)
- ✅ 50 mekan verisi yüklendi (Kadıköy, Beşiktaş, Beyoğlu)
- ✅ Sentence-Transformers embedding model
- ✅ Hibrit arama: SerpAPI + RAG (en iyi ikisinin kombinasyonu)
- ✅ Pure RAG endpoint eklendi

---

## 📋 Kurulum Adımları

### 1. Bağımlılıkları Yükle

```bash
cd ai-llm
pip install qdrant-client sentence-transformers
```

### 2. Vektör Veritabanını Hazırla

```bash
# Mekan verilerini Qdrant'a yükle
python scripts/prepare_vector_db.py
```

Çıktı:
```
====================================================
Vektör Veritabanı Hazırlama
====================================================

📥 JSON dosyasından mekanlar yükleniyor...
✓ 50 mekan bulundu

🤖 Embedding modeli yükleniyor...
✓ Model yüklendi (Vektör boyutu: 384)

🗄️  Qdrant bağlantısı kuruluyor...
✓ Qdrant hazır

🔄 Embedding'ler oluşturuluyor...
✓ 50 embedding oluşturuldu

📤 Qdrant'a yükleniyor...
  ✓ 50/50 mekan yüklendi

✓ Toplam 50 mekan Qdrant'a yüklendi
====================================================
Vektör veritabanı hazırlama tamamlandı! 🎉
====================================================
```

### 3. Servisi Başlat

```bash
python app.py
```

Çıktı:
```
============================================================
FAZ 2: STARTUP - Sistem Başlatılıyor
============================================================
[Startup] Cache Manager (Redis): OK redis://localhost:6379/0
[Startup] Model yukleme arka planda baslatildi...
[Startup] RAG sistemi arka planda baslatiliyor...
[Startup] Version: 2.1 (Performance Optimized + RAG)
============================================================

[RAG] RAG sistemi başlatılıyor...
[RAG] ✓ RAG sistemi hazır!
```

---

## 🧪 Test Etme

### Test Script'i Çalıştır

```bash
python test_rag_system.py
```

Örnek çıktı:
```
============================================================
RAG SİSTEMİ TEST
============================================================

🤖 RAG sistemi başlatılıyor...
✓ RAG sistemi hazır

📝 Test sorguları:
1. Kadıköy'de sessiz ve sakin bir kafe
2. Deniz manzaralı restoran
3. Kahvesiyle ünlü bir mekan
4. Beşiktaş'ta hamburger yiyebileceğim yer
5. Romantik bir akşam yemeği için restoran

============================================================
SORGU: Kadıköy'de sessiz ve sakin bir kafe
============================================================

✓ 5 mekan bulundu

📊 Analiz: Kullanıcı Kadıköy'de sessiz bir kafe arıyor...

1. Moloko coffee kadikoy
   Kategori: Kahve dükkanı
   Benzerlik: 0.751
   Adres: Osmanağa, Arayıcıbaşı Sk. No:23 D:25, 34375 Kadıkõy/İstanbul

2. Books & Coffee Yeldeğirmeni
   Kategori: Kahve dükkanı
   Benzerlik: 0.732
   Adres: Rasimpaşa, Karakolhane Cd. No: 38, 34716 Kadıköy/İstanbul

3. V Coffee Kadıköy
   Kategori: Kahve dükkanı
   Benzerlik: 0.718
   Adres: Rasimpaşa, İzzettin Sk. No:44/B, 34716 Kadıköy/İstanbul
```

---

## 🔌 API Kullanımı

### 1. Hibrit Arama (SerpAPI + RAG) - ÖNERİLEN

**Endpoint:** `POST /api/smart-search-v2`

```json
{
  "query": "Kadıköy'de sakin bir kafe",
  "location": "Istanbul",
  "user_lat": 40.99,
  "user_lng": 29.03,
  "limit": 10
}
```

**Response:**
```json
{
  "query": "Kadıköy'de sakin bir kafe",
  "found": 25,
  "recommendations": [
    {
      "name": "Moloko coffee kadikoy",
      "rating": 4.7,
      "match_score": 0.89,
      "recommendation_reason": "⭐ Yüksek puan (4.7) • 📍 Yakın (1.2km) • 💬 Sakin sohbet için ideal"
    }
  ],
  "ai_message": "Size Kadıköy'de...",
  "rag_context": {
    "similar_places_count": 5,
    "analysis": "Vektör veritabanında 5 benzer mekan bulundu",
    "top_matches": [
      {
        "name": "Moloko coffee kadikoy",
        "category": "Kahve dükkanı",
        "score": 0.751
      }
    ]
  }
}
```

### 2. Pure RAG Arama (Sadece Vektör DB)

**Endpoint:** `POST /api/rag-search`

```json
{
  "query": "Kahvesiyle meşhur mekan",
  "location": "Istanbul",
  "limit": 5
}
```

**Response:**
```json
{
  "query": "Kahvesiyle meşhur mekan",
  "found": 5,
  "recommendations": [
    {
      "name": "V Coffee Kadıköy",
      "similarity_score": 0.812,
      "category": "Kahve dükkanı",
      "recommendation_reason": "Benzerlik skoru: 0.812"
    }
  ],
  "analysis": "Kullanıcı kahvesiyle ünlü bir mekan arıyor...",
  "source": "RAG (Vector Database)",
  "hybrid_mode": false
}
```

---

## 🎓 Profesöre Gösterim Senaryoları

### Senaryo 1: "RAG ile Kahve Araması"

```bash
curl -X POST http://localhost:8080/api/rag-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latte ile ünlü kafe",
    "location": "Istanbul"
  }'
```

**Açıklama:**
> "Profesör bey, burada RAG sistemi şunu yapıyor: Kullanıcının 'latte ile ünlü' sorgusu sentence-transformers ile 384 boyutlu bir vektöre dönüştürülüyor. Sonra Qdrant vektör veritabanında cosine similarity ile en benzer mekanlar bulunuyor. Sonuç olarak, yorumlarında 'latte' geçen kafeler yüksek skor alıyor."

### Senaryo 2: "Hibrit Arama - RAG + SerpAPI"

```bash
curl -X POST http://localhost:8080/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Sessiz çalışma ortamı",
    "location": "Kadıköy, Istanbul",
    "user_lat": 40.99,
    "user_lng": 29.03
  }'
```

**Açıklama:**
> "Bu endpoint hem SerpAPI'den güncel mekanları çekiyor, hem de RAG sistemi ile geçmişteki kullanıcı yorumlarını analiz ediyor. RAG, 'sessiz' kelimesiyle ilişkili mekanları vektör araması ile buluyor. İki sonuç birleştirilerek en iyi öneriler kullanıcıya sunuluyor."

### Senaryo 3: "Vektör Veritabanı İçeriği"

```bash
# Vektör DB'deki mekan sayısını göster
python test_rag_system.py
```

**Açıklama:**
> "Sistemde 50 mekan var. Her mekanın adı, kategorisi, açıklaması ve kullanıcı yorumları birleştirilerek bir metin oluşturuluyor. Bu metin, multilingual sentence-transformer modeli ile vektöre dönüştürülüyor. Böylece 'kahvesiyle ünlü' gibi bir sorgu, yorumlarında 'kahve mükemmeldi' yazan mekanlarla eşleşebiliyor."

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI SORGUSU                         │
│              "Kadıköy'de sakin bir kafe"                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   /api/smart-search-v2       │
        │   (Hibrit Endpoint)          │
        └──────────┬───────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐     ┌──────────────────┐
│   SerpAPI     │     │   RAG Pipeline   │
│  (Güncel)     │     │ (Geçmiş Bilgi)   │
└───────┬───────┘     └────────┬─────────┘
        │                      │
        │              ┌───────┴────────┐
        │              │                │
        │              ▼                ▼
        │       ┌────────────┐   ┌──────────┐
        │       │ Retriever  │   │Generator │
        │       │(Qdrant DB) │   │  (LLM)   │
        │       └────────────┘   └──────────┘
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Skorlama + Rerank   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  EN İYİ 5 MEKAN      │
        └──────────────────────┘
```

---

## 🔧 Ayarlar (.env)

```env
# Qdrant Vektör Veritabanı
QDRANT_URL=:memory:                # In-memory mode (Docker gerekmez)
QDRANT_API_KEY=                    # In-memory'de gereksiz
QDRANT_COLLECTION_NAME=mekan_embeddings

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_DEVICE=cpu               # cpu veya cuda

# RAG Parametreleri
TOP_K_RESULTS=5                    # Kaç sonuç dönülecek
SIMILARITY_THRESHOLD=0.4           # Minimum benzerlik skoru (0-1)
```

---

## 🚀 Gelişmiş Kullanım

### Vektör Veritabanını Güncelleme

```bash
# Yeni mekanlar eklemek için
python scripts/prepare_vector_db.py
```

### Qdrant Cloud'a Geçiş (Production)

```env
# .env dosyasını güncelle
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-api-key-here
```

### Docker ile Qdrant

```bash
# Qdrant container başlat
docker run -p 6333:6333 qdrant/qdrant

# .env'i güncelle
QDRANT_URL=http://localhost:6333
```

---

## 📊 Performans Metrikleri

| Metrik | Değer |
|--------|-------|
| Mekan Sayısı | 50 |
| Vektör Boyutu | 384 |
| Embedding Model | Multilingual MiniLM |
| Arama Hızı | ~50ms |
| Benzerlik Skoru | Cosine Similarity |
| Threshold | 0.4 |

---

## 🐛 Sorun Giderme

### "RAG sistemi kullanılamıyor"

```bash
# 1. Vektör DB yüklü mü kontrol et
python test_rag_system.py

# 2. Vektör DB'yi yeniden yükle
python scripts/prepare_vector_db.py

# 3. Modelleri yeniden yükle
rm -rf ~/.cache/huggingface
python app.py
```

### "Qdrant bağlantısı kurulamadı"

In-memory mode kullanıyorsanız:
- `.env` dosyasında `QDRANT_URL=:memory:` olmalı
- Docker/Cloud bağlantısı gerekmez

---

## 🎉 Başarı!

RAG sistemi artık çalışıyor! Şimdi şunları gösterebilirsiniz:

1. ✅ **Semantik Arama**: "Kahvesiyle ünlü" → Yorumlarda "kahve mükemmel" geçen yerler bulunur
2. ✅ **Hibrit Sistem**: SerpAPI (güncel) + RAG (geçmiş bilgi)
3. ✅ **Vektör Veritabanı**: 50 mekan, 384 boyutlu embeddings
4. ✅ **Multilingual**: Türkçe ve İngilizce destekler
5. ✅ **Hızlı**: In-memory Qdrant, ~50ms yanıt süresi

---

**Not**: Sistem in-memory modda çalıştığı için servis her yeniden başlatıldığında vektör veritabanını yeniden yüklemek gerekir. Production için Qdrant Cloud veya Docker kullanılmalıdır.
