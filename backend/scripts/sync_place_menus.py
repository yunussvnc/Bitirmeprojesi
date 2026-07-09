import sys
import os
import re
import json
import random
import time
import argparse

# Force UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add backend directory to module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
from llm_client import groq_generate, openai_generate, ollama_generate
from config import get_settings

# ============================================================================
# SETTINGS
# ============================================================================
ALLOWED_CATEGORIES = ["Kafe", "Restoran", "Bar", "Meyhane", "Fast Food", "Nargile Cafe"]
REQUEST_DELAY = 1.2  # LLM rate limit koruması için saniye cinsinden gecikme

def get_llm_provider():
    settings = get_settings()
    return settings.LLM_PROVIDER

def generate_menu_items_llm(place_name: str, category: str, price_range: int, description: str) -> list:
    """LLM (Groq/Llama 3.1) kullanarak mekan kategorisine ve fiyat düzeyine uygun gerçekçi menü üretir."""
    price_desc = {
        1: "Ekonomik / Öğrenci Dostu (Çay: 20-30 TL, Kahve: 50-70 TL, Yemek: 120-180 TL)",
        2: "Orta / Standart (Çay: 35-50 TL, Kahve: 80-110 TL, Yemek: 220-350 TL)",
        3: "Lüks / Premium (Çay: 60-90 TL, Kahve: 130-180 TL, Yemek: 450-700 TL)",
        4: "Çok Lüks / Fine Dining (Çay: 100+ TL, Kahve: 200+ TL, Yemek: 850+ TL)"
    }
    
    selected_price_desc = price_desc.get(price_range or 2, price_desc[2])
    
    prompt = f"""Sen bir restoran ve kafe menü tasarımcısısın. Aşağıdaki bilgilere sahip mekan için gerçekçi ve zengin bir ürün menüsü tasarla.
Mekan Adı: "{place_name}"
Kategori: "{category}"
Bütçe Düzeyi: {price_range or 2} ({selected_price_desc})
Açıklama: "{description or ''}"

KURALLAR:
1. Mekanın kategorisine ve fiyat segmentine uygun tam olarak 6 ila 8 adet ürün (menu item) tasarla.
2. Fiyatlar TL cinsinden olmalı ve bütçe düzeyine uygun gerçekçi rakamlar seçilmeli.
3. Her ürün için şu alanları içeren geçerli bir JSON dizisi (array) döndür:
   - "name": Ürün adı (Örn: "Flat White", "Adana Kebap", "Tiramisu", "Sıcak Çikolata")
   - "price": Ürün fiyatı (float veya int olarak, sadece sayısal değer)
   - "description": Ürün içeriği/açıklaması (TÜRKÇE, kısa bir cümle)
   - "category": Ürünün menüdeki kategorisi (Örn: "Sıcak İçecekler", "Ana Yemekler", "Tatlılar")
4. Çıktıda SADECE ham JSON dizisi (Array) olmalı, markdown kod blokları (```json ... ```) veya açıklama metinleri kesinlikle OLMAYACAKTIR. Sadece [ ... ] formatında döndür.

Örnek çıktı formatı:
[
  {{"name": "Espresso", "price": 60, "description": "Yoğun İtalyan kahvesi", "category": "Kahveler"}},
  {{"name": "Tiramisu", "price": 120, "description": "Mascarpone peynirli İtalyan tatlısı", "category": "Tatlılar"}}
]"""

    provider = get_llm_provider()
    response = ""
    
    try:
        if provider == "groq":
            response = groq_generate(prompt)
        elif provider == "openai":
            response = openai_generate(prompt)
        else:
            response = ollama_generate(prompt)
    except Exception as e:
        print(f"      ⚠️ LLM API Hatası: {e}")
        return None

    if not response:
        return None

    # Markdown kod bloklarını temizle
    response = response.strip()
    if response.startswith("```"):
        lines = response.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        response = "\n".join(lines).strip()

    try:
        menu_items = json.loads(response)
        if isinstance(menu_items, list):
            return menu_items
    except Exception as e:
        print(f"      ⚠️ JSON Ayrıştırma Hatası: {e}")
        # Debug: Hatalı yanıtı göster
        # print(f"      Ham Yanıt: {response[:300]}")
        
    return None

def main():
    parser = argparse.ArgumentParser(description="Mekan Menü Doldurma Botu")
    parser.add_argument("--limit", type=int, default=20, help="Bu çalıştırmada güncellenecek maksimum mekan sayısı (Varsayılan: 20)")
    args = parser.parse_args()

    print("\n==================================================")
    print("🤖 MEKAN MENÜ TAMAMLAMA BOTU BAŞLATILDI")
    print("==================================================")
    
    provider = get_llm_provider()
    print(f"⚙️ Aktif LLM Sağlayıcısı: {provider.upper()}")
    print(f"📊 Maksimum işlenecek mekan: {args.limit}")
    print()

    db = SessionLocal()
    try:
        # Menüsü boş veya null olan F&B mekanlarını bulalım
        places_without_menus = (
            db.query(models.Place)
            .filter(
                models.Place.category.in_(ALLOWED_CATEGORIES),
                (models.Place.menu_items_json == None) | 
                (models.Place.menu_items_json == "") | 
                (models.Place.menu_items_json == "[]")
            )
            .order_by(models.Place.id)
            .all()
        )
        
        total_found = len(places_without_menus)
        print(f"📝 Menüsü eksik {total_found} adet mekan tespit edildi.")
        
        if total_found == 0:
            print("🎉 Veritabanındaki tüm Yiyecek/İçecek mekanlarının menüsü dolu!")
            return
            
        process_limit = min(args.limit, total_found)
        updated_count = 0

        for idx in range(process_limit):
            place = places_without_menus[idx]
            print(f"[{idx+1}/{process_limit}] 🍔 Menü Tasarlanıyor: {place.name} (ID: {place.id})")
            print(f"    Kategori: {place.category} | Fiyat Segmenti: {place.price_range or 2}")
            
            menu_items = generate_menu_items_llm(
                place.name, 
                place.category, 
                place.price_range, 
                place.description
            )
            
            if menu_items:
                place.menu_items_json = json.dumps(menu_items, ensure_ascii=False)
                db.commit()
                updated_count += 1
                print(f"    ✅ +{len(menu_items)} adet menü ürünü başarıyla veritabanına eklendi.")
            else:
                print(f"    ❌ Menü üretilemedi. Atlanıyor.")
                
            print("-" * 50)
            time.sleep(REQUEST_DELAY)
            
        print(f"\n🏁 İşlem tamamlandı. Toplam {updated_count} mekanın menüsü zenginleştirildi.")
        
    except Exception as e:
        print(f"❌ Kritik Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
