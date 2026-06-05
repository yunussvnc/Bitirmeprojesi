from database import SessionLocal
import models

def fix():
    db = SessionLocal()
    # Florida Coffee Kadıköy için
    # Google Maps koordinatları: 40.988118, 29.027976
    place = db.query(models.Place).filter(models.Place.id == 3669).first()
    if place:
        place.latitude = 40.988118
        place.longitude = 29.027976
        db.commit()
        print("Updated Florida Coffee Kadıköy location.")
    else:
        print("Place not found.")
    db.close()

if __name__ == "__main__":
    fix()
