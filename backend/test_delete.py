from database import SessionLocal
from models import User
import sqlalchemy
db = SessionLocal()
u = db.query(User).first()
if u:
    print(f"Trying to delete user {u.id}...")
    try:
        db.delete(u)
        db.commit()
        print("Success")
    except sqlalchemy.exc.IntegrityError as e:
        print("IntegrityError:", e)
