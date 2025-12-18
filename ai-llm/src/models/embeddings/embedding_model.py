"""
Embedding Model Yöneticisi
"""

from sentence_transformers import SentenceTransformer
from typing import List, Optional
from src.config import settings
import logging

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Embedding model yöneticisi - Lazy loading ile"""
    
    _instance: Optional['EmbeddingModel'] = None
    _model: Optional[SentenceTransformer] = None
    
    def __init__(self):
        """Embedding model yöneticisi - model lazy load edilir"""
        self._model = None
        self.model_name = settings.EMBEDDING_MODEL
        self.device = settings.EMBEDDING_DEVICE
    
    @property
    def model(self) -> SentenceTransformer:
        """Model'i lazy load et"""
        if self._model is None:
            logger.info(f"Embedding model yükleniyor: {self.model_name}")
            try:
                self._model = SentenceTransformer(
                    self.model_name,
                    device=self.device
                )
                logger.info(f"Embedding model başarıyla yüklendi ({self.device})")
            except Exception as e:
                logger.error(f"Embedding model yüklenirken hata: {e}")
                raise
        return self._model
    
    def encode(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Metinleri vektörlere dönüştür
        
        Args:
            texts: Metin listesi
            batch_size: Batch boyutu (büyük listeler için)
        
        Returns:
            Embedding vektörleri listesi
        """
        if not texts:
            return []
        
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=batch_size,
                show_progress_bar=len(texts) > 10
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding oluşturulurken hata: {e}")
            raise
    
    def encode_single(self, text: str) -> List[float]:
        """
        Tek bir metni vektöre dönüştür
        
        Args:
            text: Metin
        
        Returns:
            Embedding vektörü
        """
        if not text or not text.strip():
            raise ValueError("Boş metin embedding'e dönüştürülemez")
        
        try:
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Tek embedding oluşturulurken hata: {e}")
            raise
    
    def get_vector_size(self) -> int:
        """Vektör boyutunu döndür"""
        # Model yüklendikten sonra vektör boyutunu öğren
        # Örnek bir metin encode edip boyutunu al
        test_embedding = self.encode_single("test")
        return len(test_embedding)

