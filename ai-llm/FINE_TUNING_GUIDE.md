# LLM Fine-Tuning Kılavuzu

## Önemli Not

⚠️ **OpenAI modelleri (GPT-3.5, GPT-4) kapalı kaynak olduğu için indirilemez ve lokal olarak fine-tune edilemez.**

Bunun yerine **açık kaynak modeller** kullanacağız:
- **Qwen2-1.5B-Instruct** (Önerilen - Türkçe desteği iyi)
- **TinyLlama-1.1B-Chat** (Küçük, hızlı)
- **Phi-3-mini** (İyi performans)

## Fine-Tuning Süreci

### 1. Veri Hazırlama

Eğitim verilerini hazırlayın:

```bash
cd ai-llm
python scripts/prepare_training_data.py
```

Bu script:
- Backend'den mekan verilerini alır
- Örnek kullanıcı sorguları oluşturur
- Fine-tuning için uygun formatta veri hazırlar
- `data/processed/training_data.json` dosyasına kaydeder

### 2. Fine-Tuning Başlat

```bash
python scripts/fine_tune_model.py
```

**Parametreler:**

```bash
python scripts/fine_tune_model.py \
  --model Qwen/Qwen2-1.5B-Instruct \
  --output models/fine_tuned \
  --epochs 3 \
  --batch-size 4 \
  --lr 5e-5
```

**Küçük sistemler için (RAM < 16GB):**
```bash
python scripts/fine_tune_model.py \
  --model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \
  --batch-size 2 \
  --epochs 2
```

### 3. Fine-Tuned Modeli Kullanma

Fine-tuning tamamlandıktan sonra:

#### Option 1: Config'de değiştir

`.env` dosyasında:

```env
LLM_PROVIDER=huggingface
HUGGINGFACE_MODEL=./models/fine_tuned  # Lokal model path
```

#### Option 2: Kodda direkt kullan

```python
from src.models.llm.llm_wrapper import HuggingFaceWrapper

# Fine-tuned modeli yükle
llm = HuggingFaceWrapper(model_name="./models/fine_tuned")

# Kullan
response = llm.generate("Sakin bir kafe arıyorum")
```

## Veri Formatı

Eğitim verileri JSON formatında:

```json
[
  {
    "instruction": "Sen bir mekan öneri asistanısın...\nMekan: ...\nKullanıcı: Sakin bir kafe arıyorum",
    "output": "Bu mekanı öneriyorum çünkü...",
    "category": "mekan_onerisi"
  }
]
```

## Önerilen Ayarlar

### Küçük Modeller (1-2B parametre)

- **Batch Size**: 2-4
- **Learning Rate**: 5e-5
- **Epochs**: 2-3
- **Max Length**: 512

### Orta Modeller (3-7B parametre)

- **Batch Size**: 4-8
- **Learning Rate**: 2e-5
- **Epochs**: 3-5
- **Max Length**: 1024

## LoRA (Parameter-Efficient Fine-Tuning)

Daha az kaynak kullanmak için LoRA kullanabilirsiniz:

```bash
pip install peft
```

LoRA ile fine-tuning script'i eklenebilir (isteğe bağlı).

## GPU Kullanımı

GPU varsa otomatik kullanılır. CPU'da da çalışır ama çok yavaş olabilir.

**GPU kontrolü:**
```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
```

## Süre Tahminleri

### Qwen2-1.5B (100 örnek, 3 epoch)

- **CPU**: ~2-4 saat
- **GPU (NVIDIA)**: ~15-30 dakika
- **GPU (Apple Silicon)**: ~30-60 dakika

### TinyLlama-1.1B (100 örnek, 3 epoch)

- **CPU**: ~1-2 saat
- **GPU**: ~10-20 dakika

## Sorun Giderme

### Out of Memory (OOM) Hatası

1. Batch size'ı küçültün: `--batch-size 1`
2. Gradient accumulation kullanın (script'e eklenecek)
3. Daha küçük model seçin

### Yavaş Eğitim

1. GPU kullanın
2. Daha küçük model seçin
3. Epoch sayısını azaltın
4. Veri sayısını azaltın (test için)

### Model Kaydedilmiyor

1. Disk alanını kontrol edin
2. Write permissions kontrolü
3. Output directory'yi manuel oluşturun

## Fine-Tuned Model Performansı

Fine-tuning sonrası model:
- ✅ Mekan önerisi görevine özelleştirilmiş
- ✅ Türkçe mekan önerileri daha iyi
- ✅ Domain-specific bilgi içerir
- ⚠️ Başlangıç modelinden daha iyi sonuçlar verebilir

## Test Etme

Fine-tuned modeli test etmek için:

```python
from src.models.llm.llm_wrapper import HuggingFaceWrapper

llm = HuggingFaceWrapper(model_name="./models/fine_tuned")

# Test promptları
test_prompts = [
    "Sakin bir kafe arıyorum, wifi olmalı",
    "Ailemle gidebileceğim bir restoran",
    "Romantik bir akşam yemeği için yer"
]

for prompt in test_prompts:
    response = llm.generate(prompt)
    print(f"Soru: {prompt}")
    print(f"Cevap: {response}\n")
```

## Sonraki Adımlar

1. ✅ Veri hazırlama scriptini çalıştır
2. ✅ Fine-tuning başlat
3. ✅ Model performansını değerlendir
4. ✅ Gerekirse daha fazla veri ekle ve yeniden eğit
5. ✅ Production'da kullan

## Kaynaklar

- [HuggingFace Fine-tuning Guide](https://huggingface.co/docs/transformers/training)
- [Qwen2 Documentation](https://huggingface.co/Qwen/Qwen2-1.5B-Instruct)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)

