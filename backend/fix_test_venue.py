from database import SessionLocal
import models
db = SessionLocal()
place = db.query(models.Place).filter_by(name="Test Cafe").first()
place.address = "Test Adresi"
place.city = "Test Sehri"
db.commit()
print("Fixed Place")
