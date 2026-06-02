"""
migrate.py — Ana migration dosyası
===================================
Backend her başladığında main.py tarafından otomatik çalışır.
Veritabanı tablolarını SQLAlchemy kullanarak oluşturur.
"""

import logging
from database import engine, Base
import models # Modellerin yüklenmesi için gerekli

logger = logging.getLogger("asemos.migrate")

def run_migrations(engine_override=None):
    """
    Tüm modelleri kontrol eder ve veritabanında olmayan tabloları oluşturur.
    """
    db_engine = engine_override or engine
    logger.info("Veritabanı tabloları kontrol ediliyor/oluşturuluyor...")
    Base.metadata.create_all(bind=db_engine)
    logger.info("✅ Tablolar hazır!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
    run_migrations()
    print("Migration bitti.")
