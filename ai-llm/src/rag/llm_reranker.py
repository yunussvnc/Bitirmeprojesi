"""
LLM Reranker - RRF+personalization sonrası final top_k aday listesini
LLM'e (mevcut LayeredLLMWrapper) yeniden sıralatır. Asla crash etmez,
asla mekan kaybetmez/duplike etmez — herhangi bir hata/uyumsuzlukta
orijinal sırayı korur.
"""

from typing import Any, Dict, List, Optional
import json
import logging
import re

logger = logging.getLogger(__name__)

RERANK_SYSTEM_PROMPT = (
    "Sen bir mekan arama sonuçlarını yeniden sıralayan bir sistemsin. "
    "Kullanıcı sorgusuna göre verilen mekan listesini en alakalıdan en az alakalıya sırala. "
    "SADECE bir JSON dizisi döndür — mekan ID'lerinin yeni sırası, başka hiçbir metin yazma. "
    "Örnek çıktı: [3, 1, 4, 2]. Listedeki TÜM ID'leri kullan, yeni ID uydurma, hiçbirini atlama."
)

_JSON_ARRAY_RE = re.compile(r"\[[^\[\]]*\]")


class LLMReranker:
    """Stateless — LLM instance dependency injection ile alınır (generator ile paylaşılır)."""

    def rerank(self, candidates: List[Dict[str, Any]], query: str, llm) -> List[Dict[str, Any]]:
        if len(candidates) < 2:
            return candidates

        try:
            valid_ids = {c["payload"]["id"] for c in candidates}
        except (KeyError, TypeError):
            logger.warning("LLMReranker: candidate payload'larında id eksik, rerank atlanıyor.")
            return candidates

        prompt = self._build_prompt(candidates, query)

        try:
            raw = llm.generate(prompt, system_prompt=RERANK_SYSTEM_PROMPT, temperature=0.1)
        except Exception as exc:
            logger.warning(f"LLMReranker: LLM çağrısı başarısız, orijinal sıra korunuyor: {exc}")
            return candidates

        ordered_ids = self._parse_ids(raw, valid_ids)
        if ordered_ids is None:
            return candidates

        by_id = {c["payload"]["id"]: c for c in candidates}
        return [by_id[pid] for pid in ordered_ids]

    def _build_prompt(self, candidates: List[Dict[str, Any]], query: str) -> str:
        lines = []
        for c in candidates:
            payload = c.get("payload") or {}
            aciklama = (payload.get("aciklama") or "")[:120]
            lines.append(
                f"{payload.get('id')}: {payload.get('ad', '')} "
                f"({payload.get('kategori', '')}) - {aciklama}"
            )
        return (
            f'Kullanıcı sorgusu: "{query}"\n\n'
            f"Mekanlar:\n" + "\n".join(lines) + "\n\nSıralanmış ID listesi (JSON):"
        )

    def _parse_ids(self, raw: str, valid_ids: set) -> Optional[List[int]]:
        if not raw:
            return None

        text = raw.strip()
        # Markdown code fence temizle (```json [...] ``` gibi)
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()

        match = _JSON_ARRAY_RE.search(text)
        if not match:
            logger.warning(f"LLMReranker: JSON dizisi bulunamadı, orijinal sıra korunuyor. Ham çıktı: {raw[:200]}")
            return None

        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            logger.warning(f"LLMReranker: JSON parse hatası, orijinal sıra korunuyor: {exc}")
            return None

        if not isinstance(parsed, list):
            return None

        try:
            parsed_ids = [int(item) for item in parsed]
        except (TypeError, ValueError):
            logger.warning("LLMReranker: JSON dizisi int değil, orijinal sıra korunuyor.")
            return None

        # Dedup, sıra korunarak
        deduped_ids = list(dict.fromkeys(parsed_ids))

        if set(deduped_ids) != valid_ids:
            logger.warning(
                f"LLMReranker: LLM'in döndürdüğü ID seti adaylarla eşleşmiyor "
                f"(beklenen={valid_ids}, gelen={set(deduped_ids)}), orijinal sıra korunuyor."
            )
            return None

        return deduped_ids
