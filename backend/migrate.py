"""
migrate.py — Ana migration dosyası
===================================
Backend her başladığında main.py tarafından otomatik çalışır.
- Yeni tabloları SQLAlchemy create_all ile oluşturur
- Mevcut tablolara eksik kolonları ALTER TABLE ile ekler (create_all bunu yapmaz)
"""

import logging
from sqlalchemy import inspect, text

from database import engine, Base
import models  # Modellerin yüklenmesi için gerekli

logger = logging.getLogger("asemos.migrate")

# (tablo, kolon, postgres_tipi, sqlite_tipi)
_SCHEMA_PATCHES = [
    ("users", "token_version", "INTEGER NOT NULL DEFAULT 0", "INTEGER NOT NULL DEFAULT 0"),
    ("users", "push_token", "VARCHAR", "VARCHAR"),
    ("users", "push_token_updated_at", "TIMESTAMP WITH TIME ZONE", "DATETIME"),
    ("posts", "is_flagged", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
    ("post_comments", "is_flagged", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
    # notifications tablosu genişletme (Munia/Novu özellikleri)
    ("notifications", "place_id", "INTEGER REFERENCES places(id) ON DELETE SET NULL", "INTEGER"),
    ("notifications", "payload", "TEXT", "TEXT"),
    ("notifications", "group_key", "VARCHAR(100)", "VARCHAR(100)"),
    # post_media tablosu genişletme
    ("post_media", "medium_url", "VARCHAR", "VARCHAR"),
    ("post_media", "blurhash", "VARCHAR", "VARCHAR"),
    # stories tablosu genişletme
    ("stories", "duration_seconds", "INTEGER", "INTEGER"),
    ("stories", "view_count", "INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
]


def _table_exists(conn, table: str) -> bool:
    return inspect(conn).has_table(table)


def _column_exists(conn, table: str, column: str) -> bool:
    if not _table_exists(conn, table):
        return False
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def _apply_schema_patches(conn) -> None:
    """Eski veritabanlarında eksik kolonları ekle (ör. token_version)."""
    dialect = conn.dialect.name
    for table, column, pg_type, sqlite_type in _SCHEMA_PATCHES:
        if not _table_exists(conn, table):
            continue
        if _column_exists(conn, table, column):
            continue
        col_type = pg_type if dialect == "postgresql" else sqlite_type
        logger.info("Şema yaması: %s.%s ekleniyor (%s)", table, column, col_type)
        try:
            if dialect == "postgresql":
                conn.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}")
                )
            else:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        except Exception as exc:
            logger.error("Şema yaması başarısız %s.%s: %s", table, column, exc)
            raise
    conn.commit()


def schema_patch_status(engine_override=None) -> dict[str, bool]:
    """Health / deploy doğrulama: kritik kolonların varlığı."""
    db_engine = engine_override or engine
    checks = {
        "posts.is_flagged": False,
        "post_comments.is_flagged": False,
    }
    with db_engine.connect() as conn:
        checks["posts.is_flagged"] = _column_exists(conn, "posts", "is_flagged")
        checks["post_comments.is_flagged"] = _column_exists(conn, "post_comments", "is_flagged")
    return checks


def run_migrations(engine_override=None):
    """
    Tüm modelleri kontrol eder ve veritabanında olmayan tabloları oluşturur.
    Ardından mevcut tablolardaki eksik kolonları ekler.
    """
    db_engine = engine_override or engine
    logger.info("Veritabanı tabloları kontrol ediliyor/oluşturuluyor...")
    Base.metadata.create_all(bind=db_engine)
    with db_engine.connect() as conn:
        _apply_schema_patches(conn)
    logger.info("✅ Tablolar ve şema yamaları hazır!")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
    run_migrations()
    print("Migration bitti.")
