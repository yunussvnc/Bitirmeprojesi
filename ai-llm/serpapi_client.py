# -*- coding: utf-8 -*-
"""
SerpApi Client - Google Maps Places verisi cekmek icin
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
        limit: int = 10,
        lat: Optional[float] = None,
        lng: Optional[float] = None
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
            "type": "search",
            "hl": "tr",
            "gl": "tr",
            "api_key": self.api_key
        }
        
        if lat and lng:
            params["ll"] = f"@{lat},{lng},14z"
        else:
            params["ll"] = "@41.0082,28.9784,11z"  # İstanbul merkez
            
        print(f"[SerpApi] Araniyor: {query} (Konum: {params['ll']})")
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            print(f"[SerpApi] API hatasi: {e}")
            return []
        
        if "error" in data:
            print(f"[SerpApi] Hata: {data['error']}")
            return []
        
        local_results = data.get("local_results", [])
        places = []
        
        for item in local_results[:limit]:
            place = self._parse_place(item)
            if place:
                # Sadece popüler mekanları al (ara sokak dönercisi gibi yerleri filtrele)
                rating = place.get('rating', 0)
                review_count = place.get('review_count', 0)
                
                # Minimum kalite kriterleri
                if rating >= 4.0 and review_count >= 50:
                    places.append(place)
                elif rating >= 4.5 and review_count >= 20:  # Çok iyi puanlılar için daha az yorum yeterli
                    places.append(place)
        
        print(f"[SerpApi] {len(places)} mekan bulundu")
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
            
            hours = (
                item.get("hours")
                or item.get("operating_hours")
                or item.get("open_state")
            )

            return {
                "name": item.get("title", ""),
                "address": item.get("address", ""),
                "data_id": item.get("data_id", ""),  # Yorum çekmek için kritik
                "latitude": gps.get("latitude"),
                "longitude": gps.get("longitude"),
                "rating": item.get("rating", 0.0),
                "review_count": item.get("reviews", 0),
                "price_level": price_level,
                "category": item.get("type", "Kafe"),
                "photo_url": self._get_best_photo(item),
                "description": item.get("description", f"{item.get('title', '')} - {item.get('address', '')}"),
                "user_review": item.get("user_review", ""),
                "hours": hours,
            }
            
        except Exception as e:
            print(f"[SerpApi] Parse hatasi: {e}")
            return None

    def _get_best_photo(self, item: Dict) -> Optional[str]:
        """En iyi fotoğraf URL'ini seç (fallback zinciri)"""
        # 1. Direkt thumbnail (en sık gelen)
        if item.get("thumbnail"):
            return item["thumbnail"]
        # 2. images dizisinin ilk elemanı
        images = item.get("images", [])
        if images and isinstance(images, list):
            first = images[0]
            if isinstance(first, dict):
                return first.get("original") or first.get("thumbnail")
            if isinstance(first, str):
                return first
        # 3. serpapi_thumbnail
        if item.get("serpapi_thumbnail"):
            return item["serpapi_thumbnail"]
        return None

    def _fetch_review_pages(self, data_id: str, max_reviews: int) -> List[Dict]:
        """Ham SerpAPI yorum kayıtlarını sayfalayarak döner."""
        if not data_id:
            return []

        collected: List[Dict] = []
        next_page = None
        max_pages = (max_reviews // 10) + 1
        page_count = 0

        print(f"[SerpApi] {data_id} icin yorumlar cekiliyor...")

        while page_count < max_pages and len(collected) < max_reviews:
            params = {
                "engine": "google_maps_reviews",
                "data_id": data_id,
                "sort_by": "newestFirst",
                "hl": "tr",
                "gl": "tr",
                "api_key": self.api_key,
            }
            if next_page:
                params["next_page_token"] = next_page

            try:
                res = requests.get(self.BASE_URL, params=params, timeout=15)
                res.raise_for_status()
                data = res.json()
            except Exception as e:
                print(f"[SerpApi] Review hatasi: {e}")
                break

            page_reviews = data.get("reviews", [])
            collected.extend(page_reviews)
            if len(collected) >= max_reviews:
                collected = collected[:max_reviews]
                break

            pagination = data.get("serpapi_pagination", {})
            next_page = pagination.get("next_page_token")
            if not next_page:
                break
            page_count += 1

        return collected

    @staticmethod
    def _parse_structured_review(raw: Dict) -> Optional[Dict]:
        text = (raw.get("snippet") or raw.get("extract") or "").strip()
        if not text:
            return None
        user = raw.get("user") or {}
        author = (user.get("name") or "Google kullanıcısı").strip()
        rating = raw.get("rating")
        try:
            rating = float(rating) if rating is not None else 0.0
        except (TypeError, ValueError):
            rating = 0.0
        relative_time = raw.get("date") or raw.get("iso_date") or ""
        return {
            "author_name": author,
            "rating": rating,
            "text": text,
            "relative_time": str(relative_time).strip() or None,
            "avatar_url": user.get("thumbnail"),
        }

    def get_place_reviews_structured(self, data_id: str, max_reviews: int = 50) -> List[Dict]:
        """Yazar adı, puan, metin ve zaman ile yapılandırılmış yorumlar."""
        result = []
        for raw in self._fetch_review_pages(data_id, max_reviews):
            parsed = self._parse_structured_review(raw)
            if parsed:
                result.append(parsed)
        return result

    def get_place_reviews(self, data_id: str, max_reviews: int = 50) -> List[str]:
        """
        Belirli bir mekan için (data_id üzerinden) son yorum metinlerini çeker.
        """
        return [r["text"] for r in self.get_place_reviews_structured(data_id, max_reviews)]


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
