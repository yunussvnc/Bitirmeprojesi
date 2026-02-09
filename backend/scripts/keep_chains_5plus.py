"""
Sadece 5+ şubesi olan zincirleri tutar; diğer mekanları siler.
İsim formatı: "Zincir Adı - Konum" (örn. "Starbucks - Taksim" -> zincir "Starbucks")
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models


def chain_name(place_name: str) -> str:
    """Mekan adından zincir adını çıkarır: 'Starbucks - Taksim' -> 'Starbucks'"""
    if not place_name or " - " not in place_name:
        return place_name or ""
    return place_name.split(" - ")[0].strip()


def main():
    db = SessionLocal()
    try:
        places = db.query(models.Place).all()
        by_chain = defaultdict(list)
        for p in places:
            cn = chain_name(p.name)
            if cn:
                by_chain[cn].append(p)

        to_delete = []
        for chain, chain_places in by_chain.items():
            if len(chain_places) < 5:
                to_delete.extend(chain_places)

        print(f"Toplam mekan: {len(places)}")
        print(f"Zincir sayısı: {len(by_chain)}")
        print(f"5'ten az şubesi olan zincirlerdeki mekan sayısı (silinecek): {len(to_delete)}")

        for p in to_delete:
            db.delete(p)
        db.commit()
        print(f"✅ {len(to_delete)} mekan silindi. Sadece 5+ şubeli zincirler kaldı.")

        remaining = db.query(models.Place).all()
        print(f"Kalan mekan sayısı: {len(remaining)}")
        by_chain_after = defaultdict(list)
        for p in remaining:
            by_chain_after[chain_name(p.name)].append(p)
        for cn, plist in sorted(by_chain_after.items(), key=lambda x: -len(x[1])):
            print(f"  - {cn}: {len(plist)} şube")
    finally:
        db.close()


if __name__ == "__main__":
    main()
