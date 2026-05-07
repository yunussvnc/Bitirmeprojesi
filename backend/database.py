# database.py — Veritabanı bağlantısı (SQLite + PostgreSQL destekli)

import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

logger = logging.getLogger("asemos")
settings = get_settings()

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    # Bazı platformlar `postgres://` kullanıyor; SQLAlchemy için normalize et.
    SQLALCHEMY_DATABASE_URL = "postgresql://" + SQLALCHEMY_DATABASE_URL[len("postgres://") :]

# ---------------------------------------------------------------------------
# Engine konfigürasyonu — SQLite vs PostgreSQL otomatik ayarlama
# ---------------------------------------------------------------------------

engine_kwargs = {}
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

if is_sqlite:
    # SQLite: thread-safe mod
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["pool_pre_ping"] = True
else:
    # PostgreSQL: connection pooling
    engine_kwargs["pool_size"] = 10           # Minimum bağlantı havuzu
    engine_kwargs["max_overflow"] = 20        # Havuz dolunca ek bağlantı
    engine_kwargs["pool_timeout"] = 30        # Bağlantı bekleme süresi (sn)
    engine_kwargs["pool_recycle"] = 1800      # 30 dk sonra bağlantıyı yenile
    engine_kwargs["pool_pre_ping"] = True     # Bağlantı canlılık kontrolü
    engine_kwargs["echo"] = False             # SQL log (debug: True)

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

# SQLite performans ayarları
if is_sqlite:
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")      # Daha hızlı yazma
        cursor.execute("PRAGMA synchronous=NORMAL")     # Güvenli + hızlı
        cursor.execute("PRAGMA cache_size=-64000")      # 64MB cache
        cursor.execute("PRAGMA foreign_keys=ON")        # FK kısıtlamaları aktif
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

logger.info(
    "📦 DB Engine: %s",
    "SQLite (WAL + FK)" if is_sqlite else "PostgreSQL (pooled)",
)
