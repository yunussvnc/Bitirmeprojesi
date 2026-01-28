#!/usr/bin/env python3
"""
Eski mock mekanları sil (Cafe Luna, Bar 212, Kahve Durağı, Study Hub, Date Corner vb.)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

OLD_PLACE_NAMES = [
    "Cafe Luna",
    "Bar 212", 
    "Kahve Durağı",
    "Study Hub",
    "Date Corner",
]

def delete_old_places():
    db = SessionLocal()
    try:
        deleted_count = 0
        for name in OLD_PLACE_NAMES:
            places = db.query(models.Place).filter(models.Place.name == name).all()
            for place in places:
                db.delete(place)
                deleted_count += 1
                print(f"🗑️  {place.name} (ID: {place.id}) silindi")
        
        db.commit()
        print(f"\n✅ Toplam {deleted_count} eski mekan silindi")
        return True
    except Exception as e:
        print(f"❌ Hata: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    delete_old_places()
