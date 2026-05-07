"""
Faz 1 İyileştirmeleri Test
=========================

Test Senaryoları:
1. Mesafe Bazlı Filtreleme (user_lat, user_lng ile)
2. Hibrit Skorlama (feature + distance + popularity + time)
3. Sıkı Kategori Filtresi
4. Reranking Algoritması
5. Detaylı Açıklama ve Gerekçeler
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080"

def test_basic_search():
    """Test 1: Temel arama (parametresiz)"""
    print("\n" + "="*60)
    print("TEST 1: Temel Arama (Parametresiz)")
    print("="*60)
    
    payload = {
        "query": "deniz goren wifisi olan guzel bir cafe",
        "location": "Kadikoy"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/smart-search", json=payload)
        data = response.json()
        
        print(f"\nSorgu: {data['query']}")
        print(f"Bulunan: {data['found']} mekan")
        print(f"Onerilen: {len(data['recommendations'])} mekan")
        print(f"\nAciklama: {data['explanation']}")
        
        print("\n--- En iyi 3 Mekan ---")
        for i, place in enumerate(data['recommendations'][:3], 1):
            print(f"\n{i}. {place['name']}")
            print(f"   Skor: {place['match_score']}")
            print(f"   Gerekce: {place['recommendation_reason']}")
            if 'score_breakdown' in place:
                print(f"   Detay: Feature={place['score_breakdown']['feature']}, "
                      f"Distance={place['score_breakdown']['distance']}, "
                      f"Popularity={place['score_breakdown']['popularity']}")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_with_coordinates():
    """Test 2: Kullanıcı konumu ile arama"""
    print("\n" + "="*60)
    print("TEST 2: Kullanici Konumu ile Arama")
    print("="*60)
    
    # Kadıköy Moda koordinatları (örnek)
    payload = {
        "query": "Kadikoy'de bana yakin wifi olan kafe",
        "location": "Kadikoy",
        "user_lat": 40.9871,  # Moda İskelesi
        "user_lng": 29.0262,
        "max_distance_km": 2.0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/smart-search", json=payload)
        data = response.json()
        
        print(f"\nSorgu: {data['query']}")
        print(f"Kullanici Konumu: ({payload['user_lat']}, {payload['user_lng']})")
        print(f"Maksimum Mesafe: {payload['max_distance_km']}km")
        print(f"\nBulunan: {data['found']} mekan")
        print(f"Filtrelenen: {data.get('filtered', 'N/A')} mekan")
        print(f"Onerilen: {len(data['recommendations'])} mekan")
        
        print("\n--- Mesafe Bazli Sonuclar ---")
        for i, place in enumerate(data['recommendations'], 1):
            dist = place.get('distance_km', 'N/A')
            print(f"\n{i}. {place['name']}")
            print(f"   Mesafe: {dist} km")
            print(f"   Toplam Skor: {place['match_score']}")
            print(f"   Gerekce: {place['recommendation_reason']}")
        
        # Metadata kontrol
        if 'search_metadata' in data:
            print(f"\n--- Arama Metadata ---")
            print(json.dumps(data['search_metadata'], indent=2, ensure_ascii=False))
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_strict_category():
    """Test 3: Sıkı kategori filtresi"""
    print("\n" + "="*60)
    print("TEST 3: Siki Kategori Filtresi")
    print("="*60)
    
    payload = {
        "query": "kafe Besiktas",
        "location": "Besiktas"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/smart-search", json=payload)
        data = response.json()
        
        print(f"\nSorgu: {data['query']}")
        print(f"Aranan Kategori: {data['parsed']['category']}")
        print(f"Bulunan: {data['found']} mekan")
        print(f"Filtrelenen: {data.get('filtered', 'N/A')} mekan")
        
        # Kategori kontrolü
        strict_filter_used = data.get('search_metadata', {}).get('strict_category_filter', False)
        print(f"\nSiki kategori filtresi kullanildi: {strict_filter_used}")
        
        print("\n--- Kategori Dogrulama ---")
        for i, place in enumerate(data['recommendations'][:3], 1):
            print(f"{i}. {place['name']} - Kategori: {place.get('category', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_time_awareness():
    """Test 4: Zaman farkındalığı"""
    print("\n" + "="*60)
    print("TEST 4: Zaman Farkindakligi")
    print("="*60)
    
    current_hour = datetime.now().hour
    
    if current_hour < 11:
        query = "kahvalti yapabileceğim mekan"
    elif current_hour < 17:
        query = "öğle yemeği için restoran"
    else:
        query = "akşam yemeği için restoran"
    
    payload = {
        "query": query,
        "location": "Istanbul"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/smart-search", json=payload)
        data = response.json()
        
        current_time = data.get('search_metadata', {}).get('time_of_search', 'N/A')
        
        print(f"\nSorgu: {data['query']}")
        print(f"Arama Zamani: {current_time}")
        print(f"Onerilen: {len(data['recommendations'])} mekan")
        
        print("\n--- Zaman Bazli Skorlama ---")
        for i, place in enumerate(data['recommendations'][:3], 1):
            time_score = place.get('score_breakdown', {}).get('time', 0)
            print(f"{i}. {place['name']}")
            print(f"   Zaman Skoru: {time_score}")
            print(f"   Toplam Skor: {place['match_score']}")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_reranking():
    """Test 5: Reranking algoritması"""
    print("\n" + "="*60)
    print("TEST 5: Reranking Algoritmasi")
    print("="*60)
    
    payload = {
        "query": "muhteşem manzarali premium cafe latte yapan yer",
        "location": "Istanbul",
        "limit": 10
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/smart-search", json=payload)
        data = response.json()
        
        print(f"\nSorgu: {data['query']}")
        print(f"Aranan Ozellikler: {', '.join(data['parsed']['features'])}")
        print(f"\nOrijinal Bulunan: {data['found']} mekan")
        print(f"Reranking sonrasi: {len(data['recommendations'])} mekan")
        
        print("\n--- Reranking Sonuclari ---")
        for i, place in enumerate(data['recommendations'], 1):
            rerank_score = place.get('rerank_score', place.get('match_score', 0))
            print(f"\n{i}. {place['name']}")
            print(f"   Rerank Skor: {rerank_score}")
            print(f"   Match Skor: {place['match_score']}")
            print(f"   Gerekce: {place['recommendation_reason']}")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def run_all_tests():
    """Tüm testleri çalıştır"""
    print("\n")
    print("*" * 60)
    print("FAZ 1 İYİLEŞTİRMELERİ TEST SÜİTİ")
    print("*" * 60)
    print(f"Başlangıç: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Temel Arama", test_basic_search),
        ("Koordinat Bazli Arama", test_with_coordinates),
        ("Siki Kategori Filtresi", test_strict_category),
        ("Zaman Farkindakligi", test_time_awareness),
        ("Reranking", test_reranking)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results[test_name] = "BASARILI" if success else "BASARISIZ"
        except Exception as e:
            results[test_name] = f"HATA: {str(e)}"
    
    # Özet
    print("\n" + "="*60)
    print("TEST SONUCLARI OZETI")
    print("="*60)
    
    for test_name, result in results.items():
        status_icon = "✓" if result == "BASARILI" else "✗"
        print(f"{status_icon} {test_name}: {result}")
    
    success_count = sum(1 for r in results.values() if r == "BASARILI")
    total_count = len(results)
    
    print(f"\n{success_count}/{total_count} test basarili")
    print(f"Bitis: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("*" * 60)


if __name__ == "__main__":
    run_all_tests()
