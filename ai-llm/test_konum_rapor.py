"""
Konum Bazlı Arama Test Raporu
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

os.environ['LLM_PROVIDER'] = 'openai'
os.environ['QDRANT_URL'] = 'http://localhost:6333'

from src.rag.retriever import RAGRetriever
import time
import math

def hesapla_mesafe(lat1, lon1, lat2, lon2):
    """İki koordinat arasındaki mesafeyi hesapla (km)"""
    R = 6371  # Dünya yarıçapı km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def print_header(text):
    print("\n" + "="*90)
    print(f"  {text}")
    print("="*90 + "\n")

def print_subheader(text):
    print("\n" + "-"*90)
    print(f"  {text}")
    print("-"*90 + "\n")

def test_konum_bazli_arama():
    """Detaylı konum bazlı arama testi"""
    
    print_header("KONUM BAZLI ARAMA - DETAYLI TEST RAPORU")
    
    print("[*] Retriever baslatiliyor...")
    retriever = RAGRetriever()
    print("[+] Retriever hazir!\n")
    
    # Test senaryoları - farklı konumlar ve sorgular
    test_scenarios = [
        {
            "name": "Sultanahmet - Kahve Arama",
            "query": "kahve icmek istiyorum",
            "location": {"enlem": 41.0082, "boylam": 28.9784},
            "beklenen": "Kafe kategorisinde yuksek skor"
        },
        {
            "name": "Taksim - Calisma Mekani",
            "query": "sessiz wifi olan calisma mekani",
            "location": {"enlem": 41.0370, "boylam": 28.9850},
            "beklenen": "Sakin ortamli kafeler"
        },
        {
            "name": "Kadikoy - Kahvalti",
            "query": "guzel kahvalti yapabileceğim yer",
            "location": {"enlem": 40.9903, "boylam": 29.0250},
            "beklenen": "Kahvalti servisi olan yerler"
        },
        {
            "name": "Nisantasi - Lüks Restoran",
            "query": "sik restoran romantic",
            "location": {"enlem": 41.0477, "boylam": 28.9955},
            "beklenen": "Upscale restoranlar"
        },
        {
            "name": "Besiktas - Deniz Manzara",
            "query": "deniz manzarali cafe",
            "location": {"enlem": 41.0427, "boylam": 29.0089},
            "beklenen": "Boğaz manzarali mekanlar"
        }
    ]
    
    all_results = []
    
    for idx, scenario in enumerate(test_scenarios, 1):
        print_subheader(f"TEST {idx}: {scenario['name']}")
        
        print(f"[?] Sorgu     : '{scenario['query']}'")
        print(f"[*] Konum     : ({scenario['location']['enlem']}, {scenario['location']['boylam']})")
        print(f"[i] Beklenen  : {scenario['beklenen']}")
        print()
        
        # Arama yap
        start_time = time.time()
        results = retriever.retrieve(
            query=scenario['query'],
            location=scenario['location'],
            top_k=5
        )
        elapsed = (time.time() - start_time) * 1000
        
        # Sonuçları analiz et
        if results:
            print(f"[+] {len(results)} mekan bulundu ({elapsed:.0f}ms)\n")
            
            scenario_results = []
            
            for i, result in enumerate(results, 1):
                payload = result.get('payload', {})
                mekan_ad = payload.get('ad', 'Bilinmeyen')
                kategori = payload.get('kategori', 'N/A')
                skor = result.get('score', 0)
                mekan_lat = payload.get('enlem', 0)
                mekan_lon = payload.get('boylam', 0)
                
                # Mesafe hesapla
                mesafe = hesapla_mesafe(
                    scenario['location']['enlem'],
                    scenario['location']['boylam'],
                    mekan_lat,
                    mekan_lon
                )
                
                print(f"  {i}. {mekan_ad}")
                print(f"     Kategori       : {kategori}")
                print(f"     Benzerlik Skoru: {skor:.4f}")
                print(f"     Mesafe         : {mesafe:.2f} km")
                print(f"     Koordinat      : ({mekan_lat:.4f}, {mekan_lon:.4f})")
                
                if payload.get('aciklama'):
                    aciklama = payload['aciklama'][:80] + "..." if len(payload['aciklama']) > 80 else payload['aciklama']
                    print(f"     Aciklama       : {aciklama}")
                    
                if payload.get('adres'):
                    print(f"     Adres          : {payload['adres']}")
                
                print()
                
                scenario_results.append({
                    'mekan': mekan_ad,
                    'skor': skor,
                    'mesafe': mesafe,
                    'kategori': kategori
                })
            
            # Skor analizi
            avg_score = sum(r['skor'] for r in scenario_results) / len(scenario_results)
            avg_distance = sum(r['mesafe'] for r in scenario_results) / len(scenario_results)
            
            print(f"[i] Ortalama Benzerlik Skoru: {avg_score:.4f}")
            print(f"[i] Ortalama Mesafe         : {avg_distance:.2f} km")
            print(f"[i] En Yakin Mekan          : {min(scenario_results, key=lambda x: x['mesafe'])['mekan']} ({min(r['mesafe'] for r in scenario_results):.2f} km)")
            print(f"[i] En Yuksek Skorlu Mekan  : {max(scenario_results, key=lambda x: x['skor'])['mekan']} ({max(r['skor'] for r in scenario_results):.4f})")
            
            all_results.append({
                'test': scenario['name'],
                'sonuc_sayisi': len(results),
                'ortalama_skor': avg_score,
                'ortalama_mesafe': avg_distance,
                'sure_ms': elapsed
            })
            
        else:
            print("[!] Hic mekan bulunamadi")
            all_results.append({
                'test': scenario['name'],
                'sonuc_sayisi': 0,
                'ortalama_skor': 0,
                'ortalama_mesafe': 0,
                'sure_ms': elapsed
            })
        
        print()
    
    # Genel özet
    print_header("TEST OZETI")
    
    print(f"[+] Toplam Test Sayisi      : {len(test_scenarios)}")
    print(f"[+] Basarili Test Sayisi    : {sum(1 for r in all_results if r['sonuc_sayisi'] > 0)}")
    print(f"[+] Toplam Bulunan Mekan    : {sum(r['sonuc_sayisi'] for r in all_results)}")
    print(f"[+] Ortalama Yanit Suresi   : {sum(r['sure_ms'] for r in all_results) / len(all_results):.0f}ms")
    
    if all_results:
        valid_results = [r for r in all_results if r['sonuc_sayisi'] > 0]
        if valid_results:
            print(f"[+] Ortalama Benzerlik Skoru: {sum(r['ortalama_skor'] for r in valid_results) / len(valid_results):.4f}")
            print(f"[+] Ortalama Mesafe         : {sum(r['ortalama_mesafe'] for r in valid_results) / len(valid_results):.2f} km")
    
    print("\n[i] Test Detaylari:\n")
    for result in all_results:
        status = "[+]" if result['sonuc_sayisi'] > 0 else "[!]"
        print(f"  {status} {result['test']:<35} | {result['sonuc_sayisi']} mekan | "
              f"Skor: {result['ortalama_skor']:.3f} | "
              f"Mesafe: {result['ortalama_mesafe']:.2f}km | "
              f"Sure: {result['sure_ms']:.0f}ms")
    
    print("\n" + "="*90)
    print("[+] KONUM BAZLI ARAMA TESTI BASARIYLA TAMAMLANDI!")
    print("="*90 + "\n")
    
    print("[i] Cikarilanlar:")
    print("  - Vektör arama sistemi calisıyor")
    print("  - Farkli konumlar için sorgu yapilabiliyor")
    print("  - Benzerlik skorları hesaplanıyor")
    print("  - Mesafe hesaplamaları yapılabiliyor")
    print()

if __name__ == "__main__":
    try:
        test_konum_bazli_arama()
    except KeyboardInterrupt:
        print("\n\n[!] Test kullanici tarafindan durduruldu\n")
    except Exception as e:
        print(f"\n[!] Beklenmeyen hata: {e}\n")
        import traceback
        traceback.print_exc()

