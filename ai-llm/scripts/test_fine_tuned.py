"""
Fine-tuned model test scripti
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from src.models.llm.llm_wrapper import HuggingFaceWrapper
from src.utils.logging_config import setup_logging

setup_logging("INFO")


def test_fine_tuned_model(model_path: str = "./models/fine_tuned"):
    """Fine-tuned modeli test et"""
    print("\n" + "="*60)
    print("Fine-Tuned Model Test")
    print("="*60 + "\n")
    
    if not os.path.exists(model_path):
        print(f"✗ Model bulunamadı: {model_path}")
        print("\nÖnce fine-tuning yapmalısınız:")
        print("  python scripts/fine_tune_model.py")
        return False
    
    print(f"Model: {model_path}\n")
    
    # Model yükle
    try:
        print("🤖 Fine-tuned model yükleniyor...")
        llm = HuggingFaceWrapper(model_name=model_path)
        print("✓ Model yüklendi!\n")
    except Exception as e:
        print(f"✗ Model yüklenemedi: {e}")
        return False
    
    # Test promptları
    test_prompts = [
        {
            "prompt": "Sakin bir kafe arıyorum, wifi olmalı. Bana öneriler sunabilir misin?",
            "context": "Mekan Adı: Sakin Kafe\nKategori: Kafe\nAçıklama: Sessiz ve huzurlu bir ortam"
        },
        {
            "prompt": "Ailemle gidebileceğim bir restoran önerir misin?",
            "context": "Mekan Adı: Aile Restoranı\nKategori: Restoran\nAçıklama: Aile dostu ortam"
        },
        {
            "prompt": "İstanbul'da denize yakın, romantik bir restoran var mı?",
            "context": "Mekan Adı: Romantik Akşam\nKategori: Restoran\nAçıklama: Deniz manzaralı, romantik atmosfer"
        }
    ]
    
    print("📝 Test sonuçları:\n")
    
    for i, test in enumerate(test_prompts, 1):
        print(f"[{i}] Test:")
        print(f"    Prompt: {test['prompt']}")
        print(f"    Context: {test['context'][:50]}...")
        print("-" * 60)
        
        try:
            # Context ile prompt birleştir
            full_prompt = f"{test['context']}\n\n{test['prompt']}"
            
            response = llm.generate(full_prompt)
            print(f"✓ Yanıt: {response}\n")
        except Exception as e:
            print(f"✗ Hata: {e}\n")
            import traceback
            traceback.print_exc()
    
    print("="*60)
    print("Test tamamlandı! 🎉")
    print("="*60 + "\n")
    
    return True


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Fine-tuned model test")
    parser.add_argument("--model", type=str, default="./models/fine_tuned", help="Model path")
    
    args = parser.parse_args()
    
    success = test_fine_tuned_model(args.model)
    
    if not success:
        sys.exit(1)

