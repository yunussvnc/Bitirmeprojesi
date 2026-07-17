#!/usr/bin/env python3
"""
Google Places API ile Yorum İçe Aktarma
=========================================
Google Places API kullanarak tüm mekanlar için max 5 yorum çeker.
SerpAPI'den farklı olarak limit yoktur (~11.700 ücretsiz istek/ay).

Kullanım:
    python scripts/import_google_reviews_v2.py [--resume] [--skip-with-reviews N]

- --resume          : Kaldığı yerden devam et
- --skip-with-reviews N : Bu kadar ya da daha fazla yorumu olan mekânları atla (default: 5)
"""

import sys, os, time, hashlib, json, re, random, argparse
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# ─── Konfig ──────────────────────────────────────────────────────────────────
GOOGLE_API_KEY       = os.getenv("GOOGLE_MAPS_API_KEY", "")
PLACEHOLDER_DOMAIN   = "reviews.placeholder"
STUB_PASSWORD_HASH   = "!SERPAPI_STUB_CANNOT_LOGIN_DO_NOT_USE"
REQUEST_DELAY        = 0.15      # saniye (Google API rate limit: ~50 req/s)
PROGRESS_FILE        = "scripts/import_progress_v2.json"
PLACES_API_DETAILS   = "https://maps.googleapis.com/maps/api/place/details/json"
PLACES_API_TEXTSEARCH= "https://maps.googleapis.com/maps/api/place/textsearch/json"
# ─────────────────────────────────────────────────────────────────────────────


def strip_surname(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name.strip()
    return " ".join(parts[:-1])


def make_stub_email(reviewer_name: str, reviewer_photo: str) -> str:
    raw = f"{reviewer_name}|{reviewer_photo}"
    uid = hashlib.md5(raw.encode()).hexdigest()[:12]
    return f"serpapi_{uid}@{PLACEHOLDER_DOMAIN}"


def parse_relative_time(time_str: str) -> datetime:
    now = datetime.utcnow()
    if not time_str:
        return now
    s = time_str.lower()
    tr_units = {
        "dakika": timedelta(minutes=1), "saat": timedelta(hours=1),
        "gün": timedelta(days=1), "hafta": timedelta(weeks=1),
        "ay": timedelta(days=30), "yıl": timedelta(days=365),
        "minute": timedelta(minutes=1), "hour": timedelta(hours=1),
        "day": timedelta(days=1), "week": timedelta(weeks=1),
        "month": timedelta(days=30), "year": timedelta(days=365),
    }
    for unit, delta in tr_units.items():
        m = re.search(rf"(\d+)\s*{unit}", s)
        if m:
            return now - delta * int(m.group(1))
    if "yıl" in s or "year" in s:
        return now - timedelta(days=365)
    if "ay" in s or "month" in s:
        return now - timedelta(days=90)
    if "hafta" in s or "week" in s:
        return now - timedelta(weeks=2)
    return now - timedelta(days=7)


def get_or_create_stub_user(db: Session, name: str, photo_url: str) -> models.User | None:
    if not name:
        return None
    display = strip_surname(name)
    email   = make_stub_email(name, photo_url)

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return existing

    parts = display.strip().split()
    first = parts[0] if parts else display
    last  = parts[1] if len(parts) > 1 else None

    user = models.User(
        email=email,
        username=None,
        first_name=first,
        last_name=last,
        password_hash=STUB_PASSWORD_HASH,
        avatar_url=photo_url or None,
        bio=None,
        role="user",
        is_active=False,
        is_email_verified=False,
        birth_date=None,
    )
    db.add(user)
    try:
        db.flush()
    except Exception as e:
        db.rollback()
        raise e
    return user


def fetch_place_id(place_name: str, place_address: str) -> str | None:
    """
    Google TextSearch ile mekan için ChIJ... formatında place_id al.
    """
    query = f"{place_name} {place_address or 'Istanbul'}".strip()
    try:
        r = requests.get(PLACES_API_TEXTSEARCH, params={
            "query": query,
            "key": GOOGLE_API_KEY,
            "language": "tr",
        }, timeout=10)
        data = r.json()
        if data.get("status") == "OK" and data.get("results"):
            return data["results"][0]["place_id"]
    except Exception:
        pass
    return None


def fetch_reviews(place_id: str) -> list:
    """
    Google Place Details API ile max 5 yorum al.
    """
    try:
        r = requests.get(PLACES_API_DETAILS, params={
            "place_id": place_id,
            "fields": "name,reviews",
            "language": "tr",
            "reviews_sort": "newest",
            "key": GOOGLE_API_KEY,
        }, timeout=10)
        data = r.json()
        if data.get("status") == "OK":
            return data.get("result", {}).get("reviews", [])
    except Exception:
        pass
    return []


def insert_reviews(db: Session, place: models.Place, raw_reviews: list) -> int:
    inserted = 0
    for rev in raw_reviews:
        reviewer_name  = rev.get("author_name", "")
        reviewer_photo = rev.get("profile_photo_url", "")
        rating         = rev.get("rating")
        text           = rev.get("text", "").strip()
        relative_time  = rev.get("relative_time_description", "")

        if not reviewer_name or not text or rating is None:
            continue

        try:
            stub = get_or_create_stub_user(db, reviewer_name, reviewer_photo)
        except Exception as e:
            print(f"      ⚠️  Kullanıcı oluşturulamadı '{reviewer_name}': {e}")
            continue

        if stub is None:
            continue

        # Zaten bu kullanıcı bu mekana yorum yazmış mı?
        existing = db.query(models.Review).filter(
            models.Review.user_id  == stub.id,
            models.Review.place_id == place.id,
        ).first()
        if existing:
            continue

        review_date = parse_relative_time(relative_time)

        review = models.Review(
            user_id        = stub.id,
            place_id       = place.id,
            comment_text   = text,
            rating         = int(rating),
            created_at     = review_date,
            updated_at     = review_date,
            is_verified    = False,
            helpful_count  = random.randint(0, 15),
        )
        db.add(review)
        inserted += 1
    return inserted


def load_progress() -> set:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return set(json.load(f).get("done", []))
    return set()


def save_progress(done: set):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"done": list(done), "ts": datetime.utcnow().isoformat()}, f)


def run(skip_with_reviews: int, resume: bool):
    db = SessionLocal()

    print("\n" + "="*60)
    print(" Google Places API — Yorum İçe Aktarma v2")
    print("="*60)

    done_ids = load_progress() if resume else set()
    print(f"  Daha önce işlenmiş: {len(done_ids)} mekan")

    places = (
        db.query(models.Place)
        .filter(models.Place.google_place_id.isnot(None))
        .order_by(models.Place.id)
        .all()
    )
    print(f"  Toplam mekan: {len(places)}")
    print(f"  {skip_with_reviews}+ yorumu olanlar atlanacak")
    print()

    total_reviews  = 0
    total_users    = 0
    skipped        = 0
    failed         = 0

    for idx, place in enumerate(places):
        pid = str(place.id)
        if pid in done_ids:
            continue

        # Zaten yeterli yorumu var mı?
        existing_count = db.query(models.Review).filter(
            models.Review.place_id == place.id
        ).count()
        if existing_count >= skip_with_reviews:
            done_ids.add(pid)
            skipped += 1
            continue

        print(f"[{idx+1}/{len(places)}] {place.name} (id={place.id}, mevcut={existing_count} yorum)")

        # 1. Gerçek Google place_id al (ChIJ formatı)
        google_pid = fetch_place_id(place.name, place.address)
        time.sleep(REQUEST_DELAY)

        if not google_pid:
            print(f"    ⚠️  place_id bulunamadı, atlıyorum.")
            done_ids.add(pid)
            failed += 1
            continue

        # 2. Yorumları al
        raw_reviews = fetch_reviews(google_pid)
        time.sleep(REQUEST_DELAY)

        if not raw_reviews:
            print(f"    ⚠️  Yorum bulunamadı.")
            done_ids.add(pid)
            continue

        # 3. Veritabanına ekle
        try:
            inserted = insert_reviews(db, place, raw_reviews)
            db.commit()
            total_reviews += inserted

            # Yeni kullanıcı sayısı
            new_users = db.query(models.User).filter(
                models.User.email.like(f"%@{PLACEHOLDER_DOMAIN}")
            ).count()

            print(f"    ✅ +{inserted} yorum | Toplam reviews: {total_reviews} | API yorumları: {len(raw_reviews)}")
        except Exception as e:
            db.rollback()
            print(f"    ❌ DB hatası: {e}")
            failed += 1

        done_ids.add(pid)
        if (idx + 1) % 20 == 0:
            save_progress(done_ids)
            stub_count = db.query(models.User).filter(
                models.User.email.like(f"%@{PLACEHOLDER_DOMAIN}")
            ).count()
            print(f"\n  📊 İlerleme: {idx+1}/{len(places)} | Reviews: {total_reviews} | Stub kullanıcı: {stub_count}\n")

    save_progress(done_ids)

    stub_total = db.query(models.User).filter(
        models.User.email.like(f"%@{PLACEHOLDER_DOMAIN}")
    ).count()
    total_in_db = db.query(models.Review).count()

    db.close()

    print()
    print("="*60)
    print(f"  ✅ Tamamlandı!")
    print(f"  📝 Bu çalışmada eklenen : {total_reviews}")
    print(f"  📝 DB'deki toplam yorum : {total_in_db}")
    print(f"  👤 Toplam stub kullanıcı: {stub_total}")
    print(f"  ⏭️  Atlanan (zaten var)  : {skipped}")
    print(f"  ❌ Başarısız             : {failed}")
    print()
    print("  Temizleme komutları:")
    print(f"  DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@{PLACEHOLDER_DOMAIN}');")
    print(f"  DELETE FROM users WHERE email LIKE '%@{PLACEHOLDER_DOMAIN}';")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-with-reviews", type=int, default=5,
                        help="Bu kadar veya daha fazla yorumu olan mekânları atla (default: 5)")
    parser.add_argument("--resume", action="store_true", help="Kaldığı yerden devam et")
    args = parser.parse_args()
    run(skip_with_reviews=args.skip_with_reviews, resume=args.resume)
