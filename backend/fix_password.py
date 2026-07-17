import sys
sys.path.insert(0, '.')
import bcrypt
from database import SessionLocal
from models import User

import os

NEW_PASSWORD = os.getenv("FIX_USER_PASSWORD")
EMAIL = os.getenv("FIX_USER_EMAIL")

if not EMAIL or not NEW_PASSWORD:
    print("Lütfen FIX_USER_EMAIL ve FIX_USER_PASSWORD environment variable'larını ayarlayın.")
    sys.exit(1)

hashed = bcrypt.hashpw(NEW_PASSWORD.encode(), bcrypt.gensalt()).decode()
print("Yeni hash:", hashed[:30], "...")

db = SessionLocal()
user = db.query(User).filter(User.email == EMAIL).first()
if user:
    user.password_hash = hashed
    user.is_active = True
    user.is_email_verified = True
    db.commit()
    db.refresh(user)
    print("Guncellendi!")
    print("Email:", user.email)
    print("is_active:", user.is_active)

    # Dogrula
    ok = bcrypt.checkpw(NEW_PASSWORD.encode(), user.password_hash.encode())
    print("Sifre dogrulama:", "OK" if ok else "HATALI")
else:
    print("Kullanici bulunamadi!")
db.close()
