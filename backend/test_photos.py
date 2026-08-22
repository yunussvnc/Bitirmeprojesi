import asyncio
from database import SessionLocal
from models import Place
import config

db = SessionLocal()
places = db.query(Place).filter(Place.photo_url.isnot(None)).limit(10).all()
settings = config.get_settings()

print(f"GOOGLE_PLACES_API_KEY is set: {bool(settings.GOOGLE_PLACES_API_KEY)}")
print(f"GOOGLE_MAPS_API_KEY is set: {bool(settings.GOOGLE_MAPS_API_KEY)}")

for p in places:
    print(f"Place ID: {p.id}, name: {p.name}")
    print(f"  google_place_id: {p.google_place_id}")
    print(f"  vector_id: {p.vector_id}")
    print(f"  photo_url: {p.photo_url}")
    
    if p.photo_url and p.photo_url.startswith("google_photo_ref:"):
        ref = p.photo_url.split("google_photo_ref:")[1]
        actual_google_id = p.google_place_id or p.vector_id
        
        if (actual_google_id or "").startswith("ChIJ") and settings.GOOGLE_PLACES_API_KEY:
            url = f"https://places.googleapis.com/v1/places/{actual_google_id}/photos/{ref}/media?maxWidthPx=800&key=HIDDEN"
            print("  URL (V1):", url)
        else:
            url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={ref}&key=HIDDEN"
            print("  URL (Legacy):", url)
            
    print("-" * 40)
