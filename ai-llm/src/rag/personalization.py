"""
Personalization - place_interactions tablosuna göre RRF sonrası reranking.
Bellek içi index YOK — etkileşim skorları sık değiştiği için her çağrıda taze SQL atılır.
"""

from typing import Any, Dict, List
import logging
import os
import sqlite3

from src.config import settings

try:
    import psycopg2
    from psycopg2 import pool as psycopg2_pool
except ImportError:  # pragma: no cover - sqlite-only ortamlarda opsiyonel
    psycopg2 = None
    psycopg2_pool = None

logger = logging.getLogger(__name__)

_pg_pool = None


def _get_pg_pool():
    """Modül seviyesinde tekil connection pool — her istekte yeni bağlantı
    açıp kapatmak yerine (yüksek trafikte overhead + Postgres bağlantı limiti
    riski) havuzdan ödünç alıp geri verir."""
    global _pg_pool
    if _pg_pool is None and psycopg2_pool is not None:
        _pg_pool = psycopg2_pool.SimpleConnectionPool(1, 10, settings.database_url_normalized)
    return _pg_pool


class PersonalizationScorer:
    """place_interactions.score'a göre RRF/dense sonuçlarını hafifçe yeniden sıralar."""

    def get_interaction_scores(self, user_id: int, place_ids: List[int]) -> Dict[int, int]:
        """
        user_id'nin verilen place_ids içindeki her mekanla olan ham etkileşim
        skorunu (place_interactions.score) tek sorguda döner. Kayıt yoksa
        dict'te o place_id hiç bulunmaz. Hata durumunda {} döner, ana akışı kırmaz.
        """
        if not user_id or not place_ids:
            return {}

        db_url = settings.DATABASE_URL or ""
        if not db_url:
            logger.warning("PersonalizationScorer: DATABASE_URL tanımlı değil.")
            return {}

        placeholders = ",".join(["%s"] * len(place_ids))
        query = (
            f"SELECT place_id, score FROM place_interactions "
            f"WHERE user_id = %s AND place_id IN ({placeholders})"
        )
        params = (user_id, *place_ids)

        try:
            if db_url.startswith("sqlite:///"):
                rows = self._query_sqlite(db_url, query, params)
            else:
                rows = self._query_postgres(query, params)
        except Exception as exc:
            logger.warning(f"PersonalizationScorer: sorgu başarısız, boş sonuç dönülüyor: {exc}")
            return {}

        return {int(place_id): int(score or 0) for place_id, score in rows}

    def _query_sqlite(self, db_url: str, query: str, params: tuple) -> List[tuple]:
        db_path = db_url.replace("sqlite:///", "")
        if not os.path.isabs(db_path):
            ai_llm_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.abspath(os.path.join(ai_llm_root, db_path))
        conn = sqlite3.connect(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(query.replace("%s", "?"), params)
            return cursor.fetchall()
        finally:
            conn.close()

    def _query_postgres(self, query: str, params: tuple) -> List[tuple]:
        pool = _get_pg_pool()
        if pool is None:
            logger.warning("PersonalizationScorer: psycopg2-binary yüklü değil.")
            return []
        conn = pool.getconn()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            pool.putconn(conn)

    def rerank(
        self,
        candidates: List[Dict[str, Any]],
        user_id: int,
        top_k: int,
    ) -> List[Dict[str, Any]]:
        """
        candidates listesini kullanıcının place_interactions skoruna göre
        multiplicative boost ile yeniden sıralar, top_k'ya kırpar.
        Etkileşimi olmayan mekanlar için boost=1.0 (skor değişmez).
        """
        place_ids = [c["id"] for c in candidates]
        interaction_scores = self.get_interaction_scores(user_id, place_ids)
        if not interaction_scores:
            return candidates[:top_k]

        weight = settings.PERSONALIZATION_BOOST_WEIGHT
        max_score = settings.PERSONALIZATION_MAX_SCORE

        for candidate in candidates:
            raw = interaction_scores.get(candidate["id"], 0)
            normalized = min(raw, max_score) / max_score if max_score else 0.0
            candidate["score"] = candidate["score"] * (1 + weight * normalized)

        candidates.sort(key=lambda c: c["score"], reverse=True)
        return candidates[:top_k]
