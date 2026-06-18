import asyncio
import sys
sys.path.append(".")

from database import SessionLocal
import models

async def main():
    db = SessionLocal()
    try:
        # Check ulascan1903@icloud.com users
        users = db.query(models.User).filter(models.User.email == "ulascan1903@icloud.com").all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Username: {u.username}, Provider: {getattr(u, 'auth_provider', 'N/A')}")
            
        print("---")
        # Check google users
        if hasattr(models.User, 'auth_provider'):
            google_users = db.query(models.User).filter(models.User.auth_provider == "google").count()
            print(f"Google users count: {google_users}")
        else:
            print("No auth_provider field.")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
