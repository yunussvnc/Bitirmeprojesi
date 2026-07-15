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


def _tr_lower(text: str) -> str:
    """Türkçe İ/I karakterlerini doğru küçük harfe çevirir (Python'un varsayılan
    .lower()'ı 'İ' → 'i̇' [birleşik nokta] üretir, bu da düz 'i' ile eşleşmez)."""
    return (text or "").replace("İ", "i").replace("I", "ı").lower()


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
                # candidate_limit'i dense_top_k'ya SIKI kısıtlamıyoruz: sadece
                # BM25'te (dense'te hiç yok) çok güçlü tek-sinyal eşleşen bir
                # mekan, iki listede de vasat eşleşen ama toplamda daha yüksek
                # RRF skoru toplayan alakasız mekanlar tarafından erken
                # kırpılabiliyordu (district filter'a ulaşamadan elenmiş
                # oluyordu — gerçek prod testinde tespit edildi: "Bahçelievler"
                # sorgusunda BM25'in #1/#2'si RRF sonrası kayboluyordu). Union
                # boyutunu kullanmak, aşağıdaki _apply_district_filter'ın tam
                # havuzu görmesini sağlıyor; nihai top_k kırpması zaten sonda yapılıyor.
                fusion_pool_size = len(dense_results) + len(bm25_results)
                batch = self._reciprocal_rank_fusion(dense_results, bm25_results, candidate_limit=fusion_pool_size)
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
        candidates = self._apply_district_filter(candidates, parsed_query, top_k)

        if personalization_active:
            return self.personalization_scorer.rerank(candidates, user_id=user_id, top_k=top_k)
        return candidates[:top_k]

    def _apply_district_filter(
        self,
        candidates: List[Dict[str, Any]],
        parsed_query: Optional[Dict],
        top_k: int,
    ) -> List[Dict[str, Any]]:
        """
        parse_natural_query()'nin çıkardığı 'district' güvenilir bir sinyal
        (query_rewriter.py'deki yorum: eşleşme yoksa None döner). Ama şu ana
        kadar sadece embed_text'e eklenip dense modele bırakılıyordu — dense
        model semt isimlerini zayıf temsil ediyor (örn. "Bahçelievler" sorgusunda
        BM25 doğru mekanları 1-2. sıraya koyarken dense tamamen alakasız
        sonuçlar veriyordu). RRF'de bir mekan SADECE BM25'te (dense'te hiç yok)
        güçlü eşleşirse, dense'te vasat ama İKİ listede de az puan toplayan
        alakasız bir mekanın toplam RRF skoru onu geçebiliyordu.

        Bu yüzden district varsa, adres alanında o semti geçen adaylara sert
        filtre uyguluyoruz — RRF'nin skor birleştirme belirsizliğine güvenmek
        yerine. Yeterli eşleşme yoksa (veri seyrekse) orijinal listeye geri
        düşüyoruz, hiçbir zaman boş sonuç döndürmüyoruz.
        """
        district = (parsed_query or {}).get("district")
        if not district:
            return candidates

        district_key = _tr_lower(district)
        matched = [
            c for c in candidates
            if district_key in _tr_lower((c.get("payload") or {}).get("adres", ""))
        ]

        # Aday havuzunda yeterli semt eşleşmesi yoksa: bunun sebebi genelde
        # sorgu metninin hal ekli olması ("Bahçelievlerde" gibi) — BM25/dense
        # bu yüzden o semtteki mekanları hiç ADAY OLARAK bulamamış olabilir,
        # aşağıdaki substring filtresi de boş bir listeyi filtreleyemez. Bu
        # yüzden BM25Index'in ham adres verisinden DOĞRUDAN (tokenizasyondan
        # bağımsız) bir semt araması yapıp eksik adayları takviye ediyoruz.
        if len(matched) < min(top_k, 3):
            existing_ids = {c["id"] for c in candidates}
            fallback_score = min((c["score"] for c in candidates), default=0.01)
            for pid in self.bm25_index.find_by_district(district, limit=top_k * 2):
                if pid in existing_ids:
                    continue
                payload = self.bm25_index.get_payload(pid)
                if not payload:
                    continue
                matched.append({"id": pid, "score": fallback_score, "payload": payload})
                existing_ids.add(pid)

        if len(matched) < min(top_k, 3):
            return candidates

        return matched

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

