"""
Embedding Model Yöneticisi
"""

from sentence_transformers import SentenceTransformer
from typing import List
from src.config import settings


class EmbeddingModel:
    """Embedding model yöneticisi"""
    
    def __init__(self):
        """Embedding modelini yükle"""
        self.model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            device=settings.EMBEDDING_DEVICE
        )
    
    def encode(self, texts: List[str]) -> List[List[float]]:
        """Metinleri vektörlere dönüştür"""
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings.tolist()
    
    def encode_single(self, text: str) -> List[float]:
        """Tek bir metni vektöre dönüştür"""
        embedding = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding.tolist()

