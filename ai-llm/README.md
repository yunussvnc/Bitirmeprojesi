# Mekan Öneri Platformu - AI/LLM Service

Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun AI servisi. RAG (Retrieval-Augmented Generation) mimarisi kullanarak kişiselleştirilmiş mekan önerileri üretir.

## Teknolojiler

- **FastAPI** - API servisi
- **PyTorch** - Deep learning framework
- **Qdrant** - Vektör veritabanı
- **Sentence Transformers** - Embedding modelleri
- **Gemma 2** - Google'ın açık kaynak LLM'i (2B/9B modeller)
- **HuggingFace Transformers** - Model inference

## Mimari

### RAG (Retrieval-Augmented Generation)

Sistem, şu adımları izleyerek öneriler üretir:

1. **Retrieval**: Kullanıcı sorgusunu vektör araması ile ilgili mekanları bulur
2. **Augmentation**: Bulunan mekanları LLM'e context olarak sağlar
3. **Generation**: LLM kişiselleştirilmiş öneri metni üretir

### Bileşenler

- **Embedding Model**: Türkçe metinleri vektörlere dönüştürür
- **Vector Database (Qdrant)**: Mekan açıklamalarının embedding'lerini saklar
- **LLM (Gemma 2)**: Öneri metinleri üretir
- **RAG Pipeline**: Retrieval ve generation'ı birleştirir

## Kurulum

### Gereksinimler

- Python 3.9+
- CUDA (GPU için, opsiyonel)
- Docker (Qdrant için)

### Adımlar

1. Repository'yi klonlayın:
```bash
git clone <repository-url>
cd ai-llm
```

2. Virtual environment oluşturun:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

4. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

5. Qdrant'ı başlatın (Docker kullanarak):

**Docker Compose ile (Önerilen):**
```bash
docker-compose up -d
```

**Veya direkt Docker Run ile:**
```bash
docker run -d -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Windows PowerShell:**
```powershell
docker run -d -p 6333:6333 -p 6334:6334 -v ${PWD}\qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Test için (basit, veri kalıcı değil):**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

6. Vektör veritabanını hazırlayın:
```python
# scripts/prepare_vector_db.py çalıştırılacak
```

7. Uygulamayı başlatın:
```bash
uvicorn src.main:app --reload --port 8001
```

API dokümantasyonuna http://localhost:8001/docs adresinden erişebilirsiniz.

## Proje Yapısı

```
ai-llm/
├── src/
│   ├── api/              # API endpoint'leri
│   ├── rag/              # RAG sistemi (retriever, generator, pipeline)
│   ├── recommendation/   # Öneri motoru
│   ├── models/           # ML modelleri (embeddings, LLM)
│   ├── vector_db/        # Qdrant client
│   ├── data/             # Veri işleme (collectors, preprocessors, loaders)
│   ├── config.py         # Konfigürasyon
│   └── main.py           # FastAPI uygulaması
├── data/                 # Ham ve işlenmiş veriler
│   ├── raw/
│   ├── processed/
│   └── embeddings/
├── notebooks/            # Jupyter notebook'lar (araştırma)
├── tests/                # Test dosyaları
└── requirements.txt      # Python bağımlılıkları
```

## Hızlı Başlangıç

Detaylı kullanım için [USAGE.md](USAGE.md) dosyasına bakın.

### Local LLM Kullanımı

Local (yerel) LLM kullanmak için [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) kılavuzuna bakın.

### Fine-Tuning (Model Eğitimi)

**Önemli**: OpenAI modelleri kapalı kaynak olduğu için indirilemez. Bunun yerine açık kaynak modelleri (Qwen2, TinyLlama) lokal olarak fine-tune edebilirsiniz.

Fine-tuning için [FINE_TUNING_GUIDE.md](FINE_TUNING_GUIDE.md) kılavuzuna bakın.

### Temel Adımlar

1. Bağımlılıkları yükle: `pip install -r requirements.txt`
2. `.env` dosyasını oluştur ve OpenAI API key ekle
3. Qdrant'ı başlat: `docker-compose up -d`
4. Vektör DB'yi hazırla: `python scripts/prepare_vector_db.py`
5. Servisi başlat: `uvicorn src.main:app --reload --port 8001`

## Kullanım

### API Endpoint

**POST** `/api/v1/recommend`

**Request:**
```json
{
  "kullanici_metni": "Sakin bir kafe arıyorum, wifi olmalı",
  "enlem": 41.0082,
  "boylam": 28.9784,
  "kategori": "Kafe",
  "kullanici_id": 1
}
```

**Response:**
```json
{
  "sorgu_analizi": "Kullanıcı sakin bir ortamda wifi bağlantısı olan bir kafe arıyor.",
  "oneriler": [
    {
      "mekan_id": 123,
      "ad": "Sakin Kafe",
      "aciklama": "...",
      "kategori": "Kafe",
      "enlem": 41.0083,
      "boylam": 28.9785,
      "adres": "...",
      "benzerlik_skoru": 0.92,
      "gerekce": "Sakin ortam ve güçlü wifi bağlantısı ile öne çıkıyor."
    }
  ]
}
```

## Veri Hazırlama

1. Mekan verilerini toplayın (Backend API'den veya manuel)
2. Verileri ön işleyin
3. Embedding'leri oluşturun
4. Qdrant'a yükleyin

## Model Eğitimi

Embedding modeli önceden eğitilmiş modeller kullanır. Türkçe için:
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`

Custom model eğitimi için `notebooks/` klasörüne bakın.

## Geliştirme

### Test Çalıştırma
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Linting
```bash
flake8 .
mypy .
```

## Test

### Konum Bazlı Arama Testleri

Sistemin konum bazlı arama özelliğini test etmek için:

```bash
# Hızlı test
python tests/test_konum_basit.py

# Detaylı rapor
python tests/test_konum_rapor.py

# Debug testi
python tests/test_qdrant_debug.py
```

**Test Sonuçları:** [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) dosyasında detaylı test sonuçları bulabilirsiniz.

#### Başarılı Test Örnekleri

✅ **5/5 test başarılı**
- Toplam 22 mekan bulundu
- Ortalama benzerlik skoru: 0.548
- En yüksek skor: 0.826 (Deniz manzaralı cafe)

**Test Senaryoları:**
1. ☕ Sultanahmet - "kahve icmek istiyorum" → Kahve Durağı (0.681)
2. 💻 Taksim - "sessiz calisma mekani" → Sakin Köşe Kafe (0.494)  
3. 🍳 Kadıköy - "guzel kahvalti" → Meyhane Sofrası (0.468)
4. 🍽️ Nişantaşı - "sik restoran romantic" → Şato Restaurant (0.723)
5. 🌊 Beşiktaş - "deniz manzarali cafe" → Deniz Yıldızı Cafe (0.826)

## 📚 Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

- **[CHATBOT_KULLANIM.md](docs/CHATBOT_KULLANIM.md)** - İnteraktif chatbot kullanım kılavuzu
- **[TEST_RESULTS.md](docs/TEST_RESULTS.md)** - Detaylı test sonuçları
- **[USAGE.md](docs/USAGE.md)** - Kullanım örnekleri
- **[DOCKER_QDRANT.md](docs/DOCKER_QDRANT.md)** - Qdrant Docker kurulumu
- **[FINE_TUNING_GUIDE.md](docs/FINE_TUNING_GUIDE.md)** - Model fine-tuning kılavuzu
- **[LOCAL_LLM_SETUP.md](docs/LOCAL_LLM_SETUP.md)** - Yerel LLM kurulumu
- **[CHANGELOG.md](docs/CHANGELOG.md)** - Değişiklik geçmişi

## Ortam Değişkenleri

`.env` dosyasında şu değişkenler bulunmalı:

- `QDRANT_URL` - Qdrant server URL'i
- `QDRANT_API_KEY` - Qdrant API key (opsiyonel)
- `LLM_PROVIDER` - LLM sağlayıcısı (huggingface)
- `HUGGINGFACE_MODEL` - Model adı (google/gemma-2-2b-it veya google/gemma-2-9b-it)
- `EMBEDDING_MODEL` - Embedding model adı
- `BACKEND_API_URL` - Backend API URL'i

## Lisans

MIT

## Katkıda Bulunanlar

- **Yunusemre Sevinç** - LLM/RAG mimarisi, öneri algoritmaları, vektör veritabanı

