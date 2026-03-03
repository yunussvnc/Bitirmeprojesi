"""
SerpApi Client - Google Maps Places verisi çekmek için
Basitleştirilmiş versiyon (demo için)
"""

import os
import requests
from typing import List, Dict, Optional

# .env dosyasını yükle
from dotenv import load_dotenv
load_dotenv()


class SerpApiClient:
    """SerpApi ile Google Maps Places verisi çekme"""
    
    BASE_URL = "https://serpapi.com/search"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: SerpApi API key (yoksa .env'den alınır)
        """
        self.api_key = api_key or os.getenv("SERPAPI_KEY")
        if not self.api_key:
            raise ValueError(
                "SERPAPI_KEY bulunamadı!\n"
                ".env dosyasına ekleyin: SERPAPI_KEY=your_key\n"
                "API key almak için: https://serpapi.com/manage-api-key"
            )
    
    def search_places(
        self,
        query: str,
        location: str = "Istanbul, Turkey",
        limit: int = 10
    ) -> List[Dict]:
        """
        Google Maps'te mekan ara
        
        Args:
            query: Arama sorgusu (örn: "cafe in Kadıköy")
            location: Konum
            limit: Max sonuç sayısı
        
        Returns:
            Mekan listesi
        """
        params = {
            "engine": "google_maps",
            "q": query,
            "ll": "@41.0082,28.9784,11z",  # İstanbul merkez
            "type": "search",
            "api_key": self.api_key
        }
        
        print(f"🔍 Aranıyor: {query}")
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            print(f"❌ API hatası: {e}")
            return []
        
        if "error" in data:
            print(f"❌ SerpApi hatası: {data['error']}")
            return []
        
        local_results = data.get("local_results", [])
        places = []
        
        for item in local_results[:limit]:
            place = self._parse_place(item)
            if place:
                places.append(place)
        
        print(f"✅ {len(places)} mekan bulundu")
        return places
    
    def _parse_place(self, item: Dict) -> Optional[Dict]:
        """Google Maps sonucunu parse et"""
        try:
            # GPS koordinatları
            gps = item.get("gps_coordinates", {})
            if not gps.get("latitude") or not gps.get("longitude"):
                return None
            
            # Fiyat seviyesi
            price = item.get("price", "")
            price_level = len(price) if price else 2
            
            return {
                "name": item.get("title", ""),
                "address": item.get("address", ""),
                "latitude": gps.get("latitude"),
                "longitude": gps.get("longitude"),
                "rating": item.get("rating", 0.0),
                "review_count": item.get("reviews", 0),
                "price_level": price_level,
                "category": item.get("type", "Kafe"),
                "photo_url": item.get("thumbnail"),
                "description": item.get("description", f"{item.get('title', '')} - {item.get('address', '')}")
            }
            
        except Exception as e:
            print(f"⚠️ Parse hatası: {e}")
            return None


def test_client():
    """Test fonksiyonu"""
    try:
        client = SerpApiClient()
        print("\n✅ SerpApi client başarıyla oluşturuldu!")
        print(f"API Key: {client.api_key[:10]}...")
        
        # Test araması
        print("\n=== TEST: Kadıköy Kafeleri ===\n")
        places = client.search_places(
            query="cafe in Kadıköy, Istanbul",
            limit=3
        )
        
        if places:
            print(f"\n✅ {len(places)} mekan bulundu:\n")
            for i, place in enumerate(places, 1):
                print(f"{i}. {place['name']}")
                print(f"   📍 {place['address']}")
                print(f"   ⭐ {place['rating']}")
                print()
        else:
            print("❌ Hiç mekan bulunamadı")
        
        return True
        
    except ValueError as e:
        print(f"\n❌ Hata: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Beklenmeyen hata: {e}")
        return False


if __name__ == "__main__":
    test_client()
