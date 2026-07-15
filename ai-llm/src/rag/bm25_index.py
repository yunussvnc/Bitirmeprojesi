"""
BM25 Index - Postgres/SQLite 'places' tablosu üzerinden bellek içi
keyword (BM25) araması. Hybrid search'ün keyword bacağını sağlar.
"""

from typing import List, Tuple
import logging
import os
import re
import sqlite3

from rank_bm25 import BM25Okapi

from src.config import settings

try:
    import psycopg2
    import psycopg2.extras
except ImportError:  # pragma: no cover - sqlite-only ortamlarda opsiyonel
    psycopg2 = None

logger = logging.getLogger(__name__)

_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def _tokenize(text: str) -> List[str]:
    """Basit, Türkçe karakterlerle uyumlu tokenizer (küçük harf + kelime ayrımı)."""
    return _TOKEN_RE.findall((text or "").lower())


class BM25Index:
    """places tablosundan kurulan, bellek içi BM25Okapi sarmalayıcısı."""

    def __init__(self):
        self._bm25: BM25Okapi = None
        self._place_ids: List[int] = []
        self._place_rows: dict = {}

    @property
    def ready(self) -> bool:
        return self._bm25 is not None and len(self._place_ids) > 0

    def get_payload(self, place_id: int) -> dict:
        """
        Dense arama sonuçlarında bulunmayan (BM25-only) eşleşmeler için,
        Qdrant payload şemasıyla uyumlu minimal bir payload döner. Bulunamazsa {}.
        """
        row = self._place_rows.get(place_id)
        if not row:
            return {}
        return {
            "id": place_id,
            "ad": row.get("name") or "",
            "kategori": row.get("category") or "Mekan",
            "aciklama": row.get("description") or "",
            "adres": f"{row.get('address', '') or ''} {row.get('city', '') or ''}".strip(),
            "enlem": float(row["latitude"]) if row.get("latitude") is not None else None,
            "boylam": float(row["longitude"]) if row.get("longitude") is not None else None,
            "rating": float(row.get("average_rating") or row.get("rating") or 0.0),
            "review_count": int(row.get("review_count") or row.get("user_ratings_total") or 0),
        }

    def find_by_district(self, district: str, limit: int = 20) -> List[int]:
        """
        Adres alanında verilen semti geçen mekanların id listesini döner.
        BM25'in kendi tokenizer'ı Türkçe hal eklerini ayıramadığı için
        ("Bahçelievlerde" != "Bahçelievler" tokeni) sorgu metnine göre arama
        bu eşleşmeyi bazen tamamen kaçırıyor — bu metod parse_natural_query()'nin
        zaten normalize ettiği (ek'siz) semt adını doğrudan adres substring'i
        olarak arar, tokenizasyondan bağımsız çalışır.
        """
        if not self.ready or not district:
            return []
        # Türkçe İ/I için .lower() tuzağı (retriever.py'deki _tr_lower ile aynı
        # gerekçe) — modüller arası döngüsel import olmasın diye burada tekrarlanıyor.
        def _tr_lower(s: str) -> str:
            return (s or "").replace("İ", "i").replace("I", "ı").lower()

        key = _tr_lower(district)
        matches = [
            place_id for place_id, row in self._place_rows.items()
            if key in _tr_lower(str(row.get("address") or ""))
        ]
        return matches[:limit]

    def _fetch_places(self) -> List[dict]:
        db_url = settings.DATABASE_URL or ""
        if not db_url:
            logger.warning("BM25Index: DATABASE_URL tanımlı değil, indeks kurulamıyor.")
            return []

        if db_url.startswith("sqlite:///"):
            db_path = db_url.replace("sqlite:///", "")
            if not os.path.isabs(db_path):
                ai_llm_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                db_path = os.path.abspath(os.path.join(ai_llm_root, db_path))
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM places")
                return [dict(row) for row in cursor.fetchall()]
            finally:
                conn.close()

        if psycopg2 is None:
            logger.warning("BM25Index: psycopg2-binary yüklü değil, indeks kurulamıyor.")
            return []

        normalized_url = settings.database_url_normalized
        conn = psycopg2.connect(normalized_url)
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT * FROM places")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def build(self) -> None:
        """places tablosundan BM25 indeksini (yeniden) kurar."""
        rows = self._fetch_places()
        if not rows:
            self._bm25 = None
            self._place_ids = []
            self._place_rows = {}
            logger.info("BM25Index: kurulacak mekan bulunamadı, indeks boş.")
            return

        corpus_tokens = []
        place_ids = []
        place_rows = {}
        for row in rows:
            place_id = int(row["id"])
            text = " ".join(
                str(row.get(field) or "") for field in ("name", "category", "description")
            )
            corpus_tokens.append(_tokenize(text))
            place_ids.append(place_id)
            place_rows[place_id] = row

        self._bm25 = BM25Okapi(corpus_tokens)
        self._place_ids = place_ids
        self._place_rows = place_rows
        logger.info(f"BM25Index: {len(place_ids)} mekan ile indeks kuruldu.")

    def search(self, query: str, top_k: int = 15) -> List[Tuple[int, float]]:
        """Query için (place_id, bm25_score) listesi döner, skora göre azalan sıralı."""
        if not self.ready:
            return []

        tokens = _tokenize(query)
        if not tokens:
            return []

        scores = self._bm25.get_scores(tokens)
        scored = [
            (place_id, float(score))
            for place_id, score in zip(self._place_ids, scores)
            if score > 0
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[:top_k]
