# Local LLM Kurulum Kılavuzu

## Gereksinimler

- Python 3.9+
- En az 8GB RAM (16GB önerilir)
- GPU (opsiyonel ama önerilir)
- İnternet bağlantısı (ilk indirme için)

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
pip install transformers accelerate torch
```

### 2. Çevre Değişkenlerini Ayarla

`.env` dosyasında:

```env
LLM_PROVIDER=huggingface
HUGGINGFACE_MODEL=Qwen/Qwen2-1.5B-Instruct
```

### 3. Modeli Test Et

```bash
python scripts/test_local_llm.py
```

## Önerilen Modeller

### Küçük Modeller (RAM: 8-16GB)

#### 1. Qwen2-1.5B-Instruct (Önerilen)
```env
HUGGINGFACE_MODEL=Qwen/Qwen2-1.5B-Instruct
```
- **Boyut**: ~3GB
- **Türkçe Desteği**: İyi
- **Performans**: İyi
- **Hız**: Hızlı (CPU'da da çalışır)

#### 2. TinyLlama-1.1B-Chat
```env
HUGGINGFACE_MODEL=TinyLlama/TinyLlama-1.1B-Chat-v1.0
```
- **Boyut**: ~2GB
- **Türkçe Desteği**: Orta (İngilizce ağırlıklı)
- **Performans**: Orta
- **Hız**: Çok hızlı

#### 3. Phi-3-mini-4k-instruct
```env
HUGGINGFACE_MODEL=microsoft/Phi-3-mini-4k-instruct
```
- **Boyut**: ~7GB
- **Türkçe Desteği**: İyi
- **Performans**: Çok iyi
- **Hız**: Orta

### Orta Modeller (RAM: 16GB+)

#### Qwen2-7B-Instruct
```env
HUGGINGFACE_MODEL=Qwen/Qwen2-7B-Instruct
```
- **Boyut**: ~14GB
- **Türkçe Desteği**: Çok iyi
- **Performans**: Mükemmel

## İlk İndirme

Model ilk çalıştırmada otomatik indirilir. Manuel indirmek için:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

model_name = "Qwen/Qwen2-1.5B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
```

## GPU Kullanımı

### CUDA (NVIDIA)

```bash
# CUDA kurulu olmalı
python -c "import torch; print(torch.cuda.is_available())"

# Model otomatik olarak GPU kullanacak
```

### CPU Kullanımı

Model CPU'da da çalışır ama daha yavaş olur. GPU yoksa sorun değil, biraz beklemek gerekir.

## Performans İyileştirme

### 1. Quantization (Model Boyutunu Küçültme)

```python
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quantization_config
)
```

### 2. Batch Processing

Tek seferde birden fazla prompt işlemek performansı artırır.

### 3. Caching

Model bir kez yüklendikten sonra memory'de kalır, tekrar yüklemeye gerek yok.

## Sorun Giderme

### Out of Memory Hatası

1. Daha küçük bir model kullanın (TinyLlama)
2. Batch size'ı küçültün
3. CPU'da çalıştırın (daha yavaş ama daha az RAM)

### Model İndirme Hatası

1. İnternet bağlantınızı kontrol edin
2. HuggingFace'e login olun: `huggingface-cli login`
3. Manuel indirip kullanın

### Yavaş Çalışma

1. GPU kullanın
2. Daha küçük model seçin
3. `max_new_tokens` parametresini azaltın

## Örnek Kullanım

```python
from src.models.llm.llm_wrapper import LLMFactory

# Local model oluştur
llm = LLMFactory.create_llm("huggingface")

# Kullan
response = llm.generate("Sakin bir kafe arıyorum")
print(response)
```

## Model Karşılaştırması

| Model | Boyut | Türkçe | Hız (CPU) | Hız (GPU) | RAM |
|-------|-------|--------|-----------|-----------|-----|
| TinyLlama-1.1B | ~2GB | ⭐⭐ | ⚡⚡⚡ | ⚡⚡⚡⚡ | 4GB |
| Qwen2-1.5B | ~3GB | ⭐⭐⭐ | ⚡⚡ | ⚡⚡⚡⚡ | 6GB |
| Phi-3-mini | ~7GB | ⭐⭐⭐ | ⚡ | ⚡⚡⚡ | 12GB |
| Qwen2-7B | ~14GB | ⭐⭐⭐⭐ | 🐌 | ⚡⚡⚡ | 20GB |

## İpuçları

1. **İlk test için**: TinyLlama ile başlayın (hızlı indirme)
2. **Türkçe için**: Qwen2-1.5B önerilir (dengeli)
3. **En iyi performans**: Phi-3-mini veya Qwen2-7B
4. **RAM kısıtlı**: TinyLlama + CPU

## Kaynaklar

- [HuggingFace Models](https://huggingface.co/models)
- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [Qwen Models](https://huggingface.co/Qwen)

