#!/usr/bin/env python3
"""
Google Maps Yorum İçe Aktarma - Hızlandırılmış Versiyon
=========================================================
Kullanım:
  python scripts/import_fast.py --keys KEY1 KEY2 KEY3 ...  [--resume]

Özellikler:
  - Tüm review count'larını tek sorguda çeker (hızlı)
  - Birden fazla SerpAPI key'ini sırayla kullanır
  - Kredi biten key'i atlar, bir sonrakine geçer
  - --resume ile kaldığı yerden devam eder
  - Her mekan için 20 yorum hedefi (2 sayfa × ~10)
"""

import sys, os, time, hashlib, json, re, random, argparse
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from database import SessionLocal
import models

# ─── Konfig ──────────────────────────────────────────────────────────────────
TARGET_REVIEWS     = 20
PLACEHOLDER_DOMAIN = "reviews.placeholder"
STUB_HASH          = "!SERPAPI_STUB_CANNOT_LOGIN"
REQUEST_DELAY      = 1.1   # saniye
PROGRESS_FILE      = "scripts/import_progress.json"
# ─────────────────────────────────────────────────────────────────────────────


def check_credits(key):
    try:
        r = requests.get("https://serpapi.com/account", params={"api_key": key}, timeout=8)
        return r.json().get("total_searches_left", 0)
    except:
        return 0


def strip_surname(name):
    parts = name.strip().split()
    return " ".join(parts[:-1]) if len(parts) > 1 else name.strip()


def stub_email(name, thumb):
    return f"serpapi_{hashlib.md5(f'{name}|{thumb}'.encode()).hexdigest()[:12]}@{PLACEHOLDER_DOMAIN}"


def parse_date(s):
    now = datetime.utcnow()
    if not s:
        return now
    s = s.lower()
    units = {"dakika": 1/1440, "saat": 1/24, "gün": 1, "hafta": 7,
             "ay": 30, "yıl": 365, "minute": 1/1440, "hour": 1/24,
             "day": 1, "week": 7, "month": 30, "year": 365}
    for unit, days in units.items():
        m = re.search(rf"(\d+)\s*{unit}", s)
        if m:
            return now - timedelta(days=int(m.group(1)) * days)
    if "yıl" in s or "year" in s: return now - timedelta(days=365)
    if "ay"  in s or "month" in s: return now - timedelta(days=90)
    if "hafta" in s or "week" in s: return now - timedelta(days=14)
    return now - timedelta(days=7)


def get_or_create_stub(db, name, thumb):
    email = stub_email(name, thumb)
    u = db.query(models.User).filter(models.User.email == email).first()
    if u:
        return u
    display = strip_surname(name)
    parts = display.split()
    u = models.User(
        email=email, username=None,
        first_name=parts[0] if parts else display,
        last_name=parts[1] if len(parts) > 1 else None,
        password_hash=STUB_HASH,
        avatar_url=thumb or None,
        role="user", is_active=False, is_email_verified=False,
    )
    db.add(u)
    db.flush()
    return u


def fetch_page(place_id, key, next_token=None):
    params = {"engine": "google_maps_reviews", "data_id": place_id,
              "api_key": key, "hl": "tr", "sort_by": "2"}
    if next_token:
        params["next_page_token"] = next_token
    r = requests.get("https://serpapi.com/search", params=params, timeout=30)
    return r.json()


def fetch_reviews(place_id, key, needed):
    results, next_token, page = [], None, 0
    while len(results) < needed and page < 3:
        try:
            data = fetch_page(place_id, key, next_token)
        except Exception as e:
            print(f"    ⚠️  {e}")
            break
        if "error" in data:
            print(f"    ⚠️  {data['error'][:80]}")
            break
        revs = data.get("reviews", [])
        results.extend(revs)
        print(f"    → Sayfa {page+1}: {len(revs)} yorum (toplam: {len(results)})")
        next_token = data.get("serpapi_pagination", {}).get("next_page_token")
        if not next_token:
            break
        page += 1
        time.sleep(REQUEST_DELAY)
    return results[:needed]


def insert_reviews(db, place, raw):
    added = 0
    for rev in raw:
        u_data  = rev.get("user", {})
        name    = u_data.get("name", "")
        thumb   = u_data.get("thumbnail", "")
        rating  = rev.get("rating")
        text    = rev.get("snippet", "").strip()
        date_s  = rev.get("date", "")
        if not name or not text or rating is None:
            continue
        try:
            stub = get_or_create_stub(db, name, thumb)
        except Exception as e:
            db.rollback()
            continue
        exists = db.query(models.Review).filter(
            models.Review.user_id == stub.id,
            models.Review.place_id == place.id,
        ).first()
        if exists:
            continue
        dt = parse_date(date_s)
        db.add(models.Review(
            user_id=stub.id, place_id=place.id,
            comment_text=text, rating=int(rating),
            created_at=dt, updated_at=dt,
            is_verified=False,
            helpful_count=random.randint(0, 15),
        ))
        added += 1
    return added


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return set(json.load(f).get("done_place_ids", []))
    return set()


def save_progress(done):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"done_place_ids": list(done),
                   "ts": datetime.utcnow().isoformat()}, f)


def run(keys, resume):
    db = SessionLocal()

    print("\n" + "="*62)
    print(" Google Maps Yorum İçe Aktarma — Hızlı Versiyon")
    print("="*62)

    # Tüm key'lerin kredilerini göster
    key_credits = {}
    for k in keys:
        c = check_credits(k)
        key_credits[k] = c
        print(f"  Key ...{k[-8:]}: {c} kredi")
    total_credits = sum(key_credits.values())
    max_places = total_credits // 2   # 2 sayfa = 2 kredi/mekan
    print(f"  Toplam kredi: {total_credits} → maks ~{max_places} mekan işlenebilir")
    print()

    if total_credits < 4:
        print("  ❌ Kredi yok! Yeni key gönder.")
        db.close()
        return

    # İlerleme yükle
    done_ids = load_progress() if resume else set()
    print(f"  Daha önce işlenmiş: {len(done_ids)} mekan")

    # ── Tek sorguda tüm review count'larını al (hızlı!) ──
    print("  DB'den review sayıları sorgulanıyor...", end="", flush=True)
    from sqlalchemy import func
    review_counts_raw = (
        db.query(models.Review.place_id, func.count(models.Review.id))
        .group_by(models.Review.place_id)
        .all()
    )
    review_counts = {str(pid): cnt for pid, cnt in review_counts_raw}
    total_in_db = sum(review_counts.values())
    print(f" {total_in_db} yorum, {len(review_counts)} mekan")

    # Tüm mekânları çek (tek sorgu)
    print("  Mekanlar sorgulanıyor...", end="", flush=True)
    places = (
        db.query(models.Place)
        .filter(models.Place.google_place_id.isnot(None),
                models.Place.google_place_id != "")
        .order_by(models.Place.id)
        .all()
    )
    print(f" {len(places)} mekan")

    # İşlenecek mekânları filtrele
    to_process = []
    for p in places:
        pid = str(p.id)
        if pid in done_ids:
            continue
        cnt = review_counts.get(pid, 0)
        if cnt >= TARGET_REVIEWS:
            done_ids.add(pid)
            continue
        to_process.append((p, cnt))
        if len(to_process) >= max_places:
            break

    print(f"  İşlenecek: {len(to_process)} mekan")
    print()

    # ── Ana döngü ──
    added_total = 0
    failed = 0
    current_key_idx = 0

    for idx, (place, existing) in enumerate(to_process):
        # Kredi biten key'i atla
        while current_key_idx < len(keys):
            k = keys[current_key_idx]
            if key_credits.get(k, 0) >= 2:
                break
            print(f"\n  🔄 Key ...{k[-8:]} bitti, sıradaki key'e geçiliyor...\n")
            current_key_idx += 1
            if current_key_idx < len(keys):
                # Yeni key'in kredisini güncelle
                key_credits[keys[current_key_idx]] = check_credits(keys[current_key_idx])

        if current_key_idx >= len(keys):
            print("\n  ❌ Tüm key'ler bitti! Yeni key ile --resume ile devam et.")
            print(f"  python scripts/import_fast.py --keys YENİ_KEY --resume")
            break

        active_key = keys[current_key_idx]
        needed = TARGET_REVIEWS - existing
        print(f"[{idx+1}/{len(to_process)}] {place.name[:45]} (mevcut={existing}, +{needed} lazım) key=...{active_key[-6:]}")

        raw = fetch_reviews(place.google_place_id, active_key, needed)
        if not raw:
            print(f"    ⚠️  Yorum bulunamadı.")
            done_ids.add(str(place.id))
            save_progress(done_ids)
            time.sleep(0.5)
            continue

        try:
            n = insert_reviews(db, place, raw)
            db.commit()
            added_total += n
            total_in_db += n
            print(f"    ✅ +{n} yorum | DB toplam: {total_in_db}")
        except Exception as e:
            db.rollback()
            print(f"    ❌ DB hatası: {e}")
            failed += 1
            time.sleep(1)
            continue

        done_ids.add(str(place.id))
        # Her 5 mekanda ilerleme kaydet
        if (idx + 1) % 5 == 0:
            save_progress(done_ids)
            # Key kredilerini güncelle
            key_credits[active_key] = check_credits(active_key)
            remaining = key_credits[active_key]
            print(f"  💳 Key ...{active_key[-6:]} kalan: {remaining} kredi")

        time.sleep(REQUEST_DELAY)

    save_progress(done_ids)

    stub_total = db.query(models.User).filter(
        models.User.email.like(f"%@{PLACEHOLDER_DOMAIN}")
    ).count()
    db.close()

    print()
    print("="*62)
    print(f"  ✅ Tamamlandı!")
    print(f"  📝 Bu çalışmada eklenen : {added_total}")
    print(f"  📝 DB toplam yorum       : {total_in_db}")
    print(f"  👤 Toplam stub kullanıcı : {stub_total}")
    print(f"  ❌ Başarısız             : {failed}")
    print()
    print("  Yeni key ile devam etmek için:")
    print("  python scripts/import_fast.py --keys YENİ_KEY --resume")
    print()
    print("  Stub kullanıcıları silmek için:")
    print(f"  DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@{PLACEHOLDER_DOMAIN}');")
    print(f"  DELETE FROM users WHERE email LIKE '%@{PLACEHOLDER_DOMAIN}';")
    print("="*62)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--keys", nargs="+", required=True,
                        help="Bir veya daha fazla SerpAPI anahtarı")
    parser.add_argument("--resume", action="store_true",
                        help="Kaldığı yerden devam et")
    args = parser.parse_args()
    run(keys=args.keys, resume=args.resume)
