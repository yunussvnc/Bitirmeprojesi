# 🧪 AI-LLM Demo Backend

Mini demo backend - SerpApi + LLM model entegrasyonunu test etmek için.

## 🎯 Amaç

Bu basitleştirilmiş backend ile şunları test edebilirsiniz:

1. ✅ SerpApi ile Google Maps'ten gerçek mekan verisi çekme
2. ✅ Mekan verilerini embedding modeline gönderme
3. ✅ LLM ile akıllı mekan önerileri üretme
4. ✅ Tam pipeline: SerpApi → Embedding → LLM

**Not:** Ana backend'e dokunmadan, sadece model entegrasyonunu test etmek için oluşturuldu.

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
cd ai-llm

# Gerekli paketleri yükle
pip install fastapi uvicorn google-search-results requests

# .env dosyasını oluştur
cp env.example .env
```

### 2. API Key Ayarlama

`.env` dosyasını düzenle:

```env
# SerpApi key'ini ekle
SERPAPI_KEY=your_actual_api_key_here
```

**API Key Alma:**

- https://serpapi.com/manage-api-key
- Ücretsiz hesap oluştur
- 100 arama/ay ÜCRETSİZ

### 3. Test Et

#### Basit Test (SerpApi bağlantısı)

```bash
python serpapi_client.py
```

Çıktı:

```
✅ SerpApi client başarıyla oluşturuldu!
=== TEST: Kadıköy Kafeleri ===
🔍 Aranıyor: cafe in Kadıköy, Istanbul
✅ 3 mekan bulundu:
1. Walter's Coffee
   📍 Moda Cd. No:102, Kadıköy
   ⭐ 4.5
```

#### Tam Entegrasyon Testi

```bash
python test_model_integration.py
```

Bu script 5 farklı testi çalıştırır:

1. SerpApi bağlantısı
2. Embedding model
3. LLM generation
4. Full pipeline
5. Demo backend

### 4. Demo Backend'i Başlat

```bash
python demo_backend.py
```

Backend `http://localhost:8080` adresinde çalışacak.

**Swagger UI:** http://localhost:8080/docs

## 📡 API Endpoints

### Health Check

```bash
GET http://localhost:8080/health
```

Response:

```json
{
  "status": "ok",
  "places_count": 0,
  "serpapi_configured": true
}
```

### Mekan Arama (SerpApi)

```bash
POST http://localhost:8080/api/search
Content-Type: application/json

{
  "query": "coffee shop in Kadıköy",
  "location": "Kadıköy, Istanbul",
  "limit": 5
}
```

Response:

```json
{
  "query": "coffee shop in Kadıköy",
  "location": "Kadıköy, Istanbul",
  "found": 5,
  "places": [
    {
      "name": "Walter's Coffee Roastery",
      "address": "Moda Cd. No:102",
      "latitude": 40.9858,
      "longitude": 29.0343,
      "rating": 4.5,
      "price_level": 2,
      "category": "Cafe",
      "photo_url": "https://..."
    }
  ]
}
```

### Mekan Önerisi (LLM)

```bash
POST http://localhost:8080/api/recommend
Content-Type: application/json

{
  "user_query": "Sessiz bir kafede çalışmak istiyorum",
  "preferences": {
    "vibe": "quiet",
    "purpose": "work"
  }
}
```

Response:

```json
{
  "query": "Sessiz bir kafede çalışmak istiyorum",
  "found": 5,
  "recommendation": "Çalışma için uygun 5 mekan bulundu...",
  "top_places": [...]
}
```

### Tüm Mekanları Listele

```bash
GET http://localhost:8080/api/places
```

### Mekanları Temizle

```bash
DELETE http://localhost:8080/api/places
```

## 🧪 Test Senaryoları

### Senaryo 1: SerpApi + Basit Filtreleme

```bash
# 1. Kadıköy'de kafe ara
curl -X POST http://localhost:8080/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "cafe in Kadıköy", "limit": 10}'

# 2. Bulunan mekanları listele
curl http://localhost:8080/api/places
```

### Senaryo 2: LLM ile Öneri

```bash
# 1. Önce mekan ara
curl -X POST http://localhost:8080/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "quiet cafe for studying", "limit": 10}'

# 2. LLM ile öneri al
curl -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"user_query": "Çalışmak için sessiz kafe"}'
```

### Senaryo 3: Full Pipeline Test

```bash
python test_model_integration.py
```

## 📊 Test Sonuçları

Test script çalıştırıldığında şu sonuçları görmelisiniz:

```
╔══════════════════════════════════════════════════════════╗
║      🧪 AI-LLM Model Entegrasyon Test Suite             ║
╚══════════════════════════════════════════════════════════╝

🔧 TEST 1: SerpApi Bağlantısı
✅ SerpApi client oluşturuldu
🔍 Aranıyor: coffee shop in Kadıköy, Istanbul
✅ 3 mekan bulundu

🔧 TEST 2: Embedding Model
✅ Retriever oluşturuldu
✅ Embedding modeli çalışıyor

🔧 TEST 3: LLM Generation
✅ Generator oluşturuldu
✅ LLM yanıtı alındı

🔧 TEST 4: Full Pipeline
✅ Öneri üretildi

🔧 TEST 5: Demo Backend
✅ Backend çalışıyor!

📊 TEST SONUÇLARI
  SerpApi        : ✅ BAŞARILI
  Embedding      : ✅ BAŞARILI
  LLM            : ✅ BAŞARILI
  Pipeline       : ✅ BAŞARILI
  Backend        : ✅ BAŞARILI

🎉 Tüm testler başarılı!
```

## 🔧 Sorun Giderme

### "SERPAPI_KEY bulunamadı" hatası

```bash
# .env dosyasını kontrol et
cat .env | grep SERPAPI_KEY

# Yoksa ekle
echo "SERPAPI_KEY=your_key_here" >> .env
```

### "ModuleNotFoundError: No module named 'serpapi'"

```bash
pip install google-search-results
```

### Backend çalışmıyor

```bash
# Port kullanımda mı kontrol et
netstat -ano | findstr :8080

# Farklı portta başlat
python -c "import uvicorn; from demo_backend import app; uvicorn.run(app, port=8081)"
```

### LLM modeli yüklenmiyor

```bash
# Model indiriliyor olabilir, bekleyin
# İlk çalıştırmada ~5GB model indirilir

# Model cache temizle (sorun varsa)
rm -rf ~/.cache/huggingface/
```

## 📁 Dosya Yapısı

```
ai-llm/
├── demo_backend.py              # Mini FastAPI backend
├── serpapi_client.py            # SerpApi client
├── test_model_integration.py   # Test suite
├── .env                         # Environment variables
├── env.example                  # Environment template
└── DEMO_README.md              # Bu dokuman
```

## 🎓 Öğrenme Hedefleri

Bu demo backend ile şunları öğrenebilirsiniz:

1. **SerpApi Entegrasyonu**

   - Google Maps API'sine alternatif
   - JSON response parsing
   - Rate limiting

2. **Embedding Pipeline**

   - Sentence transformers kullanımı
   - Multilingual embeddings
   - Vector similarity

3. **LLM Integration**

   - Gemma 2 model kullanımı
   - Prompt engineering
   - Response parsing

4. **FastAPI Patterns**
   - Pydantic models
   - Async endpoints
   - Error handling

## 🚀 Sonraki Adımlar

Bu demo başarılı olduktan sonra:

1. ✅ Qdrant vektör DB entegrasyonu
2. ✅ Ana backend'e entegre et
3. ✅ Caching ekle
4. ✅ Batch processing
5. ✅ Production deployment

## 💡 İpuçları

- **Ücretsiz Limit:** SerpApi'de 100 arama/ay ücretsiz
- **Model Boyutu:** Gemma 2-2B modeli ~5GB disk kullanır
- **İlk Çalıştırma:** Model indiriliyor, 5-10 dakika sürebilir
- **RAM Gereksinimi:** Minimum 8GB RAM (16GB önerilen)

## 📚 Kaynaklar

- **SerpApi Docs:** https://serpapi.com/google-maps-api
- **Gemma 2:** https://huggingface.co/google/gemma-2-2b-it
- **Sentence Transformers:** https://www.sbert.net/
- **FastAPI:** https://fastapi.tiangolo.com/

---

**Not:** Bu backend sadece test ve öğrenme amaçlıdır. Production kullanımı için ana backend'i kullanın.
