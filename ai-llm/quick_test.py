"""
Hizli Test - Streamlit olmadan basit test
"""

print("\n" + "="*70)
print(" "*20 + "MEKAN ONERI SISTEMI - HIZLI TEST")
print("="*70 + "\n")

print("[*] Moduller yukleniyor...")

try:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    
    from src.rag.pipeline import RAGPipeline
    from src.config import settings
    import time
    
    print("[+] Moduller yuklendi!")
    print("\n[*] RAG Pipeline baslatiliyor...")
    
    pipeline = RAGPipeline()
    
    print("[+] Pipeline hazir!")
    print("\n" + "-"*70)
    print(f"[+] Hybrid Search    : {settings.USE_HYBRID_SEARCH}")
    print(f"[+] Query Expansion  : {settings.USE_QUERY_EXPANSION}")
    print(f"[+] Re-Ranking       : {settings.USE_RERANKING}")
    print(f"[+] Location Filter  : {settings.USE_LOCATION_FILTER}")
    print("-"*70 + "\n")
    
    # Test sorgusu
    test_sorgu = "sakin calisma mekani"
    test_konum = {"enlem": 41.0082, "boylam": 28.9784}
    
    print(f"[TEST] Sorgu: '{test_sorgu}'")
    print(f"[TEST] Konum: Taksim ({test_konum['enlem']}, {test_konum['boylam']})")
    print("\n[*] Islem yapiliyor...\n")
    
    start_time = time.time()
    sonuc = pipeline.process(
        user_query=test_sorgu,
        location=test_konum
    )
    islem_suresi = (time.time() - start_time) * 1000
    
    print("="*70)
    print("SONUCLAR")
    print("="*70 + "\n")
    
    # Sorgu analizi
    if sonuc.get("sorgu_analizi"):
        print(f"[ANALIZ] {sonuc['sorgu_analizi']}\n")
    
    # Oneriler
    if sonuc.get("oneriler"):
        print(f"[ONERILER] {len(sonuc['oneriler'])} mekan bulundu:\n")
        
        for idx, mekan in enumerate(sonuc["oneriler"][:5], 1):
            print(f"{idx}. {mekan['ad']}")
            print(f"   Skor      : {mekan['benzerlik_skoru']}")
            if mekan.get('mesafe_km'):
                print(f"   Mesafe    : {mekan['mesafe_km']}km")
            print(f"   Kategori  : {mekan['kategori']}")
            print(f"   Gerekce   : {mekan['gerekce']}\n")
    else:
        print("[!] Mekan bulunamadi.\n")
    
    # Detaylar
    if sonuc.get("genisletilmis_sorgular"):
        print(f"[DETAY]")
        print(f"  Genisletilmis: {', '.join(sonuc['genisletilmis_sorgular'][:3])}")
        print(f"  Islem Suresi: {islem_suresi:.0f}ms")
    
    print("\n" + "="*70)
    print("[+] TEST BASARILI!")
    print("="*70 + "\n")
    
    print("[!] Streamlit arayuzu icin: http://localhost:5000")
    print("[!] Terminal chatbot icin: python chatbot_terminal.py")
    print()

except ImportError as e:
    print(f"\n[!] IMPORT HATASI: {e}")
    print("\n[COZUM]")
    print("  1. Yeni bir PowerShell penceresi acin")
    print("  2. cd D:\\BitirmeProjesi\\ai-llm")
    print("  3. python quick_test.py")
    print("\n[ALTERNATIF] Streamlit zaten calisiyor:")
    print("  http://localhost:5000\n")
    
except Exception as e:
    print(f"\n[!] HATA: {e}")
    import traceback
    traceback.print_exc()




