from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    total = conn.execute(text("SELECT count(*) FROM places")).scalar()
    with_photo = conn.execute(text("SELECT count(*) FROM places WHERE photo_url IS NOT NULL")).scalar()
    print("Total:", total)
    print("With photo:", with_photo)

    places = conn.execute(text("SELECT id, vector_id, google_place_id, photo_url FROM places WHERE photo_url IS NOT NULL LIMIT 5")).fetchall()
    for p in places:
        print(p)
