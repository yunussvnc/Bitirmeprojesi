"""
Embedding Model Yöneticisi
"""

from sentence_transformers import SentenceTransformer
from typing import List, Optional
from src.config import settings
import logging
import threading

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Embedding model yöneticisi - Lazy loading ve Singleton ile"""
    _shared_model = None  # Class-level shared model to prevent multiple loads
    _load_lock = threading.Lock()  # Eşzamanlı yükleme yarışını (race) engeller
    _threads_configured = False  # torch.set_num_(interop_)threads sadece bir kez çağrılabilir

    def __init__(self):
        """Embedding model yöneticisi - model lazy load edilir"""
        self.model_name = settings.EMBEDDING_MODEL
        self.device = settings.EMBEDDING_DEVICE

    @property
    def model(self) -> SentenceTransformer:
        """Model'i lazy load et ve paylaş"""
        if EmbeddingModel._shared_model is None:
            with EmbeddingModel._load_lock:
                # Lock alınana kadar başka bir thread zaten yüklemiş olabilir
                if EmbeddingModel._shared_model is None:
                    logger.info(f"Embedding model yükleniyor: {self.model_name}")
                    try:
                        # Thread limitlerini set et (sadece paralel iş başlamadan önce, tek sefer).
                        # Bir önceki yükleme denemesi başarısız olup buraya tekrar düşülürse
                        # torch.set_num_interop_threads ikinci kez çağrılamaz (RuntimeError verir),
                        # bu yüzden sadece ilk denemede çağrılır.
                        if not EmbeddingModel._threads_configured:
                            import torch
                            torch.set_num_threads(1)
                            torch.set_num_interop_threads(1)
                            EmbeddingModel._threads_configured = True

                        EmbeddingModel._shared_model = SentenceTransformer(
                            self.model_name,
                            device=self.device
                        )
                        logger.info(f"Embedding model başarıyla yüklendi ({self.device})")

                        # Garbage collector
                        import gc
                        gc.collect()
                    except Exception as e:
                        logger.error(f"Embedding model yüklenirken hata: {e}")
                        raise
        return EmbeddingModel._shared_model
    
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
            import torch
            with torch.no_grad():
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
            import torch
            with torch.no_grad():
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

