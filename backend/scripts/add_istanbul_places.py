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
    "Bomonti": {"lat": 41.0680, "lon": 28.9820},
    "Galataport": {"lat": 41.0260, "lon": 28.9745},
    "Ataşehir": {"lat": 40.9923, "lon": 29.1244},
    "Bakırköy": {"lat": 40.9819, "lon": 28.8774},
    "Ümraniye": {"lat": 41.0164, "lon": 29.1178},
    "Maltepe": {"lat": 40.9356, "lon": 29.1286},
    "Kalamış": {"lat": 40.9750, "lon": 29.0380},
    "Fenerbahçe": {"lat": 40.9850, "lon": 29.0350},
    "Caferağa": {"lat": 40.9880, "lon": 29.0280},
    "Kuruçeşme": {"lat": 41.0580, "lon": 29.0280},
    "Arnavutköy": {"lat": 41.0620, "lon": 29.0380},
    "Maslak": {"lat": 41.1060, "lon": 29.0200},
    "Sarıyer": {"lat": 41.1670, "lon": 29.0500},
    "Caddebostan": {"lat": 40.9680, "lon": 29.0680},
    "Tuzla": {"lat": 40.8230, "lon": 29.3000},
    "Fatih": {"lat": 41.0186, "lon": 28.9497},
    "Göztepe": {"lat": 40.9750, "lon": 29.0780},
    "Ayazağa": {"lat": 41.1080, "lon": 29.0180},
    "Göktürk": {"lat": 41.1750, "lon": 28.8780},
    "Kartal": {"lat": 40.9080, "lon": 29.1720},
    "Şirinevler": {"lat": 41.0020, "lon": 28.8520},
    "Gayrettepe": {"lat": 41.0720, "lon": 28.9950},
    "Osmanbey": {"lat": 41.0580, "lon": 28.9900},
    "Teşvikiye": {"lat": 41.0480, "lon": 28.9980},
    "Başakşehir": {"lat": 41.0800, "lon": 28.8020},
    "Yeşilköy": {"lat": 40.9620, "lon": 28.8240},
    "Beylikdüzü": {"lat": 41.0020, "lon": 28.6470},
    "Büyükçekmece": {"lat": 41.0320, "lon": 28.5780},
    "Esenyurt": {"lat": 41.0350, "lon": 28.6770},
    "Kozyatağı": {"lat": 40.9680, "lon": 29.0780},
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

# Kafe zincirleri – çok yaygın (Google ile doğrulanmış İstanbul şubeleri)
CAFE_CHAINS_ZINCIR = [
    ("Starbucks", "Kafe", "Dünya çapında kahve zinciri. Canlı atmosfer, geniş menü, rahat oturma. Ücretsiz Wi-Fi.", 3, "Ücretsiz Wi-Fi, Priz, Canlı Atmosfer, Merkezi Konum"),
    ("Espresso Lab", "Kafe", "Nitelikli kahve, roastery. Modern ve şık mekânlar. AKM, Karaköy, Galataport, Levent.", 3, "Ücretsiz Wi-Fi, Priz, Çalışma Ortamı, Kaliteli Kahve"),
    ("Kahve Dünyası", "Kafe", "Türk kahvesi ve modern kahve. Geleneksel ve modern karışımı, uygun fiyatlar.", 2, "Ücretsiz Wi-Fi, Priz, Türk Kahvesi, Uygun Fiyat"),
    ("Gloria Jean's", "Kafe", "Gloria Jean's Coffees. Canlı atmosfer, geniş menü. Aqua Florya, Yeşilköy, Marmara Park.", 2, "Ücretsiz Wi-Fi, Priz, Canlı Atmosfer, Uygun Fiyat"),
    ("Coffee Lab", "Kafe", "Üçüncü dalga kahve. 2012 Ankara kökenli, kaliteli kahve. Şubeler çoğunlukla Ankara/İzmir.", 3, "Ücretsiz Wi-Fi, Priz, Kaliteli Kahve, Sade"),
    ("Arabica Coffee House", "Kafe", "100% yerli marka, üçüncü dalga. Kendi kavurma, butik hizmet. Fark Yarat Öncü Ol.", 3, "Ücretsiz Wi-Fi, Priz, Arabica Çekirdek, Butik"),
    ("Coffy", "Kafe", "Tek fiyatlı kahve noktası. Hızlı ve uygun. Kadıköy, Beşiktaş, Maslak, Mecidiyeköy.", 1, "Tek Fiyat, Hızlı Servis, Uygun Fiyat, Kahve"),
    ("MOC Coffee", "Kafe", "MOC Coffee Roastery. Nişantaşı, Bomonti, Zorlu Center. Kavurma ve kaliteli kahve.", 3, "Ücretsiz Wi-Fi, Priz, Roastery, Kaliteli Kahve"),
    ("Caribou Coffee", "Kafe", "Amerikan kahve zinciri. Karaköy, Caddebostan, Moda, Kalamış. Ücretsiz WiFi, toplantı odaları.", 3, "Ücretsiz Wi-Fi, Toplantı Odası, Geniş Menü"),
    ("Mado", "Kafe", "Türk dondurması ve kahve. Geleneksel lezzetler, aile dostu ortam.", 2, "Dondurma, Türk Kahvesi, Aile Dostu, Geleneksel"),
    ("Simit Sarayı", "Kafe", "Türk kahvaltı kültürü. Simit, poğaça ve çay. Hızlı servis, uygun fiyatlar.", 1, "Simit, Poğaça, Çay, Hızlı Servis, Uygun Fiyat"),
    ("The House Café", "Kafe", "Modern brunch ve kahve. Şık dekorasyon, geniş menü. Sosyal buluşmalar için ideal.", 3, "Ücretsiz Wi-Fi, Priz, Brunch, Şık Ortam"),
    ("BigChefs", "Kafe", "Kahvaltı ve brunch uzmanı. Geniş menü, aile dostu ortam. Hafta sonu için mükemmel.", 3, "Ücretsiz Wi-Fi, Priz, Kahvaltı, Brunch, Aile Dostu"),
]
CAFE_ZINCIR_LOCATIONS = {
    "Starbucks": ["Şişli", "Beyoğlu", "Ataşehir", "Kadıköy", "Beşiktaş", "Bakırköy", "Maltepe", "Levent", "Nişantaşı", "Fatih", "Üsküdar", "Kartal", "Mecidiyeköy", "Etiler"],
    "Espresso Lab": ["Taksim", "Karaköy", "Galataport", "Beşiktaş", "Kadıköy", "Levent", "Maslak", "Sarıyer", "Bebek", "Cihangir", "Ataşehir", "Maltepe", "Kartal", "Ayazağa"],
    "Kahve Dünyası": ["Beşiktaş", "Kadıköy", "Şişli", "Kadıköy", "Ataşehir", "Bakırköy", "Levent", "Nişantaşı"],
    "Gloria Jean's": ["Bakırköy", "Yeşilköy", "Başakşehir", "Küçükçekmece", "Esenyurt", "Beylikdüzü", "Büyükçekmece"],
    "Coffee Lab": [],  # İstanbul şubesi yok (Ankara, İzmir, Konya, Antalya vb.)
    "Arabica Coffee House": ["Bakırköy", "Kadıköy", "Beşiktaş", "Şişli", "Ataşehir", "Maltepe", "Levent"],
    "Coffy": ["Kadıköy", "Caddebostan", "Beşiktaş", "Maslak", "Mecidiyeköy", "Küçükçekmece", "Şirinevler", "Ümraniye"],
    "MOC Coffee": ["Teşvikiye", "Bomonti", "Osmanbey", "Beşiktaş", "Etiler", "Gayrettepe", "Bakırköy", "Yeşilköy"],
    "Caribou Coffee": ["Karaköy", "Caddebostan", "Moda", "Kalamış", "Fenerbahçe", "Maltepe", "Tuzla", "Kozyatağı", "Beşiktaş", "Ataşehir"],
    "Mado": ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Bakırköy", "Şişli", "Mecidiyeköy", "Etiler"],
    "Simit Sarayı": ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Şişli", "Mecidiyeköy", "Bakırköy", "Ataşehir"],
    "The House Café": ["Taksim", "Nişantaşı", "Levent", "Beşiktaş", "Kadıköy", "Bebek", "Etiler", "Zorlu Center"],
    "BigChefs": ["Taksim", "Nişantaşı", "Levent", "Beşiktaş", "Kadıköy", "Üsküdar", "Bakırköy", "Etiler", "Bebek"],
}

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

# BAR ZİNCİR / ÇOK ŞUBELİ (İstanbul lokasyonlarıyla)
BAR_CHAINS_ZINCIR = [
    ("North Shield Pub", "Bar", "İngiliz pub atmosferi. Geniş bira seçenekleri, canlı maç yayınları. Sosyal ortam.", 3, "Bira, Maç Yayını, Sosyal"),
    ("The Populist", "Bar", "Modern endüstriyel bar. Yüksek tavan, yeşil duvar, canlı müzik. Bomonti ve Galataport şubeleri.", 3, "Modern, Canlı Müzik, Geniş Mekan, Teras"),
    ("Varuna Gezgin Cafe & Pub", "Bar", "Rustik bar ve kafe. Geniş şişe koleksiyonu, sıcak atmosfer. Bayraklar ve vintage dekor.", 2, "Kafe, Rustik, Canlı Yayın"),
    ("Corner Irish Pub", "Bar", "İrlanda bar atmosferi. Yeşil ışıklar, açık teras, maç yayınları. Dublin Corner.", 3, "İrlanda Bar, Açık Hava, Maç Yayını, Canlı"),
    ("Jolly Joker", "Bar", "Bar ve canlı müzik zinciri. DJ performansları, genç kitle. Smile, Eat, Drink, Dance.", 3, "Canlı Müzik, DJ, Bar, Eğlence"),
    ("James Joyce Irish Pub", "Bar", "The Original Irish Pub. James Joyce atmosferi, raflarda kitaplar, sıcak ortam. İrlanda biraları.", 3, "İrlanda Bar, Bira, Kitaplık, Sıcak Ortam"),
    ("The Irish Pub", "Bar", "Kırmızı cepheli İrlanda barı. Açık hava oturma, canlı atmosfer. Dr. Mustafa Enver Bey Caddesi.", 3, "İrlanda Bar, Açık Hava, Canlı"),
    ("Beer Hall", "Bar", "Beşiktaş Akaretler'de bira salonu. Uzun masalar, Efes ve çeşitli biralar. House of Beer, endüstriyel dekor.", 3, "Bira, Beşiktaş, Komünal Masalar, Canlı"),
]
# Her zincir için İstanbul şube lokasyonları (Google ile doğrulanmış)
BAR_ZINCIR_LOCATIONS = {
    "North Shield Pub": ["Caddebostan", "Tuzla", "Fatih", "Ataşehir", "Göztepe", "Ayazağa", "Sultanahmet", "Göktürk"],
    "The Populist": ["Bomonti", "Galataport"],
    "Varuna Gezgin Cafe & Pub": ["Beyoğlu", "İstiklal"],
    "Corner Irish Pub": ["Beyoğlu"],
    "Jolly Joker": ["Sarıyer", "Ataşehir", "Kartal", "Levent"],
    "James Joyce Irish Pub": ["Beyoğlu"],
    "The Irish Pub": ["Kadıköy"],
    "Beer Hall": ["Beşiktaş"],
}

# Meyhane zincirleri (çok şubeli)
MEYHANE_CHAINS_ZINCIR = [
    ("Kalamış Paysage Meyhane", "Meyhane", "Deniz ve marina manzaralı meyhane. Paysage Balık konsepti, beyaz örtülü masalar, balık ve meze. Kalamış'ta keyifli akşamlar.", 3, "Deniz Manzarası, Marina, Balık, Meze, Şık Ortam"),
    ("Ala Meyhane", "Meyhane", "Kadıköy'de sanat ve lezzet buluşması. Nâzım Hikmet duvar resmi, modern meyhane atmosferi. Meze ve rakı.", 3, "Kadıköy, Sanat, Meze, Rakı, Canlı Ortam"),
    ("Maksat Ocakbaşı & Meyhane", "Meyhane", "Ocakbaşı ve meyhane. Gece aydınlatmalı dış mekân, sıcak ortam. Geleneksel meze ve ızgara.", 2, "Ocakbaşı, Açık Hava, Meze, Canlı"),
]
MEYHANE_ZINCIR_LOCATIONS = {
    "Kalamış Paysage Meyhane": ["Kalamış"],
    "Ala Meyhane": ["Kadıköy"],
    "Maksat Ocakbaşı & Meyhane": ["Beyoğlu"],
}

# Gece kulübü (birden fazla şube)
NIGHTCLUB_CHAINS_ZINCIR = [
    ("Kastel", "Gece Kulübü", "Kırmızı ve mavi lazerler, disco topları, yüksek tavan. Canlı DJ, dans alanı. İstanbul gece hayatının önemli adreslerinden.", 4, "DJ, Dans, Lazer Gösteri, VIP"),
    ("Sortie", "Gece Kulübü", "Boğaz Köprüsü manzaralı gece kulübü. Beyaz örtülü masalar, spot ışıklar, Sugar Vintage bölümü. Premium akşamlar.", 4, "Boğaz Manzarası, Köprü Manzarası, DJ, Açık Hava"),
    ("Oligark", "Gece Kulübü", "Geniş açık hava ve çok katlı mekân. Mor-mavi LED aydınlatma, havuzlu alan, sıcak sarı ışıklar. Oligark binası.", 4, "Açık Hava, Havuz, Çok Katlı, LED"),
    ("Fakülte Teras", "Gece Kulübü", "Rooftop teras gece kulübü. Yeşil çatılı barlar, yüksek masalar, kırmızı vurgular. Canlı müzik ve DJ.", 3, "Teras, Rooftop, DJ, Açık Hava"),
]
NIGHTCLUB_ZINCIR_LOCATIONS = {
    "Kastel": ["Beyoğlu"],
    "Sortie": ["Kuruçeşme"],
    "Oligark": ["Kuruçeşme"],
    "Fakülte Teras": ["Taksim", "Beyoğlu"],
}

# FINE DINING
FINE_DINING = [
    ("Mikla", "Restoran", "Michelin yıldızlı restoran. Modern Türk mutfağı, şık atmosfer. Özel geceler için.", 4, "Michelin, Modern Türk Mutfağı, Şık, Özel Geceler"),
    ("Sunset Grill & Bar", "Restoran", "Boğaz manzaralı fine dining. Premium yemekler, şık atmosfer. Romantik akşamlar.", 4, "Boğaz Manzarası, Fine Dining, Premium, Şık, Romantik"),
    ("360 Istanbul", "Restoran", "360 derece manzara. Modern mutfak, premium içkiler. Özel geceler.", 4, "360 Manzara, Modern Mutfak, Premium, Özel Geceler"),
    ("Ulus 29", "Restoran", "Boğaz manzaralı restoran. Şık atmosfer, premium yemekler. İş yemekleri için ideal.", 4, "Boğaz Manzarası, Şık, Premium, İş Yemekleri"),
    ("Bebek Balıkçı", "Restoran", "Deniz ürünleri restoranı. Taze balık, boğaz manzarası. Akşam yemekleri için.", 4, "Deniz Ürünleri, Taze Balık, Boğaz Manzarası, Akşam"),
]

# Sadece 5+ şubeli zincirler (keep_chains_5plus ile uyumlu)
MIN_BRANCHES = 5
CAFE_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Bebek", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Mecidiyeköy", "Zorlu Center", "İstiklal", "Moda", "Bağdat Caddesi", "Etiler", "Ortaköy"]
FAST_FOOD_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Mecidiyeköy", "Zorlu Center", "İstiklal", "Bağdat Caddesi", "Etiler", "Ortaköy", "Beyoğlu", "Karaköy"]
RESTAURANT_LOCATIONS = ["Taksim", "Kadıköy", "Nişantaşı", "Levent", "Beşiktaş", "Üsküdar", "Bostancı", "Şişli", "Etiler", "Ortaköy", "Beyoğlu", "Sultanahmet"]
BAR_LOCATIONS = ["Taksim", "Beşiktaş", "Ortaköy", "Beyoğlu", "Karaköy", "Galata", "Etiler"]

# 5+ şube alacak kafe zincirleri
CAFE_CHAINS_5PLUS = ["Espresso Lab", "Starbucks", "Kahve Dünyası", "Gloria Jeans", "Mado", "Simit Sarayı", "The House Café", "BigChefs"]
# 5+ şube alacak fast food zincirleri
FAST_FOOD_5PLUS = ["McDonald's", "Burger King", "KFC", "Köfteci Yusuf", "Subway", "Domino's Pizza", "Pizza Hut"]
# 5+ şube alacak restoran zincirleri
RESTAURANT_5PLUS = ["Nusr-Et", "Günaydın"]

PLACES_DATA = []

# Kafe zincirleri (çok yaygın – Google ile doğrulanmış İstanbul şubeleri)
for chain, category, desc, price, features in CAFE_CHAINS_ZINCIR:
    locs = CAFE_ZINCIR_LOCATIONS.get(chain, [])
    for loc in locs:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

for chain, category, desc, price, features in FAST_FOOD_CHAINS:
    if chain not in FAST_FOOD_5PLUS:
        continue
    n = max(MIN_BRANCHES, 10 if chain in ["McDonald's", "Burger King"] else 6)
    for loc in FAST_FOOD_LOCATIONS[:n]:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

for chain, category, desc, price, features in RESTAURANT_CHAINS:
    if chain not in RESTAURANT_5PLUS:
        continue
    n = max(MIN_BRANCHES, 6)
    for loc in RESTAURANT_LOCATIONS[:n]:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Bar zincirleri (çok şubeli)
for chain, category, desc, price, features in BAR_CHAINS_ZINCIR:
    locs = BAR_ZINCIR_LOCATIONS.get(chain, BAR_LOCATIONS)
    for loc in locs:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Meyhane zincirleri (çok şubeli)
MEYHANE_LOCATIONS = ["Kadıköy", "Taksim", "Beyoğlu", "Beşiktaş", "Ortaköy"]
for chain, category, desc, price, features in MEYHANE_CHAINS_ZINCIR:
    locs = MEYHANE_ZINCIR_LOCATIONS.get(chain, MEYHANE_LOCATIONS)
    for loc in locs:
        PLACES_DATA.append(create_place(chain, chain, loc, category, desc, price, features))

# Gece kulübü (birden fazla şube)
NIGHTCLUB_LOCATIONS = ["Taksim", "Beyoğlu", "Beşiktaş", "Ortaköy"]
for chain, category, desc, price, features in NIGHTCLUB_CHAINS_ZINCIR:
    locs = NIGHTCLUB_ZINCIR_LOCATIONS.get(chain, NIGHTCLUB_LOCATIONS)
    for loc in locs:
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
