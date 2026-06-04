# -*- coding: utf-8 -*-
"""
İstanbul'dan 400 Popüler Mekan Toplama Scripti
Farklı bölge ve kategorilerden çeşitli mekanlar toplar
"""

import os
import sys
import json
import time
import argparse
from typing import List, Dict
from dotenv import load_dotenv

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from serpapi_client import SerpApiClient

load_dotenv()


class PlaceCollector:
    """400 popüler mekan toplama"""
    
    def __init__(self):
        if not os.getenv("SERPAPI_KEY"):
            raise RuntimeError(
                "SERPAPI_KEY tanımlı değil. Canlı veri toplama için önce .env/Render dışı lokal ortamda anahtar ekleyin."
            )
        self.client = SerpApiClient()
        self.collected_places = []
        self.unique_ids = set()
        
        # İstanbul bölgeleri ve koordinatları
        self.regions = {
            "Kadıköy": {"lat": 40.9897, "lng": 29.0256},
            "Beşiktaş": {"lat": 41.0431, "lng": 29.0035},
            "Beyoğlu": {"lat": 41.0338, "lng": 28.9779},
            "Fatih": {"lat": 41.0186, "lng": 28.9497},
            "Şişli": {"lat": 41.0600, "lng": 28.9869},
            "Üsküdar": {"lat": 41.0223, "lng": 29.0161},
            "Sarıyer": {"lat": 41.1683, "lng": 29.0488},
            "Bakırköy": {"lat": 40.9785, "lng": 28.8546},
            "Ümraniye": {"lat": 41.0265, "lng": 29.1248},
            "Maltepe": {"lat": 40.9357, "lng": 29.1551},
            "Beylikdüzü": {"lat": 41.0027, "lng": 28.6401},
            "Bahçelievler": {"lat": 41.0027, "lng": 28.8597},
            "Ataşehir": {"lat": 40.9923, "lng": 29.1244},
            "Kartal": {"lat": 40.9061, "lng": 29.1873},
            "Pendik": {"lat": 40.8775, "lng": 29.2533},
            "Kağıthane": {"lat": 41.0797, "lng": 28.9727},
            "Esenyurt": {"lat": 41.0290, "lng": 28.6765},
            "Avcılar": {"lat": 40.9793, "lng": 28.7214},
        }
        
        # Kategoriler ve sorgu şablonları
        self.search_queries = [
            # Kafeler
            {"query": "best coffee shops in {region}, Istanbul", "category": "Kahve dükkanı"},
            {"query": "specialty coffee {region}, Istanbul", "category": "Kahve dükkanı"},
            {"query": "cozy cafe {region}, Istanbul", "category": "Kafe"},
            
            # Restoranlar - Türk Mutfağı
            {"query": "best Turkish restaurant {region}, Istanbul", "category": "Türk restoranı"},
            {"query": "kebab restaurant {region}, Istanbul", "category": "Kebap Restoranı"},
            {"query": "traditional Turkish food {region}, Istanbul", "category": "Türk restoranı"},
            
            # Restoranlar - Dünya Mutfağı
            {"query": "Italian restaurant {region}, Istanbul", "category": "İtalyan restoranı"},
            {"query": "Japanese restaurant {region}, Istanbul", "category": "Japon restoranı"},
            {"query": "seafood restaurant {region}, Istanbul", "category": "Balık Restoranı"},
            {"query": "burger restaurant {region}, Istanbul", "category": "Restoran"},
            
            # Barlar ve Gece Hayatı
            {"query": "cocktail bar {region}, Istanbul", "category": "Bar"},
            {"query": "pub {region}, Istanbul", "category": "Pub"},
            {"query": "rooftop bar {region}, Istanbul", "category": "Bar"},
            
            # Turistik ve Kültürel
            {"query": "historical places {region}, Istanbul", "category": "Turistik Yer"},
            {"query": "museum {region}, Istanbul", "category": "Müze"},
            {"query": "art gallery {region}, Istanbul", "category": "Sanat Galerisi"},
            
            # Kahvaltı ve Brunch
            {"query": "breakfast restaurant {region}, Istanbul", "category": "Restoran"},
            {"query": "brunch cafe {region}, Istanbul", "category": "Kafe"},
            
            # Özel Kategoriler
            {"query": "vegan restaurant {region}, Istanbul", "category": "Vegan Restoranı"},
            {"query": "bakery {region}, Istanbul", "category": "Fırın"},
            {"query": "pastry shop {region}, Istanbul", "category": "Pastane"}
        ]
    
    def collect_places(self, target_count: int = 400) -> List[Dict]:
        """
        Hedef sayıda benzersiz mekan topla
        
        Args:
            target_count: Hedef mekan sayısı
        
        Returns:
            Toplanan mekanlar
        """
        print(f"\n{'='*70}")
        print(f"ISTANBUL MEKAN TOPLAMA - Hedef: {target_count} mekan")
        print(f"{'='*70}\n")
        
        total_regions = len(self.regions)
        total_queries = len(self.search_queries)
        
        print(f"* {total_regions} bolge")
        print(f"* {total_queries} farkli sorgu tipi")
        print(f"* Maksimum {total_regions * total_queries * 20} potansiyel mekan\n")
        
        query_count = 0
        
        # Her bölge için farklı kategorilerde ara
        for region_name, coords in self.regions.items():
            if len(self.collected_places) >= target_count:
                break
            
            print(f"\n>> {region_name} bolgesi araniyor...")
            
            for query_template in self.search_queries:
                if len(self.collected_places) >= target_count:
                    break
                
                query = query_template["query"].format(region=region_name)
                query_count += 1
                
                print(f"  [{query_count}] {query[:50]}...")
                
                try:
                    places = self.client.search_places(
                        query=query,
                        lat=coords["lat"],
                        lng=coords["lng"],
                        limit=20
                    )
                    
                    # Benzersiz mekanları ekle
                    added = 0
                    for place in places:
                        data_id = place.get("data_id")
                        if data_id and data_id not in self.unique_ids:
                            self.unique_ids.add(data_id)
                            self.collected_places.append(place)
                            added += 1
                    
                    if added > 0:
                        print(f"      OK +{added} yeni mekan (Toplam: {len(self.collected_places)})")
                    
                    # API rate limiting için kısa bekle
                    time.sleep(0.5)
                    
                except Exception as e:
                    print(f"      HATA: {e}")
                    continue
        
        print(f"\n{'='*70}")
        print(f"OK TOPLAMA TAMAMLANDI")
        print(f"* Toplam {len(self.collected_places)} benzersiz mekan toplandi")
        print(f"* {query_count} sorgu yapildi")
        print(f"{'='*70}\n")
        
        return self.collected_places
    
    def save_to_json(self, filename: str = "loaded_places.json"):
        """Toplanan mekanları JSON'a kaydet"""
        output_path = os.path.join(
            os.path.dirname(__file__),
            'data',
            filename
        )
        
        # Mevcut verileri oku
        existing_places = []
        existing_ids = set()
        
        if os.path.exists(output_path):
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_places = json.load(f)
                existing_ids = {p.get("data_id") for p in existing_places if p.get("data_id")}
            print(f"[*] Mevcut dosya bulundu: {len(existing_places)} mekan")
        
        # Yeni mekanları ekle (tekrar olanları atla)
        new_places_added = 0
        for place in self.collected_places:
            if place.get("data_id") not in existing_ids:
                existing_places.append(place)
                existing_ids.add(place.get("data_id"))
                new_places_added += 1
        
        # Dosyaya kaydet
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(existing_places, f, ensure_ascii=False, indent=2)
        
        print(f"\n[*] Dosya kaydedildi: {output_path}")
        print(f"   - Yeni eklenen: {new_places_added} mekan")
        print(f"   - Toplam: {len(existing_places)} mekan\n")
        
        return len(existing_places)
    
    def print_statistics(self):
        """Istatistikleri goster"""
        if not self.collected_places:
            print("HATA: Henuz mekan toplanmadi")
            return
        
        # Kategori dagilimi
        categories = {}
        ratings = []
        review_counts = []
        
        for place in self.collected_places:
            cat = place.get("category", "Bilinmiyor")
            categories[cat] = categories.get(cat, 0) + 1
            
            if place.get("rating"):
                ratings.append(place["rating"])
            if place.get("review_count"):
                review_counts.append(place["review_count"])
        
        print("\n== ISTATISTIKLER ==")
        print("="*70)
        
        print(f"\n* Toplam Mekan: {len(self.collected_places)}")
        
        if ratings:
            avg_rating = sum(ratings) / len(ratings)
            print(f"* Ortalama Puan: {avg_rating:.2f}")
        
        if review_counts:
            avg_reviews = sum(review_counts) / len(review_counts)
            print(f"* Ortalama Yorum: {int(avg_reviews)}")
        
        print(f"\n* Kategori Dagilimi:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   - {cat}: {count}")
        
        print("="*70 + "\n")


def main():
    """Ana fonksiyon"""
    try:
        parser = argparse.ArgumentParser(description="SerpAPI ile Istanbul mekan snapshot'ını kontrollü artır")
        parser.add_argument("--target", type=int, default=400, help="Hedef toplam mekan sayısı")
        parser.add_argument("--output", default="loaded_places.json", help="data/ altındaki çıktı dosyası")
        parser.add_argument(
            "--sync-postgres",
            action="store_true",
            help="JSON kaydından sonra PostgreSQL places tablosuna otomatik aktar",
        )
        parser.add_argument(
            "--no-sync-postgres",
            action="store_true",
            help="DATABASE_URL olsa bile Postgres aktarimini atla",
        )
        args = parser.parse_args()

        collector = PlaceCollector()
        
        # Hedef sayıda mekan topla
        places = collector.collect_places(target_count=args.target)
        
        if not places:
            print("HATA: Hic mekan toplanamadi!")
            return
        
        # Istatistikleri goster
        collector.print_statistics()
        
        # JSON'a kaydet
        total = collector.save_to_json(filename=args.output)
        
        from src.config import settings

        should_sync = (
            args.sync_postgres
            or (not args.no_sync_postgres and bool(os.getenv("DATABASE_URL", "").strip()))
        )
        if should_sync:
            print("\n>> PostgreSQL'e aktariliyor...")
            from scripts.serpapi_to_postgres import serpapi_to_postgres

            json_path = os.path.join(os.path.dirname(__file__), "data", args.output)
            serpapi_to_postgres(settings.database_url_normalized, json_path=json_path)

        print("\n" + "="*70)
        print("OK ISLEM TAMAMLANDI!")
        print(f"* {total} mekan loaded_places.json dosyasinda")
        if should_sync:
            print("* Mekanlar PostgreSQL'e aktarildi — mobil uygulama kartlarda gorebilir")
        else:
            print("* Postgres aktarimi: python scripts/serpapi_to_postgres.py")
        print("* Qdrant indeks: python scripts/prepare_vector_db.py --force")
        print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\nUYARI: Islem kullanici tarafindan durduruldu")
        sys.exit(1)
    except Exception as e:
        print(f"\nHATA: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
