"""
AI/LLM Servis Konfigürasyonu
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Uygulama ayarları"""
    
    # API Ayarları
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Mekan Öneri Platformu AI Service"
    
    # CORS Ayarları (comma separated string olarak gelir, parse edilir)
    CORS_ORIGINS: str = "http://localhost:8000,http://localhost:3000,http://localhost:8081"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS origins listesi"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Qdrant Vektör Veritabanı Ayarları
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "mekan_embeddings"
    
    # LLM Ayarları
    LLM_PROVIDER: str = "openai"  # openai, huggingface, local
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Embedding Model Ayarları
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    EMBEDDING_DEVICE: str = "cpu"  # cpu, cuda
    
    # RAG Ayarları
    TOP_K_RESULTS: int = 5  # Vektör aramada döndürülecek sonuç sayısı
    SIMILARITY_THRESHOLD: float = 0.7  # Minimum benzerlik skoru
    
    # Backend API URL (Mekan verilerini almak için)
    BACKEND_API_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

