# backend/llm_recommend.py
import json
import os
from typing import Any, Dict, List, Tuple

from llm_client import ollama_generate


def _safe_json_from_text(text: str) -> Dict[str, Any]:
    """
    LLM bazen json dışında konuşur.
    İlk { ... } bloğunu yakalayıp parse etmeye çalışır.
    """
    text = (text or "").strip()
    if not text:
        return {}

    # Direkt JSON ise
    try:
        return json.loads(text)
    except Exception:
        pass

    # İçinden ilk JSON objesini yakala
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        chunk = text[start : end + 1]
        try:
            return json.loads(chunk)
        except Exception:
            return {}

    return {}


def llm_rerank_and_explain(
    *,
    query: str,
    preferences: Dict[str, Any],
    candidates: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], str]:
    """
    candidates: [{"id": 1, "name": "...", "subtitle": "...", "tags": [...]}, ...]
    return: (reranked_candidates, explanation)
    """
    # Feature flag: kapatmak istersen .env ile USE_LLM=0
    use_llm = os.getenv("USE_LLM", "1").lower() not in ("0", "false", "no")
    if not use_llm:
        return candidates, ""

    # Adayları kısalt (prompt şişmesin)
    cand_lines = []
    for c in candidates[:12]:
        cid = c.get("id")
        name = c.get("name", "")
        subtitle = c.get("subtitle", "")
        tags = c.get("tags") or []
        cand_lines.append(f"- id:{cid} | {name} | {subtitle} | tags:{tags}")

    vibe = preferences.get("vibe")
    purpose = preferences.get("purpose")
    budget = preferences.get("budget")

    prompt = f"""
Sen bir mekan öneri asistanısın.
Kullanıcının isteğine göre aşağıdaki aday mekanları yeniden sırala (rerank) ve kısa bir açıklama üret.

Kullanıcı isteği: "{query}"
Tercihler:
- vibe: {vibe}
- purpose: {purpose}
- budget: {budget}

Adaylar:
{chr(10).join(cand_lines)}

SADECE şu JSON formatında cevap ver:
{{
  "ranked_ids": [id1, id2, ...],
  "explanation": "2-4 cümle kısa açıklama"
}}
""".strip()

    out = ollama_generate(prompt)
    data = _safe_json_from_text(out)

    ranked_ids = data.get("ranked_ids")
    explanation = (data.get("explanation") or "").strip()

    if not isinstance(ranked_ids, list) or not ranked_ids:
        # LLM cevap veremediyse fallback: mevcut sıra
        return candidates, explanation

    # Rerank uygula
    id_to_item = {str(c.get("id")): c for c in candidates}
    new_list: List[Dict[str, Any]] = []

    for rid in ranked_ids:
        key = str(rid)
        if key in id_to_item:
            new_list.append(id_to_item.pop(key))

    # Kalanları sona ekle (LLM bazılarını unutabilir)
    new_list.extend(list(id_to_item.values()))

    return new_list, explanation