"""
Terminal Chatbot - Mekan Oneri Sistemi
Kullanim: python chatbot_terminal.py
"""

import sys
import os

# Proje kok dizinini path'e ekle
sys.path.insert(0, os.path.dirname(__file__))

from src.rag.pipeline import RAGPipeline
from src.config import settings
import time

def print_banner():
    """Banner yazdir"""
    print("\n" + "="*70)
    print(" "*20 + "MEKAN ONERI CHATBOT")
    print("="*70)
    print("\n[*] Yapay zeka destekli akilli mekan onerisi")
    print("[*] Cikmak icin 'q' veya 'exit' yazin\n")
    print("-"*70)
    print(f"[+] Hybrid Search    : {settings.USE_HYBRID_SEARCH}")
    print(f"[+] Query Expansion  : {settings.USE_QUERY_EXPANSION}")
    print(f"[+] Re-Ranking       : {settings.USE_RERANKING}")
    print(f"[+] Location Filter  : {settings.USE_LOCATION_FILTER}")
    print("-"*70 + "\n")

def print_results(sonuc):
    """Sonuclari formatla ve yazdir"""
    print("\n" + "="*70)
    
    # Sorgu analizi
    if sonuc.get("sorgu_analizi"):
        print(f"\n[ANALIZ] {sonuc['sorgu_analizi']}\n")
    
    # Oneriler
    if sonuc.get("oneriler"):
        print(f"[ONERILER] {len(sonuc['oneriler'])} mekan bulundu:\n")
        
        for idx, mekan in enumerate(sonuc["oneriler"][:5], 1):
            print(f"\n{idx}. {mekan['ad']}")
            print(f"   Skor      : {mekan['benzerlik_skoru']}")
            if mekan.get('mesafe_km'):
                print(f"   Mesafe    : {mekan['mesafe_km']}km")
            print(f"   Kategori  : {mekan['kategori']}")
            print(f"   Gerekce   : {mekan['gerekce']}")
    else:
        print("\n[!] Uzgunum, uygun mekan bulunamadi.")
    
    # Ek bilgiler
    if sonuc.get("genisletilmis_sorgular") and len(sonuc["genisletilmis_sorgular"]) > 1:
        print(f"\n[DETAY]")
        print(f"  Genisletilmis Sorgular: {', '.join(sonuc['genisletilmis_sorgular'][:3])}")
        print(f"  Islem Suresi: {sonuc.get('islem_suresi_ms', 0):.0f}ms")
    
    print("\n" + "="*70 + "\n")

def get_location():
    """Kullanicidan konum bilgisi al"""
    print("\n[?] Konum bilgisi eklemek ister misiniz? (e/h): ", end="")
    cevap = input().strip().lower()
    
    if cevap in ['e', 'evet', 'y', 'yes']:
        try:
            print("[?] Enlem (ornek: 41.0082): ", end="")
            enlem = float(input().strip() or "41.0082")
            
            print("[?] Boylam (ornek: 28.9784): ", end="")
            boylam = float(input().strip() or "28.9784")
            
            print(f"[+] Konum ayarlandi: {enlem}, {boylam}")
            return {"enlem": enlem, "boylam": boylam}
        except ValueError:
            print("[!] Gecersiz konum, konum kullanilmayacak.")
            return None
    
    return None

def main():
    """Ana fonksiyon"""
    print_banner()
    
    # Pipeline'i yukle
    print("[*] RAG Pipeline yukleniyor...")
    try:
        pipeline = RAGPipeline()
        print("[+] Sistem hazir!\n")
    except Exception as e:
        print(f"[!] HATA: Sistem yuklenemedi: {e}")
        return
    
    # Konum bilgisi al
    location = get_location()
    
    # Ana dongu
    print("\n" + "="*70)
    print("CHATBOT BASLATILDI - Sorularinizi yazabilirsiniz!")
    print("="*70 + "\n")
    
    while True:
        try:
            # Kullanici input
            print("\n[SORU] ", end="")
            user_input = input().strip()
            
            # Cikis kontrolu
            if user_input.lower() in ['q', 'quit', 'exit', 'cikis']:
                print("\n[*] Chatbot kapatiliyor. Gorusmek uzere!")
                break
            
            # Bos input kontrolu
            if not user_input:
                print("[!] Lutfen bir soru yazin.")
                continue
            
            # Ozel komutlar
            if user_input.lower() == 'konum':
                location = get_location()
                continue
            
            if user_input.lower() == 'help':
                print("\n[YARDIM]")
                print("  - Mekan aramak icin sorgunuzu yazin")
                print("  - 'konum' : Konum bilgisi degistir")
                print("  - 'q' veya 'exit' : Cikis")
                continue
            
            # Sorguyu isle
            print("\n[*] Dusunuyorum...")
            start_time = time.time()
            
            sonuc = pipeline.process(
                user_query=user_input,
                location=location
            )
            
            # Sonuclari goster
            print_results(sonuc)
            
        except KeyboardInterrupt:
            print("\n\n[*] Chatbot kapatiliyor. Gorusmek uzere!")
            break
        except Exception as e:
            print(f"\n[!] HATA: {e}")
            print("[*] Lutfen tekrar deneyin.\n")

if __name__ == "__main__":
    main()




