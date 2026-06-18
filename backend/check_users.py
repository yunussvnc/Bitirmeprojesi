import asyncio
import sys
sys.path.append(".")

from database import SessionLocal
import models

async def main():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Username: {u.username}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
