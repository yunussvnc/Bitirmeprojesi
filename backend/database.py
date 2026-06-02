# database.py — Veritabanı bağlantısı (Sadece PostgreSQL)

import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

logger = logging.getLogger("asemos")
settings = get_settings()

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# ---------------------------------------------------------------------------
# Engine konfigürasyonu — PostgreSQL
# ---------------------------------------------------------------------------

engine_kwargs = {
    "pool_size": 10,           # Minimum bağlantı havuzu
    "max_overflow": 20,        # Havuz dolunca ek bağlantı
    "pool_timeout": 30,        # Bağlantı bekleme süresi (sn)
    "pool_recycle": 1800,      # 30 dk sonra bağlantıyı yenile
    "pool_pre_ping": True,     # Bağlantı canlılık kontrolü
    "echo": False              # SQL log (debug: True)
}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

logger.info("📦 DB Engine: PostgreSQL (pooled)")
