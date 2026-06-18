import asyncio
import sys
sys.path.append(".")

from database import SessionLocal
import models

async def main():
    db = SessionLocal()
    try:
        venues = db.query(models.PendingVenue).filter(models.PendingVenue.email.ilike("%ulascan1903@icloud.com%")).all()
        print(f"Found {len(venues)} PendingVenues matching 'ulascan1903@icloud.com'")
        for v in venues:
            print(f"ID: {v.id}, Email: {v.email}, Venue: {v.venue_name}, Status: {v.status}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
