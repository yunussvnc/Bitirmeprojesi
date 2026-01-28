"""
Backend'de mekanların olup olmadığını test etmek için basit script
"""

from database import SessionLocal
import crud

def test_places():
    db = SessionLocal()
    try:
        places = crud.get_places(db, skip=0, limit=10)
        print(f"✅ Toplam {len(places)} mekan bulundu")
        for place in places[:5]:
            print(f"  - {place.name} ({place.category})")
        if len(places) == 0:
            print("⚠️  Veritabanında mekan yok! Script'i çalıştırın:")
            print("   python scripts/add_istanbul_places.py")
    finally:
        db.close()

if __name__ == "__main__":
    test_places()
