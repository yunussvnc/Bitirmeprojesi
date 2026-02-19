"""
Mevcut mekan görsellerini (Unsplash URL'leri) Cloudinary'ye taşır.

Kullanım:
  cd backend && source venv/bin/activate
  python scripts/migrate_images_to_cloud.py

Ön koşul:
  .env'de CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET dolu olmalı.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
import cloud_storage


def run():
    if not cloud_storage.is_configured():
        print("HATA: Cloudinary yapılandırılmamış!")
        print("  .env dosyasına şunları ekleyin:")
        print("    CLOUDINARY_CLOUD_NAME=xxx")
        print("    CLOUDINARY_API_KEY=xxx")
        print("    CLOUDINARY_API_SECRET=xxx")
        return

    db = SessionLocal()
    places = db.query(models.Place).filter(models.Place.photo_url.isnot(None)).all()

    print(f"Toplam {len(places)} mekanın görseli taşınacak...\n")

    success = 0
    failed = 0

    for p in places:
        if not p.photo_url:
            continue

        # Zaten Cloudinary URL'si ise atla
        if "res.cloudinary.com" in (p.photo_url or ""):
            print(f"  [ATLA] {p.id}: {p.name} — zaten Cloudinary'de")
            continue

        try:
            result = cloud_storage.upload_from_url(
                p.photo_url,
                folder=f"asemos/places/{p.category or 'genel'}".lower().replace(" ", "_"),
            )
            old_url = p.photo_url
            p.photo_url = result["url"]
            db.commit()
            success += 1
            print(f"  [OK]   {p.id}: {p.name}")
        except Exception as e:
            failed += 1
            print(f"  [FAIL] {p.id}: {p.name} — {e}")

    db.close()

    print(f"\nTamamlandı: {success} başarılı, {failed} başarısız")


if __name__ == "__main__":
    run()
