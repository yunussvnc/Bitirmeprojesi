"""
Google Maps'ten yeni mekan + yorum içe aktarma (SerpAPI).

Akış:
  1. engine=google_maps ile İstanbul'da kategori+ilçe sorguları yapar,
     mevcut DB'de olmayan (google_place_id ile dedupe), kaliteli
     (rating>=4.0 & yorum>=50, veya rating>=4.5 & yorum>=20) mekanları toplar.
  2. Her mekan için engine=google_maps_reviews ile yorumları çeker,
     öncelik sırası: (rating>=4 VE fotoğraflı) > (rating>=4) > (kalan),
     ilk 10'u alır.
  3. Place + Review + ReviewMedia (yorum fotoğrafları) satırlarını
     mevcut şema/konvansiyona uygun ekler (stub kullanıcı havuzu,
     google_place_id == vector_id — mevcut 1115 mekanla aynı format).

Kota bilinçli: --max-calls ile toplam SerpAPI çağrısı sınırlanır.
"""

import argparse
import json
import os
import random
import re
import sys
import time
from datetime import datetime, timedelta

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

BASE_URL = "https://serpapi.com/search"
PLACEHOLDER_EMAIL_DOMAIN = "reviews.placeholder"
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "").strip()

QUERIES = [
    ("kafe", "Kadıköy"), ("kafe", "Beşiktaş"), ("kafe", "Beyoğlu"), ("kafe", "Üsküdar"),
    ("kafe", "Şişli"), ("kafe", "Bakırköy"),
    ("restoran", "Kadıköy"), ("restoran", "Beşiktaş"), ("restoran", "Şişli"),
    ("restoran", "Beyoğlu"), ("restoran", "Sarıyer"),
    ("brunch", "Kadıköy"), ("brunch", "Beşiktaş"),
    ("kokteyl bar", "Beyoğlu"), ("kokteyl bar", "Kadıköy"),
    ("pastane", "Nişantaşı"), ("pastane", "Kadıköy"),
    ("steakhouse", "Şişli"), ("sushi restoranı", "Beşiktaş"),
    ("kitapçı kafe", "Kadıköy"), ("kahvaltı mekanı", "Üsküdar"),
    ("cocktail bar", "Karaköy"), ("meyhane", "Beyoğlu"),
    ("bar", "Kadıköy"), ("bar", "Beyoğlu"),
]

CATEGORY_MAP = {
    "kafe": "Kafe", "restoran": "Restoran", "brunch": "Restoran",
    "kokteyl bar": "Bar", "pastane": "Kafe", "steakhouse": "Restoran",
    "sushi restoranı": "Restoran", "kitapçı kafe": "Kafe",
    "kahvaltı mekanı": "Restoran", "cocktail bar": "Bar", "meyhane": "Restoran",
    "bar": "Bar",
}

_call_count = 0


def sapi_get(params: dict) -> dict:
    global _call_count
    params = dict(params)
    params["api_key"] = SERPAPI_KEY
    _call_count += 1
    r = requests.get(BASE_URL, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def parse_date(date_str: str) -> datetime:
    now = datetime.utcnow()
    if not date_str:
        return now
    s = date_str.lower().strip()
    if "dün" in s:
        return now - timedelta(days=1)
    match = re.search(r"(\d+)\s*(dakika|saat|gün|hafta|ay|yıl)", s)
    if not match:
        return now - timedelta(days=30)
    n = int(match.group(1))
    unit = match.group(2)
    unit_days = {"dakika": 0, "saat": 0, "gün": 1, "hafta": 7, "ay": 30, "yıl": 365}
    return now - timedelta(days=n * unit_days.get(unit, 30))


def get_category_from_types(types, default_category):
    type_map = {
        "cafe": "Kafe", "coffee shop": "Kafe", "restaurant": "Restoran",
        "bar": "Bar", "night club": "Gece Kulübü", "bakery": "Kafe",
        "breakfast restaurant": "Restoran", "steak house": "Restoran",
        "sushi restaurant": "Restoran", "book store": "Kafe",
    }
    if not types:
        return default_category
    for t in types if isinstance(types, list) else [types]:
        key = str(t).lower()
        if key in type_map:
            return type_map[key]
    return default_category


def get_best_photo(item: dict):
    if item.get("thumbnail"):
        return item["thumbnail"]
    images = item.get("images") or []
    if images:
        first = images[0]
        if isinstance(first, dict):
            return first.get("original") or first.get("thumbnail")
        if isinstance(first, str):
            return first
    return None


def discover_candidates(existing_ids: set, target: int, max_calls: int):
    candidates = []
    seen = set(existing_ids)
    qi = 0
    while len(candidates) < target and _call_count < max_calls and qi < len(QUERIES) * 3:
        cat, district = QUERIES[qi % len(QUERIES)]
        qi += 1
        q = f"{district} {cat}"
        try:
            data = sapi_get({
                "engine": "google_maps", "q": q, "type": "search",
                "hl": "tr", "gl": "tr", "ll": "@41.0082,28.9784,11z",
            })
        except Exception as e:
            print(f"  ⚠️  Keşif hatası ({q}): {e}")
            continue

        if "error" in data:
            print(f"  ⚠️  SerpAPI hatası ({q}): {data['error']}")
            if "credit" in str(data["error"]).lower() or "limit" in str(data["error"]).lower():
                break
            continue

        found_here = 0
        for item in data.get("local_results", []):
            data_id = item.get("data_id")
            if not data_id or data_id in seen:
                continue
            rating = item.get("rating") or 0
            reviews_cnt = item.get("reviews") or 0
            if not ((rating >= 4.0 and reviews_cnt >= 50) or (rating >= 4.5 and reviews_cnt >= 20)):
                continue
            seen.add(data_id)
            candidates.append((item, cat))
            found_here += 1
            if len(candidates) >= target:
                break
        print(f"  [{qi}] '{q}' → {found_here} yeni kaliteli mekan (toplam {len(candidates)}/{target}, çağrı={_call_count})")
        time.sleep(0.4)

    return candidates


def fetch_quality_reviews(data_id: str, target: int = 10, max_pages: int = 2, max_calls: int = 999):
    collected = []
    next_token = None
    page = 0
    while page < max_pages and _call_count < max_calls:
        params = {"engine": "google_maps_reviews", "data_id": data_id, "hl": "tr", "gl": "tr"}
        if next_token:
            params["next_page_token"] = next_token
        try:
            data = sapi_get(params)
        except Exception as e:
            print(f"    ⚠️  Review hatası: {e}")
            break
        if "error" in data:
            print(f"    ⚠️  SerpAPI review hatası: {data['error']}")
            break
        revs = data.get("reviews", [])
        collected.extend(revs)
        pagination = data.get("serpapi_pagination", {})
        next_token = pagination.get("next_page_token")
        page += 1
        if not next_token or len(collected) >= target * 2:
            break
        time.sleep(0.3)

    def has_img(r):
        return bool(r.get("images"))

    tier1 = [r for r in collected if (r.get("rating") or 0) >= 4 and has_img(r)]
    tier2 = [r for r in collected if (r.get("rating") or 0) >= 4 and not has_img(r)]
    tier3 = [r for r in collected if (r.get("rating") or 0) < 4]

    ordered = []
    seen_ids = set()
    for r in tier1 + tier2 + tier3:
        rid = r.get("review_id") or id(r)
        if rid in seen_ids:
            continue
        seen_ids.add(rid)
        ordered.append(r)
        if len(ordered) >= target:
            break

    return ordered


def run(target: int, max_calls: int, dry_run: bool):
    if not SERPAPI_KEY:
        print("❌ SERPAPI_KEY bulunamadı (.env)")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing_ids = {
            r[0] for r in db.query(models.Place.google_place_id).filter(
                models.Place.google_place_id.isnot(None)
            ).all()
        }
        stub_user_ids = [
            r[0] for r in db.query(models.User.id).filter(
                models.User.email.like(f"%@{PLACEHOLDER_EMAIL_DOMAIN}")
            ).all()
        ]
        print(f"Mevcut mekan (google_place_id'li): {len(existing_ids)}")
        print(f"Stub kullanıcı havuzu: {len(stub_user_ids)}")
        if not stub_user_ids:
            print("❌ Stub kullanıcı bulunamadı, yorumlar atanamaz.")
            sys.exit(1)
    finally:
        db.close()

    print(f"\n=== Keşif başlıyor (hedef: {target} yeni mekan, kota sınırı: {max_calls} çağrı) ===")
    candidates = discover_candidates(existing_ids, target, max_calls)
    print(f"\n✅ {len(candidates)} kaliteli yeni mekan bulundu (şimdiye kadar {_call_count} SerpAPI çağrısı).\n")

    if dry_run:
        for item, cat in candidates[:10]:
            print(f"  - {item.get('title')} | {item.get('rating')}⭐ ({item.get('reviews')} yorum) | {item.get('address')}")
        print("\n(dry-run: DB'ye yazılmadı)")
        return

    added_places = 0
    added_reviews = 0
    added_media = 0

    for idx, (item, cat) in enumerate(candidates):
        if _call_count >= max_calls:
            print(f"  ⏹️  Kota sınırına yaklaşıldı ({_call_count}/{max_calls}), duruyor.")
            break

        data_id = item["data_id"]
        name = item.get("title", "")
        print(f"[{idx+1}/{len(candidates)}] {name}")

        raw_reviews = fetch_quality_reviews(data_id, target=10, max_pages=2, max_calls=max_calls)

        db = SessionLocal()
        try:
            price = item.get("price", "")
            price_range = min(max(len(price), 1), 4) if price else 2
            gallery = item.get("images") or []
            gallery_urls = json.dumps(gallery[:5], ensure_ascii=False) if gallery else None

            place = models.Place(
                name=name,
                address=item.get("address", ""),
                city="İstanbul",
                description=f"{name} - {item.get('address', '')}",
                vector_id=data_id,
                google_place_id=data_id,
                price_range=price_range,
                category=get_category_from_types(item.get("type"), CATEGORY_MAP.get(cat, "Diğer")),
                latitude=(item.get("gps_coordinates") or {}).get("latitude"),
                longitude=(item.get("gps_coordinates") or {}).get("longitude"),
                average_rating=float(item.get("rating") or 0.0),
                user_ratings_total=int(item.get("reviews") or 0),
                photo_url=get_best_photo(item),
                gallery_urls=gallery_urls,
                phone_number=item.get("phone"),
                is_open=True,
            )
            db.add(place)
            db.flush()  # place.id lazım

            available_uids = list(stub_user_ids)
            random.shuffle(available_uids)
            used_uids = set()

            for rev in raw_reviews:
                if not available_uids:
                    break
                snippet = (rev.get("snippet") or "").strip()
                rating = rev.get("rating")
                if not snippet or rating is None:
                    continue
                uid = None
                for cand in available_uids:
                    if cand not in used_uids:
                        uid = cand
                        break
                if uid is None:
                    break
                used_uids.add(uid)

                review_date = parse_date(rev.get("date", ""))
                review = models.Review(
                    user_id=uid,
                    place_id=place.id,
                    comment_text=snippet,
                    rating=int(rating),
                    created_at=review_date,
                    updated_at=review_date,
                    is_verified=False,
                    helpful_count=random.randint(0, 15),
                )
                db.add(review)
                db.flush()

                for order_i, img_url in enumerate(rev.get("images") or []):
                    db.add(models.ReviewMedia(
                        review_id=review.id,
                        media_type="photo",
                        media_url=img_url,
                        order_index=order_i,
                    ))
                    added_media += 1

                added_reviews += 1

            db.commit()
            added_places += 1
            print(f"    ✅ mekan eklendi (id={place.id}), {len([r for r in raw_reviews])} yorum işlendi")

        except Exception as e:
            db.rollback()
            print(f"    ❌ DB hatası: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()

        time.sleep(0.3)

    print("\n" + "=" * 60)
    print(f"  ✅ Tamamlandı!")
    print(f"  📍 Eklenen mekan   : {added_places}")
    print(f"  📝 Eklenen yorum   : {added_reviews}")
    print(f"  🖼️  Eklenen foto    : {added_media}")
    print(f"  📞 Toplam SerpAPI çağrısı: {_call_count}")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Maps'ten yeni mekan + kaliteli yorum içe aktar")
    parser.add_argument("--target", type=int, default=80, help="Hedef yeni mekan sayısı")
    parser.add_argument("--max-calls", type=int, default=230, help="Toplam SerpAPI çağrı sınırı (kota koruması)")
    parser.add_argument("--dry-run", action="store_true", help="Sadece keşfet, DB'ye yazma")
    args = parser.parse_args()
    run(target=args.target, max_calls=args.max_calls, dry_run=args.dry_run)
