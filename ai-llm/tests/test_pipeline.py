"""
RAGPipeline.process() unit testleri — retriever/generator/llm_reranker mock'lanır.
Çalıştırma: cd ai-llm && python -m pytest tests/test_pipeline.py -v
"""

import os
import sys
from unittest.mock import MagicMock

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

import pytest  # noqa: E402

from src.rag.pipeline import RAGPipeline  # noqa: E402
from src.config import settings  # noqa: E402


@pytest.fixture
def pipeline():
    p = RAGPipeline()
    p.retriever = MagicMock()
    p.generator = MagicMock()
    p.generator.llm = MagicMock()
    p.llm_reranker = MagicMock()
    return p


@pytest.fixture(autouse=True)
def reset_llm_rerank_flag():
    original = settings.RAG_USE_LLM_RERANK
    yield
    settings.RAG_USE_LLM_RERANK = original


def test_rerank_disabled_skips_llm_reranker(pipeline):
    settings.RAG_USE_LLM_RERANK = False
    candidates = [{"id": 1, "score": 0.02, "payload": {"id": 1}}]
    pipeline.retriever.retrieve.return_value = candidates
    pipeline.generator.generate_recommendation.return_value = {"oneriler": []}

    pipeline.process(user_query="sessiz kafe")

    pipeline.llm_reranker.rerank.assert_not_called()
    args, kwargs = pipeline.generator.generate_recommendation.call_args
    assert kwargs["retrieved_mekanlar"] == candidates


def test_rerank_enabled_calls_llm_reranker_with_generator_llm(pipeline):
    settings.RAG_USE_LLM_RERANK = True
    candidates = [
        {"id": 1, "score": 0.02, "payload": {"id": 1}},
        {"id": 2, "score": 0.01, "payload": {"id": 2}},
    ]
    reranked = [candidates[1], candidates[0]]
    pipeline.retriever.retrieve.return_value = candidates
    pipeline.llm_reranker.rerank.return_value = reranked
    pipeline.generator.generate_recommendation.return_value = {"oneriler": []}

    pipeline.process(user_query="sessiz kafe")

    pipeline.llm_reranker.rerank.assert_called_once()
    args, kwargs = pipeline.llm_reranker.rerank.call_args
    assert kwargs["llm"] is pipeline.generator.llm
    assert args[0] == candidates
    assert args[1] == "sessiz kafe"

    _, gen_kwargs = pipeline.generator.generate_recommendation.call_args
    assert gen_kwargs["retrieved_mekanlar"] == reranked


def test_empty_retrieval_skips_reranker_and_generator(pipeline):
    settings.RAG_USE_LLM_RERANK = True
    pipeline.retriever.retrieve.return_value = []

    result = pipeline.process(user_query="alakasiz sorgu")

    assert result["oneriler"] == []
    pipeline.llm_reranker.rerank.assert_not_called()
    pipeline.generator.generate_recommendation.assert_not_called()


if __name__ == "__main__":
    print("Bu dosya pytest fixture kullanıyor, `pytest tests/test_pipeline.py -v` ile çalıştırın.")
