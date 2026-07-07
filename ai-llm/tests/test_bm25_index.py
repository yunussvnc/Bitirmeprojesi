"""
BM25Index unit testleri — geçici SQLite DB ile.
Çalıştırma: cd ai-llm && python -m pytest tests/test_bm25_index.py -v
"""

import os
import sqlite3
import sys
import tempfile

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

import pytest  # noqa: E402

from src.rag.bm25_index import BM25Index  # noqa: E402
from src.config import settings  # noqa: E402


@pytest.fixture
def sqlite_places_db():
    """Geçici bir SQLite DB'de 'places' tablosu kurar, DATABASE_URL'i geçici olarak buna işaret ettirir."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE places (
            id INTEGER PRIMARY KEY,
            name TEXT,
            category TEXT,
            description TEXT,
            address TEXT,
            city TEXT,
            latitude REAL,
            longitude REAL,
            average_rating REAL,
            review_count INTEGER
        )
        """
    )
    conn.executemany(
        "INSERT INTO places (id, name, category, description, address, city, latitude, longitude, average_rating, review_count) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            (1, "Sakin Kahve Evi", "kafe", "Sessiz ve çalışmaya uygun bir mekan", "Moda Cad. 1", "İstanbul", 40.98, 29.02, 4.5, 120),
            (2, "Gürültülü Bar", "bar", "Canlı müzik ve eğlence", "İstiklal Cad. 5", "İstanbul", 41.03, 28.98, 4.1, 300),
            (3, "Aile Restoranı", "restoran", "Geniş aile masaları, çocuk dostu", "Bağdat Cad. 10", "İstanbul", 40.96, 29.10, 4.3, 80),
        ],
    )
    conn.commit()
    conn.close()

    original_url = settings.DATABASE_URL
    settings.DATABASE_URL = f"sqlite:///{path}"
    yield path
    settings.DATABASE_URL = original_url
    os.remove(path)


def test_not_ready_before_build():
    index = BM25Index()
    assert index.ready is False
    assert index.search("kahve") == []
    assert index.get_payload(1) == {}


def test_build_and_ready(sqlite_places_db):
    index = BM25Index()
    index.build()
    assert index.ready is True


def test_search_finds_relevant_place(sqlite_places_db):
    index = BM25Index()
    index.build()
    results = index.search("sessiz çalışma kahve")
    assert len(results) > 0
    top_id, top_score = results[0]
    assert top_id == 1  # "Sakin Kahve Evi" en alakalı olmalı
    assert top_score > 0


def test_search_no_match_returns_empty(sqlite_places_db):
    index = BM25Index()
    index.build()
    results = index.search("xyzzy alakasiz terimler qwerty")
    assert results == []


def test_get_payload_shape(sqlite_places_db):
    index = BM25Index()
    index.build()
    payload = index.get_payload(2)
    assert payload["id"] == 2
    assert payload["ad"] == "Gürültülü Bar"
    assert payload["kategori"] == "bar"
    assert payload["enlem"] == pytest.approx(41.03)
    assert payload["boylam"] == pytest.approx(28.98)


def test_get_payload_missing_id_returns_empty(sqlite_places_db):
    index = BM25Index()
    index.build()
    assert index.get_payload(999) == {}


def test_build_empty_table_sets_not_ready():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    conn = sqlite3.connect(path)
    conn.execute(
        "CREATE TABLE places (id INTEGER PRIMARY KEY, name TEXT, category TEXT, description TEXT)"
    )
    conn.commit()
    conn.close()

    original_url = settings.DATABASE_URL
    settings.DATABASE_URL = f"sqlite:///{path}"
    try:
        index = BM25Index()
        index.build()
        assert index.ready is False
    finally:
        settings.DATABASE_URL = original_url
        os.remove(path)


if __name__ == "__main__":
    print("Bu dosya pytest fixture kullanıyor, `pytest tests/test_bm25_index.py -v` ile çalıştırın.")
