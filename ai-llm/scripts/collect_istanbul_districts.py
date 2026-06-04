# -*- coding: utf-8 -*-
"""
İstanbul ilçe bazlı mekan toplama — Explore haritasında kümelenmeyi azaltır.

Kullanım (ai-llm dizininden):
    python scripts/collect_istanbul_districts.py
    python scripts/collect_istanbul_districts.py --per-district 20 --dry-run
    python scripts/collect_istanbul_districts.py --normalize-only
    python scripts/collect_istanbul_districts.py --sync-postgres
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

from serpapi_client import SerpApiClient
from scripts.serpapi_place_utils import normalize_loaded_place

DATA_PATH = ROOT / "data" / "loaded_places.json"

# Öncelik: Explore'da eksik / az temsil edilen ilçeler (Şirinevler → Bahçelievler)
DISTRICT_TARGETS: List[Tuple[str, float, float, int]] = [
    ("Ümraniye", 41.0265, 29.1248, 25),
    ("Maltepe", 40.9357, 29.1551, 25),
    ("Beylikdüzü", 41.0027, 28.6401, 25),
    ("Bahçelievler", 41.0027, 28.8597, 25),  # Şirinevler vb.
    ("Bakırköy", 40.9785, 28.8546, 22),
    ("Üsküdar", 41.0223, 29.0161, 22),
    ("Ataşehir", 40.9923, 29.1244, 22),
    ("Kartal", 40.9061, 29.1873, 20),
    ("Pendik", 40.8775, 29.2533, 20),
    ("Sarıyer", 41.1683, 29.0488, 20),
    ("Kağıthane", 41.0797, 28.9727, 20),
    ("Esenyurt", 41.0290, 28.6765, 20),
    ("Avcılar", 40.9793, 28.7214, 20),
    ("Fatih", 41.0186, 28.9497, 18),
    ("Şişli", 41.0600, 28.9869, 18),
    ("Zeytinburnu", 41.0031, 28.9069, 15),
    ("Bağcılar", 41.0391, 28.8567, 15),
    ("Tuzla", 40.8175, 29.3006, 15),
    ("Çekmeköy", 41.0351, 29.1780, 15),
    ("Büyükçekmece", 41.0217, 28.5858, 15),
]

# Mevcut snapshot'ta zaten dolu; sadece denge için az ekle
LOW_PRIORITY_DISTRICTS: List[Tuple[str, float, float, int]] = [
    ("Kadıköy", 40.9897, 29.0256, 8),
    ("Beşiktaş", 41.0431, 29.0035, 8),
    ("Beyoğlu", 41.0338, 28.9779, 8),
]

SEARCH_TEMPLATES = [
    ("en iyi restoran {d} İstanbul", "Restoran"),
    ("kahve {d} İstanbul", "Kafe"),
    ("kahvaltı {d} İstanbul", "Restoran"),
    ("kebap {d} İstanbul", "Fast Food"),
    ("balık restoran {d} İstanbul", "Restoran"),
    ("bar {d} İstanbul", "Bar"),
    ("brunch cafe {d} Istanbul", "Kafe"),
    ("vegan restaurant {d} Istanbul", "Restoran"),
]

DISTRICT_NAMES = [
    "Kadıköy", "Beşiktaş", "Beyoğlu", "Şişli", "Fatih", "Üsküdar", "Bakırköy",
    "Maltepe", "Kartal", "Pendik", "Ümraniye", "Sarıyer", "Kağıthane", "Ataşehir",
    "Beylikdüzü", "Bahçelievler", "Esenyurt", "Avcılar", "Zeytinburnu", "Bağcılar",
    "Tuzla", "Çekmeköy", "Büyükçekmece", "Şirinevler",
]


def extract_district(address: str) -> str:
    if not address:
        return "BILINMIYOR"
    for d in sorted(DISTRICT_NAMES, key=len, reverse=True):
        if d.lower() in address.lower():
            return d
    m = re.search(r"(\d{5})?\s*([^/,]+)/İstanbul", address, re.I)
    if m:
        return m.group(2).strip()
    return "BILINMIYOR"


def district_counts(places: List[dict]) -> Counter:
    return Counter(extract_district(p.get("address", "")) for p in places)


def place_record_from_search(raw: Dict[str, Any], fallback_category: str) -> Optional[Dict[str, Any]]:
    norm = normalize_loaded_place(raw)
    if not norm["name"] or not norm["data_id"]:
        return None
    if not norm["latitude"] or not norm["longitude"]:
        return None
    cat = norm["category"] or fallback_category
    return {
        "name": norm["name"],
        "address": norm["address"],
        "data_id": norm["data_id"],
        "latitude": norm["latitude"],
        "longitude": norm["longitude"],
        "rating": norm["rating"],
        "review_count": norm["review_count"],
        "price_level": norm.get("price_level") or 2,
        "category": cat,
        "photo_url": norm.get("photo_url"),
        "description": norm["description"] or f"{norm['name']} - {norm['address']}",
        "user_review": norm.get("user_review") or "",
    }


def normalize_existing_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    for i, raw in enumerate(data):
        rec = place_record_from_search(raw, raw.get("category", "Restoran"))
        if not rec:
            continue
        if rec["category"] != raw.get("category"):
            changed += 1
        data[i] = {**raw, **rec}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return changed


def merge_places(
    existing: List[dict],
    new_items: List[dict],
) -> Tuple[List[dict], int]:
    ids: Set[str] = {p["data_id"] for p in existing if p.get("data_id")}
    added = 0
    for p in new_items:
        did = p.get("data_id")
        if not did or did in ids:
            continue
        ids.add(did)
        existing.append(p)
        added += 1
    return existing, added


def collect_for_districts(
    client: SerpApiClient,
    districts: List[Tuple[str, float, float, int]],
    *,
    per_district_override: Optional[int] = None,
    sleep_sec: float = 0.6,
) -> List[dict]:
    collected: List[dict] = []
    seen: Set[str] = set()

    for district, lat, lng, target in districts:
        goal = per_district_override or target
        district_added = 0
        print(f"\n>> {district} (hedef +{goal})")

        for query_tpl, cat_hint in SEARCH_TEMPLATES:
            if district_added >= goal:
                break
            query = query_tpl.format(d=district)
            try:
                results = client.search_places(query=query, lat=lat, lng=lng, limit=15)
            except Exception as exc:
                print(f"   HATA: {query[:40]}... -> {exc}")
                continue

            for raw in results:
                rec = place_record_from_search(raw, cat_hint)
                if not rec:
                    continue
                did = rec["data_id"]
                if did in seen:
                    continue
                addr = rec["address"] or ""
                addr_l = addr.lower()
                if district == "Bahçelievler":
                    in_region = any(
                        x in addr_l
                        for x in ("bahçelievler", "bahcelievler", "şirinevler", "sirinevler")
                    )
                else:
                    in_region = district.lower() in addr_l or extract_district(addr) == district
                if not in_region:
                    continue
                seen.add(did)
                collected.append(rec)
                district_added += 1
                if district_added >= goal:
                    break

            if district_added > 0:
                print(f"   {query[:45]:<45} +{district_added}/{goal}")
            time.sleep(sleep_sec)

        print(f"   Toplam {district} bu tur: {district_added}")

    return collected


def print_report(places: List[dict], title: str) -> None:
    dc = district_counts(places)
    cats = Counter(p.get("category") for p in places)
    print(f"\n=== {title} ===")
    print(f"Toplam: {len(places)}")
    print("Ilce dagilimi (ust 25):")
    for d, c in dc.most_common(25):
        print(f"  {d}: {c}")
    print("Kategori:")
    for cat, c in cats.most_common():
        print(f"  {cat}: {c}")


def main() -> None:
    parser = argparse.ArgumentParser(description="İstanbul ilçe bazlı mekan toplama")
    parser.add_argument("--per-district", type=int, default=None, help="Her ilce icin max yeni mekan")
    parser.add_argument("--dry-run", action="store_true", help="JSON yazma, sadece istatistik")
    parser.add_argument("--normalize-only", action="store_true", help="Mevcut JSON kategorilerini duzelt")
    parser.add_argument("--include-low-priority", action="store_true", help="Kadikoy/Besiktas/Beyoglu ekle")
    parser.add_argument("--sync-postgres", action="store_true", help="Kayit sonrasi Postgres sync")
    parser.add_argument("--output", default=str(DATA_PATH))
    args = parser.parse_args()

    out_path = Path(args.output)

    if args.normalize_only:
        if not out_path.exists():
            print(f"HATA: {out_path} yok")
            sys.exit(1)
        n = normalize_existing_file(out_path)
        places = json.loads(out_path.read_text(encoding="utf-8"))
        print_report(places, "Normalize sonrasi")
        print(f"Kategori guncellenen kayit: {n}")
        return

    if not os.getenv("SERPAPI_KEY"):
        print("HATA: SERPAPI_KEY yok (ai-llm/.env)")
        sys.exit(1)

    existing: List[dict] = []
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding="utf-8"))
        print(f"Mevcut: {len(existing)} mekan")
        print_report(existing, "Mevcut dagilim")

    districts = list(DISTRICT_TARGETS)
    if args.include_low_priority:
        districts.extend(LOW_PRIORITY_DISTRICTS)

    client = SerpApiClient()
    new_places = collect_for_districts(
        client,
        districts,
        per_district_override=args.per_district,
    )
    print(f"\nToplanan yeni (ham): {len(new_places)}")

    if args.dry_run:
        print_report(existing + new_places, "Dry-run birlesik")
        return

    merged, added = merge_places(existing, new_places)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    normalize_existing_file(out_path)
    merged = json.loads(out_path.read_text(encoding="utf-8"))

    print(f"\nJSON kaydedildi: {out_path}")
    print(f"Yeni eklenen: {added} | Toplam: {len(merged)}")
    print_report(merged, "Guncel dagilim")

    if args.sync_postgres:
        db_url = os.getenv("DATABASE_URL", "").strip()
        if not db_url:
            print("\nDATABASE_URL yok — Render External Database URL ile tekrar calistirin.")
            sys.exit(2)
        print("\n>> PostgreSQL sync (serpapi_to_postgres)...")
        from scripts.serpapi_to_postgres import serpapi_to_postgres
        from src.config import settings

        serpapi_to_postgres(settings.database_url_normalized, json_path=str(out_path))
    else:
        print("\nRender Postgres sync:")
        print('  $env:DATABASE_URL="<Render External Database URL>"')
        print("  cd backend")
        print("  python scripts/sync_loaded_places.py --json ../ai-llm/data/loaded_places.json")


if __name__ == "__main__":
    main()
