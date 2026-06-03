"""
loaded_places.json → PostgreSQL places tablosu upsert.

Kullanim (backend dizininden):
    python scripts/sync_loaded_places.py
    python scripts/sync_loaded_places.py --dry-run
    python scripts/sync_loaded_places.py --db "postgresql://user:pass@host/db"
    python scripts/sync_loaded_places.py --json data/loaded_places.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Dict, List, Optional, Set

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv

load_dotenv()

from config import get_settings
from scripts.place_utils import place_to_postgres_row

def _is_postgres_url(db_url: str) -> bool:
    u = (db_url or "").strip().lower()
    return u.startswith("postgresql://") or u.startswith("postgres://")


def _database_target_label(db_url: str) -> str:
    u = (db_url or "").strip()
    if not u:
        return "(bos)"
    if u.lower().startswith("sqlite"):
        return f"SQLite ({u})"
    if "@" in u:
        return u.split("@", 1)[-1]
    return u[:80]


DEFAULT_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "loaded_places.json")
FALLBACK_JSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ai-llm", "data", "loaded_places.json"
)


def resolve_json_path(json_path: Optional[str] = None) -> str:
    if json_path:
        return json_path
    if os.path.exists(DEFAULT_JSON_PATH):
        return DEFAULT_JSON_PATH
    if os.path.exists(FALLBACK_JSON_PATH):
        return FALLBACK_JSON_PATH
    return DEFAULT_JSON_PATH


def load_places_from_json(json_path: str, *, quiet: bool = False) -> List[dict]:
    if not os.path.exists(json_path):
        if not quiet:
            print(f"HATA: {json_path} bulunamadi!")
            print("Once ai-llm/data/loaded_places.json olusturun veya build.sh calistirin.")
        return []
    with open(json_path, encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        if not quiet:
            print("HATA: JSON bir liste olmali")
        return []
    if not quiet:
        print(f"JSON'dan {len(data)} mekan okundu ({json_path})")
    return data


def count_db_places(db_url: str) -> Optional[int]:
    try:
        import psycopg2
    except ImportError:
        print("[PlacesSync] psycopg2-binary yuklu degil")
        return None

    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM places;")
        total = int(cur.fetchone()[0])
        cur.close()
        conn.close()
        return total
    except Exception as exc:
        print(f"[PlacesSync] DB sayimi basarisiz: {exc}")
        return None


def maybe_sync_places_on_startup(
    db_url: Optional[str] = None,
    json_path: Optional[str] = None,
    min_ratio: float = 0.95,
) -> Optional[Dict[str, int]]:
    """DB mekan sayisi JSON snapshot'in %95'inden azsa upsert calistirir."""
    db_url = (db_url or get_settings().DATABASE_URL or "").strip()
    if not db_url:
        print("[PlacesSync] DATABASE_URL yok, atlaniyor")
        return None

    json_path = resolve_json_path(json_path)
    json_places = load_places_from_json(json_path, quiet=True)
    if not json_places:
        print(f"[PlacesSync] JSON bos veya bulunamadi: {json_path}")
        return None

    db_count = count_db_places(db_url)
    if db_count is None:
        return None

    json_count = len(json_places)
    threshold = max(1, int(json_count * min_ratio))
    if db_count >= threshold:
        print(f"[PlacesSync] DB guncel ({db_count}/{json_count}), sync atlandi")
        return {"inserted": 0, "updated": 0, "skipped": json_count, "failed": 0}

    print(f"[PlacesSync] DB geride ({db_count}/{json_count}), upsert basliyor...")
    return sync_loaded_places(db_url, json_path=json_path, dry_run=False)


def sync_loaded_places(
    db_url: str,
    json_path: Optional[str] = None,
    dry_run: bool = False,
) -> Dict[str, int]:
    try:
        import psycopg2
    except ImportError:
        print("HATA: pip install psycopg2-binary")
        sys.exit(1)

    json_path = resolve_json_path(json_path)
    raw_places = load_places_from_json(json_path)
    if not raw_places:
        sys.exit(1)

    rows: List[dict] = []
    skipped_invalid = 0
    for raw in raw_places:
        row = place_to_postgres_row(raw)
        if row:
            rows.append(row)
        else:
            skipped_invalid += 1

    print(f"\n{'=' * 65}")
    print("  LOADED_PLACES.JSON -> POSTGRESQL")
    print(f"{'=' * 65}")
    print(f"  Gecerli kayit : {len(rows)}")
    print(f"  Gecersiz/atla : {skipped_invalid}")
    print(f"  Veritabani    : {_database_target_label(db_url)}")
    print(f"  Mod           : {'DRY-RUN' if dry_run else 'CANLI UPSERT'}")
    print(f"{'=' * 65}\n")

    if dry_run:
        for row in rows[:5]:
            print(f"  {row['name'][:45]:<45} | {row['latitude']}, {row['longitude']}")
        return {"inserted": 0, "updated": 0, "skipped": skipped_invalid, "failed": 0}

    stats = {"inserted": 0, "updated": 0, "skipped": skipped_invalid, "failed": 0}

    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        conn.autocommit = False
        cur = conn.cursor()
        print("PostgreSQL baglantisi OK\n")
    except Exception as exc:
        print(f"HATA: PostgreSQL baglanamadi: {exc}")
        sys.exit(1)

    cur.execute("SELECT vector_id, LOWER(name) FROM places WHERE vector_id IS NOT NULL;")
    existing_vector_ids: Set[str] = set()
    existing_names: Set[str] = set()
    for vector_id, name in cur.fetchall():
        if vector_id:
            existing_vector_ids.add(str(vector_id))
        if name:
            existing_names.add(name)

    print(f"Mevcut kayit (vector_id'li): {len(existing_vector_ids)}")

    upsert_sql = """
        INSERT INTO places (
            name, description, category, address, city,
            latitude, longitude, average_rating, user_ratings_total,
            features, photo_url, price_range,
            opening_time, closing_time, opening_hours_json,
            vector_id, google_place_id
        ) VALUES (
            %(name)s, %(description)s, %(category)s, %(address)s, %(city)s,
            %(latitude)s, %(longitude)s, %(average_rating)s, %(user_ratings_total)s,
            %(features)s, %(photo_url)s, %(price_range)s,
            %(opening_time)s, %(closing_time)s, %(opening_hours_json)s,
            %(vector_id)s, %(google_place_id)s
        )
        ON CONFLICT (vector_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            average_rating = EXCLUDED.average_rating,
            user_ratings_total = EXCLUDED.user_ratings_total,
            features = EXCLUDED.features,
            photo_url = EXCLUDED.photo_url,
            price_range = EXCLUDED.price_range,
            opening_time = EXCLUDED.opening_time,
            closing_time = EXCLUDED.closing_time,
            opening_hours_json = EXCLUDED.opening_hours_json,
            google_place_id = EXCLUDED.google_place_id
        RETURNING id;
    """

    insert_sql = """
        INSERT INTO places (
            name, description, category, address, city,
            latitude, longitude, average_rating, user_ratings_total,
            features, photo_url, price_range,
            opening_time, closing_time, opening_hours_json,
            vector_id, google_place_id
        ) VALUES (
            %(name)s, %(description)s, %(category)s, %(address)s, %(city)s,
            %(latitude)s, %(longitude)s, %(average_rating)s, %(user_ratings_total)s,
            %(features)s, %(photo_url)s, %(price_range)s,
            %(opening_time)s, %(closing_time)s, %(opening_hours_json)s,
            NULL, NULL
        )
        RETURNING id;
    """

    for row in rows:
        name_key = row["name"].lower()
        vector_id = row.get("vector_id")

        try:
            cur.execute("SAVEPOINT place_sync_row")
            if vector_id:
                was_existing = vector_id in existing_vector_ids
                cur.execute(upsert_sql, row)
                result = cur.fetchone()
                if result:
                    if was_existing:
                        stats["updated"] += 1
                    else:
                        stats["inserted"] += 1
                    existing_vector_ids.add(vector_id)
                    existing_names.add(name_key)
                cur.execute("RELEASE SAVEPOINT place_sync_row")
                continue

            if name_key in existing_names:
                stats["skipped"] += 1
                cur.execute("RELEASE SAVEPOINT place_sync_row")
                continue

            cur.execute(insert_sql, row)
            result = cur.fetchone()
            if result:
                stats["inserted"] += 1
                existing_names.add(name_key)
            cur.execute("RELEASE SAVEPOINT place_sync_row")
        except Exception as exc:
            cur.execute("ROLLBACK TO SAVEPOINT place_sync_row")
            stats["failed"] += 1
            print(f"  [!] HATA ({row['name']}): {exc}")

    try:
        conn.commit()
        cur.execute("SELECT COUNT(*) FROM places;")
        total = cur.fetchone()[0]
        print(f"\n{'=' * 65}")
        print("  TAMAMLANDI")
        print(f"{'=' * 65}")
        print(f"  Yeni eklenen : {stats['inserted']}")
        print(f"  Guncellenen  : {stats['updated']}")
        print(f"  Atlanan      : {stats['skipped']}")
        print(f"  Hatali       : {stats['failed']}")
        print(f"  Toplam DB    : {total}")
        print(f"{'=' * 65}\n")
        if total == 0 and stats["inserted"] == 0 and stats["updated"] == 0:
            print("UYARI: places tablosu hala bos. DATABASE_URL veya JSON yolunu kontrol edin.")
    except Exception as exc:
        print(f"Commit hatasi: {exc}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="loaded_places.json -> PostgreSQL")
    parser.add_argument(
        "--db",
        default=os.getenv("DATABASE_URL") or get_settings().DATABASE_URL,
        help="PostgreSQL URL (Render: External Database URL)",
    )
    parser.add_argument("--json", default=None, help="Kaynak JSON dosyasi")
    parser.add_argument("--dry-run", action="store_true", help="Sadece onizleme")
    parser.add_argument(
        "--allow-sqlite",
        action="store_true",
        help="Yerel SQLite ile calistirmaya izin ver (varsayilan: sadece Postgres)",
    )
    args = parser.parse_args()

    db_url = (args.db or "").strip()
    if not db_url:
        print("HATA: DATABASE_URL veya --db gerekli.")
        print("Render Postgres icin Dashboard -> asemos-db -> External Database URL kullanin.")
        sys.exit(2)

    if not _is_postgres_url(db_url) and not args.allow_sqlite:
        print("HATA: Hedef veritabani PostgreSQL degil!")
        print(f"  Algilanan: {_database_target_label(db_url)}")
        print("  Yerel backend/.env icindeki sqlite:///... Render API verisini DOLDURMAZ.")
        print("  Cozum: PowerShell'de $env:DATABASE_URL = '<External Database URL>' sonra scripti tekrar calistirin.")
        print("  Yerel SQLite testi icin: --allow-sqlite")
        sys.exit(2)

    sync_loaded_places(db_url, json_path=args.json, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
