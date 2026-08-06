import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app'))

from database import SessionLocal
from models import User, Place
from crud import _hash_password

db = SessionLocal()
email = "mekan@asemos.tr"
password = "password123"

existing = db.query(User).filter(User.email == email).first()
user = existing

if not user:
    user = User(
        email=email,
        password_hash=_hash_password(password),
        username="mekan_owner",
        first_name="Mekan",
        last_name="Sahibi",
        role="venue",
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("Mekan owner created.")
else:
    user.role = "venue"
    user.is_active = True
    user.is_email_verified = True
    user.password_hash = _hash_password(password)
    db.commit()
    print("Mekan owner updated.")

place = db.query(Place).first()
if place:
    place.owner_id = user.id
    db.commit()
    print(f"Assigned place '{place.name}' to user '{user.email}'.")
else:
    print("No places found in DB to assign.")
