from database import SessionLocal
import models, crud, schemas
db = SessionLocal()
u = db.query(models.User).filter_by(email="test@cafe.com").first()
place = db.query(models.Place).filter(models.Place.owner_id == u.id).first()
try:
    enriched_places = crud._enrich_places_with_stats(db, [place])
    schemas.Place.model_validate(enriched_places[0])
    print("Success schemas")
except Exception as e:
    import traceback
    traceback.print_exc()
