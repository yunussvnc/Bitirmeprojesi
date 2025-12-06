"""
Qdrant Vektör Veritabanı İstemcisi
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Optional, Dict, Any
from src.config import settings


class QdrantVectorDB:
    """Qdrant vektör veritabanı yöneticisi"""
    
    def __init__(self):
        """Qdrant client'ı başlat"""
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME
    
    def create_collection_if_not_exists(self, vector_size: int = 384):
        """Koleksiyonu oluştur (yoksa)"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            print(f"Koleksiyon oluşturulurken hata: {e}")
    
    def add_vectors(
        self,
        points: List[PointStruct]
    ) -> bool:
        """Vektörleri ekle"""
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            return True
        except Exception as e:
            print(f"Vektör eklenirken hata: {e}")
            return False
    
    def search_vectors(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Vektör araması yap"""
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                query_filter=filter,
                score_threshold=settings.SIMILARITY_THRESHOLD
            )
            
            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload
                }
                for result in results
            ]
        except Exception as e:
            print(f"Vektör aramasında hata: {e}")
            return []
    
    def delete_vectors(self, point_ids: List[int]) -> bool:
        """Vektörleri sil"""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=point_ids
            )
            return True
        except Exception as e:
            print(f"Vektör silinirken hata: {e}")
            return False

