import sys
import os

sys.path.append(os.path.abspath('backend'))

from database import SessionLocal
import crud

db = SessionLocal()
try:
    places = crud.get_places(db, skip=0, limit=100)
    for p in places:
        print(f"{p.name}: {p.photo_url}")
finally:
    db.close()
