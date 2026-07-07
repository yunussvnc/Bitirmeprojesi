"""
PersonalizationScorer unit testleri — geçici SQLite DB ile.
Çalıştırma: cd ai-llm && python -m pytest tests/test_personalization.py -v
"""

import os
import sqlite3
import sys
import tempfile

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

import pytest  # noqa: E402

from src.rag.personalization import PersonalizationScorer  # noqa: E402
from src.config import settings  # noqa: E402


@pytest.fixture
def sqlite_interactions_db():
    """Geçici bir SQLite DB'de 'place_interactions' tablosu kurar."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE place_interactions (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            place_id INTEGER,
            score INTEGER
        )
        """
    )
    conn.executemany(
        "INSERT INTO place_interactions (user_id, place_id, score) VALUES (?,?,?)",
        [
            (1, 10, 15),
            (1, 20, 3),
            (2, 10, 8),
        ],
    )
    conn.commit()
    conn.close()

    original_url = settings.DATABASE_URL
    settings.DATABASE_URL = f"sqlite:///{path}"
    yield path
    settings.DATABASE_URL = original_url
    os.remove(path)


def test_no_user_id_returns_empty():
    scorer = PersonalizationScorer()
    assert scorer.get_interaction_scores(None, [10, 20]) == {}


def test_no_place_ids_returns_empty():
    scorer = PersonalizationScorer()
    assert scorer.get_interaction_scores(1, []) == {}


def test_get_interaction_scores_multi_place(sqlite_interactions_db):
    scorer = PersonalizationScorer()
    scores = scorer.get_interaction_scores(1, [10, 20, 30])
    assert scores == {10: 15, 20: 3}
    assert 30 not in scores


def test_get_interaction_scores_scoped_to_user(sqlite_interactions_db):
    scorer = PersonalizationScorer()
    scores = scorer.get_interaction_scores(2, [10, 20])
    assert scores == {10: 8}


def test_missing_database_url_returns_empty():
    scorer = PersonalizationScorer()
    original_url = settings.DATABASE_URL
    settings.DATABASE_URL = ""
    try:
        assert scorer.get_interaction_scores(1, [10]) == {}
    finally:
        settings.DATABASE_URL = original_url


def test_rerank_no_interactions_preserves_order_and_trims():
    scorer = PersonalizationScorer()
    candidates = [
        {"id": 1, "score": 0.03, "payload": {}},
        {"id": 2, "score": 0.02, "payload": {}},
        {"id": 3, "score": 0.01, "payload": {}},
    ]
    # DATABASE_URL boş -> get_interaction_scores {} döner -> erken çıkış
    original_url = settings.DATABASE_URL
    settings.DATABASE_URL = ""
    try:
        result = scorer.rerank(candidates, user_id=1, top_k=2)
    finally:
        settings.DATABASE_URL = original_url

    assert [c["id"] for c in result] == [1, 2]


def test_rerank_boosts_high_interaction_candidate(sqlite_interactions_db):
    """
    weight=0.3, max_score=20 (config varsayılanları) ile:
    place 10: raw=15 -> normalized=0.75 -> score *= 1 + 0.3*0.75 = 1.225
    place 20: raw=3  -> normalized=0.15 -> score *= 1 + 0.3*0.15 = 1.045
    place 30: etkileşim yok -> score değişmez (*1.0)

    Başlangıç skorları (RRF-benzeri küçük değerler): 30 en yüksek ham skora
    sahip ama 10'un boost'u onu öne geçirmeli.
    """
    scorer = PersonalizationScorer()
    candidates = [
        {"id": 30, "score": 0.020, "payload": {}},
        {"id": 10, "score": 0.018, "payload": {}},
        {"id": 20, "score": 0.010, "payload": {}},
    ]

    result = scorer.rerank(candidates, user_id=1, top_k=3)

    assert [c["id"] for c in result] == [10, 30, 20]
    by_id = {c["id"]: c["score"] for c in result}
    assert by_id[10] == pytest.approx(0.018 * 1.225)
    assert by_id[20] == pytest.approx(0.010 * 1.045)
    assert by_id[30] == pytest.approx(0.020)  # etkileşim yok, değişmedi


def test_rerank_trims_to_top_k(sqlite_interactions_db):
    scorer = PersonalizationScorer()
    candidates = [
        {"id": 10, "score": 0.02, "payload": {}},
        {"id": 20, "score": 0.015, "payload": {}},
        {"id": 30, "score": 0.01, "payload": {}},
    ]
    result = scorer.rerank(candidates, user_id=1, top_k=2)
    assert len(result) == 2


if __name__ == "__main__":
    print("Bu dosya pytest fixture kullanıyor, `pytest tests/test_personalization.py -v` ile çalıştırın.")
