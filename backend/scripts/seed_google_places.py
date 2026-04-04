"""
Google Places API v1 (New) kullanarak gerçek İstanbul mekanlarını çekip
veritabanına yükleyen kapsamlı seed script.

Her mekan için: fotoğraflar, yorumlar, çalışma saatleri, özellikler çekilir.
Yorumlar sahte kullanıcılar altında kaydedilir.

Kullanım:
  cd backend && source venv/bin/activate
  python scripts/seed_google_places.py
"""

import sys, os, json, time, re
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from database import SessionLocal, engine, Base
import models
from config import get_settings

# ============================================================================
# YAPILANDIRMA
# ============================================================================

settings = get_settings()
API_KEY = settings.GOOGLE_MAPS_API_KEY
if not API_KEY:
    print("❌ GOOGLE_MAPS_API_KEY .env dosyasında bulunamadı!")
    sys.exit(1)

GOOGLE_API_URL = "https://places.googleapis.com/v1/places:searchText"

# Arama sorguları: (bölge, kategori anahtar kelime, uygulama kategorisi)
SEARCH_QUERIES = [
    # Taksim-Beyoğlu
    ("İstanbul Taksim", "kafe", "Kafe"),
    ("İstanbul Beyoğlu", "restoran", "Restoran"),
    ("İstanbul Taksim", "bar", "Bar"),
    ("İstanbul Beyoğlu", "gece kulübü", "Gece Kulübü"),
    ("İstanbul İstiklal Caddesi", "meyhane", "Meyhane"),
    # Kadıköy-Moda
    ("İstanbul Kadıköy", "kafe", "Kafe"),
    ("İstanbul Kadıköy", "restoran", "Restoran"),
    ("İstanbul Kadıköy barlar sokağı", "bar", "Bar"),
    # Beşiktaş-Ortaköy
    ("İstanbul Beşiktaş", "kafe", "Kafe"),
    ("İstanbul Beşiktaş", "restoran", "Restoran"),
    ("İstanbul Ortaköy", "bar", "Bar"),
    # Karaköy-Galata
    ("İstanbul Karaköy", "kafe", "Kafe"),
    ("İstanbul Karaköy", "restoran", "Restoran"),
    # Nişantaşı-Şişli
    ("İstanbul Nişantaşı", "restoran", "Restoran"),
    ("İstanbul Nişantaşı", "kafe", "Kafe"),
    # Sultanahmet-Fatih
    ("İstanbul Sultanahmet", "restoran", "Restoran"),
    ("İstanbul Fatih", "kafe", "Kafe"),
    # Üsküdar
    ("İstanbul Üsküdar", "kafe", "Kafe"),
    # Bebek-Arnavutköy
    ("İstanbul Bebek", "restoran", "Restoran"),
    ("İstanbul Bebek", "kafe", "Kafe"),
    # Bomonti-Cihangir
    ("İstanbul Cihangir", "kafe", "Kafe"),
    ("İstanbul Bomonti", "bar", "Bar"),
    # Sokak lezzetleri
    ("İstanbul", "dönerci", "Fast Food"),
    ("İstanbul", "köfteci", "Fast Food"),
    ("İstanbul", "pide lahmacun", "Fast Food"),
]

# Google type → Uygulama kategorisi eşleme
TYPE_TO_CATEGORY = {
    "cafe": "Kafe",
    "coffee_shop": "Kafe",
    "bakery": "Kafe",
    "restaurant": "Restoran",
    "bar": "Bar",
    "night_club": "Gece Kulübü",
    "meal_delivery": "Fast Food",
    "meal_takeaway": "Fast Food",
    "fast_food_restaurant": "Fast Food",
}

# Google boolean fields → features eşleme
FEATURE_FLAGS = {
    "outdoorSeating": "outdoor",
    "liveMusic": "live_music",
    "takeout": "takeout",
    "delivery": "delivery",
    "dineIn": "dine_in",
    "reservable": "reservable",
    "servesBreakfast": "breakfast",
    "servesBrunch": "brunch",
    "servesLunch": "lunch",
    "servesDinner": "dinner",
    "servesBeer": "beer",
    "servesWine": "wine",
    "servesCocktails": "cocktails",
    "servesVegetarianFood": "vegetarian",
    "goodForChildren": "family",
    "goodForGroups": "friends",
    "goodForWatchingSports": "sports",
}

# Fiyat seviyesi eşleme
PRICE_MAPPING = {
    "PRICE_LEVEL_FREE": 1,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}


# ============================================================================
# GOOGLE PLACES API FONKSİYONLARI
# ============================================================================

def search_places(query: str, max_results: int = 20) -> list:
    """Google Places API v1 ile mekan arar."""
    headers = {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": ",".join([
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.primaryType",
            "places.types",
            "places.photos",
            "places.reviews",
            "places.regularOpeningHours",
            "places.editorialSummary",
            "places.internationalPhoneNumber",
            "places.nationalPhoneNumber",
            "places.goodForChildren",
            "places.goodForGroups",
            "places.goodForWatchingSports",
            "places.liveMusic",
            "places.outdoorSeating",
            "places.takeout",
            "places.delivery",
            "places.dineIn",
            "places.reservable",
            "places.servesBeer",
            "places.servesBreakfast",
            "places.servesBrunch",
            "places.servesCocktails",
            "places.servesDinner",
            "places.servesLunch",
            "places.servesVegetarianFood",
            "places.servesWine",
        ]),
        "Content-Type": "application/json",
    }

    payload = {
        "textQuery": query,
        "languageCode": "tr",
        "maxResultCount": max_results,
    }

    try:
        resp = requests.post(GOOGLE_API_URL, headers=headers, json=payload, timeout=15)
        if resp.status_code != 200:
            print(f"   ⚠️  API Hatası ({resp.status_code}): {resp.text[:200]}")
            return []
        data = resp.json()
        return data.get("places", [])
    except Exception as e:
        print(f"   ❌ İstek hatası: {e}")
        return []


def get_category_from_place(place_data: dict, default_category: str) -> str:
    """Google types'tan uygulama kategorisi belirle."""
    primary_type = place_data.get("primaryType", "")
    if primary_type in TYPE_TO_CATEGORY:
        return TYPE_TO_CATEGORY[primary_type]

    for t in place_data.get("types", []):
        if t in TYPE_TO_CATEGORY:
            return TYPE_TO_CATEGORY[t]

    return default_category


def get_features_from_place(place_data: dict) -> str:
    """Google boolean alanlarından feature string oluştur."""
    features = []
    for google_field, feature_name in FEATURE_FLAGS.items():
        if place_data.get(google_field) is True:
            features.append(feature_name)

    # Types'tan ek feature çıkar
    types = place_data.get("types", [])
    type_features = {
        "wifi": ["cafe", "coffee_shop", "library"],
        "historic": ["historical_landmark", "museum"],
        "shopping": ["shopping_mall", "store"],
    }
    for feature, matching_types in type_features.items():
        if any(t in types for t in matching_types):
            features.append(feature)

    return ",".join(features) if features else ""


def get_opening_hours(place_data: dict) -> tuple:
    """Çalışma saatlerini çıkar — (opening_time, closing_time, hours_json)"""
    hours_data = place_data.get("regularOpeningHours", {})
    weekday_texts = hours_data.get("weekdayDescriptions", [])

    hours_dict = {}
    opening_time = None
    closing_time = None

    for day_text in weekday_texts:
        # Format: "Monday: 9:00 AM – 11:00 PM"
        parts = day_text.split(": ", 1)
        if len(parts) == 2:
            day_name = parts[0].strip()
            time_range = parts[1].strip()
            hours_dict[day_name] = time_range

            # İlk günün saatlerini opening/closing olarak kullan
            if opening_time is None and "–" in time_range:
                time_parts = time_range.split("–")
                if len(time_parts) == 2:
                    raw_open = time_parts[0].strip()
                    raw_close = time_parts[1].strip()
                    opening_time = _parse_time_to_hhmm(raw_open)
                    closing_time = _parse_time_to_hhmm(raw_close)
            elif opening_time is None and "24 saat" in time_range.lower():
                opening_time = "00:00"
                closing_time = "23:59"

    hours_json = json.dumps(hours_dict, ensure_ascii=False) if hours_dict else None
    return opening_time, closing_time, hours_json


def _parse_time_to_hhmm(time_str: str) -> str:
    """'9:00 AM' veya '11:00 ÖÖ' → 'HH:MM' formatına çevir."""
    time_str = time_str.strip().upper()
    # Türkçe kısaltmalar
    time_str = time_str.replace("ÖÖ", "AM").replace("ÖS", "PM")

    try:
        # 12 saat formatı
        match = re.match(r"(\d{1,2}):(\d{2})\s*(AM|PM)", time_str)
        if match:
            h, m, ampm = int(match.group(1)), int(match.group(2)), match.group(3)
            if ampm == "PM" and h != 12:
                h += 12
            elif ampm == "AM" and h == 12:
                h = 0
            return f"{h:02d}:{m:02d}"

        # 24 saat formatı
        match = re.match(r"(\d{1,2}):(\d{2})", time_str)
        if match:
            return f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"
    except Exception:
        pass

    return "09:00"  # Fallback


def get_photo_refs(place_data: dict, max_photos: int = 3) -> list:
    """Fotoğraf referanslarını çıkar."""
    photos = place_data.get("photos", [])
    refs = []
    for photo in photos[:max_photos]:
        photo_name = photo.get("name", "")
        if "photos/" in photo_name:
            # "places/xxx/photos/PHOTO_REF" → "PHOTO_REF"
            photo_ref = photo_name.split("photos/")[-1]
            refs.append(f"google_photo_ref:{photo_ref}")
    return refs


def get_reviews(place_data: dict, max_reviews: int = 3) -> list:
    """Google yorumlarını çıkar."""
    reviews = place_data.get("reviews", [])
    result = []
    for r in reviews[:max_reviews]:
        author_name = r.get("authorAttribution", {}).get("displayName", "Anonim")
        result.append({
            "author_name": author_name,
            "rating": r.get("rating", 4),
            "text": r.get("text", {}).get("text", ""),
            "relative_time": r.get("relativePublishTimeDescription", ""),
        })
    return result


def sanitize_username(name: str) -> str:
    """Google yazar adını geçerli username'e çevir."""
    # Türkçe karakter dönüşümü
    tr_map = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    name = name.translate(tr_map)
    # Sadece alfanumerik ve alt çizgi
    username = re.sub(r"[^a-zA-Z0-9_]", "_", name.strip().lower())
    username = re.sub(r"_+", "_", username).strip("_")
    if not username or len(username) < 2:
        username = f"google_user_{hash(name) % 100000}"
    return username[:30]


# ============================================================================
# VERİTABANI İŞLEMLERİ
# ============================================================================

def get_or_create_seed_user(db, username: str, display_name: str) -> models.User:
    """Sahte seed kullanıcısı oluştur veya mevcut olanı getir."""
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        return existing

    # Sahte e-posta ve şifre (giriş yapılamaz)
    fake_email = f"{username}@seed.local"
    user = models.User(
        email=fake_email,
        username=username,
        password_hash="SEED_USER_NO_LOGIN",  # Giriş yapılamaz
        first_name=display_name.split()[0] if display_name else username,
        last_name=display_name.split()[-1] if display_name and len(display_name.split()) > 1 else "",
        role="seed",  # Özel rol: gerçek kullanıcı bu username'i isterse silinir
        is_active=True,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def clear_seed_data(db):
    """Önceki seed verilerini temizle."""
    # Seed kullanıcılarının yorumlarını sil
    seed_users = db.query(models.User).filter(models.User.role == "seed").all()
    seed_user_ids = [u.id for u in seed_users]

    if seed_user_ids:
        db.query(models.Review).filter(models.Review.user_id.in_(seed_user_ids)).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.role == "seed").delete(synchronize_session=False)
        db.commit()
        print(f"   🧹 {len(seed_user_ids)} seed kullanıcı ve yorumları silindi")

    # Tüm mekanları sil (CASCADE ile ilişkili veriler de silinir)
    place_count = db.query(models.Place).count()
    if place_count > 0:
        # Önce ilişkili verileri temizle
        db.query(models.SavedPlace).delete(synchronize_session=False)
        db.query(models.Review).delete(synchronize_session=False)
        db.query(models.Place).delete(synchronize_session=False)
        db.commit()
        print(f"   🧹 {place_count} mevcut mekan silindi")


# ============================================================================
# ANA SEED FONKSİYONU
# ============================================================================

def run_seed():
    """Ana seed işlemi."""
    print("\n" + "=" * 70)
    print("🌍 GOOGLE PLACES API — GERÇEK MEKAN VERİSİ ÇEKME")
    print("=" * 70)

    db = SessionLocal()

    try:
        # 1. Önceki verileri temizle
        print("\n📋 Adım 1: Önceki veriler temizleniyor...")
        clear_seed_data(db)

        # 2. Google'dan mekan verisi çek
        print("\n📋 Adım 2: Google Places API'den mekan çekiliyor...")
        all_places = {}  # google_place_id → place_data (duplikasyon önleme)

        for region, keyword, default_cat in SEARCH_QUERIES:
            query = f"{region} {keyword}"
            print(f"\n   🔍 '{query}' sorgulanıyor...")

            places_data = search_places(query, max_results=20)
            new_count = 0

            for p in places_data:
                gid = p.get("id")
                if gid and gid not in all_places:
                    p["_default_category"] = default_cat
                    all_places[gid] = p
                    new_count += 1

            print(f"   ✓ {len(places_data)} sonuç, {new_count} yeni mekan")
            time.sleep(0.3)  # Rate limiting

        print(f"\n   📊 Toplam benzersiz mekan: {len(all_places)}")

        # 3. Mekanları veritabanına kaydet
        print("\n📋 Adım 3: Mekanlar veritabanına kaydediliyor...")
        saved_places = 0
        total_reviews = 0
        category_counts = {}

        for idx, (gid, p) in enumerate(all_places.items(), 1):
            name = p.get("displayName", {}).get("text", "İsimsiz")
            address = p.get("formattedAddress", "")

            # Koordinatlar
            loc = p.get("location", {})
            lat = loc.get("latitude")
            lng = loc.get("longitude")

            if not lat or not lng:
                continue

            # İstanbul sınırları kontrolü
            if not (40.7 < lat < 41.4 and 28.5 < lng < 29.5):
                continue

            # Kategori
            category = get_category_from_place(p, p.get("_default_category", "Restoran"))

            # Özellikler
            features = get_features_from_place(p)

            # Fiyat
            price_level = PRICE_MAPPING.get(p.get("priceLevel", ""), 2)

            # Açıklama
            description = p.get("editorialSummary", {}).get("text", "")
            if not description:
                description = f"{name} — {category} · {address.split(',')[0] if address else 'İstanbul'}"

            # Telefon
            phone = p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber") or None

            # Çalışma saatleri
            opening_time, closing_time, hours_json = get_opening_hours(p)

            # Fotoğraflar
            photo_refs = get_photo_refs(p, max_photos=3)
            photo_url = photo_refs[0] if photo_refs else None
            gallery = json.dumps(photo_refs[1:]) if len(photo_refs) > 1 else None

            # Rating
            rating = float(p.get("rating", 0.0))
            user_ratings_total = p.get("userRatingCount", 0)

            # Veritabanına kaydet
            place = models.Place(
                name=name,
                address=address,
                city="İstanbul",
                category=category,
                description=description,
                latitude=lat,
                longitude=lng,
                average_rating=rating,
                user_ratings_total=user_ratings_total,
                price_range=price_level,
                features=features,
                photo_url=photo_url,
                gallery_urls=gallery,
                phone_number=phone,
                opening_time=opening_time,
                closing_time=closing_time,
                opening_hours_json=hours_json,
                google_place_id=gid,
                vector_id=gid,
                is_open=True,
            )
            db.add(place)
            db.flush()  # ID almak için

            # Yorumları ekle
            reviews = get_reviews(p, max_reviews=3)
            for r in reviews:
                if not r["text"]:
                    continue

                author = r["author_name"]
                username = sanitize_username(author)
                seed_user = get_or_create_seed_user(db, username, author)

                review = models.Review(
                    user_id=seed_user.id,
                    place_id=place.id,
                    comment_text=r["text"],
                    rating=r["rating"],
                    is_verified=False,
                )
                db.add(review)
                total_reviews += 1

            saved_places += 1
            category_counts[category] = category_counts.get(category, 0) + 1

            if idx % 10 == 0:
                db.commit()
                print(f"   ✓ {idx}/{len(all_places)} işlendi ({saved_places} kaydedildi)")

        db.commit()

        # 4. Sonuç özeti
        print("\n" + "=" * 70)
        print("✅ SEED İŞLEMİ TAMAMLANDI!")
        print("=" * 70)
        print(f"\n📊 Toplam kaydedilen mekan: {saved_places}")
        print(f"💬 Toplam yorum: {total_reviews}")
        print(f"👤 Seed kullanıcı: {db.query(models.User).filter(models.User.role == 'seed').count()}")
        print("\n📂 Kategori dağılımı:")
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
            print(f"   {cat}: {count}")

        # Fotoğraflı mekan sayısı
        photo_count = db.query(models.Place).filter(models.Place.photo_url.isnot(None)).count()
        print(f"\n📸 Fotoğraflı mekan: {photo_count}/{saved_places}")

        # Çalışma saatli mekan sayısı
        hours_count = db.query(models.Place).filter(models.Place.opening_hours_json.isnot(None)).count()
        print(f"🕐 Çalışma saatli mekan: {hours_count}/{saved_places}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
