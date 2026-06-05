"""
Google Maps Yorum İçe Aktarma - V3
=====================================
SerpAPI ile Google Maps yorumlarını çeker ve mevcut stub kullanıcılara atar.

Değişiklikler (v3):
 - 4 API key round-robin kullanımı
 - Mekan başı yorum sayısı 10
 - Yeni stub kullanıcı oluşturmak yerine mevcut 2811 stub kullanıcılardan rastgele atama
 - is_verified=False zorunlu (onaylı rozeti kaldırıldı)
 - Duplicate (aynı yorum metni farklı user) kontrolü
"""

import sys
import os
import time
import hashlib
import argparse
import json
import re
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# ─── Konfig ───────────────────────────────────────────────────────────────────
API_KEYS = [
    # "YOUR_SERPAPI_KEY_1",
    # "YOUR_SERPAPI_KEY_2",
]
PLACEHOLDER_EMAIL_DOMAIN = "reviews.placeholder"
REQUEST_DELAY = 1.0          # saniye — rate limit
MAX_REVIEWS_PER_PLACE = 10   # hedef yorum sayısı (10'a düşürüldü)
PROGRESS_FILE = "scripts/import_progress_v3.json"
# ─────────────────────────────────────────────────────────────────────────────

# Global key index
_key_index = 0

def next_api_key() -> str:
    """Round-robin ile sıradaki API key'i döndür."""
    global _key_index
    key = API_KEYS[_key_index % len(API_KEYS)]
    _key_index += 1
    return key


def parse_date(date_str: str) -> datetime:
    """'bir yıl önce', '3 ay önce', '2 hafta önce' → datetime"""
    now = datetime.utcnow()
    if not date_str:
        return now

    s = date_str.lower().strip()

    if "dün" in s:
        return now - timedelta(days=1)

    match = re.search(r"(\d+)\s*(dakika|saat|gün|hafta|ay|yıl|minute|hour|day|week|month|year)", s)
    if not match:
        if "yıl" in s or "year" in s:
            return now - timedelta(days=365)
        if "ay" in s or "month" in s:
            return now - timedelta(days=90)
        if "hafta" in s or "week" in s:
            return now - timedelta(days=14)
        if "gün" in s or "day" in s:
            return now - timedelta(days=3)
        return now - timedelta(days=30)

    n = int(match.group(1))
    unit_tr = match.group(2)
    unit_map = {
        "dakika": "minute", "saat": "hour", "gün": "day",
        "hafta": "week", "ay": "month", "yıl": "year",
    }
    unit = unit_map.get(unit_tr, unit_tr)

    if unit == "minute":
        return now - timedelta(minutes=n)
    elif unit == "hour":
        return now - timedelta(hours=n)
    elif unit == "day":
        return now - timedelta(days=n)
    elif unit == "week":
        return now - timedelta(weeks=n)
    elif unit == "month":
        return now - timedelta(days=n * 30)
    elif unit == "year":
        return now - timedelta(days=n * 365)
    return now - timedelta(days=30)


def fetch_reviews_page(place_id: str, next_page_token: str = None, api_key: str = None) -> dict:
    """SerpAPI'den bir sayfa yorum çek."""
    params = {
        "engine": "google_maps_reviews",
        "data_id": place_id,
        "api_key": api_key or next_api_key(),
        "hl": "tr",
        "sort_by": "2",  # 2 = newest
    }
    if next_page_token:
        params["next_page_token"] = next_page_token

    resp = requests.get("https://serpapi.com/search", params=params, timeout=30)
    return resp.json()


def fetch_reviews_for_place(google_place_id: str, target_count: int = 10) -> list:
    """Bir mekan için target_count kadar yorum çek."""
    all_reviews = []
    next_token = None
    page = 0
    api_key = next_api_key()

    while len(all_reviews) < target_count and page < 2:  # max 2 sayfa
        try:
            data = fetch_reviews_page(google_place_id, next_token, api_key=api_key)
        except Exception as e:
            print(f"    ⚠️  API hatası: {e}")
            break

        if "error" in data:
            err = data['error']
            print(f"    ⚠️  SerpAPI hatası: {err}")
            if "credit" in err.lower() or "limit" in err.lower():
                # Bir sonraki key'e geç
                api_key = next_api_key()
                print(f"    🔄 Yeni API key deneniyor...")
                time.sleep(0.5)
                try:
                    data = fetch_reviews_page(google_place_id, next_token, api_key=api_key)
                    if "error" in data:
                        break
                except Exception:
                    break
            else:
                break

        reviews = data.get("reviews", [])
        if not reviews:
            break
        all_reviews.extend(reviews)
        print(f"    → Sayfa {page+1}: {len(reviews)} yorum ({len(all_reviews)} toplam)")

        pagination = data.get("serpapi_pagination", {})
        next_token = pagination.get("next_page_token")
        if not next_token:
            break

        page += 1
        if page < 2:
            time.sleep(REQUEST_DELAY)

    return all_reviews[:target_count]


def load_progress() -> set:
    """İşlenmiş place_id'leri yükle."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            data = json.load(f)
            return set(data.get("done_place_ids", []))
    return set()


def save_progress(done_ids: set):
    """İlerlemeyi kaydet."""
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"done_place_ids": list(done_ids), "last_updated": datetime.utcnow().isoformat()}, f)


def check_serpapi_credits(api_key: str = None) -> tuple:
    """Her API key için kalan kredi sayısını döndür."""
    results = {}
    check_keys = [api_key] if api_key else API_KEYS
    for key in check_keys:
        try:
            r = requests.get("https://serpapi.com/account", params={"api_key": key}, timeout=10)
            data = r.json()
            results[key[:8] + "..."] = data.get("total_searches_left", 0)
        except Exception:
            results[key[:8] + "..."] = -1
    return results


def insert_reviews_for_place(
    place_id: int,
    place_name: str,
    raw_reviews: list,
    stub_user_ids: list,
    existing_user_ids_for_place: set,
    existing_snippets_for_place: set,
) -> list:
    """
    Hazır Review nesneleri döndür (DB bağlantısı dışında işlem yap).
    - Mevcut listeden rastgele kullanıcı ata
    - is_verified=False zorla
    - Duplicate kontrolü yap
    Döndürür: list of dict (review verileri)
    """
    results = []
    available_ids = [uid for uid in stub_user_ids if uid not in existing_user_ids_for_place]
    random.shuffle(available_ids)

    for rev in raw_reviews:
        if not available_ids:
            print(f"      ⚠️  Kullanılabilir stub kullanıcı kalmadı")
            break

        user_data = rev.get("user", {})
        reviewer_name = user_data.get("name", "")
        if not reviewer_name:
            continue

        rating = rev.get("rating")
        if rating is None:
            continue
        rating = int(rating)

        snippet = rev.get("snippet", "").strip()
        if not snippet:
            continue

        if snippet in existing_snippets_for_place:
            continue

        date_str = rev.get("date", "")
        review_date = parse_date(date_str)

        user_id = available_ids.pop()
        existing_user_ids_for_place.add(user_id)
        existing_snippets_for_place.add(snippet)

        results.append({
            "user_id": user_id,
            "place_id": place_id,
            "comment_text": snippet,
            "rating": rating,
            "created_at": review_date,
            "updated_at": review_date,
            "is_verified": False,
            "helpful_count": random.randint(0, 15),
        })

    return results


def update_place_rating(db: Session, place_id: int):
    """Mekanın average_rating'ini yeniden hesapla."""
    # pyrefly: ignore [missing-import]
    from sqlalchemy import func
    result = db.query(func.avg(models.Review.rating)).filter(
        models.Review.place_id == place_id
    ).scalar()
    if result is not None:
        place = db.query(models.Place).filter(models.Place.id == place_id).first()
        if place:
            place.average_rating = round(float(result), 1)


def run(limit: int, reviews_per_place: int, resume: bool):
    print("\n" + "="*60)
    print(" Google Maps Yorum İçe Aktarma - V3")
    print("="*60)

    # Kredi kontrol
    print("  API Key kredileri kontrol ediliyor...")
    credits = check_serpapi_credits()
    total_credits = 0
    for k, v in credits.items():
        print(f"    {k}: {v} arama hakkı")
        if isinstance(v, int) and v > 0:
            total_credits += v
    print(f"  Toplam kullanılabilir kredi: {total_credits}")
    print()

    # ── Tek seferlik DB yüklemeleri ──────────────────────────────────────────
    db = SessionLocal()
    try:
        # Tüm stub kullanıcı ID'lerini hafızaya yükle (sadece ID)
        stub_user_rows = db.query(models.User.id).filter(
            models.User.email.like(f"%@{PLACEHOLDER_EMAIL_DOMAIN}")
        ).all()
        stub_user_ids = [r.id for r in stub_user_rows]
        print(f"  Mevcut stub kullanıcı: {len(stub_user_ids)}")

        if not stub_user_ids:
            print("  ❌ Stub kullanıcı bulunamadı!")
            return

        # İlerleme yükle
        done_ids = load_progress() if resume else set()
        print(f"  Daha önce işlenmiş: {len(done_ids)} mekan")

        # Mekânları çek (google_place_id olan)
        all_places = (
            db.query(models.Place.id, models.Place.name, models.Place.google_place_id)
            .filter(
                models.Place.google_place_id.isnot(None),
                models.Place.google_place_id != "",
            )
            .order_by(models.Place.id)
            .all()
        )

        # Her mekanın mevcut yorum sayısını tek sorguda al
        # pyrefly: ignore [missing-import]
        from sqlalchemy import func
        review_counts = dict(
            db.query(models.Review.place_id, func.count(models.Review.id))
            .group_by(models.Review.place_id)
            .all()
        )
    finally:
        db.close()

    # İşlenecekleri filtrele
    places_to_process = []
    for p in all_places:
        if str(p.id) in done_ids:
            continue
        rev_count = review_counts.get(p.id, 0)
        if rev_count >= reviews_per_place:
            done_ids.add(str(p.id))
            continue
        places_to_process.append((p.id, p.name, p.google_place_id, rev_count))
        if limit != -1 and len(places_to_process) >= limit:
            break

    print(f"  Toplam mekan: {len(all_places)}, işlenecek: {len(places_to_process)}")
    print()

    total_reviews = 0
    failed = 0

    for idx, (place_id, place_name, google_place_id, existing_count) in enumerate(places_to_process):
        needed = reviews_per_place - existing_count
        print(f"[{idx+1}/{len(places_to_process)}] {place_name} (id={place_id}, mevcut={existing_count}, lazım={needed})")

        # 1. SerpAPI'den yorumları çek (ağ işlemi — DB bağlantısı açık değil)
        try:
            raw_reviews = fetch_reviews_for_place(google_place_id, target_count=needed)
        except Exception as e:
            print(f"    ❌ Çekme hatası: {e}")
            failed += 1
            time.sleep(2)
            continue

        if not raw_reviews:
            print(f"    ⚠️  Yorum bulunamadı, atlıyorum.")
            done_ids.add(str(place_id))
            save_progress(done_ids)
            time.sleep(REQUEST_DELAY)
            continue

        # 2. Hafızada review nesnelerini hazırla (yeni DB bağlantısı aç)
        db = SessionLocal()
        try:
            # Bu mekanın mevcut snippet ve user_id'lerini çek
            existing_snippets = set(
                r[0] for r in db.query(models.Review.comment_text)
                .filter(models.Review.place_id == place_id).all()
                if r[0]
            )
            existing_uids = set(
                r[0] for r in db.query(models.Review.user_id)
                .filter(models.Review.place_id == place_id).all()
            )

            # Review verilerini hafızada hazırla
            review_data_list = insert_reviews_for_place(
                place_id=place_id,
                place_name=place_name,
                raw_reviews=raw_reviews,
                stub_user_ids=stub_user_ids,
                existing_user_ids_for_place=existing_uids,
                existing_snippets_for_place=existing_snippets,
            )

            # DB'ye toplu yaz
            for rd in review_data_list:
                db.add(models.Review(**rd))

            # Average rating güncelle
            update_place_rating(db, place_id)
            db.commit()

            inserted = len(review_data_list)
            total_reviews += inserted
            total_in_db = db.query(func.count(models.Review.id)).scalar()
            print(f"    ✅ +{inserted} yorum eklendi | DB toplam: {total_in_db}")

        except Exception as e:
            db.rollback()
            print(f"    ❌ DB hatası: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
            time.sleep(1)
            continue
        finally:
            db.close()

        done_ids.add(str(place_id))
        if idx % 10 == 0:
            save_progress(done_ids)

        time.sleep(REQUEST_DELAY)

    save_progress(done_ids)

    # Final istatistik
    db = SessionLocal()
    try:
        # pyrefly: ignore [missing-import]
        from sqlalchemy import func as f2
        total_in_db = db.query(f2.count(models.Review.id)).scalar()
    finally:
        db.close()

    print()
    print("="*60)
    print(f"  ✅ Tamamlandı!")
    print(f"  📝 Bu çalışmada eklenen : {total_reviews}")
    print(f"  📝 DB'deki toplam yorum : {total_in_db}")
    print(f"  ❌ Başarısız mekan      : {failed}")
    print()
    print("  Devam etmek için:")
    print(f"  python scripts/import_google_reviews_v3.py --resume")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Maps yorumlarını içe aktar (v3 - 4 key, 10 yorum, mevcut kullanıcılar)")
    parser.add_argument("--limit", type=int, default=-1, help="İşlenecek maks mekan sayısı (-1 = hepsi)")
    parser.add_argument("--reviews-per-place", type=int, default=MAX_REVIEWS_PER_PLACE, help=f"Mekan başı yorum hedefi (default: {MAX_REVIEWS_PER_PLACE})")
    parser.add_argument("--resume", action="store_true", help="Kaldığı yerden devam et")
    args = parser.parse_args()

    run(
        limit=args.limit,
        reviews_per_place=args.reviews_per_place,
        resume=args.resume,
    )
