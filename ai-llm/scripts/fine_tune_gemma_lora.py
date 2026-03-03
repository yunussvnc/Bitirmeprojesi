"""
Faz 3.1: Gemma 2-2B modelini LoRA/QLoRA ile fine-tune etme script'i
Türkçe mekan önerisi için parameter-efficient fine-tuning
"""

import os
import json
import torch
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType
)
from datasets import Dataset


# ======================== CONFIGURATION ========================

class Config:
    # Model
    MODEL_NAME = "google/gemma-2-2b-it"
    MODEL_DIR = Path("../models")
    OUTPUT_DIR = Path("../models/gemma-2-2b-mekan-lora")
    
    # Training Data
    TRAINING_DATA = Path("../data/processed/training_data_v2.json")
    
    # LoRA Config
    LORA_R = 16  # Rank
    LORA_ALPHA = 32  # Alpha (scaling factor)
    LORA_DROPOUT = 0.05
    LORA_TARGET_MODULES = [
        "q_proj",
        "k_proj", 
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj"
    ]
    
    # Quantization (QLoRA)
    USE_QUANTIZATION = True  # 4-bit quantization (QLoRA)
    BNB_4BIT_COMPUTE_DTYPE = "bfloat16"
    BNB_4BIT_QUANT_TYPE = "nf4"
    
    # Training Hyperparameters
    NUM_EPOCHS = 3
    BATCH_SIZE = 2  # Lower for QLoRA
    GRADIENT_ACCUMULATION_STEPS = 8  # Effective batch size = 2 * 8 = 16
    LEARNING_RATE = 2e-4
    MAX_LENGTH = 1024
    WARMUP_STEPS = 50
    LOGGING_STEPS = 10
    SAVE_STEPS = 100
    EVAL_STEPS = 100
    
    # System
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    FP16 = torch.cuda.is_available()
    BF16 = False


config = Config()


# ======================== DATA LOADING ========================

def load_training_data(data_path: Path) -> List[Dict]:
    """Training data'yı yükle"""
    print(f"\n📂 Training data yükleniyor: {data_path}")
    
    if not data_path.exists():
        raise FileNotFoundError(f"Training data bulunamadı: {data_path}")
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    examples = data.get('data', [])
    print(f"✅ {len(examples)} training örneği yüklendi")
    
    return examples


def format_chat_template(instruction: str, response: str, tokenizer) -> str:
    """Gemma chat formatında mesaj oluştur"""
    
    # Gemma chat template
    chat = [
        {"role": "user", "content": instruction},
        {"role": "assistant", "content": response}
    ]
    
    # Tokenizer'ın chat template'ini kullan
    formatted = tokenizer.apply_chat_template(
        chat,
        tokenize=False,
        add_generation_prompt=False
    )
    
    return formatted


def prepare_dataset(examples: List[Dict], tokenizer) -> Dataset:
    """Dataset'i tokenize et ve hazırla"""
    
    print("\n🔧 Dataset hazırlanıyor...")
    
    # Format chat templates
    formatted_texts = []
    for ex in examples:
        text = format_chat_template(
            instruction=ex['instruction'],
            response=ex['response'],
            tokenizer=tokenizer
        )
        formatted_texts.append(text)
    
    print(f"  ✓ {len(formatted_texts)} örnek formatlandı")
    
    # Tokenize
    def tokenize_function(examples):
        result = tokenizer(
            examples['text'],
            truncation=True,
            max_length=config.MAX_LENGTH,
            padding=False,
            return_tensors=None
        )
        # Labels = input_ids (causal language modeling)
        result['labels'] = result['input_ids'].copy()
        return result
    
    # Create dataset
    dataset = Dataset.from_dict({'text': formatted_texts})
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=['text'],
        desc="Tokenizing"
    )
    
    print(f"  ✓ Dataset tokenize edildi")
    print(f"  📊 Örnek token sayısı: {len(tokenized_dataset[0]['input_ids'])}")
    
    return tokenized_dataset


# ======================== MODEL SETUP ========================

def setup_model_and_tokenizer():
    """Model ve tokenizer'ı yükle ve LoRA config'i ayarla"""
    
    print("\n🤖 Model ve tokenizer yükleniyor...")
    
    # Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        config.MODEL_NAME,
        trust_remote_code=True
    )
    
    # Pad token ayarla (Gemma için gerekli)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id
    
    print(f"  ✓ Tokenizer yüklendi: {config.MODEL_NAME}")
    
    # Quantization config (QLoRA)
    if config.USE_QUANTIZATION:
        print("  ⚙️ 4-bit quantization (QLoRA) aktif")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type=config.BNB_4BIT_QUANT_TYPE,
            bnb_4bit_compute_dtype=torch.bfloat16 if config.BNB_4BIT_COMPUTE_DTYPE == "bfloat16" else torch.float16
        )
    else:
        bnb_config = None
    
    # Model
    model = AutoModelForCausalLM.from_pretrained(
        config.MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto" if config.DEVICE == "cuda" else None,
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if config.BF16 else torch.float16
    )
    
    print(f"  ✓ Model yüklendi: {config.MODEL_NAME}")
    
    # LoRA config
    lora_config = LoraConfig(
        r=config.LORA_R,
        lora_alpha=config.LORA_ALPHA,
        target_modules=config.LORA_TARGET_MODULES,
        lora_dropout=config.LORA_DROPOUT,
        bias="none",
        task_type=TaskType.CAUSAL_LM
    )
    
    print(f"  ⚙️ LoRA config: r={config.LORA_R}, alpha={config.LORA_ALPHA}")
    
    # Prepare model for training
    if config.USE_QUANTIZATION:
        model = prepare_model_for_kbit_training(model)
        print("  ✓ Model k-bit training için hazırlandı")
    
    # Apply LoRA
    model = get_peft_model(model, lora_config)
    
    print("  ✓ LoRA adaptörleri eklendi")
    
    # Print trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  📊 Trainable params: {trainable_params:,} / {total_params:,} ({100 * trainable_params / total_params:.2f}%)")
    
    return model, tokenizer


# ======================== TRAINING ========================

def create_trainer(model, tokenizer, train_dataset, eval_dataset=None):
    """Trainer objesi oluştur"""
    
    print("\n🎓 Trainer yapılandırılıyor...")
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=str(config.OUTPUT_DIR),
        num_train_epochs=config.NUM_EPOCHS,
        per_device_train_batch_size=config.BATCH_SIZE,
        gradient_accumulation_steps=config.GRADIENT_ACCUMULATION_STEPS,
        learning_rate=config.LEARNING_RATE,
        warmup_steps=config.WARMUP_STEPS,
        logging_steps=config.LOGGING_STEPS,
        save_steps=config.SAVE_STEPS,
        eval_steps=config.EVAL_STEPS if eval_dataset else None,
        evaluation_strategy="steps" if eval_dataset else "no",
        save_strategy="steps",
        save_total_limit=3,
        load_best_model_at_end=True if eval_dataset else False,
        fp16=config.FP16,
        bf16=config.BF16,
        optim="paged_adamw_8bit" if config.USE_QUANTIZATION else "adamw_torch",
        gradient_checkpointing=True,
        group_by_length=True,
        report_to="none",  # Disable wandb
        logging_first_step=True,
        remove_unused_columns=False
    )
    
    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # Causal LM (not masked)
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=data_collator
    )
    
    print("  ✓ Trainer hazır")
    
    return trainer


def train_model():
    """Ana training fonksiyonu"""
    
    print("=" * 70)
    print("🚀 FAZ 3.1: GEMMA 2-2B FINE-TUNING (LoRA)")
    print("=" * 70)
    
    # 1. Load data
    training_examples = load_training_data(config.TRAINING_DATA)
    
    # 2. Setup model
    model, tokenizer = setup_model_and_tokenizer()
    
    # 3. Prepare dataset
    dataset = prepare_dataset(training_examples, tokenizer)
    
    # Split train/eval (90/10)
    split_dataset = dataset.train_test_split(test_size=0.1, seed=42)
    train_dataset = split_dataset['train']
    eval_dataset = split_dataset['test']
    
    print(f"\n📊 Dataset split:")
    print(f"  Train: {len(train_dataset)} örnekBatch size: {config.BATCH_SIZE}")
    print(f"  Eval:  {len(eval_dataset)} örnek")
    
    # 4. Create trainer
    trainer = create_trainer(model, tokenizer, train_dataset, eval_dataset)
    
    # 5. Train!
    print("\n" + "=" * 70)
    print("🔥 TRAINING BAŞLIYOR...")
    print("=" * 70)
    print(f"⏱️ Başlangıç: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Epochs: {config.NUM_EPOCHS}")
    print(f"📦 Batch size: {config.BATCH_SIZE} (gradient accum: {config.GRADIENT_ACCUMULATION_STEPS})")
    print(f"📈 Learning rate: {config.LEARNING_RATE}")
    print(f"💾 Output dir: {config.OUTPUT_DIR}")
    print("=" * 70 + "\n")
    
    # Training
    train_result = trainer.train()
    
    # 6. Save model
    print("\n💾 Model kaydediliyor...")
    trainer.save_model()
    tokenizer.save_pretrained(config.OUTPUT_DIR)
    
    # Save training metrics
    metrics = train_result.metrics
    metrics['train_samples'] = len(train_dataset)
    metrics['eval_samples'] = len(eval_dataset)
    
    metrics_file = config.OUTPUT_DIR / "training_metrics.json"
    with open(metrics_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"  ✓ Model kaydedildi: {config.OUTPUT_DIR}")
    print(f"  ✓ Metrics kaydedildi: {metrics_file}")
    
    # 7. Summary
    print("\n" + "=" * 70)
    print("✅ TRAINING TAMAMLANDI!")
    print("=" * 70)
    print(f"⏱️ Bitiş: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Final Loss: {metrics.get('train_loss', 'N/A'):.4f}")
    if 'eval_loss' in metrics:
        print(f"📊 Eval Loss: {metrics['eval_loss']:.4f}")
    print(f"⚡ Training samples/sec: {metrics.get('train_samples_per_second', 'N/A'):.2f}")
    print(f"\n💾 Model location: {config.OUTPUT_DIR}")
    print(f"\n🎯 Sonraki adım: Test script'ini çalıştır")
    print(f"   python scripts/test_fine_tuned_lora.py")
    print("=" * 70)


# ======================== MAIN ========================

def main():
    # Check requirements
    if not config.TRAINING_DATA.exists():
        print(f"\n❌ Training data bulunamadı: {config.TRAINING_DATA}")
        print("💡 Önce training data hazırla:")
        print("   python scripts/prepare_training_data_v2.py")
        return
    
    # Check GPU
    if config.DEVICE == "cuda":
        print(f"\n🎮 GPU: {torch.cuda.get_device_name(0)}")
        print(f"💾 VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    else:
        print("\n⚠️ CPU modunda çalışıyor (yavaş olabilir)")
    
    # Start training
    try:
        train_model()
    except KeyboardInterrupt:
        print("\n\n⚠️ Training kullanıcı tarafından durduruldu")
    except Exception as e:
        print(f"\n\n❌ Training hatası: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
