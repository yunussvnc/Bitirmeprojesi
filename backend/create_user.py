import sys
import os

try:
    import database
    import schemas
    import crud
    import models
except ImportError:
    print("Imports failed. Ensure this is run inside backend directory.")
    sys.exit(1)

db = database.SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == "yunusemree.sevinc@gmail.com").first()
    if user:
        user.password_hash = crud._hash_password("123456")
        db.commit()
        print(f"✅ Şifre düzeltildi: {user.email}")
    else:
        print("User not found?")
    
    # admin in case it was broken too
    user2 = db.query(models.User).filter(models.User.email == "admin@mail.com").first()
    if user2:
        user2.password_hash = crud._hash_password("123456")
        db.commit()
        print(f"✅ Şifre düzeltildi: {user2.email}")

except Exception as e:
    print("❌ Hata:", e)
finally:
    db.close()
