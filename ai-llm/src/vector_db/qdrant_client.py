"""
Qdrant Vektör Veritabanı İstemcisi
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Optional, Dict, Any
import logging
from src.config import settings

logger = logging.getLogger(__name__)


class QdrantVectorDB:
    """Qdrant vektör veritabanı yöneticisi"""
    
    def __init__(self):
        """Qdrant client'ı başlat"""
        try:
            qdrant_url = (settings.QDRANT_URL or "").strip()
            # In-memory mode kontrolü
            if not qdrant_url or qdrant_url == ":memory:" or qdrant_url.lower() == "memory":
                logger.info("Qdrant in-memory mode kullanılıyor")
                self.client = QdrantClient(":memory:")
                self.storage_mode = "memory"
            else:
                # Remote/local server mode
                client_kwargs = {"url": qdrant_url}
                if settings.QDRANT_API_KEY:
                    client_kwargs["api_key"] = settings.QDRANT_API_KEY
                self.client = QdrantClient(**client_kwargs)
                self.storage_mode = "remote"
            
            self.collection_name = settings.QDRANT_COLLECTION_NAME
            
            # Bağlantıyı test et
            self._test_connection()
            logger.info(f"Qdrant bağlantısı başarılı: {qdrant_url or ':memory:'}")
        except Exception as e:
            logger.error(f"Qdrant bağlantısı kurulamadı: {e}")
            raise
    
    def _test_connection(self):
        """Qdrant bağlantısını test et"""
        try:
            self.client.get_collections()
        except Exception as e:
            logger.warning(f"Qdrant bağlantı testi başarısız: {e}")
            raise ConnectionError(f"Qdrant'a bağlanılamıyor: {e}")
    
    def create_collection_if_not_exists(self, vector_size: int = 384):
        """Koleksiyonu oluştur (yoksa)"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                logger.info(f"Koleksiyon oluşturuluyor: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Koleksiyon başarıyla oluşturuldu: {self.collection_name}")
            else:
                logger.info(f"Koleksiyon zaten mevcut: {self.collection_name}")
        except Exception as e:
            logger.error(f"Koleksiyon oluşturulurken hata: {e}")
            raise

    def collection_exists(self) -> bool:
        """Koleksiyon var mı?"""
        try:
            collections = self.client.get_collections()
            return self.collection_name in [col.name for col in collections.collections]
        except Exception as e:
            logger.error(f"Koleksiyon kontrolünde hata: {e}")
            return False

    def count_vectors(self) -> int:
        """Koleksiyondaki vektör sayısını döndür."""
        try:
            if not self.collection_exists():
                return 0
            result = self.client.count(
                collection_name=self.collection_name,
                exact=True
            )
            return int(result.count or 0)
        except Exception as e:
            logger.error(f"Vektör sayısı okunurken hata: {e}")
            return 0
    
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
        filter: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Vektör araması yap
        
        Args:
            query_vector: Arama vektörü
            top_k: Döndürülecek sonuç sayısı
            filter: Filtre (kategori, konum vb.)
            score_threshold: Minimum benzerlik skoru
        
        Returns:
            Arama sonuçları
        """
        try:
            score_threshold = score_threshold or settings.SIMILARITY_THRESHOLD
            
            # Qdrant filter oluştur
            qdrant_filter = None
            if filter:
                # Basit kategori filtresi örneği
                if "kategori" in filter:
                    qdrant_filter = Filter(
                        must=[
                            FieldCondition(
                                key="kategori",
                                match=MatchValue(value=filter["kategori"])
                            )
                        ]
                    )
            
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=top_k,
                query_filter=qdrant_filter,
                score_threshold=score_threshold
            )
            
            return [
                {
                    "id": result.id,
                    "score": float(result.score),
                    "payload": result.payload or {}
                }
                for result in results.points
            ]
        except Exception as e:
            logger.error(f"Vektör aramasında hata: {e}")
            return []
    
    def delete_vectors(self, point_ids: List[int]) -> bool:
        """Vektörleri sil"""
        try:
            from qdrant_client.models import PointIdsList
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=PointIdsList(points=point_ids)
            )
            return True
        except Exception as e:
            logger.error(f"Vektör silinirken hata: {e}")
            return False

