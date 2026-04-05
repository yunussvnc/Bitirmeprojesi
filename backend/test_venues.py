import sys
from database import SessionLocal
import models
db = SessionLocal()
venues = db.query(models.User).filter(models.User.role == 'venue').all()
for v in venues:
    print("User", v.email, v.role)
venues2 = db.query(models.Venue).all()
for v in venues2:
    print("Venue table", v.id, v.user_id)
db.close()
