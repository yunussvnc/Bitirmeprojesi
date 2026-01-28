#!/usr/bin/env python3
"""
Backend'de mekanların olup olmadığını kontrol etmek için basit script
"""

import sys
import os

# Backend dizinine ekle
sys.path.insert(0, os.path.dirname(__file__))

try:
    from database import SessionLocal
    import crud
    
    def check_places():
        db = SessionLocal()
        try:
            places = crud.get_places(db, skip=0, limit=10)
            print(f"✅ Toplam {len(places)} mekan bulundu")
            if len(places) > 0:
                print("\nİlk 5 mekan:")
                for i, place in enumerate(places[:5], 1):
                    print(f"  {i}. {place.name} ({place.category if hasattr(place, 'category') else 'N/A'})")
            else:
                print("\n⚠️  Veritabanında mekan yok!")
                print("Mekan eklemek için:")
                print("   cd scripts")
                print("   python3 add_istanbul_places.py")
        except Exception as e:
            print(f"❌ Hata: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    
    if __name__ == "__main__":
        check_places()
except ImportError as e:
    print(f"❌ Import hatası: {e}")
    print("Backend dizininde olduğunuzdan emin olun ve venv'i aktif edin.")
