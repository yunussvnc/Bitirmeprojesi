"""Seed real places while keeping the catalog in manageable modules."""

import os
import sys
from datetime import datetime
from pathlib import Path

from seed_real_places_daytime import DAYTIME_PLACES
from seed_real_places_evening import EVENING_PLACES

PLACES = DAYTIME_PLACES + EVENING_PLACES

"""
Gerçek İstanbul mekanları seed script'i.
Her mekanın doğru koordinatları, açıklaması ve meta verisi var.

Kullanım:
  cd backend && source venv/bin/activate
  python scripts/seed_real_places.py
"""


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


CATEGORY_HOURS = {
    "Kafe":          ("08:00", "23:00"),
    "Restoran":      ("11:00", "23:00"),
    "Bar":           ("18:00", "03:00"),
    "Meyhane":       ("18:00", "01:00"),
    "Gece Kulübü":   ("22:00", "05:00"),
    "Fast Food":     ("10:00", "02:00"),
    "Nargile Cafe":  ("10:00", "01:00"),
}


def run():
    db = SessionLocal()

    # Mevcut tüm mekanları sil
    existing = db.query(models.Place).count()
    print(f"Mevcut {existing} mekan siliniyor...")
    db.query(models.Place).delete()
    db.commit()

    # Yeni mekanları ekle
    added = 0
    for p in PLACES:
        cat = p["category"]
        opening, closing = CATEGORY_HOURS.get(cat, ("09:00", "22:00"))
        # Bireysel override (varsa)
        opening = p.get("opening_time", opening)
        closing = p.get("closing_time", closing)

        place = models.Place(
            name=p["name"],
            address=p["address"],
            city=p["city"],
            category=p["category"],
            description=p["description"],
            latitude=p["latitude"],
            longitude=p["longitude"],
            price_range=p["price_range"],
            features=p["features"],
            photo_url=p["photo_url"],
            opening_time=opening,
            closing_time=closing,
        )
        db.add(place)
        added += 1

    db.commit()
    db.close()

    # Kategori bazlı özet
    cats = {}
    for p in PLACES:
        c = p["category"]
        cats[c] = cats.get(c, 0) + 1

    print(f"\n{added} gerçek mekan eklendi:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        hours = CATEGORY_HOURS.get(c, ("09:00", "22:00"))
        print(f"  {c}: {n} (varsayılan {hours[0]}-{hours[1]})")
    print(f"\nToplam: {added}")


if __name__ == "__main__":
    run()
