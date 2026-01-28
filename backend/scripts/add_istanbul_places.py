"""
İstanbul'daki tüm büyük zincirleri veritabanına ekleme scripti
Kafe, Bar, Restaurant, Fast Food zincirleri
"""

import sys
import os
from typing import List, Dict

# Backend dizinine ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    import requests
    USE_API = True
    BACKEND_URL = "http://localhost:8000"
except ImportError:
    USE_API = False
    # Direkt database kullan
    from database import SessionLocal
    import crud
    import schemas

# İstanbul koordinatları (merkez)
ISTANBUL_CENTER = {
    "latitude": 41.0082,
    "longitude": 28.9784,
}

# İstanbul bölgeleri ve koordinatları
ISTANBUL_LOCATIONS = {
    "Taksim": {"lat": 41.0369, "lon": 28.9850},
    "Kadıköy": {"lat": 40.9900, "lon": 29.0250},
    "Nişantaşı": {"lat": 41.0475, "lon": 28.9854},
    "Levent": {"lat": 41.0819, "lon": 29.0125},
    "Bebek": {"lat": 41.0775, "lon": 29.0433},
    "Beşiktaş": {"lat": 41.0431, "lon": 29.0080},
    "Üsküdar": {"lat": 41.0214, "lon": 29.0150},
    "Bostancı": {"lat": 40.9700, "lon": 29.1000},
    "Şişli": {"lat": 41.0602, "lon": 28.9874},
    "Mecidiyeköy": {"lat": 41.0689, "lon": 28.9875},
    "Zorlu Center": {"lat": 41.0667, "lon": 29.0167},
    "İstiklal": {"lat": 41.0369, "lon": 28.9850},
    "Moda": {"lat": 40.9800, "lon": 29.0200},
    "Bağdat Caddesi": {"lat": 40.9700, "lon": 29.1000},
    "Etiler": {"lat": 41.0800, "lon": 29.0200},
    "Ortaköy": {"lat": 41.0473, "lon": 29.0236},
    "Beyoğlu": {"lat": 41.0369, "lon": 28.9850},
    "Karaköy": {"lat": 41.0225, "lon": 28.9744},
    "Galata": {"lat": 41.0256, "lon": 28.9744},
    "Sultanahmet": {"lat": 41.0054, "lon": 28.9772},
}

def create_place(name: str, chain: str, location: str, category: str, 
                 description: str, price_range: int, features: str, 
                 vibe: str = "quiet", purpose: str = "work") -> Dict:
    """Mekan oluşturma helper fonksiyonu"""
    loc = ISTANBUL_LOCATIONS.get(location, ISTANBUL_LOCATIONS["Taksim"])
    return {
        "name": f"{chain} - {location}",
        "address": f"{location}, İstanbul",
        "city": "İstanbul",
        "category": category,
        "description": description,
        "price_range": price_range,
        "features": features,
        "latitude": loc["lat"],
        "longitude": loc["lon"],
    }

# Mekan verileri - KAFELER
CAFE_CHAINS = [
    # Espresso Lab
    ("Espresso Lab", "Kafe", "Modern ve şık kahve deneyimi. Nitelikli kahve çeşitleri, rahat çalışma ortamı ve ücretsiz Wi-Fi.", 3, "Ücretsiz Wi-Fi, Priz, Açık Alan, Çalışma Ortamı"),
    # Starbucks
    ("Starbucks", "Kafe", "Dünya çapında ünlü kahve zinciri. Canlı atmosfer, geniş menü ve rahat oturma alanları.", 3, "Ücretsiz Wi-Fi, Priz, Canlı Atmosfer, Merkezi Konum"),
    # Kahve Dünyası
    ("Kahve Dünyası", "Kafe", "Türk kahvesi ve modern kahve çeşitleri. Geleneksel ve modern karışımı, uygun fiyatlar.", 2, "Ücretsiz Wi-Fi, Priz, Türk Kahvesi, Uygun Fiyat"),
    # Gloria Jeans
    ("Gloria Jeans", "Kafe", "Canlı ve enerjik atmosfer. Geniş menü ve uygun fiyatlar. Öğrenciler için ideal.", 2, "Ücretsiz Wi-Fi, Priz, Canlı Atmosfer, Uygun Fiyat"),
    # Nero
    ("Nero", "Kafe", "İtalyan tarzı kahve deneyimi. Şık ve modern atmosfer. İş toplantıları için ideal.", 3, "Ücretsiz Wi-Fi, Priz, İtalyan Kahvesi, Şık Ortam"),
    # Caffè Nero
    ("Caffè Nero", "Kafe", "Avrupa tarzı kahvehane. Sessiz ve huzurlu ortam. Çalışma ve okuma için mükemmel.", 3, "Ücretsiz Wi-Fi, Priz, Sessiz Ortam, Avrupa Tarzı"),
    # Mado
    ("Mado", "Kafe", "Türk dondurması ve kahve. Geleneksel lezzetler, aile dostu ortam.", 2, "Dondurma, Türk Kahvesi, Aile Dostu, Geleneksel"),
    # Simit Sarayı
    ("Simit Sarayı", "Kafe", "Türk kahvaltı kültürü. Simit, poğaça ve çay. Hızlı servis, uygun fiyatlar.", 1, "Simit, Poğaça, Çay, Hızlı Servis, Uygun Fiyat"),
    # The House Café
    ("The House Café", "Kafe", "Modern brunch ve kahve. Şık dekorasyon, geniş menü. Sosyal buluşmalar için ideal.", 3, "Ücretsiz Wi-Fi, Priz, Brunch, Şık Ortam"),
    # BigChefs
    ("BigChefs", "Kafe", "Kahvaltı ve brunch uzmanı. Geniş menü, aile dostu ortam. Hafta sonu için mükemmel.", 3, "Ücretsiz Wi-Fi, Priz, Kahvaltı, Brunch, Aile Dostu"),
    # Midpoint
    ("Midpoint", "Kafe", "Modern kafe konsepti. Çalışma ortamı, kaliteli kahve. İş merkezlerinde popüler.", 3, "Ücretsiz Wi-Fi, Priz, Çalışma Ortamı, Modern"),
    # Happy Moon's
    ("Happy Moon's", "Kafe", "Canlı ve renkli atmosfer. Genç kitle, sosyal ortam. Arkadaşlarla buluşmak için ideal.", 2, "Ücretsiz Wi-Fi, Priz, Canlı Atmosfer, Genç Kitle"),
]

# FAST FOOD ZİNCİRLERİ
FAST_FOOD_CHAINS = [
    ("McDonald's", "Fast Food", "Dünya çapında hamburger zinciri. Hızlı servis, uygun fiyatlar, çocuk dostu.", 2, "Hamburger, Patates, Hızlı Servis, Çocuk Menüsü"),
    ("Burger King", "Fast Food", "Alevde pişmiş hamburgerler. Geniş menü, hızlı servis. Öğrenciler için popüler.", 2, "Hamburger, Alevde Pişirme, Hızlı Servis, Uygun Fiyat"),
    ("KFC", "Fast Food", "Dünyaca ünlü tavuk restoranı. Kızarmış tavuk, patates, cola. Aileler için ideal.", 2, "Tavuk, Patates, Cola, Aile Dostu"),
    ("Domino's Pizza", "Fast Food", "Hızlı pizza teslimatı. Geniş pizza çeşitleri, online sipariş. Ev partileri için ideal.", 2, "Pizza, Teslimat, Online Sipariş, Hızlı"),
    ("Pizza Hut", "Fast Food", "Restoran tarzı pizza. Geniş menü, aile boyu pizza. Oturma alanı mevcut.", 2, "Pizza, Restoran, Aile Boyu, Oturma Alanı"),
    ("Sbarro", "Fast Food", "İtalyan tarzı fast food. Pizza dilimleri, makarna. Hızlı ve lezzetli.", 2, "Pizza Dilimi, Makarna, İtalyan, Hızlı"),
    ("Popeyes", "Fast Food", "Louisiana tarzı tavuk. Baharatlı ve lezzetli. Farklı bir fast food deneyimi.", 2, "Tavuk, Baharatlı, Louisiana Tarzı, Farklı Lezzet"),
    ("Subway", "Fast Food", "Özel sandviçler. Sağlıklı seçenekler, kişiselleştirilebilir. Diyet dostu.", 2, "Sandviç, Sağlıklı, Kişiselleştirilebilir, Diyet Dostu"),
    ("Baydoner", "Fast Food", "Türk döner zinciri. Taze döner, dürüm, porsiyon. Öğrenciler için popüler.", 1, "Döner, Dürüm, Taze, Uygun Fiyat, Öğrenci Dostu"),
    ("Köfteci Yusuf", "Fast Food", "Geleneksel köfte. Taze köfte, piyaz, ayran. Türk mutfağı lezzetleri.", 2, "Köfte, Piyaz, Ayran, Geleneksel, Türk Mutfağı"),
]

# RESTORAN ZİNCİRLERİ
RESTAURANT_CHAINS = [
    ("Nusr-Et", "Restoran", "Premium steakhouse. Yüksek kaliteli et, şık atmosfer. Özel geceler için ideal.", 4, "Steak, Premium, Şık Ortam, Özel Geceler"),
    ("Günaydın", "Restoran", "Türk mutfağı restoranı. Geleneksel yemekler, aile dostu. Geniş menü.", 3, "Türk Mutfağı, Geleneksel, Aile Dostu, Geniş Menü"),
    ("Saray Muhallebicisi", "Restoran", "Geleneksel Türk tatlıları. Muhallebi, baklava, sütlü tatlılar. Tarihi lezzetler.", 2, "Tatlı, Muhallebi, Baklava, Geleneksel, Tarihi"),
    ("Emirgan Sütiş", "Restoran", "Türk kahvaltısı ve tatlıları. Boğaz manzaralı, geleneksel lezzetler.", 3, "Kahvaltı, Tatlı, Boğaz Manzarası, Geleneksel"),
    ("Çiya Sofrası", "Restoran", "Anadolu mutfağı. Farklı bölgelerden lezzetler, zengin menü. Keşif için ideal.", 3, "Anadolu Mutfağı, Farklı Lezzetler, Zengin Menü, Keşif"),
    ("Zübeyir Ocakbaşı", "Restoran", "Geleneksel ocakbaşı. Et çeşitleri, meze, rakı. Sosyal ortam.", 3, "Ocakbaşı, Et, Meze, Rakı, Sosyal Ortam"),
    ("Hacı Dayı", "Restoran", "Türk mutfağı. Köfte, döner, lahmacun. Uygun fiyat, lezzetli yemekler.", 2, "Köfte, Döner, Lahmacun, Uygun Fiyat, Lezzetli"),
    ("Konyalı Lokantası", "Restoran", "Konya mutfağı. Etli ekmek, bamya çorbası. Geleneksel lezzetler.", 2, "Konya Mutfağı, Etli Ekmek, Geleneksel, Uygun Fiyat"),
]

# BAR ZİNCİRLERİ
BAR_CHAINS = [
    ("360 Bar", "Bar", "360 derece İstanbul manzarası. Premium kokteyller, canlı müzik. Özel geceler için ideal.", 4, "Manzara, Kokteyl, Canlı Müzik, Premium, Özel Geceler"),
    ("5. Kat", "Bar", "Şık bar ve restoran. Boğaz manzarası, geniş içki menüsü. Romantik buluşmalar için.", 4, "Boğaz Manzarası, Şık Ortam, Geniş Menü, Romantik"),
    ("Leb-i Derya", "Bar", "Boğaz manzaralı bar. Kokteyller, meze, canlı müzik. Sosyal ortam.", 4, "Boğaz Manzarası, Kokteyl, Meze, Canlı Müzik, Sosyal"),
    ("Sortie", "Bar", "Gece kulübü ve bar. Canlı müzik, dans, genç kitle. Eğlence için ideal.", 4, "Gece Kulübü, Canlı Müzik, Dans, Genç Kitle, Eğlence"),
    ("Reina", "Bar", "Lüks gece kulübü. Premium içkiler, DJ performansları. VIP alan mevcut.", 4, "Lüks, Gece Kulübü, DJ, Premium, VIP"),
    ("Anjelique", "Bar", "Boğaz manzaralı lüks bar. Şık atmosfer, premium kokteyller. Özel geceler.", 4, "Boğaz Manzarası, Lüks, Şık, Premium Kokteyl, Özel Geceler"),
    ("Ruby", "Bar", "Modern bar konsepti. Kokteyller, atıştırmalıklar, canlı müzik. Sosyal buluşmalar.", 3, "Modern, Kokteyl, Atıştırmalık, Canlı Müzik, Sosyal"),
    ("29", "Bar", "Rooftop bar. Şehir manzarası, kokteyller, canlı müzik. Akşam için ideal.", 4, "Rooftop, Şehir Manzarası, Kokteyl, Canlı Müzik, Akşam"),
    ("Mikla Bar", "Bar", "Premium bar. Şık atmosfer, özel kokteyller. İş çıkışı için ideal.", 4, "Premium, Şık, Özel Kokteyl, İş Çıkışı"),
]

# FINE DINING
FINE_DINING = [
    ("Mikla", "Restoran", "Michelin yıldızlı restoran. Modern Türk mutfağı, şık atmosfer. Özel geceler için.", 4, "Michelin, Modern Türk Mutfağı, Şık, Özel Geceler"),
    ("Sunset Grill & Bar", "Restoran", "Boğaz manzaralı fine dining. Premium yemekler, şık atmosfer. Romantik akşamlar.", 4, "Boğaz Manzarası, Fine Dining, Premium, Şık, Romantik"),
    ("360 Istanbul", "Restoran", "360 derece manzara. Modern mutfak, premium içkiler. Özel geceler.", 4, "360 Manzara, Modern Mutfak, Premium, Özel Geceler"),
    ("Ulus 29", "Restoran", "Boğaz manzaralı restoran. Şık atmosfer, premium yemekler. İş yemekleri için ideal.", 4, "Boğaz Manzarası, Şık, Premium, İş Yemekleri"),
    ("Bebek Balıkçı", "Restoran", "Deniz ürünleri restoranı. Taze balık, boğaz manzarası. Akşam yemekleri için.", 4, "Deniz Ürünleri, Taze Balık, Boğaz Manzarası, Akşam"),
]

# Tüm mekanları oluştur
PLACES_DATA = []

# Kafeler - Her zincir için 3-5 şube
CAFE_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Bebek", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Mecidiyeköy", "Zorlu Center", "İstiklal", "Moda", "Bağdat Caddesi", "Etiler", "Ortaköy"]
for chain, category, desc, price, features in CAFE_CHAINS:
    locations = CAFE_LOCATIONS[:5] if chain in ["Espresso Lab", "Starbucks"] else CAFE_LOCATIONS[:3]
    for loc in locations:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Fast Food - Her zincir için 4-6 şube
FAST_FOOD_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Mecidiyeköy", "Zorlu Center", "İstiklal", "Bağdat Caddesi", "Etiler", "Ortaköy", "Beyoğlu", "Karaköy"]
for chain, category, desc, price, features in FAST_FOOD_CHAINS:
    locations = FAST_FOOD_LOCATIONS[:6] if chain in ["McDonald's", "Burger King"] else FAST_FOOD_LOCATIONS[:4]
    for loc in locations:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Restoranlar - Her zincir için 2-4 şube
RESTAURANT_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Etiler", "Ortaköy", "Beyoğlu", "Sultanahmet"]
for chain, category, desc, price, features in RESTAURANT_CHAINS:
    locations = RESTAURANT_LOCATIONS[:4] if chain in ["Nusr-Et", "Günaydın"] else RESTAURANT_LOCATIONS[:2]
    for loc in locations:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Barlar - Her zincir için 1-2 şube (daha az şube)
BAR_LOCATIONS = ["Taksim", "Beşiktaş", "Ortaköy", "Beyoğlu", "Karaköy", "Galata", "Etiler"]
for chain, category, desc, price, features in BAR_CHAINS:
    locations = BAR_LOCATIONS[:2] if chain in ["360 Bar", "5. Kat", "Leb-i Derya"] else BAR_LOCATIONS[:1]
    for loc in locations:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Fine Dining - Her zincir için 1 şube (özel mekanlar)
FINE_DINING_LOCATIONS = ["Beşiktaş", "Ortaköy", "Etiler", "Beyoğlu", "Üsküdar"]
for idx, (chain, category, desc, price, features) in enumerate(FINE_DINING):
    loc = FINE_DINING_LOCATIONS[idx % len(FINE_DINING_LOCATIONS)]
    PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

def add_place(place_data: Dict) -> bool:
    """Tek bir mekanı backend'e ekle"""
    try:
        if USE_API:
            # API üzerinden ekle
            response = requests.post(
                f"{BACKEND_URL}/places/",
                json=place_data,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 200:
                print(f"✅ {place_data['name']} eklendi")
                return True
            else:
                print(f"❌ {place_data['name']} eklenemedi: {response.status_code} - {response.text}")
                return False
        else:
            # Direkt database'e ekle
            db = SessionLocal()
            try:
                place_create = schemas.PlaceCreate(**place_data)
                crud.create_place(db, place_create)
                print(f"✅ {place_data['name']} eklendi")
                return True
            except Exception as db_error:
                print(f"❌ {place_data['name']} eklenirken hata: {str(db_error)}")
                return False
            finally:
                db.close()
    except Exception as e:
        print(f"❌ {place_data['name']} eklenirken hata: {str(e)}")
        return False


def main():
    """Tüm mekanları ekle"""
    print("🚀 İstanbul mekanları ekleniyor...\n")
    print(f"📝 Toplam {len(PLACES_DATA)} mekan hazırlanıyor...\n")
    
    success_count = 0
    fail_count = 0
    
    for place in PLACES_DATA:
        if add_place(place):
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n📊 Özet:")
    print(f"✅ Başarılı: {success_count}")
    print(f"❌ Başarısız: {fail_count}")
    print(f"📝 Toplam: {len(PLACES_DATA)}")


if __name__ == "__main__":
    main()
