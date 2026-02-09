"""
Zincir mekanlara gerçek fotoğraf ve video URL'leri ekleyen script
Unsplash, Pexels gibi kaynaklardan veya zincir markaların resmi görsellerini kullanır
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
from models import Place

# Zincir markalara ait gerçek görsel URL'leri
CHAIN_MEDIA = {
    "Espresso Lab": {
        "photo": "https://images.unsplash.com/photo-1559496417-e7f25c5fbbf5?w=800",  # Modern cafe interior
        "video": "https://player.vimeo.com/video/example1"  # Placeholder
    },
    "Starbucks": {
        "photo": "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800",  # Starbucks coffee
        "video": None
    },
    "Kahve Dünyası": {
        "photo": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",  # Turkish coffee
        "video": None
    },
    "Gloria Jeans": {
        "photo": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",  # Cafe atmosphere
        "video": None
    },
    "Nero": {
        "photo": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",  # Espresso
        "video": None
    },
    "Caffè Nero": {
        "photo": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",  # Coffee shop
        "video": None
    },
    "Mado": {
        "photo": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",  # Turkish ice cream
        "video": None
    },
    "Simit Sarayı": {
        "photo": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",  # Turkish simit
        "video": None
    },
    "The House Café": {
        "photo": "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800",  # Modern cafe
        "video": None
    },
    "BigChefs": {
        "photo": "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=800",  # Brunch
        "video": None
    },
    "Midpoint": {
        "photo": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",  # Modern workspace cafe
        "video": None
    },
    "Happy Moon's": {
        "photo": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",  # Colorful cafe
        "video": None
    },
    "McDonald's": {
        "photo": "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=800",  # McDonald's burger
        "video": None
    },
    "Burger King": {
        "photo": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",  # Burger King whopper
        "video": None
    },
    "KFC": {
        "photo": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",  # Fried chicken
        "video": None
    },
    "Domino's Pizza": {
        "photo": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",  # Pizza
        "video": None
    },
    "Pizza Hut": {
        "photo": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",  # Pizza close-up
        "video": None
    },
    "Sbarro": {
        "photo": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800",  # Pizza slice
        "video": None
    },
    "Popeyes": {
        "photo": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800",  # Spicy chicken
        "video": None
    },
    "Subway": {
        "photo": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800",  # Sandwich
        "video": None
    },
    "Baydoner": {
        "photo": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800",  # Turkish doner
        "video": None
    },
    "Köfteci Yusuf": {
        "photo": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",  # Turkish kofte
        "video": None
    },
    "Nusr-Et": {
        "photo": "https://images.unsplash.com/photo-1558030006-450675393462?w=800",  # Premium steak
        "video": None
    },
    "Günaydın": {
        "photo": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",  # Turkish kebab
        "video": None
    },
    "Saray Muhallebicisi": {
        "photo": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800",  # Turkish dessert
        "video": None
    },
    "Emirgan Sütiş": {
        "photo": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",  # Turkish breakfast
        "video": None
    },
    "Çiya Sofrası": {
        "photo": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800",  # Turkish food
        "video": None
    },
    "Zübeyir Ocakbaşı": {
        "photo": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",  # Turkish grill
        "video": None
    },
    "Hacı Dayı": {
        "photo": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800",  # Turkish street food
        "video": None
    },
    "Konyalı Lokantası": {
        "photo": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800",  # Turkish etli ekmek
        "video": None
    },
    "360 Bar": {
        "photo": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",  # Rooftop bar view
        "video": None
    },
    "5. Kat": {
        "photo": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",  # Bar with view
        "video": None
    },
    "Leb-i Derya": {
        "photo": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",  # Cocktails
        "video": None
    },
    "Sortie": {
        "photo": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",  # Night club
        "video": None
    },
    "Reina": {
        "photo": "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800",  # Luxury club
        "video": None
    },
    "Anjelique": {
        "photo": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",  # Luxury bar
        "video": None
    },
    "Ruby": {
        "photo": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800",  # Modern bar
        "video": None
    },
    "29": {
        "photo": "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800",  # Rooftop lounge
        "video": None
    },
    "Mikla Bar": {
        "photo": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800",  # Premium bar
        "video": None
    },
    "Mikla": {
        "photo": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",  # Fine dining
        "video": None
    },
    "Sunset Grill & Bar": {
        "photo": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",  # Restaurant view
        "video": None
    },
    "360 Istanbul": {
        "photo": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",  # Restaurant atmosphere
        "video": None
    },
    "Ulus 29": {
        "photo": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",  # Waterfront dining
        "video": None
    },
    "Bebek Balıkçı": {
        "photo": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",  # Seafood restaurant
        "video": None
    },
}

def extract_chain_name(full_name: str) -> str:
    """Tam isimden zincir adını çıkar (örn: 'Starbucks - Taksim' -> 'Starbucks')"""
    return full_name.split(" - ")[0].strip()

def update_chain_media():
    """Tüm zincir mekanlara görsel ekle"""
    db = SessionLocal()
    try:
        # Tüm mekanları al
        places = db.query(Place).all()
        updated_count = 0
        
        for place in places:
            chain_name = extract_chain_name(place.name)
            
            if chain_name in CHAIN_MEDIA:
                media = CHAIN_MEDIA[chain_name]
                place.photo_url = media["photo"]
                place.video_url = media["video"]
                updated_count += 1
                print(f"✅ {place.name} - Görsel eklendi")
        
        db.commit()
        print(f"\n📊 Toplam {updated_count} mekan güncellendi")
        
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Zincir mekanlara görsel ekleniyor...\n")
    update_chain_media()
    print("\n✅ İşlem tamamlandı!")
