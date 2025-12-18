"""
LLM Fine-tuning Scripti
Lokal modeli mekan önerileri için fine-tune eder
"""

import sys
import os
import json
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import torch
from dotenv import load_dotenv
from src.config import settings

load_dotenv()


def load_training_data(data_path: str = "data/processed/training_data.json"):
    """Eğitim verilerini yükle"""
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data


def format_for_training(example):
    """Veriyi eğitim formatına çevir"""
    # Qwen2 format: <|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n{assistant}<|im_end|>
    # Veya basit format için:
    instruction = example.get('instruction', '')
    output = example.get('output', '')
    text = f"{instruction}\nCevap: {output}"
    return {"text": text}


def prepare_dataset(training_data, tokenizer, max_length=512):
    """Dataset hazırla"""
    # Veriyi formatla
    formatted_data = [format_for_training(ex) for ex in training_data]
    
    # Dataset oluştur
    dataset = Dataset.from_list(formatted_data)
    
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=max_length,
            padding="max_length"
        )
    
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names
    )
    
    return tokenized_dataset


def fine_tune_model(
    model_name: str = None,
    output_dir: str = "models/fine_tuned",
    num_epochs: int = 3,
    batch_size: int = 4,
    learning_rate: float = 5e-5
):
    """Modeli fine-tune et"""
    
    model_name = model_name or settings.HUGGINGFACE_MODEL
    
    print("\n" + "="*60)
    print("LLM Fine-tuning Başlatılıyor")
    print("="*60 + "\n")
    print(f"Model: {model_name}")
    print(f"Çıktı Dizini: {output_dir}")
    print()
    
    # Device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}\n")
    
    # Tokenizer ve model yükle
    print("🤖 Model ve tokenizer yükleniyor...")
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None
    )
    
    if device == "cpu":
        model = model.to(device)
    
    print("✓ Model yüklendi\n")
    
    # Eğitim verilerini yükle
    print("📥 Eğitim verileri yükleniyor...")
    data_path = "data/processed/training_data.json"
    
    if not os.path.exists(data_path):
        print(f"⚠ Eğitim verisi bulunamadı: {data_path}")
        print("   Önce 'python scripts/prepare_training_data.py' çalıştırın!")
        sys.exit(1)
    
    training_data = load_training_data(data_path)
    print(f"✓ {len(training_data)} örnek yüklendi\n")
    
    # Dataset hazırla
    print("🔄 Dataset hazırlanıyor...")
    dataset = prepare_dataset(training_data, tokenizer)
    print("✓ Dataset hazır\n")
    
    # Train/test split
    dataset = dataset.train_test_split(test_size=0.1)
    train_dataset = dataset["train"]
    eval_dataset = dataset["test"]
    
    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # Causal LM için False
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        overwrite_output_dir=True,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        learning_rate=learning_rate,
        warmup_steps=100,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=device == "cuda",
        report_to="none"  # TensorBoard kullanmak isterseniz "tensorboard"
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
    )
    
    # Eğitimi başlat
    print("🚀 Eğitim başlatılıyor...\n")
    trainer.train()
    
    # Modeli kaydet
    print("\n💾 Model kaydediliyor...")
    trainer.save_model()
    tokenizer.save_pretrained(output_dir)
    print(f"✓ Model kaydedildi: {output_dir}\n")
    
    print("="*60)
    print("✓ Fine-tuning tamamlandı! 🎉")
    print("="*60 + "\n")
    
    return output_dir


def main():
    """Ana fonksiyon"""
    import argparse
    
    parser = argparse.ArgumentParser(description="LLM Fine-tuning")
    parser.add_argument("--model", type=str, default=None, help="Model adı")
    parser.add_argument("--output", type=str, default="models/fine_tuned", help="Çıktı dizini")
    parser.add_argument("--epochs", type=int, default=3, help="Epoch sayısı")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size")
    parser.add_argument("--lr", type=float, default=5e-5, help="Learning rate")
    
    args = parser.parse_args()
    
    try:
        fine_tune_model(
            model_name=args.model,
            output_dir=args.output,
            num_epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr
        )
    except KeyboardInterrupt:
        print("\n\n⚠ Eğitim kullanıcı tarafından durduruldu")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

