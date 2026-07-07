"""
RAGRetriever.retrieve() / _reciprocal_rank_fusion() unit testleri.
Gerçek Qdrant/embedding model'e bağımlı değildir — vector_db, embedding_model
ve bm25_index mock'lanır.

Çalıştırma: cd ai-llm && python -m pytest tests/test_retriever.py -v
"""

import os
import sys
from unittest.mock import MagicMock

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

import pytest  # noqa: E402

from src.rag.retriever import RAGRetriever  # noqa: E402
from src.config import settings  # noqa: E402


@pytest.fixture
def retriever():
    r = RAGRetriever()
    r._embedding_model = MagicMock()
    r._embedding_model.encode_single.return_value = [0.1, 0.2, 0.3]
    r._vector_db = MagicMock()
    r._bm25_index = MagicMock()
    r._personalization_scorer = MagicMock()
    return r


@pytest.fixture(autouse=True)
def reset_hybrid_flag():
    original = settings.HYBRID_SEARCH_ENABLED
    yield
    settings.HYBRID_SEARCH_ENABLED = original


def test_hybrid_disabled_returns_dense_only(retriever):
    settings.HYBRID_SEARCH_ENABLED = False
    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
        {"id": 2, "score": 0.8, "payload": {"id": 2, "ad": "Yer B"}},
    ]

    results = retriever.retrieve("sessiz kafe", top_k=2)

    assert [r["id"] for r in results] == [1, 2]
    retriever._bm25_index.search.assert_not_called()


def test_hybrid_enabled_but_bm25_not_ready_falls_back_to_dense(retriever):
    settings.HYBRID_SEARCH_ENABLED = True
    retriever._bm25_index.ready = False
    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
    ]

    results = retriever.retrieve("sessiz kafe", top_k=1)

    assert [r["id"] for r in results] == [1]
    retriever._bm25_index.search.assert_not_called()


def test_reciprocal_rank_fusion_combines_and_ranks(retriever):
    """
    Bilinen rank listeleriyle RRF sonucunun elle hesaplanmış skorlarla eşleştiğini doğrula.
    k=60 (varsayılan RRF_K).
    dense sırası: [10, 20, 30]  (rank 0,1,2)
    bm25 sırası:  [20, 10]      (rank 0,1)

    Beklenen skorlar:
    10: 1/(60+1) + 1/(60+2) = 0.016393... + 0.016129... = 0.032522...
    20: 1/(60+2) + 1/(60+1) = aynı toplam = 0.032522...
    30: 1/(60+3) = 0.015873...

    10 ve 20 eşit skorlu; place_id sıralamasında ikisi de 30'dan önce gelmeli.
    """
    settings.HYBRID_SEARCH_ENABLED = True
    retriever._bm25_index.ready = True
    retriever._vector_db.search_vectors.return_value = [
        {"id": 10, "score": 0.9, "payload": {"id": 10, "ad": "A"}},
        {"id": 20, "score": 0.8, "payload": {"id": 20, "ad": "B"}},
        {"id": 30, "score": 0.7, "payload": {"id": 30, "ad": "C"}},
    ]
    retriever._bm25_index.search.return_value = [(20, 5.0), (10, 3.0)]

    results = retriever.retrieve("test query", top_k=3)

    assert len(results) == 3
    result_ids = [r["id"] for r in results]
    assert set(result_ids[:2]) == {10, 20}  # en yüksek skorlu ikisi
    assert result_ids[2] == 30  # en düşük skorlu son sırada

    # Payload'lar korunmuş olmalı
    by_id = {r["id"]: r for r in results}
    assert by_id[10]["payload"]["ad"] == "A"
    assert by_id[20]["payload"]["ad"] == "B"


def test_bm25_only_match_gets_payload_from_bm25_index(retriever):
    """Dense'te olmayan ama BM25'te bulunan bir eşleşme, boş payload yerine
    BM25Index.get_payload() ile doldurulmalı (aksi halde downstream filtre eler)."""
    settings.HYBRID_SEARCH_ENABLED = True
    retriever._bm25_index.ready = True
    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Dense Yer"}},
    ]
    retriever._bm25_index.search.return_value = [(99, 4.0)]
    retriever._bm25_index.get_payload.return_value = {"id": 99, "ad": "BM25 Only Yer"}

    results = retriever.retrieve("test query", top_k=2)

    by_id = {r["id"]: r for r in results}
    assert by_id[99]["payload"]["ad"] == "BM25 Only Yer"
    retriever._bm25_index.get_payload.assert_called_with(99)


def test_query_rewrite_used_when_parsed_query_given(retriever):
    settings.HYBRID_SEARCH_ENABLED = False
    retriever._vector_db.search_vectors.return_value = []

    retriever.retrieve(
        "sessiz bir yer",
        top_k=1,
        parsed_query={"district": "Kadıköy", "features": [], "mood": None, "group_type": "bireysel"},
    )

    encode_call_arg = retriever._embedding_model.encode_single.call_args[0][0]
    assert encode_call_arg == "sessiz bir yer Kadıköy"


def test_no_user_id_skips_personalization(retriever):
    settings.HYBRID_SEARCH_ENABLED = False
    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
    ]

    retriever.retrieve("sessiz kafe", top_k=1)

    retriever._personalization_scorer.rerank.assert_not_called()


def test_user_id_triggers_wide_pool_when_hybrid_disabled(retriever):
    settings.HYBRID_SEARCH_ENABLED = False
    retriever._vector_db.search_vectors.return_value = []
    retriever._personalization_scorer.rerank.return_value = []

    retriever.retrieve("sessiz kafe", top_k=2, user_id=42)

    _, kwargs = retriever._vector_db.search_vectors.call_args
    assert kwargs["top_k"] == 6  # top_k * 3


def test_personalization_reranks_candidates(retriever):
    settings.HYBRID_SEARCH_ENABLED = False
    dense_results = [
        {"id": 1, "score": 0.02, "payload": {"id": 1, "ad": "Yer A"}},
        {"id": 2, "score": 0.01, "payload": {"id": 2, "ad": "Yer B"}},
    ]
    retriever._vector_db.search_vectors.return_value = dense_results
    reranked = [dense_results[1], dense_results[0]]  # personalization sırayı tersine çevirdi
    retriever._personalization_scorer.rerank.return_value = reranked

    results = retriever.retrieve("sessiz kafe", top_k=2, user_id=42)

    assert results == reranked
    retriever._personalization_scorer.rerank.assert_called_once()
    _, kwargs = retriever._personalization_scorer.rerank.call_args
    assert kwargs["user_id"] == 42
    assert kwargs["top_k"] == 2


def test_iterative_retrieval_disabled_calls_search_vectors_once(retriever, monkeypatch):
    settings.HYBRID_SEARCH_ENABLED = False
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_ENABLED", False)
    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
    ]

    results = retriever.retrieve("sessiz kafe", top_k=5)

    retriever._vector_db.search_vectors.assert_called_once()
    assert len(results) == 1


def test_iterative_retrieval_relaxes_threshold_and_merges(retriever, monkeypatch):
    settings.HYBRID_SEARCH_ENABLED = False
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_ENABLED", True)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MAX_ATTEMPTS", 2)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_THRESHOLD_STEP", 0.1)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MIN_THRESHOLD", 0.15)
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.4)

    first_batch = [{"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}}]
    second_batch = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
        {"id": 2, "score": 0.5, "payload": {"id": 2, "ad": "Yer B"}},
        {"id": 3, "score": 0.4, "payload": {"id": 3, "ad": "Yer C"}},
    ]
    retriever._vector_db.search_vectors.side_effect = [first_batch, second_batch]

    results = retriever.retrieve("nadir bir sorgu", top_k=3)

    assert retriever._vector_db.search_vectors.call_count == 2
    first_kwargs = retriever._vector_db.search_vectors.call_args_list[0].kwargs
    second_kwargs = retriever._vector_db.search_vectors.call_args_list[1].kwargs
    assert first_kwargs["score_threshold"] == 0.4
    assert second_kwargs["score_threshold"] == pytest.approx(0.3)

    result_ids = {r["id"] for r in results}
    assert result_ids == {1, 2, 3}


def test_iterative_retrieval_exhausts_attempts_without_crash(retriever, monkeypatch):
    settings.HYBRID_SEARCH_ENABLED = False
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_ENABLED", True)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MAX_ATTEMPTS", 2)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_THRESHOLD_STEP", 0.1)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MIN_THRESHOLD", 0.15)
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.4)

    retriever._vector_db.search_vectors.return_value = [
        {"id": 1, "score": 0.9, "payload": {"id": 1, "ad": "Yer A"}},
    ]

    results = retriever.retrieve("çok nadir bir sorgu", top_k=5)

    assert retriever._vector_db.search_vectors.call_count == 3  # 1 + max_attempts
    assert len(results) == 1  # top_k'dan az ama crash yok


def test_iterative_retrieval_min_threshold_respected(retriever, monkeypatch):
    settings.HYBRID_SEARCH_ENABLED = False
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_ENABLED", True)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MAX_ATTEMPTS", 3)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_THRESHOLD_STEP", 0.2)
    monkeypatch.setattr(settings, "ITERATIVE_RETRIEVAL_MIN_THRESHOLD", 0.15)
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.4)

    retriever._vector_db.search_vectors.return_value = []

    retriever.retrieve("bulunamayan sorgu", top_k=5)

    thresholds = [
        call.kwargs["score_threshold"]
        for call in retriever._vector_db.search_vectors.call_args_list
    ]
    # 0.4 -> 0.2 -> 0.15 (0.0 yerine min'de sabitlenir, 3. denemede tekrar 0.15'te kalır)
    assert thresholds[0] == 0.4
    assert all(t >= 0.15 for t in thresholds)


if __name__ == "__main__":
    print("Bu dosya pytest fixture kullanıyor, `pytest tests/test_retriever.py -v` ile çalıştırın.")
