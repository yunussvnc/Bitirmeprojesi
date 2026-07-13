# main.py — AsEmOs Backend API (Modüler Yapı)

import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session

from database import engine, Base
import migrate
from config import get_settings
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

from app.routers import auth, users, places, reviews, feed, stories, notifications, upload, recommend, messages, saved, community, admin

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
# NOT: Migration burada ÇALIŞTIRILMAZ. Ayrı bir "migrate" Docker servisi
# (docker-compose.prod.yml) backend başlamadan önce `python migrate.py` ile
# migration'ları uygular — backend bunu asla otomatik tetiklemez. `migrate`
# modülü hâlâ import ediliyor çünkü /health/ready `migrate.schema_patch_status()`
# çağırıyor.
# ---------------------------------------------------------------------------
# Lifespan — Modern FastAPI startup/shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan context manager (on_event yerine)."""
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

    # WebSocket Heartbeat başlat (her 30 saniyede ping + Redis TTL uzat)
    await manager.start_heartbeat()

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

    yield  # Uygulama çalışıyor

    # Shutdown
    from app.core.redis_client import disconnect_redis
    await disconnect_redis()
    logger.info("🛑 API kapatılıyor...")


# ---------------------------------------------------------------------------
# FastAPI uygulaması
# ---------------------------------------------------------------------------
_docs_enabled = settings.ENVIRONMENT != "production"

app = FastAPI(
    title="AsEmOs - Mekan Öneri Sistemi API",
    description="Mekan öneri, sosyal akış, eşleşme ve gerçek zamanlı mesajlaşma platformu",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
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
# Router'ları bağla — hepsi /api/v1 altında (aggregation-layer versioning,
# router dosyalarının kendi prefix/tag tanımları değişmedi)
# ---------------------------------------------------------------------------
API_V1_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(places.router, prefix=API_V1_PREFIX)
app.include_router(reviews.router, prefix=API_V1_PREFIX)
app.include_router(feed.router, prefix=API_V1_PREFIX)
app.include_router(stories.router, prefix=API_V1_PREFIX)
app.include_router(notifications.router, prefix=API_V1_PREFIX)

app.include_router(upload.router, prefix=API_V1_PREFIX)
app.include_router(recommend.router, prefix=API_V1_PREFIX)
app.include_router(messages.router, prefix=API_V1_PREFIX)
app.include_router(saved.router, prefix=API_V1_PREFIX)
app.include_router(community.router, prefix=API_V1_PREFIX)
app.include_router(admin.router, prefix=API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Health & Root
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {"mesaj": "AsEmOs Backend API Aktif"}


@app.get("/health")
async def health_check():
    """
    Liveness — sadece process ayakta mı / event loop tıkanmış mı sorusuna
    cevap verir. Dış bağımlılık (DB/Redis/vb.) kontrol ETMEZ — Docker
    HEALTHCHECK ve restart kararı bu endpoint'e bağlı; DB/Redis kısa süreli
    kesintisinde process'i gereksiz yere restart etmemek için bilerek hafif
    tutuluyor. Bağımlılık kontrolleri için /health/ready kullanılır.
    """
    return {
        "status": "ok",
        "version": app.version,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health/ready")
async def readiness_check():
    """
    Readiness — trafik almaya gerçekten hazır mı: DB, Redis, WebSocket
    manager kontrol edilir. Groq/Cloudinary/SerpAPI gibi yavaş/kotalı dış
    servisler bilerek DIŞARIDA bırakıldı (onların yavaşlaması backend'i
    "hazır değil" göstermemeli).
    """
    from app.dependencies import get_db
    from app.websocket.manager import manager
    from app.core.redis_client import get_redis
    import models

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
            "websocket": {"online_users": ws_online},
        },
    }


@app.get("/api/versions")
def api_versions():
    return {
        "current": "v1",
        "minimum_supported": "v1",
        "latest_mobile": settings.LATEST_MOBILE_VERSION,
        "maintenance": settings.MAINTENANCE_MODE,
        "force_update": settings.FORCE_UPDATE,
    }


_SUPPORTED_API_VERSIONS = {"v1"}


@app.exception_handler(StarletteHTTPException)
async def api_version_aware_404_handler(request: Request, exc: StarletteHTTPException):
    """
    Starlette'in kendi 404/405 ayrımını bozmadan (bir route path'e eşleşip
    method'a eşleşmezse hâlâ normal 405 döner) — ve uygulama kodunun kasıtlı
    `raise HTTPException(404, detail=...)` çağrılarına (ör. "kullanıcı
    bulunamadı") dokunmadan, SADECE hiçbir route'un eşleşmediği gerçek
    "path yok" durumunda, path /api/{version}/... şeklindeyse versiyon
    bilgisiyle zenginleştirilmiş bir JSON hatası döner. Bir route eşleştiyse
    (endpoint çalışıp kendi 404'ünü fırlattıysa) request.scope["route"] dolu
    olur — bu ayrım sayesinde uygulama kodunun kendi 404 detail mesajları
    hiç değişmeden geçer.
    """
    route_matched = request.scope.get("route") is not None
    if exc.status_code == 404 and not route_matched and request.url.path.startswith("/api/"):
        segments = request.url.path.strip("/").split("/")
        version = segments[1] if len(segments) > 1 else ""
        if version not in _SUPPORTED_API_VERSIONS:
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": "UNSUPPORTED_API_VERSION",
                        "message": f"API versiyonu '{version}' desteklenmiyor.",
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    "supported_versions": sorted(_SUPPORTED_API_VERSIONS),
                },
            )
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "İstenen kaynak bulunamadı.",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            },
        )
    return await http_exception_handler(request, exc)

