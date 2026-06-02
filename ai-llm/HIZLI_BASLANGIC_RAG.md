# RAG Sistemi - Hızlı Başlangıç Rehberi

## 🚀 3 Adımda Çalıştır

### 1. Gerekli Paketleri Yükle
```bash
cd D:\BitirmeProjesi\ai-llm
pip install qdrant-client sentence-transformers
```

### 2. Demo'yu Çalıştır (Veri Yükleme + Test)
```bash
python demo_rag_complete.py
```

Çıktı:
```
============================================================
RAG SISTEMI KOMPLE DEMO
============================================================
[1/2] Mekan verileri yukleniyor...
OK: 98 mekan bulundu
OK: 98 embedding olusturuldu
OK: 98 mekan yuklendi

[2/2] RAG Arama Testi
OK: 5 mekan bulundu

1. Walter's Coffee Roastery
   Kategori: Kahve dükkanı
   Benzerlik: 0.700
   Adres: Caferağa, Bademaltı Sk. No:21, 34710 Kadıköy/İstanbul...
```

### 3. Servisi Başlat
```bash
python app.py
```

---

## 📝 Profesöre Gösterim

### Senaryo 1: Canlı Demo (Terminal)
```bash
python demo_rag_complete.py
```

**Ne Gösterir:**
- 98 mekan yükleniyor
- 5 test sorgusu çalışıyor
- Semantik arama sonuçları (benzerlik skorları)

**Açıklama:**
> "Burada RAG sistemi çalışıyor. 'Kahvesiyle ünlü' sorgusu, kullanıcı yorumlarında 'kahve mükemmeldi' yazan yerleri buluyor. 384 boyutlu vektörler, cosine similarity ile karşılaştırılıyor."

---

### Senaryo 2: API Testi (Postman veya cURL)

**Endpoint:** `http://localhost:8080/api/rag-search`

**Request:**
```json
{
  "query": "Kahvesiyle ünlü kafe",
  "location": "Istanbul",
  "limit": 5
}
```

**Response:**
```json
{
  "query": "Kahvesiyle ünlü kafe",
  "found": 5,
  "recommendations": [
    {
      "name": "Walter's Coffee Roastery",
      "similarity_score": 0.700,
      "category": "Kahve dükkanı"
    }
  ],
  "source": "RAG (Vector Database)"
}
```

**Açıklama:**
> "Bu endpoint, sadece vektör veritabanında arama yapıyor. SerpAPI'yi kullanmıyor. Yerel 98 mekan üzerinden semantik arama yapıyor."

---

### Senaryo 3: Hibrit Sistem

**Endpoint:** `http://localhost:8080/api/smart-search-v2`

**Request:**
```json
{
  "query": "Sessiz çalışma ortamı",
  "location": "Kadıköy, Istanbul",
  "limit": 5
}
```

**Response (rag_context dikkat!):**
```json
{
  "query": "Sessiz çalışma ortamı",
  "found": 25,
  "recommendations": [...],
  "rag_context": {
    "similar_places_count": 5,
    "top_matches": [
      {"name": "Moloko Coffee", "score": 0.751}
    ]
  }
}
```

**Açıklama:**
> "Hibrit sistem: SerpAPI güncel mekanları çekiyor, RAG ise geçmiş kullanıcı yorumlarından 'sessiz' ile ilgili yerleri buluyor. İki kaynak birleştiriliyor."

---

## 🎯 Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `demo_rag_complete.py` | ⭐ Komple demo (önerilen) |
| `RAG_KURULUM_VE_KULLANIM.md` | Detaylı rehber |
| `RAG_SISTEM_OZET.md` | Teknik özet |
| `scripts/prepare_vector_db.py` | Veri yükleme scripti |

---

## ⚡ Hızlı Test Komutları

```bash
# 1. Demo çalıştır
python demo_rag_complete.py

# 2. Servisi başlat
python app.py

# 3. Pure RAG endpoint test
curl -X POST http://localhost:8080/api/rag-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Kahvesiyle ünlü", "location": "Istanbul"}'

# 4. Hibrit endpoint test
curl -X POST http://localhost:8080/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d '{"query": "Deniz manzaralı restoran", "location": "Istanbul"}'
```

---

## 🔧 Ayarlar

### .env Dosyası (Zaten Hazır)
```env
QDRANT_URL=:memory:
QDRANT_COLLECTION_NAME=mekan_embeddings
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.4
```

---

## 📊 Beklenen Sonuçlar

### Test Sorguları ve Sonuçları

| Sorgu | Beklenen Sonuç | Benzerlik |
|-------|----------------|-----------|
| "Kahvesiyle ünlü" | Walter's Coffee Roastery | 0.70 |
| "Deniz manzaralı" | Mavi Balık | 0.71 |
| "Sakin kafe" | Moloko Coffee | 0.75 |
| "Hamburger" | FABESCO Restaurant | 0.57 |
| "Romantik akşam" | Galata Konak Cafe | 0.58 |

---

## ❓ Sorun Giderme

### "Collection not found"
- **Sorun:** In-memory mode - her çalıştırmada veri yeniden yüklenmeli
- **Çözüm:** `demo_rag_complete.py` kullanın (veri + test beraber)

### "Embedding model yüklenemiyor"
- **Sorun:** İlk çalıştırmada model indirilir (~500MB)
- **Çözüm:** İnternet bağlantısı olmalı, bekleyin

### "GROQ_API_KEY eksik"
- **Sorun:** LLM yanıt üretme için gerekli
- **Not:** RAG araması çalışır, sadece LLM yanıtı olmaz

---

## ✅ Kontrol Listesi

Profesöre göstermeden önce:

- [ ] `demo_rag_complete.py` çalıştı mı?
- [ ] 98 mekan yüklendi mi?
- [ ] Test sorguları sonuç verdi mi?
- [ ] Benzerlik skorları mantıklı mı? (0.5+)
- [ ] `app.py` başladı mı?
- [ ] API endpoint'ler yanıt veriyor mu?

---

## 🎉 Başarı!

RAG sistemi hazır! Şimdi:

1. ✅ `demo_rag_complete.py` çalıştır (canlı demo)
2. ✅ Profesöre semantik aramayı göster
3. ✅ Hibrit sistemi açıkla (SerpAPI + RAG)
4. ✅ Vektör veritabanı içeriğini göster

---

**Not:** In-memory mode kullanıldığı için servis her başladığında vektör veritabanı sıfırlanır. Production için Docker veya Qdrant Cloud kullanılmalıdır.
