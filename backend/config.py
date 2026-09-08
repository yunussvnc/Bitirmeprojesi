# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    # development | staging | production — prod'da /docs, /redoc, /openapi.json kapatılır.
    ENVIRONMENT: str = "development"
    # Production (Render): ALLOWED_ORIGINS=https://asemos.app,https://admin.asemos.app
    # Mobile native apps: ALLOWED_ORIGINS=* (veya boş bırakmayın — aşağıdaki varsayılan *)
    ALLOWED_ORIGINS: str = "*"
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 365
    PASSWORD_MIN_LENGTH: int = 8
    LLM_ENABLED: bool = True
    LLM_PROVIDER: str = "groq"
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "gemma2"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    RECOMMEND_CACHE_TTL: int = 1800
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    # Places API (New) — sadece backend/scripts/ içe aktarma script'leri için (IP kısıtlamalı ayrı key)
    GOOGLE_PLACES_API_KEY: str = ""
    SERPAPI_KEY: str = ""  # Google Maps yorumları (SerpAPI google_maps_reviews)
    # Social login token audiences. Use comma-separated values for *_ALLOWED_CLIENT_IDS.
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_ALLOWED_CLIENT_IDS: str = ""
    APPLE_CLIENT_ID: str = ""
    APPLE_ALLOWED_CLIENT_IDS: str = ""

    # E-posta (SMTP) ayarları — Gmail için App Password kullanılmalı
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""      # Gmail adresin (ör: asemos.tr@gmail.com)
    SMTP_PASS: str = ""      # Gmail App Password (16 karakterlik)
    SMTP_FROM: str = ""      # Gönderici adres (boşsa SMTP_USER kullanılır)

    # Geliştirme: SMTP yokken konsola mock log (prod'da kullanmayın)
    DEV_SKIP_EMAIL_VERIFICATION: bool = False

    # Explore harita pinleri: loaded_places.json → Postgres startup sync
    PLACES_SYNC_ON_STARTUP: bool = True
    PLACES_SYNC_MIN_RATIO: float = 0.95
    PLACES_JSON_PATH: str = "data/loaded_places.json"

    # /api/versions içinde döner — mobil app force-update/maintenance kill-switch'i
    LATEST_MOBILE_VERSION: str = "1.0.0"
    MAINTENANCE_MODE: bool = False
    FORCE_UPDATE: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
