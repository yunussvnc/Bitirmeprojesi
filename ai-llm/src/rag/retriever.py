"""
RAG Retriever - Vektör araması ile ilgili mekanları bulur
"""

from typing import List, Dict, Any, Optional
from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.rag.query_rewriter import rewrite_query
from src.rag.bm25_index import BM25Index
from src.rag.personalization import PersonalizationScorer
from src.config import settings
import logging

logger = logging.getLogger(__name__)


class RAGRetriever:
    """RAG sistemi için retriever"""

    def __init__(self):
        """Retriever'ı başlat - Lazy loading ile"""
        self._vector_db = None
        self._embedding_model = None
        self._bm25_index = None
        self._personalization_scorer = None

    @property
    def vector_db(self) -> QdrantVectorDB:
        """Vector DB'yi lazy load et"""
        if self._vector_db is None:
            self._vector_db = QdrantVectorDB()
        return self._vector_db

    @property
    def embedding_model(self) -> EmbeddingModel:
        """Embedding model'i lazy load et"""
        if self._embedding_model is None:
            self._embedding_model = EmbeddingModel()
        return self._embedding_model

    @property
    def bm25_index(self) -> BM25Index:
        """BM25 index'i lazy load et (kurulumu ayrıca build() ile tetiklenir)"""
        if self._bm25_index is None:
            self._bm25_index = BM25Index()
        return self._bm25_index

    @property
    def personalization_scorer(self) -> PersonalizationScorer:
        """Personalization scorer'ı lazy load et"""
        if self._personalization_scorer is None:
            self._personalization_scorer = PersonalizationScorer()
        return self._personalization_scorer

    def retrieve(
        self,
        query: str,
        location: Dict[str, float] = None,
        top_k: int = None,
        parsed_query: Dict = None,
        user_id: int = None
    ) -> List[Dict[str, Any]]:
        """
        Kullanıcı sorgusuna göre ilgili mekanları bul

        Args:
            query: Kullanıcının doğal dil sorgusu
            location: Kullanıcı konumu (enlem, boylam)
            top_k: Döndürülecek sonuç sayısı
            parsed_query: app.py::parse_natural_query() çıktısı (opsiyonel,
                query rewriting için kullanılır)
            user_id: Kullanıcı ID (opsiyonel, verilirse place_interactions
                skoruna göre sonuçlar RRF sonrası yeniden ağırlıklandırılır)

        Returns:
            İlgili mekanlar ve benzerlik skorları
        """
        top_k = top_k or settings.TOP_K_RESULTS

        embed_text = query
        if parsed_query and settings.QUERY_REWRITE_ENABLED:
            embed_text = rewrite_query(query, parsed_query)

        # Konum filtresi (opsiyonel)
        filter_dict = None
        if location:
            # Konum bazlı filtreleme eklenebilir
            pass

        hybrid_active = settings.HYBRID_SEARCH_ENABLED and self.bm25_index.ready
        personalization_active = bool(user_id)
        needs_wide_pool = hybrid_active or personalization_active
        dense_top_k = top_k * 3 if needs_wide_pool else top_k

        query_embedding = self.embedding_model.encode_single(embed_text)

        # İteratif retrieval: ilk denemede top_k'dan az sonuç gelirse,
        # similarity threshold'u kademeli gevşetip tekrar dener (kapalıysa tek geçer).
        candidates_by_id: Dict[int, Dict[str, Any]] = {}
        threshold = settings.SIMILARITY_THRESHOLD
        max_attempts = 1 + (
            settings.ITERATIVE_RETRIEVAL_MAX_ATTEMPTS if settings.ITERATIVE_RETRIEVAL_ENABLED else 0
        )

        for attempt in range(max_attempts):
            dense_results = self.vector_db.search_vectors(
                query_vector=query_embedding,
                top_k=dense_top_k,
                filter=filter_dict,
                score_threshold=threshold,
            )

            if hybrid_active:
                bm25_results = self.bm25_index.search(embed_text, top_k=dense_top_k)
                batch = self._reciprocal_rank_fusion(dense_results, bm25_results, candidate_limit=dense_top_k)
            else:
                batch = dense_results[:dense_top_k]

            for item in batch:
                item_id = item["id"]
                if item_id not in candidates_by_id or item["score"] > candidates_by_id[item_id]["score"]:
                    candidates_by_id[item_id] = item

            if len(candidates_by_id) >= top_k:
                break
            if attempt < max_attempts - 1:
                threshold = max(
                    threshold - settings.ITERATIVE_RETRIEVAL_THRESHOLD_STEP,
                    settings.ITERATIVE_RETRIEVAL_MIN_THRESHOLD,
                )
                logger.info(
                    f"Iterative retrieval: {len(candidates_by_id)}/{top_k} sonuç, "
                    f"threshold={threshold} ile tekrar deneniyor"
                )

        candidates = sorted(candidates_by_id.values(), key=lambda c: c["score"], reverse=True)

        if personalization_active:
            return self.personalization_scorer.rerank(candidates, user_id=user_id, top_k=top_k)
        return candidates[:top_k]

    def _reciprocal_rank_fusion(
        self,
        dense_results: List[Dict[str, Any]],
        bm25_results: List[tuple],
        candidate_limit: int,
    ) -> List[Dict[str, Any]]:
        """
        Dense vektör ve BM25 sonuçlarını RRF (1/(k+rank)) ile birleştirir.
        Anahtar: place_id (Qdrant payload["id"], Postgres places.id ile aynı).

        candidate_limit: nihai top_k DEĞİL — personalization gibi sonraki
        reranking adımlarının çalışabileceği aday havuzu boyutu. Gerçek top_k
        kırpması retrieve() içinde, personalization'dan SONRA yapılır.
        """
        k = settings.RRF_K
        rrf_scores: Dict[int, float] = {}
        payloads: Dict[int, Dict[str, Any]] = {}

        for rank, item in enumerate(dense_results):
            place_id = (item.get("payload") or {}).get("id", item.get("id"))
            if place_id is None:
                continue
            place_id = int(place_id)
            rrf_scores[place_id] = rrf_scores.get(place_id, 0.0) + 1.0 / (k + rank + 1)
            payloads[place_id] = item.get("payload")

        for rank, (place_id, _bm25_score) in enumerate(bm25_results):
            rrf_scores[place_id] = rrf_scores.get(place_id, 0.0) + 1.0 / (k + rank + 1)
            if not payloads.get(place_id):
                # Dense sonuçlarında yoktu (BM25-only eşleşme) — payload'ı
                # BM25Index'in belleğe aldığı Postgres satırından doldur.
                # Aksi halde boş payload downstream _is_complete_recommendation
                # filtresi tarafından sessizce elenir.
                payloads[place_id] = self.bm25_index.get_payload(place_id)

        ranked_ids = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)[:candidate_limit]

        return [
            {
                "id": place_id,
                "score": score,
                "payload": payloads.get(place_id) or {},
            }
            for place_id, score in ranked_ids
        ]

