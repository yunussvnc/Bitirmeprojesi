"""
Uygulama Konfigürasyonu
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Uygulama ayarları"""
    
    # API Ayarları
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Mekan Öneri Platformu API"
    
    # Database Ayarları
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/mekan_onerisi"
    
    # Security Ayarları
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Ayarları (comma separated string olarak gelir, parse edilir)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081,exp://localhost:8081"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS origins listesi"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # AI Service URL (AI/LLM repository ile iletişim için)
    AI_SERVICE_URL: str = "http://localhost:8001"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

