from app.dependencies import get_db
from app.database import SessionLocal
import app.models as models

db = SessionLocal()
users = db.query(models.User).filter(models.User.first_name.ilike('%Eyüp%') | models.User.username.ilike('%eyup%')).all()
for u in users:
    print(f"ID: {u.id}, Name: {u.first_name}, Username: {u.username}, Active: {u.is_active}")

db.close()
