from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    places = conn.execute(text("SELECT id, name, gallery_urls, photo_url, vector_id, google_place_id FROM places")).fetchall()
    for p in places:
        print(p)
