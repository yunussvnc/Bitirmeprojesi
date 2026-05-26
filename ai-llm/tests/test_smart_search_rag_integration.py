"""
smart-search-v2 ve rag-search endpoint entegrasyon testleri (TestClient).
Çalıştırma: cd ai-llm && python -m pytest tests/test_smart_search_rag_integration.py -v
veya: python tests/test_smart_search_rag_integration.py
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

os.environ.setdefault("RAG_INDEX_ON_STARTUP", "false")
os.environ.setdefault("RAG_AUTO_INDEX", "true")

from app import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


SAMPLE_QUERY = {
    "query": "Kadıköy'de sessiz kahve",
    "location": "Istanbul",
    "limit": 5,
    "user_lat": 40.99,
    "user_lng": 29.02,
    "analyze_reviews": False,
    "language": "tr",
}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_rag_search_returns_structure(client):
    r = client.post("/api/rag-search", json=SAMPLE_QUERY)
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    assert "found" in data
    if data.get("found", 0) > 0:
        rec = data["recommendations"][0]
        assert rec.get("name")
        assert "data_id" in rec or rec.get("similarity_score") is not None


def test_smart_search_v2_rag_metadata(client):
    r = client.post("/api/smart-search-v2", json=SAMPLE_QUERY)
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    assert "found" in data
    assert "rag_context" in data
    assert "rag_source_count" in data
    assert "rag_indexed_count" in data
    assert "context" in data

    # SerpAPI yoksa bile RAG fallback ile sonuç veya açıklayıcı mesaj dönmeli
    if data.get("found", 0) > 0:
        rec = data["recommendations"][0]
        assert rec.get("name")
        assert rec.get("data_id") is not None
        assert data.get("message") is not None or data.get("ai_message") is not None
        if data.get("rag_enhanced") or data.get("source", "").startswith("RAG"):
            assert data["rag_context"].get("rag_enhanced") is True


if __name__ == "__main__":
    c = TestClient(app)
    test_health(c)
    test_rag_search_returns_structure(c)
    test_smart_search_v2_rag_metadata(c)
    print("OK: smart-search-v2 + rag-search integration tests passed")
