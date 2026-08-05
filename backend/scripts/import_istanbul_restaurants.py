"""
İstanbul Restoran İçe Aktarma — Google Places API (New)
=========================================================
İstanbul'daki ~4.000 benzersiz restoranı Google Places API (New) üzerinden
çekip mevcut `Place` / `Review` tablolarına ekler. Şema değişikliği yapmaz,
sadece mevcut kolonları doldurur.

İki faz halinde çalışır (her ikisi de --resume ile devam edebilir):
  1. discover  — İlçe × anahtar kelime kombinasyonlarıyla Text Search (New)
                 taraması yapar, benzersiz google_place_id'leri toplar.
  2. ingest    — Toplanan place_id'ler için Place Details (New) çeker,
                 Place + Review kayıtlarını veritabanına yazar.

Kullanım:
  python scripts/import_istanbul_restaurants.py discover
  python scripts/import_istanbul_restaurants.py ingest --resume
  python scripts/import_istanbul_restaurants.py all --resume --limit 4000

Gerekli .env değişkeni: GOOGLE_PLACES_API_KEY
"""

import sys
import os
import json
import time
import argparse
import re
from datetime import datetime, timedelta
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Windows konsollarında (cp1254 vb.) emoji/Türkçe karakter print hatasını önle
if sys.stdout.encoding is None or sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Bazı Windows makinelerinde antivirüs/kurumsal proxy TLS trafiğini kendi
# sertifikasıyla kesiyor; certifi'nin bundle'ı bu sertifikayı tanımadığı için
# CERTIFICATE_VERIFY_FAILED alınıyor. truststore, Windows'un kendi güvenilir
# sertifika deposunu kullanarak bu sorunu çözer.
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

import requests
from database import SessionLocal
import models
from config import get_settings

# ─── Konfig ──────────────────────────────────────────────────────────────────
SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"

PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "import_istanbul_restaurants_progress.json")

BOT_EMAIL = "google-import@system.asemos.local"
BOT_USERNAME = "google_import_bot"

REQUEST_DELAY = 0.3          # saniye — arka arkaya isteklerde
MAX_RETRIES = 5
SEARCH_PAGES_PER_QUERY = 3   # Text Search (New) sayfa başı 20 sonuç, max ~60

# İstanbul ilçeleri — arama merkezleri (yaklaşık)
DISTRICTS = [
    ("Adalar", 40.8767, 29.0864), ("Arnavutköy", 41.1859, 28.7407),
    ("Ataşehir", 40.9923, 29.1244), ("Avcılar", 40.9791, 28.7218),
    ("Bağcılar", 41.0381, 28.8564), ("Bahçelievler", 41.0022, 28.8586),
    ("Bakırköy", 40.9819, 28.8772), ("Başakşehir", 41.0949, 28.8017),
    ("Bayrampaşa", 41.0472, 28.9058), ("Beşiktaş", 41.0422, 29.0083),
    ("Beykoz", 41.1354, 29.0977), ("Beylikdüzü", 41.0018, 28.6408),
    ("Beyoğlu", 41.0369, 28.9770), ("Büyükçekmece", 41.0203, 28.5827),
    ("Çatalca", 41.1436, 28.4611), ("Çekmeköy", 41.0353, 29.2135),
    ("Esenler", 41.0455, 28.8801), ("Esenyurt", 41.0344, 28.6756),
    ("Eyüpsultan", 41.0480, 28.9339), ("Fatih", 41.0186, 28.9497),
    ("Gaziosmanpaşa", 41.0672, 28.9153), ("Güngören", 41.0157, 28.8747),
    ("Kadıköy", 40.9927, 29.0274), ("Kağıthane", 41.0863, 28.9713),
    ("Kartal", 40.9057, 29.1877), ("Küçükçekmece", 41.0000, 28.7756),
    ("Maltepe", 40.9354, 29.1556), ("Pendik", 40.8778, 29.2333),
    ("Sancaktepe", 41.0011, 29.2308), ("Sarıyer", 41.1667, 29.0500),
    ("Silivri", 41.0733, 28.2467), ("Sultanbeyli", 40.9639, 29.2639),
    ("Sultangazi", 41.1067, 28.8672), ("Şile", 41.1758, 29.6117),
    ("Şişli", 41.0602, 28.9877), ("Tuzla", 40.8161, 29.3011),
    ("Ümraniye", 41.0328, 29.1231), ("Üsküdar", 41.0225, 29.0244),
    ("Zeytinburnu", 40.9950, 28.9028),
]
DISTRICT_RADIUS_M = 4000.0

KEYWORDS = [
    "restaurant", "cafe", "kebap", "pizza", "burger", "steakhouse",
    "seafood", "breakfast", "coffee", "dessert", "bakery", "sushi",
    "döner", "lokanta", "meyhane",
]

TYPE_CATEGORY_MAP = {
    "cafe": "Kafe", "coffee_shop": "Kafe", "bakery": "Fırın",
    "bar": "Bar", "night_club": "Gece Kulübü", "meyhane": "Meyhane",
    "seafood_restaurant": "Deniz Ürünleri", "pizza_restaurant": "Pizza",
    "hamburger_restaurant": "Burger", "sushi_restaurant": "Suşi",
    "steak_house": "Steakhouse", "breakfast_restaurant": "Kahvaltı",
    "dessert_shop": "Tatlıcı", "turkish_restaurant": "Türk Mutfağı",
    "restaurant": "Restoran",
}
PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": 1, "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2, "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}


# ─── HTTP yardımcıları (retry + rate limit) ────────────────────────────────

def _request_with_retry(method: str, url: str, **kwargs) -> Optional[requests.Response]:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.request(method, url, timeout=20, **kwargs)
        except requests.exceptions.RequestException as e:
            print(f"    ⚠️  ağ hatası ({attempt}/{MAX_RETRIES}): {e}")
            time.sleep(2 ** attempt)
            continue

        if resp.status_code == 200:
            return resp
        if resp.status_code == 429 or resp.status_code >= 500:
            wait = min(2 ** attempt, 30)
            print(f"    ⚠️  HTTP {resp.status_code}, {wait}s bekleniyor ({attempt}/{MAX_RETRIES})")
            time.sleep(wait)
            continue
        # 4xx (400/403/404 vb.) — tekrar denemek fayda etmez
        print(f"    ❌ HTTP {resp.status_code}: {resp.text[:300]}")
        return resp
    return None


def search_text(api_key: str, query: str, lat: float, lng: float, radius_m: float, page_token: Optional[str] = None) -> dict:
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,nextPageToken",
        "Content-Type": "application/json",
    }
    payload = {
        "textQuery": query,
        "languageCode": "tr",
        "regionCode": "TR",
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_m,
            }
        },
    }
    if page_token:
        payload["pageToken"] = page_token

    resp = _request_with_retry("POST", SEARCH_URL, headers=headers, json=payload)
    if resp is None or resp.status_code != 200:
        return {}
    return resp.json()


DETAILS_FIELD_MASK = ",".join([
    "id", "displayName", "formattedAddress", "location", "rating",
    "userRatingCount", "priceLevel", "nationalPhoneNumber",
    "internationalPhoneNumber", "regularOpeningHours", "photos",
    "reviews", "primaryType", "types",
])


def get_place_details(api_key: str, place_id: str) -> dict:
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    }
    resp = _request_with_retry("GET", DETAILS_URL.format(place_id=place_id), headers=headers)
    if resp is None or resp.status_code != 200:
        return {}
    return resp.json()


# ─── İlerleme kaydı ─────────────────────────────────────────────────────────

def _empty_progress() -> dict:
    return {"done_searches": [], "collected_place_ids": [], "ingested_place_ids": []}


def load_progress() -> dict:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return _empty_progress()


def save_progress(progress: dict):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False)


# ─── Faz 1: Keşif ───────────────────────────────────────────────────────────

def discover(api_key: str, resume: bool, target_count: int = 0):
    progress = load_progress() if resume else _empty_progress()
    done_searches = set(progress["done_searches"])
    collected = set(progress["collected_place_ids"])

    combos = [(d, kw) for d in DISTRICTS for kw in KEYWORDS]
    print(f"Toplam arama kombinasyonu: {len(combos)} (tamamlanmış: {len(done_searches)})")

    for (district, lat, lng), keyword in combos:
        if target_count and len(collected) >= target_count:
            print(f"Hedef {target_count} place_id toplandı, keşif durduruluyor.")
            break

        search_key = f"{district}|{keyword}"
        if search_key in done_searches:
            continue

        query = f"{district} İstanbul {keyword}"
        page_token = None
        pages = 0
        found_in_query = 0

        while pages < SEARCH_PAGES_PER_QUERY:
            data = search_text(api_key, query, lat, lng, DISTRICT_RADIUS_M, page_token)
            places = data.get("places", [])
            for p in places:
                pid = p.get("id")
                if pid:
                    collected.add(pid)
                    found_in_query += 1

            pages += 1
            page_token = data.get("nextPageToken")
            if not page_token:
                break
            time.sleep(REQUEST_DELAY + 1.5)  # nextPageToken aktif olması için Google gecikme öneriyor

        print(f"[{search_key}] +{found_in_query} sonuç, toplam benzersiz: {len(collected)}")

        done_searches.add(search_key)
        progress["done_searches"] = list(done_searches)
        progress["collected_place_ids"] = list(collected)
        save_progress(progress)

        time.sleep(REQUEST_DELAY)

    print(f"\nKeşif tamamlandı. Toplam benzersiz place_id: {len(collected)}")


# ─── Faz 2: Detay + veritabanına yazma ──────────────────────────────────────

def get_or_create_bot_user(db) -> "models.User":
    from crud import _hash_password
    user = db.query(models.User).filter(models.User.email == BOT_EMAIL).first()
    if user:
        return user
    user = models.User(
        email=BOT_EMAIL,
        password_hash=_hash_password(os.urandom(16).hex()),
        username=BOT_USERNAME,
        first_name="Google",
        last_name="Import",
        role="standard",
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def map_category(primary_type: str, types: list) -> str:
    if primary_type in TYPE_CATEGORY_MAP:
        return TYPE_CATEGORY_MAP[primary_type]
    for t in types or []:
        if t in TYPE_CATEGORY_MAP:
            return TYPE_CATEGORY_MAP[t]
    return "Restoran"


def photo_ref_from_name(photo_name: str) -> Optional[str]:
    if "photos/" not in photo_name:
        return None
    ref = photo_name.split("photos/")[1]
    return f"google_photo_ref:{ref}"


def parse_relative_time(desc: str) -> datetime:
    """Google'ın 'a year ago', '3 ay önce' gibi göreli zamanını datetime'a çevirir."""
    now = datetime.utcnow()
    if not desc:
        return now
    s = desc.lower()
    m = re.search(r"(\d+)", s)
    n = int(m.group(1)) if m else 1
    if "year" in s or "yıl" in s:
        return now - timedelta(days=365 * n)
    if "month" in s or "ay" in s:
        return now - timedelta(days=30 * n)
    if "week" in s or "hafta" in s:
        return now - timedelta(weeks=n)
    if "day" in s or "gün" in s:
        return now - timedelta(days=n)
    return now


def build_place_kwargs(details: dict) -> dict:
    loc = details.get("location", {})
    photos = details.get("photos", [])
    gallery_refs = []
    for ph in photos[:10]:
        ref = photo_ref_from_name(ph.get("name", ""))
        if ref:
            gallery_refs.append(ref)
    photo_url = gallery_refs[0] if gallery_refs else None

    opening = details.get("regularOpeningHours", {})
    weekday_desc = opening.get("weekdayDescriptions")
    opening_hours_json = json.dumps(weekday_desc, ensure_ascii=False) if weekday_desc else None

    types = details.get("types", [])
    primary_type = details.get("primaryType", "")

    return dict(
        name=details.get("displayName", {}).get("text", "")[:255],
        address=details.get("formattedAddress", ""),
        city="İstanbul",
        google_place_id=details.get("id"),
        price_range=PRICE_LEVEL_MAP.get(details.get("priceLevel"), None),
        category=map_category(primary_type, types),
        latitude=loc.get("latitude"),
        longitude=loc.get("longitude"),
        average_rating=details.get("rating", 0.0) or 0.0,
        user_ratings_total=details.get("userRatingCount"),
        photo_url=photo_url,
        gallery_urls=json.dumps(gallery_refs, ensure_ascii=False) if gallery_refs else None,
        opening_hours_json=opening_hours_json,
        phone_number=details.get("internationalPhoneNumber") or details.get("nationalPhoneNumber"),
    )


def ingest_reviews(db, place: "models.Place", details: dict, bot_user_id: int) -> int:
    raw_reviews = details.get("reviews", [])
    if not raw_reviews:
        return 0

    existing_snippets = set(
        r[0] for r in db.query(models.Review.comment_text)
        .filter(models.Review.place_id == place.id).all() if r[0]
    )

    added = 0
    for rev in raw_reviews:
        text_obj = rev.get("text") or rev.get("originalText") or {}
        comment_text = (text_obj.get("text") or "").strip()
        rating = rev.get("rating")
        if not comment_text or rating is None:
            continue
        if comment_text in existing_snippets:
            continue

        review_date = parse_relative_time(rev.get("relativePublishTimeDescription", ""))
        db.add(models.Review(
            user_id=bot_user_id,
            place_id=place.id,
            comment_text=comment_text,
            rating=int(rating),
            created_at=review_date,
            is_verified=False,
        ))
        existing_snippets.add(comment_text)
        added += 1

    return added


def ingest(api_key: str, resume: bool, limit: int):
    progress = load_progress()
    collected = list(progress.get("collected_place_ids", []))
    ingested = set(progress.get("ingested_place_ids", [])) if resume else set()

    if not collected:
        print("Önce 'discover' fazını çalıştırın — toplanmış place_id bulunamadı.")
        return

    to_process = [pid for pid in collected if pid not in ingested]
    if limit and limit > 0:
        remaining_slots = max(0, limit - len(ingested))
        to_process = to_process[:remaining_slots]

    print(f"Toplam toplanmış: {len(collected)}, işlenecek: {len(to_process)} (zaten aktarılmış: {len(ingested)})")

    db = SessionLocal()
    try:
        bot_user = get_or_create_bot_user(db)
        bot_user_id = bot_user.id
    finally:
        db.close()

    added_places = 0
    added_reviews = 0
    skipped_existing = 0
    skipped_quality = 0
    failed = 0

    for idx, pid in enumerate(to_process):
        db = SessionLocal()
        try:
            existing = db.query(models.Place).filter(models.Place.google_place_id == pid).first()
            if existing:
                skipped_existing += 1
                ingested.add(pid)
                if idx % 20 == 0:
                    progress["ingested_place_ids"] = list(ingested)
                    save_progress(progress)
                continue

            details = get_place_details(api_key, pid)
            if not details or not details.get("id"):
                print(f"[{idx+1}/{len(to_process)}] ❌ detay alınamadı: {pid}")
                failed += 1
                time.sleep(REQUEST_DELAY)
                continue

            # Kalite filtresi — add_places_with_reviews.py (SerpAPI) ile aynı eşik:
            # düşük puanlı/az yorumlu/fotoğrafsız mekanlar havuzu kirletmesin.
            rating = details.get("rating") or 0.0
            rating_count = details.get("userRatingCount") or 0
            has_photos = bool(details.get("photos"))
            passes_rating = (rating >= 4.0 and rating_count >= 50) or (rating >= 4.5 and rating_count >= 20)
            if not (passes_rating and has_photos):
                skipped_quality += 1
                ingested.add(pid)
                time.sleep(REQUEST_DELAY)
                continue

            place_kwargs = build_place_kwargs(details)
            place = models.Place(**place_kwargs)
            db.add(place)
            db.flush()  # place.id lazım review eklemeden önce

            rev_count = ingest_reviews(db, place, details, bot_user_id)

            db.commit()
            added_places += 1
            added_reviews += rev_count
            print(f"[{idx+1}/{len(to_process)}] ✅ {place_kwargs['name']} (+{rev_count} yorum)")

        except Exception as e:
            db.rollback()
            print(f"[{idx+1}/{len(to_process)}] ❌ DB hatası ({pid}): {e}")
            failed += 1
            time.sleep(1)
            continue
        finally:
            db.close()

        ingested.add(pid)
        if idx % 20 == 0:
            progress["ingested_place_ids"] = list(ingested)
            save_progress(progress)

        time.sleep(REQUEST_DELAY)

    progress["ingested_place_ids"] = list(ingested)
    save_progress(progress)

    print("\n" + "=" * 60)
    print(f"  ✅ Yeni eklenen mekan : {added_places}")
    print(f"  📝 Eklenen yorum      : {added_reviews}")
    print(f"  ⏭️  Zaten mevcuttu     : {skipped_existing}")
    print(f"  🚫 Kalite filtresi    : {skipped_quality}")
    print(f"  ❌ Başarısız          : {failed}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="İstanbul restoranlarını Google Places API (New) ile içe aktar.")
    parser.add_argument("phase", choices=["discover", "ingest", "all"], help="Çalıştırılacak faz")
    parser.add_argument("--resume", action="store_true", help="Kaldığı yerden devam et")
    parser.add_argument("--limit", type=int, default=4000, help="ingest fazında aktarılacak maksimum mekan sayısı")
    args = parser.parse_args()

    settings = get_settings()
    api_key = settings.GOOGLE_PLACES_API_KEY
    if not api_key:
        print("HATA: .env dosyasında GOOGLE_PLACES_API_KEY bulunamadı!")
        sys.exit(1)

    if args.phase in ("discover", "all"):
        discover(api_key, resume=args.resume, target_count=args.limit)
    if args.phase in ("ingest", "all"):
        ingest(api_key, resume=args.resume, limit=args.limit)


if __name__ == "__main__":
    main()
