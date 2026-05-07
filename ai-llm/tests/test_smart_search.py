"""
Akıllı arama test script'i
"""
import requests
import json

# Test sorguları
test_queries = [
    "Kadıköy'de sessiz çalışma ortamı olan laptop friendly kafe",
    "Beşiktaş'ta açık havada oturabileceğim restoran",
    "deniz manzaralı romantik restoran",
]

print("\n" + "="*60)
print("🧪 AKILLI ARAMA TESTİ")
print("="*60 + "\n")

for query in test_queries:
    print(f"\n🔍 SORGU: {query}")
    print("-" * 60)
    
    try:
        response = requests.post(
            'http://localhost:8080/api/smart-search',
            json={
                'query': query,
                'location': 'Istanbul',
                'limit': 10
            }
        )
        
        result = response.json()
        
        print(f"\n📊 ANALİZ:")
        print(f"  • Kategori: {result['parsed']['category']}")
        print(f"  • Özellikler: {', '.join(result['parsed']['features']) if result['parsed']['features'] else 'Yok'}")
        print(f"  • Konum: {result['parsed']['location']}")
        print(f"  • Bulunan: {result['found']} mekan")
        
        print(f"\n✨ EN İYİ 3 ÖNERİ:\n")
        
        for i, place in enumerate(result['recommendations'][:3], 1):
            print(f"{i}. {place['name']} ⭐ {place['rating']}")
            print(f"   📍 {place['address'][:60]}")
            print(f"   🎯 Eşleşme Puanı: {place['match_score']}")
            print()
        
    except Exception as e:
        print(f"❌ Hata: {e}")
    
    print("\n" + "="*60)

print("\n✅ Test tamamlandı!\n")
