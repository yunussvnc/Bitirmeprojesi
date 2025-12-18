# Mekan Öneri Platformu - AI/LLM Service

Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun AI servisi. RAG (Retrieval-Augmented Generation) mimarisi kullanarak kişiselleştirilmiş mekan önerileri üretir.

## Teknolojiler

- **FastAPI** - API servisi
- **PyTorch** - Deep learning framework
- **LangChain** - LLM entegrasyonu
- **Qdrant** - Vektör veritabanı
- **Sentence Transformers** - Embedding modelleri
- **OpenAI API** - LLM sağlayıcısı
- **HuggingFace Transformers** - Local LLM desteği (Qwen2, TinyLlama, vb.)

## Mimari

### RAG (Retrieval-Augmented Generation)

Sistem, şu adımları izleyerek öneriler üretir:

1. **Retrieval**: Kullanıcı sorgusunu vektör araması ile ilgili mekanları bulur
2. **Augmentation**: Bulunan mekanları LLM'e context olarak sağlar
3. **Generation**: LLM kişiselleştirilmiş öneri metni üretir

### Bileşenler

- **Embedding Model**: Türkçe metinleri vektörlere dönüştürür
- **Vector Database (Qdrant)**: Mekan açıklamalarının embedding'lerini saklar
- **LLM (OpenAI/Local)**: Öneri metinleri üretir
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
```bash
docker-compose up -d
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

## Ortam Değişkenleri

`.env` dosyasında şu değişkenler bulunmalı:

- `QDRANT_URL` - Qdrant server URL'i
- `QDRANT_API_KEY` - Qdrant API key (opsiyonel)
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Kullanılacak OpenAI modeli
- `EMBEDDING_MODEL` - Embedding model adı
- `BACKEND_API_URL` - Backend API URL'i

## Lisans

MIT

## Katkıda Bulunanlar

- **Yunusemre Sevinç** - LLM/RAG mimarisi, öneri algoritmaları, vektör veritabanı

