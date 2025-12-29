# Kullanım Kılavuzu

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd ai-llm
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Çevre Değişkenlerini Ayarla

`.env` dosyasını oluşturun:

```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:

```env
# OpenAI API Key (Zorunlu)
OPENAI_API_KEY=your-openai-api-key-here

# Qdrant
QDRANT_URL=http://localhost:6333

# Embedding Model (Türkçe için önerilen)
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

### 3. Qdrant'ı Başlat

**Seçenek 1: Docker Compose (Önerilen - Volume ile kalıcı veri)**

```bash
docker-compose up -d
```

**Seçenek 2: Direkt Docker Run (Basit, ama veri kalıcı değil)**

```bash
docker run -d -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Windows için:**
```powershell
docker run -d -p 6333:6333 -p 6334:6334 -v ${PWD}\qdrant_storage:/qdrant/storage qdrant/qdrant
```

**En Basit (Test için, veri kalıcı değil):**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Qdrant'ın çalıştığını kontrol et:**
```bash
curl http://localhost:6333/health
# veya tarayıcıda: http://localhost:6333/dashboard
```

### 4. Vektör Veritabanını Hazırla

```bash
python scripts/prepare_vector_db.py
```

Bu script:
- Backend API'den mekanları alır
- Embedding'leri oluşturur
- Qdrant'a yükler

### 5. Servisi Başlat

```bash
uvicorn src.main:app --reload --port 8001
```

API dokümantasyonu: http://localhost:8001/docs

## Test Etme

### RAG Sistemi Test

```bash
python scripts/test_rag.py
```

## API Kullanımı

### Öneri İsteği

```bash
curl -X POST "http://localhost:8001/api/v1/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "kullanici_metni": "Sakin bir kafe arıyorum, wifi olmalı",
    "enlem": 41.0082,
    "boylam": 28.9784,
    "kategori": "Kafe"
  }'
```

### Yanıt Formatı

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

## Geliştirme

### Yeni Embedding Modeli Kullanma

`src/config.py` veya `.env` dosyasında `EMBEDDING_MODEL` değişkenini değiştirin:

```python
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
```

### Farklı LLM Sağlayıcısı

Şu anda OpenAI destekleniyor. Yeni sağlayıcı eklemek için:

1. `src/models/llm/llm_wrapper.py` dosyasına yeni wrapper ekleyin
2. `LLMFactory`'ye yeni provider'ı ekleyin
3. `.env` dosyasında `LLM_PROVIDER` değişkenini güncelleyin

## Sorun Giderme

### Qdrant Bağlantı Hatası

```bash
# Qdrant'ın çalıştığından emin olun
docker ps | grep qdrant

# Logları kontrol edin
docker-compose logs qdrant
```

### Embedding Model İndirme

İlk çalıştırmada model otomatik indirilir. Manuel indirmek için:

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
```

### OpenAI API Hatası

API key'inizin geçerli olduğundan ve yeterli krediye sahip olduğunuzdan emin olun.

## Performans İpuçları

1. **GPU Kullanımı**: CUDA yüklüyse, `.env` dosyasında `EMBEDDING_DEVICE=cuda` ayarlayın
2. **Batch İşleme**: Büyük veri setleri için batch_size'ı artırın
3. **Caching**: Embedding'ler Qdrant'ta cache'lenir, tekrar hesaplanmaz

