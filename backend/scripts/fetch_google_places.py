import os
import sys
import argparse
import requests
import json
from pprint import pprint

# Backend dizinini sys.path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Place
from config import get_settings

GOOGLE_API_URL = "https://places.googleapis.com/v1/places:searchText"

def get_places_from_google(api_key, query, max_pages=1):
    """Google Maps üzerinden mekanları sorgular (New Places API v1)"""
    results = []
    next_page_token = None
    pages_fetched = 0

    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.photos,nextPageToken",
        "Content-Type": "application/json"
    }

    while pages_fetched < max_pages:
        payload = {
            "textQuery": query,
            "languageCode": "tr"
        }
        
        if next_page_token:
            payload["pageToken"] = next_page_token

        print(f"[{query}] Google Maps API (V1) isteği yapılıyor (Sayfa {pages_fetched + 1})...")
        response = requests.post(GOOGLE_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Hata! HTTP {response.status_code}: {response.text}")
            break
            
        data = response.json()
        
        fetched_places = data.get("places", [])
        if not fetched_places and not data.get("nextPageToken"):
            print("Uyarı: Sonuç bulunamadı.")
            break

        results.extend(fetched_places)
        pages_fetched += 1
        
        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break
            
    return results

def get_category_from_types(types, default_category):
    """Google types alanını uygulamamızın kategori sistemine mapler."""
    if not types:
        return default_category
        
    type_map = {
        "cafe": "Kafe",
        "restaurant": "Restoran",
        "library": "Kütüphane",
        "bar": "Bar",
        "night_club": "Gece Kulübü",
        "park": "Park",
        "museum": "Müze",
        "shopping_mall": "Alışveriş Merkezi",
    }
    
    for t in types:
        if t in type_map:
            return type_map[t]
            
    return default_category

def save_places_to_db(db, places, city, category_name):
    """Google verilerini veritabanına kaydeder."""
    added_count = 0
    updated_count = 0
    
    for p in places:
        google_place_id = p.get("id")
        if not google_place_id:
            continue
            
        # Önceden eklendi mi kontrol et
        existing_place = db.query(Place).filter(Place.vector_id == google_place_id).first()
        
        photo_url = None
        if p.get("photos") and len(p["photos"]) > 0:
            # v1 API'de "name" alanı "places/PLACE_ID/photos/PHOTO_REFERENCE" formatındedir.
            # Bizim endpoint "google_photo_ref:PHOTO_REFERENCE" bekliyor
            photo_name = p["photos"][0].get("name", "")
            if "photos/" in photo_name:
                photo_ref = photo_name.split("photos/")[1]
                photo_url = f"google_photo_ref:{photo_ref}"

        loc = p.get("location", {})
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        
        price_level_str = p.get("priceLevel", "PRICE_LEVEL_MODERATE")
        price_mapping = {
            "PRICE_LEVEL_FREE": 1,
            "PRICE_LEVEL_INEXPENSIVE": 1,
            "PRICE_LEVEL_MODERATE": 2,
            "PRICE_LEVEL_EXPENSIVE": 3,
            "PRICE_LEVEL_VERY_EXPENSIVE": 4
        }
        price_level = price_mapping.get(price_level_str, 2)

        name = p.get("displayName", {}).get("text", "")
        
        types = p.get("types", [])
        if "primaryType" in p:
            types.insert(0, p["primaryType"])

        if existing_place:
            # Sadece kritik bilgileri güncelleyelim
            existing_place.average_rating = float(p.get("rating", existing_place.average_rating or 0.0))
            if photo_url:
                existing_place.photo_url = photo_url
            updated_count += 1
        else:
            new_place = Place(
                name=name,
                address=p.get("formattedAddress", ""),
                city=city,
                category=get_category_from_types(types, default_category=category_name),
                latitude=lat,
                longitude=lng,
                average_rating=float(p.get("rating", 0.0)),
                photo_url=photo_url,
                price_range=price_level,
                vector_id=google_place_id,
                google_place_id=google_place_id
            )
            db.add(new_place)
            added_count += 1
            
    db.commit()
    return added_count, updated_count

def main():
    parser = argparse.ArgumentParser(description="Google Maps üzerinden mekan çeker.")
    parser.add_argument("--cities", type=str, required=True, help="Virgülle ayrılmış şehir listesi (örn: Istanbul,Ankara)")
    parser.add_argument("--categories", type=str, required=True, help="Virgülle ayrılmış kategori/arama kelimeleri listesi (örn: cafe,restaurant,library)")
    parser.add_argument("--max-pages", type=int, default=1, help="Her arama için çekilecek maksimum sayfa sayısı (Sayfa başı 20 sonuç)")
    parser.add_argument("--clear-all", action="store_true", help="Çalıştırmadan önce tablodaki TÜM mekanları SİLER (Dikkat: foreign key hataları çıkarabilir)")
    args = parser.parse_args()

    settings = get_settings()
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        print("HATA: .env dosyasında GOOGLE_MAPS_API_KEY bulunamadı!")
        sys.exit(1)

    db = SessionLocal()

    if args.clear_all:
        try:
            print("Veritabanındaki mevcut mekanlar siliniyor...")
            # İlişkili tablolar CASCADE değilse hata verecektir
            db.query(Place).delete()
            db.commit()
            print("Mekanlar başarıyla silindi.")
        except Exception as e:
            db.rollback()
            print(f"Mekanlar silinirken hata oluştu: {e}")
            print("CASCADE ayarlarınızı kontrol edin veya --clear-all olmadan çalıştırın.")
            sys.exit(1)

    cities = [c.strip() for c in args.cities.split(",")]
    categories = [cat.strip() for cat in args.categories.split(",")]

    total_added = 0
    total_updated = 0
    for city in cities:
        for cat in categories:
            query = f"{city} {cat}"
            print(f"\n=> Sorgu Başladı: '{query}'")
            places_data = get_places_from_google(api_key, query, max_pages=args.max_pages)
            
            if places_data:
                added, updated = save_places_to_db(db, places_data, city, cat.capitalize())
                total_added += added
                total_updated += updated
                print(f"✓ '{query}' için {added} mekan eklendi, {updated} mekan güncellendi.")
            else:
                print(f"✗ '{query}' için mekan bulunamadı veya API limiti aşıldı.")

    print(f"\n--- İŞLEM TAMAMLANDI: Toplam {total_added} eklendi, {total_updated} güncellendi! ---")
    db.close()

if __name__ == "__main__":
    main()
