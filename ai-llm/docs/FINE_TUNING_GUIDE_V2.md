# 🚀 Faz 3.1: Fine-Tuning Kullanım Kılavuzu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Fine-Tuning Süreci](#fine-tuning-süreci)
4. [Testing](#testing)
5. [Production Entegrasyonu](#production-entegrasyonu)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

Bu kılavuz, Gemma 2-2B modelini **LoRA/QLoRA** ile Türkçe mekan önerisi için fine-tune etme sürecini açıklar.

### Temel Özellikler

- ✅ **Parameter-Efficient Fine-Tuning**: LoRA ile sadece %0.5 parametreyi eğit
- ✅ **QLoRA (4-bit Quantization)**: Düşük VRAM kullanımı (8GB yeterli)
- ✅ **Gerçek Mekan Verisi**: Backend API'den otomatik veri toplama
- ✅ **Çeşitli Senaryolar**: 20+ farklı kullanıcı senaryosu
- ✅ **Otomatik Evaluation**: Base model ile karşılaştırma

### System Gereksinimleri

#### Minimum (CPU Training)

- RAM: 16 GB
- Disk: 20 GB boş alan
- Süre: ~4-6 saat (3 epoch)

#### Önerilen (GPU Training)

- GPU: 8GB+ VRAM (RTX 3060, RTX 4060 veya üzeri)
- RAM: 16 GB
- Disk: 20 GB boş alan
- Süre: ~30-45 dakika (3 epoch)

---

## ⚙️ Kurulum

### 1. Virtual Environment Aktif Et

```bash
cd ai-llm
source .venv/bin/activate  # Linux/Mac
# veya
.\.venv\Scripts\activate  # Windows
```

### 2. Dependencies Kur

```bash
pip install -r requirements.txt
```

**Önemli**: QLoRA için `bitsandbytes` gereklidir:

```bash
# GPU için (CUDA)
pip install bitsandbytes>=0.41.0

# CPU için (opsiyonel, yavaş)
# bitsandbytes CPU'da çalışmaz, config'i güncelleyin
```

### 3. Backend'i Başlat

Fine-tuning için gerçek mekan verisi gerekiyor:

```bash
# Yeni terminal aç
cd ai-llm
python demo_backend_v2.py
```

Backend **http://localhost:8080** adresinde çalışmalı.

---

## 🎓 Fine-Tuning Süreci

### Adım 1: Training Data Hazırlama

```bash
cd ai-llm
python scripts/prepare_training_data_v2.py
```

**Ne yapar?**

- Backend'den 10+ farklı query ile mekan verisi çeker
- 20+ çeşitli kullanıcı senaryosu oluşturur
- Her senaryo için instruction-response pair'leri üretir
- `data/processed/training_data_v2.json` olarak kaydeder

**Örnek Output:**

```
✅ Toplam 156 benzersiz mekan bulundu
✓ 'sessiz kafe wifi' query'sinden 15 mekan çekildi
✓ 'romantik restoran' query'sinden 12 mekan çekildi
...
✅ Toplam 80 training örneği oluşturuldu
💾 Training data kaydedildi: data/processed/training_data_v2.json
```

**Sorun giderme:**

- ❌ Backend bağlantı hatası → Backend çalışıyor mu kontrol et
- ❌ Çok az mekan bulundu → Backend'e daha fazla mekan ekle

---

### Adım 2: Fine-Tuning

```bash
python scripts/fine_tune_gemma_lora.py
```

**Configuration (script içinde değiştirilebilir):**

```python
class Config:
    # LoRA Settings
    LORA_R = 16                    # LoRA rank (16-64 arası)
    LORA_ALPHA = 32                # Scaling factor
    LORA_DROPOUT = 0.05            # Dropout

    # Training
    NUM_EPOCHS = 3                 # Epoch sayısı
    BATCH_SIZE = 2                 # Batch size (GPU VRAM'e göre)
    GRADIENT_ACCUMULATION_STEPS = 8  # Effective batch = 16
    LEARNING_RATE = 2e-4           # Learning rate
    MAX_LENGTH = 1024              # Max token length

    # Quantization
    USE_QUANTIZATION = True        # QLoRA (4-bit)
```

**Training Süreci:**

1. Base model (Gemma 2-2B) yüklenir
2. 4-bit quantization uygulanır (QLoRA)
3. LoRA adaptörleri eklenir (~2M trainable params)
4. 3 epoch training (train/eval split: 90/10)
5. Model `models/gemma-2-2b-mekan-lora/` altına kaydedilir

**Örnek Output:**

```
🤖 Model ve tokenizer yükleniyor...
  ✓ Tokenizer yüklendi: google/gemma-2-2b-it
  ⚙️ 4-bit quantization (QLoRA) aktif
  ✓ Model yüklendi
  📊 Trainable params: 2,359,296 / 2,614,341,632 (0.09%)

🔥 TRAINING BAŞLIYOR...
⏱️ Başlangıç: 2024-01-15 14:30:00
🎯 Epochs: 3
📦 Batch size: 2 (gradient accum: 8)
📈 Learning rate: 0.0002

[Epoch 1/3] ████████████░░░░░░░ 60%
...

✅ TRAINING TAMAMLANDI!
📊 Final Loss: 0.8523
⚡ Training samples/sec: 1.23
💾 Model location: models/gemma-2-2b-mekan-lora
```

**GPU Memory Usage:**

- Without Quantization: ~16GB VRAM
- With QLoRA (4-bit): ~8GB VRAM

**Süre Tahminleri (80 örnek, 3 epoch):**

- RTX 4090: ~20 dakika
- RTX 3060 (12GB): ~45 dakika
- CPU: ~4-6 saat

---

### Adım 3: Testing & Evaluation

```bash
python scripts/test_fine_tuned_lora.py
```

**Ne yapar?**

- Base Gemma model'i yükler
- Fine-tuned LoRA model'i yükler
- 4 test case çalıştırır
- Her ikisini karşılaştırır

**Test Cases:**

1. Sessiz kafe (çalışma mekanı)
2. Romantik restoran
3. Canlı bar (eğlence)
4. Aile parkı

**Örnek Output:**

```
🧪 TEST 1/4
📋 TEST: Sakin bir kafede laptop ile çalışmak istiyorum, wifi şart
========================================

🤖 BASE MODEL (2.34s):
Tabii! İşte önerilerim:
- Starbucks Kadıköy: Wifi var, sessiz.
- Kahve Dünyası: Çalışma için uygun.
...

📊 Evaluation:
  Feature Coverage: 66.7%
  Word Count: 125
  Has Structure: ✗
  Turkish Fluency: 71.4%

🎯 FINE-TUNED MODEL (2.41s):
Çalışma için sessiz bir ortam, güçlü wifi ve laptop dostu masalar aradınız.
Size Kadıköy'de bu kriterlere uygun kafeleri öneriyorum.

📍 Önerilen Mekanlar:

1. **Walter's Coffee Roastery** (Kafe)
   📍 Caferağa Mah. Moda Cd. No:102, Kadıköy
   🚶 1.2 km uzaklıkta
   ✨ Özellikler: Wifi, Quiet, Laptop Friendly, Specialty Coffee
   💡 Sessiz ortamı ve güvenilir wifi bağlantısı ile uzun süreli çalışma için ideal
...

📊 Evaluation:
  Feature Coverage: 100.0%
  Word Count: 287
  Has Structure: ✓
  Turkish Fluency: 85.7%

📈 COMPARISON:
  Feature Coverage: +33.3%
  ✅ Fine-tuned model daha akıcı Türkçe
  ✅ Fine-tuned model daha yapılandırılmış
```

**Metrics:**

- **Feature Coverage**: İstenen özelliklerin response'da bulunma oranı
- **Structure**: Mekan listesi, emoji, formatlandırma
- **Turkish Fluency**: Türkçe gramer/kelime kullanımı

**Başarı Kriterleri:**

- ✅ Feature Coverage > %80
- ✅ Structured response (liste format)
- ✅ Turkish fluency improvement
- ✅ Reasonable response time (<5s)

---

## 🚀 Production Entegrasyonu

### Model'i Backend'e Entegre Et

`demo_backend_v2.py` dosyasını güncelle:

```python
# BEFORE (Base Model)
class ModelManager:
    def __init__(self):
        self.model_name = "google/gemma-2-2b-it"
        self.model = None
        self.tokenizer = None

# AFTER (Fine-tuned Model)
from peft import PeftModel

class ModelManager:
    def __init__(self):
        self.base_model_name = "google/gemma-2-2b-it"
        self.lora_path = "models/gemma-2-2b-mekan-lora"
        self.model = None
        self.tokenizer = None

    def load_model(self):
        """Fine-tuned LoRA model'i yükle"""
        print("🤖 Loading fine-tuned model...")

        # Tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.base_model_name,
            trust_remote_code=True
        )

        # Base model
        base_model = AutoModelForCausalLM.from_pretrained(
            self.base_model_name,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True
        )

        # LoRA weights
        self.model = PeftModel.from_pretrained(
            base_model,
            self.lora_path
        )
        self.model = self.model.merge_and_unload()

        print("✅ Fine-tuned model loaded!")
```

### API Endpoint'ini Test Et

```bash
curl -X POST http://localhost:8080/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sessiz kafe wifi çalışmak",
    "user_lat": 40.9905,
    "user_lon": 29.0267,
    "limit": 5
  }'
```

**Beklenen Response:**

```json
{
  "query": "sessiz kafe wifi çalışmak",
  "parsed": {
    "category": "Kafe",
    "features": ["wifi", "quiet", "laptop_friendly"]
  },
  "places": [
    {
      "name": "Walter's Coffee Roastery",
      "category": "Kafe",
      "distance_km": 1.2,
      "score": 0.89,
      "reason": "Sessiz ortamı ve güvenilir wifi bağlantısı ile..."
    }
  ],
  "metadata": {
    "model": "gemma-2-2b-mekan-lora",
    "cached": false
  }
}
```

---

## 🐛 Troubleshooting

### Problem 1: CUDA Out of Memory

**Hata:**

```
RuntimeError: CUDA out of memory. Tried to allocate X GB
```

**Çözüm:**

1. `USE_QUANTIZATION = True` yap (4-bit QLoRA)
2. `BATCH_SIZE` düşür (2 → 1)
3. `GRADIENT_ACCUMULATION_STEPS` artır (8 → 16)
4. `MAX_LENGTH` düşür (1024 → 512)

```python
# Low VRAM Config (6GB GPU)
BATCH_SIZE = 1
GRADIENT_ACCUMULATION_STEPS = 16
MAX_LENGTH = 512
USE_QUANTIZATION = True
```

---

### Problem 2: Training Data Bulunamadı

**Hata:**

```
❌ Training data bulunamadı: data/processed/training_data_v2.json
```

**Çözüm:**

```bash
# Backend'in çalıştığından emin ol
python demo_backend_v2.py

# Yeni terminal'de training data oluştur
python scripts/prepare_training_data_v2.py
```

---

### Problem 3: Bitsandbytes Import Hatası

**Hata:**

```
ImportError: cannot import name 'bitsandbytes'
```

**Çözüm (GPU):**

```bash
pip install bitsandbytes>=0.41.0
```

**Çözüm (CPU):**

```python
# fine_tune_gemma_lora.py içinde
USE_QUANTIZATION = False  # QLoRA'yı kapat
```

---

### Problem 4: Model Yükleme Çok Yavaş

**Sebep:** Model her seferinde HuggingFace'den indiriliyor.

**Çözüm:** Cache directory ayarla

```bash
export HF_HOME=/path/to/cache
export TRANSFORMERS_CACHE=$HF_HOME/transformers
```

---

### Problem 5: Fine-tuned Model Base'den Kötü

**Olası Sebepler:**

1. ❌ Çok az training data (<50 örnek)
2. ❌ Çok yüksek learning rate
3. ❌ Overfitting (çok fazla epoch)
4. ❌ Kalitesiz training data

**Çözüm:**

```python
# Daha fazla training data oluştur
num_examples = 150  # 80 → 150

# Learning rate düşür
LEARNING_RATE = 1e-4  # 2e-4 → 1e-4

# Epoch azalt
NUM_EPOCHS = 2  # 3 → 2

# LoRA rank artır (daha fazla capacity)
LORA_R = 32  # 16 → 32
```

---

## 📊 Performance Metrikleri

### Beklenen İyileştirmeler (Base → Fine-tuned)

| Metric              | Base Model | Fine-tuned | Improvement |
| ------------------- | ---------- | ---------- | ----------- |
| Feature Coverage    | ~60%       | ~90%       | +30%        |
| Structured Response | 25%        | 95%        | +70%        |
| Turkish Fluency     | ~70%       | ~85%       | +15%        |
| Relevance Score     | 0.65       | 0.82       | +26%        |

### Training Stats (80 examples, 3 epochs)

| Hardware       | Time       | Final Loss | VRAM |
| -------------- | ---------- | ---------- | ---- |
| RTX 4090       | ~20 min    | 0.85       | 8GB  |
| RTX 3060 12GB  | ~45 min    | 0.87       | 8GB  |
| RTX 3060 6GB   | ~60 min    | 0.89       | 6GB  |
| CPU (16 cores) | ~4-5 hours | 0.92       | N/A  |

---

## 🎯 Sonraki Adımlar

### Faz 3.2: Kullanıcı Tercihleri

- User profile tracking
- Personalized recommendations
- Feedback loop

### Faz 3.3: Context-Awareness

- Zaman bazlı öneriler (sabah/akşam)
- Hava durumu entegrasyonu
- Özel günler (bayram, etkinlik)

### Faz 3.4: Multi-language

- İngilizce support
- Arapça support
- Rusça support

---

## 📚 Referanslar

- [LoRA: Low-Rank Adaptation](https://arxiv.org/abs/2106.09685)
- [QLoRA: Efficient Finetuning](https://arxiv.org/abs/2305.14314)
- [Gemma Documentation](https://ai.google.dev/gemma/docs)
- [HuggingFace PEFT](https://huggingface.co/docs/peft)

---

## 💬 Destek

Sorun yaşıyorsan:

1. Training logs'ları kontrol et: `models/gemma-2-2b-mekan-lora/`
2. Test script'i çalıştır: `test_fine_tuned_lora.py`
3. Backend logs'ları incele

**Happy Fine-tuning! 🚀**
