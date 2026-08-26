"""
TÜM mekanların fotoğrafını Google'dan (yeni key ile) çekip Cloudinary'e
kalıcı olarak yükler, photo_url'i Cloudinary linkine günceller.

İki grup:
  A) google_place_id ChIJ... formatında + photo_url 'google_photo_ref:TOKEN'
     -> Places API (New) photo media endpoint ile direkt çek.
  B) google_place_id CID formatında (0x...:0x...) + photo_url ham (eski/ölü)
     googleusercontent linki -> Legacy Find Place (isim+şehir) ile taze
     photo_reference bul, legacy Photo API ile çek.

Her başarılı çekimde bytes doğrudan Cloudinary'e (cloud_storage.upload_image)
yüklenir, DB satırı hemen commit edilir (script ortasında kesilirse iş kaybı
minimal olur, aynı yerden devam edilebilir çünkü zaten Cloudinary URL'i
olanlar atlanır).
"""
import sys, os, time, json, threading
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import urllib.request
import urllib.error
from dotenv import load_dotenv
load_dotenv(override=True)

from database import SessionLocal
import models
import cloud_storage
from config import get_settings

settings = get_settings()
API_KEY = settings.GOOGLE_PLACES_API_KEY or settings.GOOGLE_MAPS_API_KEY

LOG_LOCK = threading.Lock()
STATS = {"ok": 0, "fail": 0, "skip": 0}


def log(msg: str):
    with LOG_LOCK:
        print(msg, flush=True)


def fetch_new_api_photo(google_place_id: str, ref: str) -> bytes | None:
    url = f"https://places.googleapis.com/v1/places/{google_place_id}/photos/{ref}/media?maxWidthPx=1000&key={API_KEY}"
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return r.read()
    except Exception:
        return None


def fetch_legacy_photo_via_search(name: str, city: str) -> bytes | None:
    import urllib.parse as up
    q = up.quote(f"{name} {city or 'Istanbul'}")
    find_url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={q}&inputtype=textquery&fields=photos&key={API_KEY}"
    try:
        with urllib.request.urlopen(find_url, timeout=20) as r:
            data = json.loads(r.read())
    except Exception:
        return None
    candidates = data.get("candidates") or []
    if not candidates:
        return None
    photos = candidates[0].get("photos") or []
    if not photos:
        return None
    ref = photos[0].get("photo_reference")
    if not ref:
        return None
    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference={ref}&key={API_KEY}"
    try:
        with urllib.request.urlopen(photo_url, timeout=20) as r:
            return r.read()
    except Exception:
        return None


def process_one(place_id: int):
    db = SessionLocal()
    try:
        place = db.query(models.Place).filter(models.Place.id == place_id).first()
        if not place:
            return
        if place.photo_url and "res.cloudinary.com" in place.photo_url:
            STATS["skip"] += 1
            return

        img_bytes = None
        actual_id = place.google_place_id or place.vector_id or ""

        if place.photo_url and place.photo_url.startswith("google_photo_ref:") and actual_id.startswith("ChIJ"):
            ref = place.photo_url.split("google_photo_ref:", 1)[1]
            img_bytes = fetch_new_api_photo(actual_id, ref)

        if img_bytes is None:
            img_bytes = fetch_legacy_photo_via_search(place.name, place.city)

        if img_bytes is None:
            STATS["fail"] += 1
            log(f"[FAIL] {place.id}: {place.name}")
            return

        result = cloud_storage.upload_image(
            img_bytes,
            folder=f"asemos/places/{(place.category or 'genel').lower().replace(' ', '_')}",
        )
        place.photo_url = result["url"]
        db.commit()
        STATS["ok"] += 1
        log(f"[OK]   {place.id}: {place.name}")
    except Exception as e:
        STATS["fail"] += 1
        log(f"[ERR]  {place_id}: {e}")
    finally:
        db.close()


def main():
    if not cloud_storage.is_configured():
        print("HATA: Cloudinary yapılandırılmamış!")
        return
    if not API_KEY:
        print("HATA: Google API key yok!")
        return

    db = SessionLocal()
    ids = [
        r[0]
        for r in db.query(models.Place.id)
        .filter(~models.Place.photo_url.like("%res.cloudinary.com%"))
        .order_by(models.Place.user_ratings_total.desc().nulls_last())
        .all()
    ]
    db.close()
    print(f"Toplam işlenecek: {len(ids)}")

    from concurrent.futures import ThreadPoolExecutor
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(process_one, ids))

    elapsed = time.time() - t0
    print(f"\nBİTTİ. OK={STATS['ok']} FAIL={STATS['fail']} SKIP={STATS['skip']} süre={elapsed:.0f}s")


if __name__ == "__main__":
    main()
