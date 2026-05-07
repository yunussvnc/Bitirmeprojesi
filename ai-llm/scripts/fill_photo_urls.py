"""
scripts/fill_photo_urls.py
===========================
PostgreSQL places tablosundaki photo_url'si boş mekanlar için
Google Maps Places API veya SerpAPI üzerinden fotoğraf URL'i çekip günceller.

Kullanım:
    python scripts/fill_photo_urls.py              # Tüm boş photo_url'leri doldur
    python scripts/fill_photo_urls.py --dry-run    # Sadece göster, yazma
    python scripts/fill_photo_urls.py --limit 20   # Max 20 mekanı güncelle

NOT: Google Maps API key gerekli (GOOGLE_MAPS_API_KEY .env'de olmalı)
     Yoksa SerpAPI ile dener.
"""

import sys
import os
import time
import argparse
from typing import Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dotenv import load_dotenv; load_dotenv()
from src.config import settings


# ── Google Places API ile tek mekan fotoğrafı çek ──────────────────────────

def fetch_photo_google(name: str, city: str, api_key: str) -> Optional[str]:
    """Google Places Text Search ile mekan ara ve ilk fotoğraf URL'ini al."""
    import httpx

    query = f"{name} {city}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.photos,places.displayName",
    }
    body = {
        "textQuery": query,
        "languageCode": "tr",
        "regionCode": "TR",
        "maxResultCount": 1,
    }

    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers=headers,
                json=body
            )
        if r.status_code != 200:
            return None
        data = r.json()
        places = data.get("places", [])
        if not places:
            return None
        photos = places[0].get("photos", [])
        if not photos:
            return None
        photo_name = photos[0].get("name", "")
        if not photo_name:
            return None
        return (
            f"https://places.googleapis.com/v1/{photo_name}/media"
            f"?maxHeightPx=800&key={api_key}"
        )
    except Exception as e:
        print(f"    [Google] Hata: {e}")
        return None


# ── SerpAPI ile tek mekan fotoğrafı çek ─────────────────────────────────────

def fetch_photo_serpapi(name: str, city: str, api_key: str) -> Optional[str]:
    """SerpAPI Google Maps ile thumbnailı çek."""
    import requests

    params = {
        "engine": "google_maps",
        "q": f"{name} {city}",
        "type": "search",
        "hl": "tr",
        "gl": "tr",
        "ll": "@41.0082,28.9784,12z",
        "api_key": api_key,
    }
    try:
        r = requests.get("https://serpapi.com/search", params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        results = data.get("local_results", [])
        if not results:
            return None
        item = results[0]
        # Fallback zinciri
        if item.get("thumbnail"):
            return item["thumbnail"]
        images = item.get("images", [])
        if images:
            first = images[0]
            if isinstance(first, dict):
                return first.get("original") or first.get("thumbnail")
            if isinstance(first, str):
                return first
        return item.get("serpapi_thumbnail")
    except Exception as e:
        print(f"    [SerpAPI] Hata: {e}")
        return None


# ── PostgreSQL güncelle ──────────────────────────────────────────────────────

def fill_photo_urls(db_url: str, dry_run: bool = False, limit: int = 200):
    try:
        import psycopg2, psycopg2.extras
    except ImportError:
        print("HATA: pip install psycopg2-binary")
        sys.exit(1)

    google_key = getattr(settings, "GOOGLE_MAPS_API_KEY", None) or os.getenv("GOOGLE_MAPS_API_KEY")
    serpapi_key = os.getenv("SERPAPI_KEY")

    if not google_key and not serpapi_key:
        print("HATA: GOOGLE_MAPS_API_KEY veya SERPAPI_KEY .env'de tanımlı değil!")
        sys.exit(1)

    use_google = bool(google_key)
    provider = "Google Places API" if use_google else "SerpAPI"
    print(f"\n{'='*60}")
    print(f"  PHOTO URL DOLDURUCU - {provider}")
    print(f"{'='*60}")

    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        print(f"HATA: PostgreSQL bağlanamadı: {e}")
        sys.exit(1)

    # photo_url'si boş olan mekanları çek
    cur.execute("""
        SELECT id, name, city, address
        FROM places
        WHERE photo_url IS NULL OR photo_url = ''
        ORDER BY id
        LIMIT %s;
    """, (limit,))
    rows = cur.fetchall()
    print(f"  Boş photo_url olan mekan: {len(rows)}")

    if not rows:
        print("  [OK] Tum mekanlarin fotografı mevcut!")
        conn.close()
        return

    guncellenen = 0
    bulunamadi  = 0

    for row in rows:
        place_id = row["id"]
        name     = row["name"] or ""
        city     = row["city"] or "Istanbul"

        print(f"\n  [{place_id}] {name} ({city}) -> ", end="")

        if use_google:
            photo_url = fetch_photo_google(name, city, google_key)
        else:
            photo_url = fetch_photo_serpapi(name, city, serpapi_key)

        if photo_url:
            print(f"[OK] {photo_url[:70]}")
            if not dry_run:
                try:
                    cur2 = conn.cursor()
                    cur2.execute(
                        "UPDATE places SET photo_url = %s WHERE id = %s",
                        (photo_url, place_id)
                    )
                    conn.commit()
                    guncellenen += 1
                except Exception as e:
                    print(f"    [DB] Guncelleme hatasi: {e}")
                    conn.rollback()
            else:
                print("    [DRY-RUN] Yazmadim")
                guncellenen += 1
        else:
            print("[YOK] Fotograf bulunamadi")
            bulunamadi += 1

        # Rate limiting (SerpAPI: ~2 req/sn, Google: daha hızlı)
        time.sleep(0.5 if use_google else 1.0)

    print(f"\n{'='*60}")
    print(f"  TAMAMLANDI")
    print(f"{'='*60}")
    print(f"  Guncellenen : {guncellenen}")
    print(f"  Bulunamadi  : {bulunamadi}")
    if dry_run:
        print("  (DRY-RUN - veritabani degistirilmedi)")
    print(f"{'='*60}\n")

    conn.close()


def main():
    parser = argparse.ArgumentParser(
        description="PostgreSQL places.photo_url'si boş mekanları doldur"
    )
    parser.add_argument("--db", default=settings.DATABASE_URL)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=200,
                        help="Max güncellenecek mekan sayısı")
    args = parser.parse_args()

    fill_photo_urls(args.db, dry_run=args.dry_run, limit=args.limit)


if __name__ == "__main__":
    main()
