"""Purge all users and dependent rows. Preserves places table data (owner_id cleared)."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

CONFIRM_TOKEN = "PURGE_ALL_USERS"

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"
RENDER_ENV_PATH = BACKEND_DIR / ".env.render"

DELETE_TABLES = [
    "messages",
    "match_conversations",
    "match_likes",
    "match_profiles",
    "community_messages",
    "community_members",
    "community_rooms",
    "notifications",
    "stories",
    "post_tags",
    "post_likes",
    "saved_posts",
    "post_comments",
    "post_media",
    "posts",
    "review_media",
    "reviews",
    "reports",
    "user_blocks",
    "follows",
    "saved_places",
    "place_follows",
    "place_interactions",
    "email_verifications",
    "password_resets",
    "device_tokens",
    "user_preferences",
    "pending_users",
    "users",
]


def load_database_url(env_file: Path | None = None) -> str:
    if env_file is not None:
        if not env_file.is_file():
            print(f"ERROR: Missing env file {env_file}", file=sys.stderr)
            sys.exit(1)
        load_dotenv(env_file, override=True)
    else:
        if not ENV_PATH.is_file() and not RENDER_ENV_PATH.is_file():
            print(f"ERROR: Missing {ENV_PATH} or {RENDER_ENV_PATH}", file=sys.stderr)
            sys.exit(1)
        if ENV_PATH.is_file():
            load_dotenv(ENV_PATH, override=False)
        if RENDER_ENV_PATH.is_file():
            load_dotenv(RENDER_ENV_PATH, override=True)
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        print("ERROR: DATABASE_URL not set (backend/.env or environment)", file=sys.stderr)
        sys.exit(1)
    return url


def require_postgres(database_url: str) -> None:
    scheme = urlparse(database_url).scheme.lower()
    if scheme.startswith("postgres"):
        return
    print(
        "ERROR: DATABASE_URL must be PostgreSQL (Render production). "
        f"Got scheme '{scheme or '(empty)'}' from backend/.env.",
        file=sys.stderr,
    )
    print(
        "Set DATABASE_URL in backend/.env to your Render Postgres connection string, then re-run.",
        file=sys.stderr,
    )
    sys.exit(1)


def db_host_label(database_url: str) -> str:
    parsed = urlparse(database_url)
    host = parsed.hostname or "(unknown)"
    port = parsed.port
    db = (parsed.path or "").lstrip("/") or None
    if port and db:
        return f"{host}:{port}/{db}"
    if port:
        return f"{host}:{port}"
    if db:
        return f"{host}/{db}"
    return host


def table_count(conn, table: str) -> int:
    return int(conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar_one())


def purge_table(conn, table: str) -> tuple[int, int, int]:
    before = table_count(conn, table)
    if before > 0:
        conn.execute(text(f'DELETE FROM "{table}"'))
    after = table_count(conn, table)
    return before, after, before - after


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete all users and user-linked data.")
    parser.add_argument(
        "--confirm",
        required=True,
        help=f'Must be exactly "{CONFIRM_TOKEN}"',
    )
    args = parser.parse_args()
    if args.confirm != CONFIRM_TOKEN:
        print(f'ERROR: Pass --confirm {CONFIRM_TOKEN}', file=sys.stderr)
        return 1

    database_url = load_database_url()
    require_postgres(database_url)
    host_label = db_host_label(database_url)
    print(f"Database host: {host_label}")

    engine = create_engine(database_url, pool_pre_ping=True)

    deleted_by_table: dict[str, int] = {}
    places_before = places_after = 0
    users_final = -1

    with engine.connect() as conn:
        with conn.begin():
            places_before = table_count(conn, "places")
            owner_updates = conn.execute(
                text('UPDATE "places" SET owner_id = NULL WHERE owner_id IS NOT NULL')
            )
            print(f"  places.owner_id cleared: {owner_updates.rowcount} rows updated")
            for table in DELETE_TABLES:
                before, after, removed = purge_table(conn, table)
                deleted_by_table[table] = removed
                print(f"  {table}: {before} -> {after} (removed {removed})")
            places_after = table_count(conn, "places")
            users_final = table_count(conn, "users")

    print("\n--- Summary ---")
    print(f"Database host: {host_label}")
    print(f"places: preserved ({places_before} -> {places_after} rows)")
    print(f"users (final count): {users_final}")
    print("Rows removed per table:")
    for table in DELETE_TABLES:
        print(f"  {table}: {deleted_by_table.get(table, 0)}")
    print(f"Total rows removed (listed tables): {sum(deleted_by_table.values())}")

    if users_final != 0:
        print("ERROR: users table is not empty after purge.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

