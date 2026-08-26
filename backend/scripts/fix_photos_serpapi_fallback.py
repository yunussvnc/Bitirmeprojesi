"""
Google'da bulunamayan/fotoğrafsız mekanlar için SerpAPI ile son çare görsel bulma.
fix_all_photos.py'nin FAIL ettiği az sayıdaki mekan için kullanılır.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(override=True)

from database import SessionLocal
import models
import cloud_storage
import requests

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

FAILED_IDS = [
    1389, 1306, 782, 1086, 2267, 2342, 2372, 3702, 2314, 1284, 748, 728,
    930, 2403, 905, 1214, 886, 6193, 1215, 2415, 1131, 897, 674, 867,
]


def find_photo_url(name: str, city: str) -> str | None:
    params = {
        "engine": "google_maps",
        "q": f"{name} {city or 'Istanbul'}",
        "type": "search",
        "hl": "tr",
        "gl": "tr",
        "ll": "@41.0082,28.9784,11z",
        "api_key": SERPAPI_KEY,
    }
    r = requests.get("https://serpapi.com/search", params=params, timeout=30)
    data = r.json()
    results = data.get("local_results", [])
    if not results:
        return None
    item = results[0]
    if item.get("thumbnail"):
        return item["thumbnail"]
    photos = item.get("photos")
    if photos:
        return photos[0].get("original") or photos[0].get("thumbnail")
    return item.get("serpapi_thumbnail")


def main():
    db = SessionLocal()
    ok, fail = 0, 0
    for pid in FAILED_IDS:
        place = db.query(models.Place).filter(models.Place.id == pid).first()
        if not place:
            continue
        photo_url = find_photo_url(place.name, place.city)
        if not photo_url:
            print(f"[FAIL] {pid}: {place.name} — SerpAPI'de de yok")
            fail += 1
            continue
        try:
            result = cloud_storage.upload_from_url(
                photo_url,
                folder=f"asemos/places/{(place.category or 'genel').lower().replace(' ', '_')}",
            )
            place.photo_url = result["url"]
            db.commit()
            print(f"[OK]   {pid}: {place.name}")
            ok += 1
        except Exception as e:
            print(f"[ERR]  {pid}: {e}")
            fail += 1
    db.close()
    print(f"\nBİTTİ. OK={ok} FAIL={fail}")


if __name__ == "__main__":
    main()
