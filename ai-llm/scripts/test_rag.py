"""
RAG Sistemi Test Scripti
"""

import sys
import os
import asyncio

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.rag.pipeline import RAGPipeline
from src.utils.logging_config import setup_logging

# Logging'i ayarla
setup_logging("INFO")
logger = setup_logging()


def test_rag_pipeline():
    """RAG pipeline'ı test et"""
    print("\n" + "="*50)
    print("RAG Pipeline Test")
    print("="*50 + "\n")
    
    # Pipeline oluştur
    try:
        pipeline = RAGPipeline()
        print("✓ RAG Pipeline başarıyla oluşturuldu\n")
    except Exception as e:
        print(f"✗ RAG Pipeline oluşturulamadı: {e}")
        return False
    
    # Test sorguları
    test_queries = [
        {
            "query": "Sakin bir kafe arıyorum, wifi olmalı",
            "location": {"enlem": 41.0082, "boylam": 28.9784}
        },
        {
            "query": "Ailemle gidebileceğim bir restoran",
            "location": {"enlem": 41.0082, "boylam": 28.9784}
        }
    ]
    
    for i, test in enumerate(test_queries, 1):
        print(f"\n[{i}] Test Sorgusu: {test['query']}")
        print("-" * 50)
        
        try:
            result = pipeline.process(
                user_query=test["query"],
                location=test["location"]
            )
            
            print(f"✓ Sorgu analizi: {result.get('sorgu_analizi', 'N/A')}")
            print(f"✓ Bulunan mekan sayısı: {len(result.get('oneriler', []))}")
            
            if result.get('oneriler'):
                print("\nÖnerilen Mekanlar:")
                for j, oneri in enumerate(result['oneriler'][:3], 1):
                    print(f"  {j}. {oneri.get('ad', 'N/A')} (Skor: {oneri.get('benzerlik_skoru', 0):.2f})")
            else:
                print("⚠ Hiç mekan bulunamadı")
        
        except Exception as e:
            print(f"✗ Hata: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*50)
    print("Test tamamlandı!")
    print("="*50 + "\n")
    
    return True


if __name__ == "__main__":
    print("\n🚀 RAG Sistemi Test Scripti Başlatılıyor...\n")
    
    # .env dosyasının yüklendiğinden emin ol
    from dotenv import load_dotenv
    load_dotenv()
    
    success = test_rag_pipeline()
    
    if not success:
        sys.exit(1)

