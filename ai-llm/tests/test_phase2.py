"""
Faz 2 Test Suite - Cache, Model Preloading, Async Performance
=====================================================

Test Senaryoları:
1. System Info & Cache Stats
2. Cache Timing (Hit vs Miss)
3. Async Performance Comparison
4. Model Preloading Status
5. Repeated Queries (Cache Hit Test)
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8080"

def test_system_info():
    """Test 1: Sistem bilgileri ve cache istatistikleri"""
    print("\n" + "="*60)
    print("TEST 1: Sistem Bilgileri & Cache Stats")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/info")
        data = response.json()
        
        print(f"\nVersion: {data['version']}")
        print(f"Phase: {data['phase']}")
        
        print("\nÖzellikleri:")
        for feature in data['features']:
            print(f"  ✓ {feature}")
        
        print("\nCache Statistics:")
        cache_stats = data.get('cache_stats', {})
        print(f"  Total Items: {cache_stats.get('total_items', 0)}")
        print(f"  TTL: {cache_stats.get('ttl_seconds', 'N/A')} seconds")
        print(f"  Hits: {cache_stats.get('hits', 0)}")
        print(f"  Misses: {cache_stats.get('misses', 0)}")
        print(f"  Hit Rate: {cache_stats.get('hit_rate', '0%')}")
        
        print("\nModel Statistics:")
        model_stats = data.get('model_stats', {})
        print(f"  Loaded: {model_stats.get('is_loaded', False)}")
        print(f"  Device: {model_stats.get('device', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_cache_timing():
    """Test 2: Cache timing - İlk sorgu vs Cache hit"""
    print("\n" + "="*60)
    print("TEST 2: Cache Timing (Miss vs Hit)")
    print("="*60)
    
    payload = {
        "query": "deniz goren wifi kafe",
        "location": "Kadikoy"
    }
    
    try:
        # İlk sorgu (MISS)
        print("\n▶ İlk Sorgu (Cache MISS)...")
        start = time.time()
        response1 = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
        data1 = response1.json()
        time1 = time.time() - start
        
        print(f"  Süre: {time1:.3f} sn")
        print(f"  Bulunan: {data1.get('found', 0)} mekan")
        print(f"  Önerilen: {len(data1.get('recommendations', []))} mekan")
        
        cache_info1 = data1.get('_cache', {})
        perf_info1 = data1.get('_performance', {})
        print(f"  Cache Hit: {cache_info1.get('hit', False)}")
        print(f"  Response Time: {perf_info1.get('response_time_seconds', 'N/A')} sn")
        
        # 2. sorgu (HIT)
        print("\n▶ 2. Sorgu (Cache HIT)...")
        start = time.time()
        response2 = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
        data2 = response2.json()
        time2 = time.time() - start
        
        print(f"  Süre: {time2:.3f} sn")
        cache_info2 = data2.get('_cache', {})
        print(f"  Cache Hit: {cache_info2.get('hit', False)}")
        
        # Karşılaştırma
        if time1 > 0:
            speedup = time1 / time2
            print(f"\n📊 Hızlanma: {speedup:.1f}x daha hızlı!")
            print(f"  First: {time1:.3f}s → Cache: {time2:.3f}s")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_multiple_queries():
    """Test 3: Farklı sorgularla cache test"""
    print("\n" + "="*60)
    print("TEST 3: Multiple Queries Cache Test")
    print("="*60)
    
    queries = [
        {"query": "kafe Besiktas", "location": "Besiktas"},
        {"query": "restoran Istanbul", "location": "Istanbul"},
        {"query": "kafe Besiktas", "location": "Besiktas"},  # Tekrar (cache hit)
        {"query": "deniz goren wifi", "location": "Kadikoy"},
        {"query": "kafe Besiktas", "location": "Besiktas"},  # Tekrar (cache hit)
    ]
    
    try:
        results = []
        
        for i, payload in enumerate(queries, 1):
            start = time.time()
            response = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
            data = response.json()
            elapsed = time.time() - start
            
            cache_hit = data.get('_cache', {}).get('hit', False)
            
            results.append({
                "query": payload['query'],
                "time": elapsed,
                "cached": cache_hit
            })
            
            status = "🟢 CACHE HIT" if cache_hit else "🔴 CACHE MISS"
            print(f"\n{i}. {payload['query']}")
            print(f"   Time: {elapsed:.3f}s {status}")
        
        # Özet
        print("\n" + "-"*60)
        print("ÖZET:")
        hits = sum(1 for r in results if r['cached'])
        misses = sum(1 for r in results if not r['cached'])
        print(f"Cache Hits: {hits}")
        print(f"Cache Misses: {misses}")
        print(f"Hit Rate: {hits/(hits+misses)*100:.0f}%")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_recommendation_quality():
    """Test 4: Recommendation quality'nin cache sonrası consistent olup olmadığı"""
    print("\n" + "="*60)
    print("TEST 4: Recommendation Quality Consistency")
    print("="*60)
    
    payload = {
        "query": "wifi olan kafe",
        "location": "Kadikoy"
    }
    
    try:
        # İlk sorgu
        response1 = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
        data1 = response1.json()
        
        # 2. sorgu (cache'den)
        response2 = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
        data2 = response2.json()
        
        # Karşılaştır
        rec1 = [p['name'] for p in data1.get('recommendations', [])[:3]]
        rec2 = [p['name'] for p in data2.get('recommendations', [])[:3]]
        
        print(f"\n1. Sorgu (MISS):")
        for i, name in enumerate(rec1, 1):
            print(f"  {i}. {name}")
        
        print(f"\n2. Sorgu (Cache HIT):")
        for i, name in enumerate(rec2, 1):
            print(f"  {i}. {name}")
        
        # Check consistency
        if rec1 == rec2:
            print("\n✅ Sonuçlar AYNII (Cache çalışıyor)")
            return True
        else:
            print("\n⚠️  Sonuçlar FARKLII (Cache tutarlı değil)")
            return False
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def test_concurrent_requests():
    """Test 5: Concurrent requests (async test)"""
    print("\n" + "="*60)
    print("TEST 5: Concurrent Requests Performance")
    print("="*60)
    
    payload = {
        "query": "kafe Istanbul",
        "location": "Istanbul"
    }
    
    try:
        import concurrent.futures
        
        def make_request():
            start = time.time()
            response = requests.post(f"{BASE_URL}/api/smart-search-v2", json=payload)
            return time.time() - start
        
        # 5 concurrent requests
        print("\n▶ 5 eşzamanlı istek gönderiliyor...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            times = [f.result(timeout=30) for f in concurrent.futures.as_completed(futures)]
        
        print(f"\nSüreler:")
        for i, t in enumerate(sorted(times), 1):
            print(f"  {i}. {t:.3f}s")
        
        avg_time = sum(times) / len(times)
        print(f"\nAverage: {avg_time:.3f}s")
        print(f"Min: {min(times):.3f}s, Max: {max(times):.3f}s")
        
        return True
        
    except Exception as e:
        print(f"HATA: {e}")
        return False


def run_all_tests():
    """Tüm testleri çalıştır"""
    print("\n")
    print("*" * 60)
    print("FAZ 2 TEST SUITE - Performance & Caching")
    print("*" * 60)
    print(f"Başlangıç: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("System Info", test_system_info),
        ("Cache Timing", test_cache_timing),
        ("Multiple Queries", test_multiple_queries),
        ("Consistency", test_recommendation_quality),
        ("Concurrent Requests", test_concurrent_requests),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results[test_name] = "✅ PASS" if success else "❌ FAIL"
        except Exception as e:
            results[test_name] = f"⚠️ ERROR: {str(e)[:30]}"
    
    # Özet
    print("\n" + "="*60)
    print("TEST SONUCLARI OZETI")
    print("="*60)
    
    for test_name, result in results.items():
        print(f"{result} - {test_name}")
    
    pass_count = sum(1 for r in results.values() if "✅" in r or "PASS" in r)
    total_count = len(results)
    
    print(f"\n{pass_count}/{total_count} test başarılı")
    print(f"Bitis: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("*" * 60)


if __name__ == "__main__":
    run_all_tests()
