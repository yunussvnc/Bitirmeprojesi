"""
RAG Retriever - Vektör araması ile ilgili mekanları bulur
"""

from typing import List, Dict, Any
from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.config import settings


class RAGRetriever:
    """RAG sistemi için retriever"""
    
    def __init__(self):
        """Retriever'ı başlat"""
        self.vector_db = QdrantVectorDB()
        self.embedding_model = EmbeddingModel()
    
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

