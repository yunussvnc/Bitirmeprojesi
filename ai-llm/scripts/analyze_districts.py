# -*- coding: utf-8 -*-
"""Quick district distribution report for loaded_places.json."""
import json
import re
import statistics
from collections import Counter
from pathlib import Path

DISTRICTS = [
    "Kadıköy", "Beşiktaş", "Beyoğlu", "Şişli", "Fatih", "Üsküdar", "Bakırköy",
    "Maltepe", "Kartal", "Pendik", "Ümraniye", "Sarıyer", "Kağıthane", "Eyüpsultan",
    "Eyüp", "Ataşehir", "Beylikdüzü", "Bahçelievler", "Bağcılar", "Güngören",
    "Zeytinburnu", "Esenyurt", "Avcılar", "Başakşehir", "Sultangazi", "Şile",
    "Büyükçekmece", "Çekmeköy", "Sultanbeyli", "Tuzla", "Silivri", "Arnavutköy",
    "Şirinevler", "Nişantaşı", "Bebek", "Moda", "Karaköy", "Taksim", "Galata",
]

def extract_district(address: str) -> str:
    if not address:
        return "UNKNOWN"
    for d in sorted(DISTRICTS, key=len, reverse=True):
        if d.lower() in address.lower():
            return d
    m = re.search(r"(\d{5})?\s*([^/,]+)/İstanbul", address, re.I)
    if m:
        return m.group(2).strip()
    return "UNKNOWN"


def main():
    p = Path(__file__).resolve().parents[1] / "data" / "loaded_places.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    districts = [extract_district(x.get("address", "")) for x in data]
    dc = Counter(districts)
    cats = Counter(x.get("category", "?") for x in data)
    no_lat = sum(1 for x in data if not x.get("latitude") or not x.get("longitude"))
    has_data_id = sum(1 for x in data if x.get("data_id"))
    lats = [x["latitude"] for x in data if x.get("latitude")]
    lngs = [x["longitude"] for x in data if x.get("longitude")]

    print("total", len(data))
    print("missing lat/lng", no_lat)
    print("has data_id", has_data_id)
    print("unique districts", len(dc))
    if lats:
        print(f"lat {min(lats):.4f}-{max(lats):.4f} lng {min(lngs):.4f}-{max(lngs):.4f}")
        print(f"lat std {statistics.pstdev(lats):.4f} lng std {statistics.pstdev(lngs):.4f}")
    print("\nDistrict counts:")
    for d, c in dc.most_common():
        print(f"  {d}: {c}")
    print("\nTop categories:")
    for cat, c in cats.most_common(20):
        print(f"  {cat}: {c}")


if __name__ == "__main__":
    main()
