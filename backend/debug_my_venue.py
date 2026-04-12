from database import SessionLocal
import models, crud
db = SessionLocal()
u = db.query(models.User).filter_by(email="test@cafe.com").first()
place = db.query(models.Place).filter(models.Place.owner_id == u.id).first()
try:
    enriched = crud._enrich_places_with_stats(db, [place])
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
