"""
Local LLM Test Scripti
HuggingFace modelinin çalıştığını test eder
"""

import sys
import os

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from src.models.llm.llm_wrapper import LLMFactory
from src.config import settings
from src.utils.logging_config import setup_logging

# Logging'i ayarla
setup_logging("INFO")
logger = setup_logging()


def test_local_llm():
    """Local LLM'i test et"""
    print("\n" + "="*60)
    print("Local LLM Test")
    print("="*60 + "\n")
    
    # Provider'ı kontrol et
    print(f"LLM Provider: {settings.LLM_PROVIDER}")
    print(f"Model: {settings.HUGGINGFACE_MODEL if settings.LLM_PROVIDER == 'huggingface' else settings.OPENAI_MODEL}")
    print()
    
    # LLM oluştur
    try:
        print("🤖 LLM modeli yükleniyor...")
        llm = LLMFactory.create_llm()
        print("✓ Model başarıyla yüklendi!\n")
    except Exception as e:
        print(f"✗ Model yüklenemedi: {e}")
        print("\nİpucu: Local model için LLM_PROVIDER=huggingface ayarlayın")
        return False
    
    # Test promptları
    test_prompts = [
        "Sakin bir kafe arıyorum, wifi olmalı. Bana öneriler sunabilir misin?",
        "Ailemle gidebileceğim bir restoran önerir misin?",
        "İstanbul'da denize yakın, romantik bir restoran var mı?",
    ]
    
    print("📝 Test promptları:\n")
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"[{i}] Test Sorgusu: {prompt}")
        print("-" * 60)
        
        try:
            response = llm.generate(prompt)
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
    print("\n🚀 Local LLM Test Scripti Başlatılıyor...\n")
    
    success = test_local_llm()
    
    if not success:
        print("\n⚠ Test başarısız oldu. Lütfen:")
        print("1. .env dosyasında LLM_PROVIDER=huggingface olduğundan emin olun")
        print("2. 'pip install transformers accelerate' komutunu çalıştırın")
        print("3. Yeterli RAM'iniz olduğundan emin olun (en az 8GB önerilir)")
        sys.exit(1)

