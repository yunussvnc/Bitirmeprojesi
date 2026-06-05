#!/usr/bin/env python3
"""
Google Maps Yorum İçe Aktarma Scripti
======================================
SerpAPI ile Google Maps yorumlarını veritabanına çeker.

Kullanım:
    python scripts/import_google_reviews.py [--limit N] [--reviews-per-place N] [--resume]

Özellikler:
 - Her mekan için gerçek Google yorumlarını çeker
 - Reviewer isimlerinden soyad gizlenir (son kelime kaldırılır)
 - Stub kullanıcılar oluşturulur (email=...@reviews.placeholder, username=None)
 - Kaldığı yerden devam edebilir (--resume)
 - Mevcut stub kullanıcıları temizlemek için: DELETE FROM users WHERE email LIKE '%@reviews.placeholder'
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

# ─── Konfig ──────────────────────────────────────────────────────────────────
SERPAPI_KEY = "99b7cb1c1b82cba1244fda1aaf9fbc6e6615c3aac19dfb612a010f5f3224fc54"  # default, --api-key ile geçersiz kılınır
PLACEHOLDER_EMAIL_DOMAIN = "reviews.placeholder"
REQUEST_DELAY = 1.2          # saniye — rate limit
MAX_REVIEWS_PER_PLACE = 20   # hedef yorum sayısı
PROGRESS_FILE = "scripts/import_progress.json"
# ─────────────────────────────────────────────────────────────────────────────


def strip_surname(full_name: str) -> str:
    """
    'Ahmet Yılmaz Kaya' → 'Ahmet Yılmaz'
    'Fatih Altindas'   → 'Fatih'          (tek soyad → sadece ad)
    'Rumi Zade'        → 'Rumi'
    'Fernweh'          → 'Fernweh'         (tek kelime → olduğu gibi bırak)
    """
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name.strip()
    # Son kelimeyi at (soyad)
    return " ".join(parts[:-1])


def make_stub_email(reviewer_name: str, reviewer_thumbnail: str) -> str:
    """Reviewer için tekil e-posta adresi üret."""
    raw = f"{reviewer_name}|{reviewer_thumbnail}"
    uid = hashlib.md5(raw.encode()).hexdigest()[:12]
    return f"serpapi_{uid}@{PLACEHOLDER_EMAIL_DOMAIN}"


def parse_date(date_str: str) -> datetime:
    """
    'bir yıl önce', '3 ay önce', '2 hafta önce' → datetime
    """
    now = datetime.utcnow()
    if not date_str:
        return now

    s = date_str.lower().strip()

    # Türkçe
    tr_map = {
        "dakika": "minute", "saat": "hour", "gün": "day", "hafta": "week",
        "ay": "month", "yıl": "year",
        "dün": None,
    }

    if "dün" in s:
        return now - timedelta(days=1)

    match = re.search(r"(\d+)\s*(dakika|saat|gün|hafta|ay|yıl|minute|hour|day|week|month|year)", s)
    if not match:
        # "bir yıl önce", "birkaç ay önce" tarzı
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
    unit = tr_map.get(unit_tr, unit_tr)

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
    return now



# Giriş yapılamayan, geçersiz bir bcrypt placeholder hash
# "!" prefix'i unix shadow password'larda "locked" anlamına gelir — hiçbir şifreyle eşleşmez
STUB_PASSWORD_HASH = "!SERPAPI_STUB_CANNOT_LOGIN_DO_NOT_USE"


def get_or_create_stub_user(db: Session, reviewer_name: str, reviewer_thumbnail: str) -> models.User:
    """
    Reviewer için stub kullanıcı getir/oluştur.
    username=None, email=serpapi_xxx@reviews.placeholder
    Giriş yapılamaz: password_hash geçersiz bir sentinel değer içerir.
    """
    display_name = strip_surname(reviewer_name)
    email = make_stub_email(reviewer_name, reviewer_thumbnail)

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return existing

    # İsmi ad/soyad olarak ayır
    name_parts = display_name.strip().split()
    first_name = name_parts[0] if name_parts else display_name
    last_name = name_parts[1] if len(name_parts) > 1 else None

    user = models.User(
        email=email,
        username=None,                    # username null → profil aramasında çıkmaz
        first_name=first_name,
        last_name=last_name,
        password_hash=STUB_PASSWORD_HASH, # geçersiz hash → giriş yapılamaz
        avatar_url=reviewer_thumbnail if reviewer_thumbnail else None,
        bio=None,
        role="user",
        is_active=False,                  # pasif hesap
        is_email_verified=False,
        birth_date=None,
    )
    db.add(user)
    try:
        db.flush()  # id al, commit etme
    except Exception as e:
        db.rollback()
        raise e
    return user


def fetch_reviews_page(place_id: str, next_page_token: str = None, api_key: str = None) -> dict:
    """SerpAPI'den bir sayfa yorum çek."""
    params = {
        "engine": "google_maps_reviews",
        "data_id": place_id,
        "api_key": api_key or SERPAPI_KEY,
        "hl": "tr",
        "sort_by": "2",  # 2 = newest
    }
    if next_page_token:
        params["next_page_token"] = next_page_token

    resp = requests.get("https://serpapi.com/search", params=params, timeout=30)
    return resp.json()


def fetch_reviews_for_place(google_place_id: str, target_count: int = 20, api_key: str = None) -> list:
    """
    Bir mekan için target_count kadar yorum çek.
    Her sayfa ~8-10 yorum döndürür, birden fazla sayfa gerekebilir.
    """
    all_reviews = []
    next_token = None
    page = 0

    while len(all_reviews) < target_count and page < 3:  # max 3 sayfa = ~24 yorum
        try:
            data = fetch_reviews_page(google_place_id, next_token, api_key=api_key)
        except Exception as e:
            print(f"    ⚠️  API hatası: {e}")
            break

        if "error" in data:
            print(f"    ⚠️  SerpAPI hatası: {data['error']}")
            break

        reviews = data.get("reviews", [])
        all_reviews.extend(reviews)
        print(f"    → Sayfa {page+1}: {len(reviews)} yorum ({len(all_reviews)} toplam)")

        # Pagination
        pagination = data.get("serpapi_pagination", {})
        next_token = pagination.get("next_page_token")
        if not next_token:
            break

        page += 1
        if page < 2:  # 2. sayfadan sonra biraz bekle
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


def insert_reviews_for_place(db: Session, place: models.Place, raw_reviews: list) -> int:
    """Yorumları veritabanına ekle. Zaten var olanları atla."""
    inserted = 0
    for rev in raw_reviews:
        user_data = rev.get("user", {})
        reviewer_name = user_data.get("name", "")
        reviewer_thumb = user_data.get("thumbnail", "")

        if not reviewer_name:
            continue

        # Rating
        rating = rev.get("rating")
        if rating is None:
            continue
        rating = int(rating)

        # Yorum metni
        snippet = rev.get("snippet", "").strip()
        if not snippet:
            continue

        # Tarih
        date_str = rev.get("date", "")
        review_date = parse_date(date_str)

        # Stub kullanıcı
        try:
            stub_user = get_or_create_stub_user(db, reviewer_name, reviewer_thumb)
        except Exception as e:
            print(f"      ⚠️  Kullanıcı oluşturulamadı '{reviewer_name}': {e}")
            continue

        # Zaten var mı kontrol et (aynı user + place kombinasyonu)
        existing_rev = db.query(models.Review).filter(
            models.Review.user_id == stub_user.id,
            models.Review.place_id == place.id,
        ).first()
        if existing_rev:
            continue

        # Yorum oluştur
        review = models.Review(
            user_id=stub_user.id,
            place_id=place.id,
            comment_text=snippet,
            rating=rating,
            created_at=review_date,
            updated_at=review_date,
            is_verified=False,
            helpful_count=random.randint(0, 12),  # gerçekçi görünüm
        )
        db.add(review)
        inserted += 1

    return inserted


def check_serpapi_credits(api_key: str = None) -> int:
    """Kalan SerpAPI kredit sayısını döndür."""
    try:
        r = requests.get("https://serpapi.com/account", params={"api_key": api_key or SERPAPI_KEY}, timeout=10)
        data = r.json()
        return data.get("total_searches_left", 0)
    except:
        return -1


def run(limit: int, reviews_per_place: int, resume: bool, api_key: str = None):
    active_key = api_key or SERPAPI_KEY
    db = SessionLocal()

    print("\n" + "="*60)
    print(" Google Maps Yorum İçe Aktarma")
    print("="*60)

    # Kalan kredi kontrol
    credits = check_serpapi_credits(active_key)
    print(f"  SerpAPI kalan kredi: {credits}")

    if credits != -1 and credits < 5:
        print("  ❌ Yeterli SerpAPI kredisi yok! Lütfen yeni key ile tekrar çalıştırın.")
        print(f"  python scripts/import_google_reviews.py --api-key YENİ_KEY --resume")
        return

    # Her mekan 2 sayfa → 2 kredi. Kaç mekan işlenebilir?
    if limit == -1:
        pages_per_place = 2
        if credits != -1:
            limit = min((credits - 2) // pages_per_place, 1110)
        else:
            limit = 80
    print(f"  İşlenecek maks mekan: {limit}")
    print(f"  Mekan başı hedef yorum: {reviews_per_place}")

    # İlerleme yükle
    done_ids = load_progress() if resume else set()
    print(f"  Daha önce işlenmiş: {len(done_ids)} mekan")
    print()

    # Mekânları çek — 20'den az yorumu olanlar önce
    all_places = (
        db.query(models.Place)
        .filter(
            models.Place.google_place_id.isnot(None),
            models.Place.google_place_id != "",
        )
        .order_by(models.Place.id)
        .all()
    )

    # Daha önce işlenenleri ve zaten yeterli yorumu olanları çıkar
    places_to_process = []
    for p in all_places:
        if str(p.id) in done_ids:
            continue
        rev_count = db.query(models.Review).filter(models.Review.place_id == p.id).count()
        if rev_count >= reviews_per_place:
            done_ids.add(str(p.id))  # progress'e ekle, bir daha bakma
            continue
        places_to_process.append((p, rev_count))
        if len(places_to_process) >= limit:
            break

    print(f"  Toplam mekan: {len(all_places)}, işlenecek: {len(places_to_process)}")
    print()

    total_reviews = 0
    total_users_created = 0
    failed = 0

    for idx, (place, existing_count) in enumerate(places_to_process):
        needed = reviews_per_place - existing_count
        print(f"[{idx+1}/{len(places_to_process)}] {place.name} (id={place.id}, mevcut={existing_count}, lazım={needed})")

        # SerpAPI'den çek
        try:
            raw_reviews = fetch_reviews_for_place(place.google_place_id, target_count=needed, api_key=active_key)
        except Exception as e:
            print(f"    ❌ Çekme hatası: {e}")
            failed += 1
            time.sleep(2)
            continue

        if not raw_reviews:
            print(f"    ⚠️  Yorum bulunamadı, atlıyorum.")
            done_ids.add(str(place.id))
            save_progress(done_ids)
            time.sleep(REQUEST_DELAY)
            continue

        # Kullanıcı sayısını takip
        users_before = db.query(models.User).filter(
            models.User.email.like(f"%@{PLACEHOLDER_EMAIL_DOMAIN}")
        ).count()

        # Veritabanına ekle
        try:
            inserted = insert_reviews_for_place(db, place, raw_reviews)
            db.commit()

            users_after = db.query(models.User).filter(
                models.User.email.like(f"%@{PLACEHOLDER_EMAIL_DOMAIN}")
            ).count()

            new_users = users_after - users_before
            total_users_created += new_users
            total_reviews += inserted

            total_in_db = db.query(models.Review).count()
            print(f"    ✅ +{inserted} yorum eklendi | DB toplam: {total_in_db}")
        except Exception as e:
            db.rollback()
            print(f"    ❌ DB hatası: {e}")
            failed += 1
            time.sleep(1)
            continue

        # İlerlemeyi kaydet
        done_ids.add(str(place.id))
        if idx % 5 == 0:
            save_progress(done_ids)

        # Rate limit bekle
        time.sleep(REQUEST_DELAY)

    # Final kaydet
    save_progress(done_ids)

    total_in_db = db.query(models.Review).count()
    stub_total = db.query(models.User).filter(
        models.User.email.like(f"%@{PLACEHOLDER_EMAIL_DOMAIN}")
    ).count()
    db.close()

    print()
    print("="*60)
    print(f"  ✅ Tamamlandı!")
    print(f"  📝 Bu çalışmada eklenen : {total_reviews}")
    print(f"  📝 DB'deki toplam yorum : {total_in_db}")
    print(f"  👤 Stub kullanıcı sayısı: {stub_total}")
    print(f"  ❌ Başarısız mekan      : {failed}")
    print()
    print("  Kredi bittiyse yeni key ile devam et:")
    print(f"  python scripts/import_google_reviews.py --api-key YENİ_KEY --resume")
    print()
    print("  Stub kullanıcıları silmek için:")
    print(f"  DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@{PLACEHOLDER_EMAIL_DOMAIN}');")
    print(f"  DELETE FROM users WHERE email LIKE '%@{PLACEHOLDER_EMAIL_DOMAIN}';")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Maps yorumlarını içe aktar")
    parser.add_argument("--api-key", type=str, default=None, help="SerpAPI anahtarı (default: scriptteki key)")
    parser.add_argument("--limit", type=int, default=-1, help="İşlenecek maks mekan sayısı (-1 = kredi kadar otomatik)")
    parser.add_argument("--reviews-per-place", type=int, default=20, help="Mekan başı yorum hedefi (default: 20)")
    parser.add_argument("--resume", action="store_true", help="Kaldığı yerden devam et")
    args = parser.parse_args()

    run(
        limit=args.limit,
        reviews_per_place=args.reviews_per_place,
        resume=args.resume,
        api_key=args.api_key,
    )
