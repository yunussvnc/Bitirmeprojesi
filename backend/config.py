from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:123@localhost:5432/ai_mekan_oneri_db"
    ALLOWED_ORIGINS: str = "*"
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_MIN_LENGTH: int = 6
    LLM_ENABLED: bool = True
    LLM_PROVIDER: str = "groq"  # groq (default), openai, veya ollama
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "gemma2"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    RECOMMEND_CACHE_TTL: int = 1800
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    # Social login token audiences. Use comma-separated values for *_ALLOWED_CLIENT_IDS.
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_ALLOWED_CLIENT_IDS: str = ""
    APPLE_CLIENT_ID: str = ""
    APPLE_ALLOWED_CLIENT_IDS: str = ""
    
    # Admin güvenlik anahtarı - test kullanıcısı oluşturma için
    ADMIN_SECRET_KEY: str = "test-admin-secret-2024"

    # E-posta (SMTP) ayarları — Gmail için App Password kullanılmalı
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""      # Gmail adresin (ör: asemos.app@gmail.com)
    SMTP_PASS: str = ""      # Gmail App Password (16 karakterlik)
    SMTP_FROM: str = ""      # Gönderici adres (boşsa SMTP_USER kullanılır)

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
