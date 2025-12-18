"""
RAG Retriever - Vektör araması ile ilgili mekanları bulur
"""

from typing import List, Dict, Any, Optional
from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.config import settings
import logging

logger = logging.getLogger(__name__)


class RAGRetriever:
    """RAG sistemi için retriever"""
    
    def __init__(self):
        """Retriever'ı başlat - Lazy loading ile"""
        self._vector_db = None
        self._embedding_model = None
    
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
    
    def retrieve(
        self,
        query: str,
        location: Dict[str, float] = None,
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Kullanıcı sorgusuna göre ilgili mekanları bul
        
        Args:
            query: Kullanıcının doğal dil sorgusu
            location: Kullanıcı konumu (enlem, boylam)
            top_k: Döndürülecek sonuç sayısı
        
        Returns:
            İlgili mekanlar ve benzerlik skorları
        """
        top_k = top_k or settings.TOP_K_RESULTS
        
        # Sorguyu vektöre dönüştür
        query_embedding = self.embedding_model.encode_single(query)
        
        # Konum filtresi (opsiyonel)
        filter_dict = None
        if location:
            # Konum bazlı filtreleme eklenebilir
            pass
        
        # Vektör araması yap
        results = self.vector_db.search_vectors(
            query_vector=query_embedding,
            top_k=top_k,
            filter=filter_dict
        )
        
        return results

