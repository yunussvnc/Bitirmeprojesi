"""
query_rewriter.rewrite_query() unit testleri.
Çalıştırma: cd ai-llm && python -m pytest tests/test_query_rewriter.py -v
"""

import os
import sys

_AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _AI_ROOT not in sys.path:
    sys.path.insert(0, _AI_ROOT)

from src.rag.query_rewriter import rewrite_query  # noqa: E402


def test_no_parsed_returns_original():
    assert rewrite_query("sakin bir yer", None) == "sakin bir yer"


def test_empty_parsed_returns_original():
    assert rewrite_query("sakin bir yer", {}) == "sakin bir yer"


def test_all_signals_none_returns_original():
    parsed = {
        "category": "kafe",  # kasıtlı: category güvenilmez, kullanılmamalı
        "district": None,
        "features": [],
        "mood": None,
        "group_type": "bireysel",  # varsayılan, eklenmemeli
    }
    assert rewrite_query("bir şeyler", parsed) == "bir şeyler"


def test_district_added():
    parsed = {"district": "Kadıköy", "features": [], "mood": None, "group_type": "bireysel"}
    result = rewrite_query("sessiz bir kafe", parsed)
    assert result == "sessiz bir kafe Kadıköy"


def test_features_and_mood_added_with_dedup():
    parsed = {
        "district": None,
        "features": ["sessiz", "çalışma"],
        "mood": "yorgun",
        "group_type": "bireysel",
    }
    result = rewrite_query("yorgunum sakin bir yer istiyorum", parsed)
    # "yorgun" query içinde geçtiği (yorgunum) için dedup edilip eklenmemeli
    assert "sessiz" in result
    assert "çalışma" in result
    assert result.startswith("yorgunum sakin bir yer istiyorum")


def test_category_field_never_used():
    """category alanı her zaman bir değere sahiptir (varsayılan 'kafe') ve
    bu yüzden güvenilir bir sinyal değildir — rewrite_query bunu kullanmamalı."""
    parsed = {"category": "restoran", "district": None, "features": [], "mood": None, "group_type": "bireysel"}
    result = rewrite_query("bir yer öner", parsed)
    assert "restoran" not in result


def test_group_type_added_when_not_default():
    parsed = {"district": None, "features": [], "mood": None, "group_type": "aile"}
    result = rewrite_query("bir yer öner", parsed)
    assert "aile" in result


if __name__ == "__main__":
    test_no_parsed_returns_original()
    test_empty_parsed_returns_original()
    test_all_signals_none_returns_original()
    test_district_added()
    test_features_and_mood_added_with_dedup()
    test_category_field_never_used()
    test_group_type_added_when_not_default()
    print("OK: query_rewriter tests passed")
