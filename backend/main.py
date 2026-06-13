# main.py — AsEmOs Backend API (Modüler Yapı)

import os
import logging
from datetime import datetime

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, Base
import migrate
from config import get_settings
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

# Router'lar
from app.routers import auth, users, places, reviews, feed, stories, notifications, match, upload, recommend, messages, saved, community

# ---------------------------------------------------------------------------
# Logging konfigürasyonu
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("asemos")

# ---------------------------------------------------------------------------
# Konfigürasyon
# ---------------------------------------------------------------------------
settings = get_settings()

# ---------------------------------------------------------------------------
# Veritabanı tabloları
# ---------------------------------------------------------------------------
# Tabloları oluşturur (Zaten varsa atlar)
migrate.run_migrations(engine)

# ---------------------------------------------------------------------------
# FastAPI uygulaması
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AsEmOs - Mekan Öneri Sistemi API",
    description="Mekan öneri, sosyal akış, eşleşme ve gerçek zamanlı mesajlaşma platformu",
    version="2.0.0",
)

# ---------------------------------------------------------------------------
# Middleware (sıra önemli: önce error handler, sonra logging)
# ---------------------------------------------------------------------------
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggingMiddleware)

origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Statik dosya servisi
# ---------------------------------------------------------------------------
_uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

# ---------------------------------------------------------------------------
# Router'ları bağla
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(places.router)
app.include_router(reviews.router)
app.include_router(feed.router)
app.include_router(stories.router)
app.include_router(notifications.router)
app.include_router(match.router)
app.include_router(upload.router)
app.include_router(recommend.router)
app.include_router(messages.router)
app.include_router(saved.router)
app.include_router(community.router)


# ---------------------------------------------------------------------------
# Health & Root
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {"mesaj": "AsEmOs Backend API Aktif"}


@app.get("/health")
async def health_check():
    """
    Kapsamlı sistem sağlık kontrolü:
    - Veritabanı bağlantısı
    - Cloud storage durumu
    - LLM servisi
    - WebSocket aktif bağlantılar
    - Redis bağlantısı
    """
    from app.dependencies import get_db
    from app.websocket.manager import manager
    from app.core.redis_client import get_redis
    import models
    import cloud_storage

    # DB Kontrolü
    db_ok = False
    db = next(get_db())
    try:
        db.execute(models.Place.__table__.select().limit(1))
        db_ok = True
    except Exception:
        pass
    finally:
        db.close()

    # Redis Kontrolü
    redis_ok = False
    redis_err = None
    redis_client = get_redis()
    if redis_client:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception as e:
            redis_err = str(e)

    # Servis durumları
    cloud_ok = cloud_storage.is_configured()
    llm_active = settings.LLM_ENABLED if hasattr(settings, 'LLM_ENABLED') else False
    ws_online = len(manager._global_connections)

    schema_ok = True
    schema_checks: dict = {}
    if db_ok:
        try:
            schema_checks = migrate.schema_patch_status()
            schema_ok = all(schema_checks.values())
        except Exception:
            schema_ok = False

    overall = "ok" if db_ok and schema_ok and redis_ok else "degraded"

    return {
        "status": overall,
        "version": app.version,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": {"status": "ok" if db_ok else "error", "schema_patches": schema_checks},
            "redis": {"status": "ok" if redis_ok else "error", "detail": redis_err if not redis_ok else "connected"},
            "cloud_storage": {"status": "ok" if cloud_ok else "not_configured"},
            "llm": {"status": "active" if llm_active else "disabled", "provider": getattr(settings, 'LLM_PROVIDER', 'N/A')},
            "websocket": {"online_users": ws_online},
        },
    }


# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    import asyncio

    logger.info("🚀 AsEmOs API v2.0 başlatılıyor...")
    logger.info("📊 Veritabanı: %s", settings.DATABASE_URL.split("///")[-1])
    logger.info("🤖 LLM: %s (%s)", settings.LLM_PROVIDER, "aktif" if settings.LLM_ENABLED else "devre dışı")
    logger.info("☁️  Cloudinary: %s", "yapılandırılmış" if settings.CLOUDINARY_CLOUD_NAME else "yapılandırılmamış")
    logger.info("🔒 Rate Limiting: aktif")

    # Sentry başlat (DSN yoksa sessizce devre dışı kalır)
    try:
        from app.middleware.sentry_middleware import init_sentry
        init_sentry(app)
    except ImportError as exc:
        logger.warning("Sentry middleware yuklenemedi (%s); Sentry atlandi.", exc)

    # Güvenlik uyarıları
    if settings.JWT_SECRET_KEY == "dev-secret-change-in-production":
        logger.warning("⚠️  JWT_SECRET_KEY varsayılan değerde! Production'da mutlaka değiştirin!")
    if settings.ALLOWED_ORIGINS == "*":
        logger.warning("⚠️  ALLOWED_ORIGINS=* — Production'da spesifik origin'ler belirleyin!")

    # Redis başlat
    from app.core.redis_client import connect_redis
    await connect_redis()

    # WebSocket Redis Pub/Sub Listener başlat
    from app.websocket.manager import manager
    await manager.start_redis_listener()

    # Background scheduler başlat (Testlerde devre dışı bırak)
    if os.getenv("TESTING") != "1":
        from app.services.tasks import background_scheduler, cleanup_expired_stories
        cleanup_expired_stories()  # İlk başlangıçta bir kez çalıştır
        asyncio.create_task(background_scheduler())

    # Explore harita pinleri: DB bos/eksikse loaded_places.json upsert
    if os.getenv("TESTING") != "1" and settings.PLACES_SYNC_ON_STARTUP:
        async def _sync_places_bg():
            try:
                from scripts.sync_loaded_places import maybe_sync_places_on_startup
                json_path = settings.PLACES_JSON_PATH
                if not os.path.isabs(json_path):
                    json_path = os.path.join(os.path.dirname(__file__), json_path)
                await asyncio.to_thread(
                    maybe_sync_places_on_startup,
                    settings.DATABASE_URL,
                    json_path,
                    settings.PLACES_SYNC_MIN_RATIO,
                )
            except Exception as exc:
                logger.warning("Places sync basarisiz: %s", exc)

        asyncio.create_task(_sync_places_bg())
        logger.info("Postgres place sync arka planda kontrol edilecek...")

    logger.info("✅ API hazır!")

@app.on_event("shutdown")
async def shutdown_event():
    from app.core.redis_client import disconnect_redis
    await disconnect_redis()
    logger.info("🛑 API kapatılıyor...")