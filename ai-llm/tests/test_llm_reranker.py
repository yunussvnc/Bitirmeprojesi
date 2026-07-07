"""
LLMReranker unit testleri — mock LLM ile (gerçek Groq/HuggingFace çağrısı yok).
Çalıştırma: cd ai-llm && python -m pytest tests/test_llm_reranker.py -v
"""

import os
import sys
from unittest.mock import MagicMock

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

from src.rag.llm_reranker import LLMReranker  # noqa: E402


def _candidate(place_id, ad="Yer"):
    return {"id": place_id, "score": 0.01, "payload": {"id": place_id, "ad": ad, "kategori": "kafe", "aciklama": ""}}


def test_fewer_than_two_candidates_skips_llm():
    reranker = LLMReranker()
    llm = MagicMock()
    single = [_candidate(1)]

    result = reranker.rerank(single, "sessiz kafe", llm=llm)

    assert result == single
    llm.generate.assert_not_called()

    empty_result = reranker.rerank([], "sessiz kafe", llm=llm)
    assert empty_result == []
    llm.generate.assert_not_called()


def test_valid_json_reorders_candidates():
    reranker = LLMReranker()
    candidates = [_candidate(1, "A"), _candidate(2, "B"), _candidate(3, "C")]
    llm = MagicMock()
    llm.generate.return_value = "[3, 1, 2]"

    result = reranker.rerank(candidates, "test query", llm=llm)

    assert [c["id"] for c in result] == [3, 1, 2]
    llm.generate.assert_called_once()
    _, kwargs = llm.generate.call_args
    assert kwargs["temperature"] == 0.1
    assert "system_prompt" in kwargs


def test_json_wrapped_in_markdown_fence_parsed():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2)]
    llm = MagicMock()
    llm.generate.return_value = "```json\n[2, 1]\n```"

    result = reranker.rerank(candidates, "test", llm=llm)

    assert [c["id"] for c in result] == [2, 1]


def test_malformed_json_preserves_original_order():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2), _candidate(3)]
    llm = MagicMock()
    llm.generate.return_value = "bu bir JSON degil"

    result = reranker.rerank(candidates, "test", llm=llm)

    assert result == candidates


def test_missing_id_preserves_original_order():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2), _candidate(3)]
    llm = MagicMock()
    llm.generate.return_value = "[1, 2]"  # 3 eksik

    result = reranker.rerank(candidates, "test", llm=llm)

    assert result == candidates


def test_extra_id_preserves_original_order():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2)]
    llm = MagicMock()
    llm.generate.return_value = "[1, 2, 99]"  # 99 uydurma

    result = reranker.rerank(candidates, "test", llm=llm)

    assert result == candidates


def test_duplicate_id_deduped_and_matches():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2)]
    llm = MagicMock()
    llm.generate.return_value = "[1, 1, 2]"  # 1 tekrar ediyor ama dedup sonrası set eşleşmeli

    result = reranker.rerank(candidates, "test", llm=llm)

    assert [c["id"] for c in result] == [1, 2]


def test_llm_exception_preserves_original_order():
    reranker = LLMReranker()
    candidates = [_candidate(1), _candidate(2)]
    llm = MagicMock()
    llm.generate.side_effect = RuntimeError("Groq API hatası")

    result = reranker.rerank(candidates, "test", llm=llm)

    assert result == candidates


if __name__ == "__main__":
    test_fewer_than_two_candidates_skips_llm()
    test_valid_json_reorders_candidates()
    test_json_wrapped_in_markdown_fence_parsed()
    test_malformed_json_preserves_original_order()
    test_missing_id_preserves_original_order()
    test_extra_id_preserves_original_order()
    test_duplicate_id_deduped_and_matches()
    test_llm_exception_preserves_original_order()
    print("OK: llm_reranker tests passed")
