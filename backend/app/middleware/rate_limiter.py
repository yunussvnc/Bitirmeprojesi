# middleware/rate_limiter.py — In-memory rate limiter

import time
import os
import logging
from collections import defaultdict

# pyrefly: ignore [missing-import]
from fastapi import Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("asemos")


class RedisRateLimitStore:
    """Redis-backed fixed-window rate limiter (Render REDIS_URL)."""

    def __init__(self):
        from app.core.redis_client import get_redis
        self._redis = get_redis()

    async def is_locked_out(self, key: str) -> bool:
        if not self._redis:
            return False
        ttl = await self._redis.ttl(f"lockout:{key}")
        return ttl is not None and ttl > 0

    async def lock_out(self, key: str, duration_seconds: int = 900):
        if not self._redis:
            return
        await self._redis.setex(f"lockout:{key}", duration_seconds, "1")
        logger.warning("🔒 IP kilitlendi (Redis): %s (%d saniye)", key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        if not self._redis:
            return True, max_requests
        redis_key = f"rate:{key}"
        count = await self._redis.incr(redis_key)
        if count == 1:
            await self._redis.expire(redis_key, window_seconds)
        if count > max_requests:
            return False, 0
        return True, max_requests - count


class InMemoryRateLimitStore:
    """Simple in-memory fixed-window rate limiter for tests and local dev.
    Stores _requests and _lockouts dicts so tests can clear them.
    """
    def __init__(self):
        self._requests: dict[str, tuple[int, float]] = {}  # key -> (count, window_start_ts)
        self._lockouts: dict[str, float] = {}  # key -> lock_expiry_ts

    async def is_locked_out(self, key: str) -> bool:
        exp = self._lockouts.get(key)
        if not exp:
            return False
        if time.time() < exp:
            return True
        # expired
        del self._lockouts[key]
        return False

    async def lock_out(self, key: str, duration_seconds: int = 900):
        self._lockouts[key] = time.time() + duration_seconds
        logger.warning("🔒 IP kilitlendi (InMemory): %s (%d saniye)", key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        entry = self._requests.get(key)
        if not entry:
            self._requests[key] = (1, now)
            return True, max_requests - 1
        count, start = entry
        if now - start >= window_seconds:
            self._requests[key] = (1, now)
            return True, max_requests - 1
        count += 1
        self._requests[key] = (count, start)
        if count > max_requests:
            return False, 0
        return True, max_requests - count


class RateLimitStore:
    """Facade that uses Redis if available, otherwise falls back to in-memory store.
    Exposes _requests and _lockouts attributes for tests to clear.
    """
    def __init__(self):
        from app.core.redis_client import get_redis
        redis = None
        try:
            redis = get_redis()
        except Exception:
            redis = None
        self._inmemory = InMemoryRateLimitStore()
        self._use_redis = bool(redis)
        self._redis_store = None
        if self._use_redis:
            # lazily use RedisRateLimitStore implementation if needed
            self._redis_store = RedisRateLimitStore()
        # expose attrs for tests
        self._requests = self._inmemory._requests
        self._lockouts = self._inmemory._lockouts

    async def is_locked_out(self, key: str) -> bool:
        if self._use_redis and self._redis_store:
            return await self._redis_store.is_locked_out(key)
        return await self._inmemory.is_locked_out(key)

    async def lock_out(self, key: str, duration_seconds: int = 900):
        if self._use_redis and self._redis_store:
            return await self._redis_store.lock_out(key, duration_seconds)
        return await self._inmemory.lock_out(key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        if self._use_redis and self._redis_store:
            return await self._redis_store.check_rate(key, max_requests, window_seconds)
        return await self._inmemory.check_rate(key, max_requests, window_seconds)


# Global store (use facade so conftest can clear ._requests and ._lockouts)
_store = RateLimitStore()

MAX_FAILED_LOGINS = 10
LOCKOUT_DURATION = 900  # 15 dakika

# In-memory failed login counter (used when Redis unavailable)
_failed_logins: dict[str, int] = {}

async def _record_failed_login_async(ip: str):
    """Internal async implementation that records failed login in Redis or in-memory store."""
    from app.core.redis_client import get_redis
    redis = None
    try:
        redis = get_redis()
    except Exception:
        redis = None

    if redis:
        fail_key = f"failed_login:{ip}"
        count = await redis.incr(fail_key)
        if count == 1:
            await redis.expire(fail_key, LOCKOUT_DURATION)
        if count >= MAX_FAILED_LOGINS:
            await _store.lock_out(ip, LOCKOUT_DURATION)
            await redis.delete(fail_key)
            logger.warning("🚨 Brute-force tespit edildi: %s — %d dk kilitlendi", ip, LOCKOUT_DURATION // 60)
    else:
        cnt = _failed_logins.get(ip, 0) + 1
        _failed_logins[ip] = cnt
        if cnt >= MAX_FAILED_LOGINS:
            await _store.lock_out(ip, LOCKOUT_DURATION)
            _failed_logins.pop(ip, None)
            logger.warning("🚨 Brute-force tespit edildi: %s — %d dk kilitlendi", ip, LOCKOUT_DURATION // 60)


def record_failed_login(ip: str):
    """Public helper: schedule the async failed-login recorder in the running loop.
    This allows call sites (sync endpoints) to call record_failed_login(...) without awaiting.
    """
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        # schedule without awaiting
        loop.create_task(_record_failed_login_async(ip))
    except RuntimeError:
        # No running loop — run synchronously (rare in tests)
        asyncio.run(_record_failed_login_async(ip))

async def reset_failed_logins(ip: str):
    """Başarılı login sonrası Redis'teki sayacı sıfırla veya in-memory temizle"""
    from app.core.redis_client import get_redis
    redis = None
    try:
        redis = get_redis()
    except Exception:
        redis = None
    if redis:
        await redis.delete(f"failed_login:{ip}")
    else:
        _failed_logins.pop(ip, None)


def get_client_ip(request: Request) -> str:
    """Gerçek client IP'sini al (proxy arkasındaysa X-Forwarded-For)"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Rate limit kuralları: (path_prefix, max_requests, window_seconds)
RATE_LIMIT_RULES = [
    ("/auth/login", 50, 60),              # 50 req/dk (Geliştirme için artırıldı)
    ("/auth/register", 30, 60),           # 30 req/dk
    ("/auth/verify-register", 50, 300),   # 50 req/5 dk
    ("/auth/resend-register-code", 30, 60),# 30 req/dk
    ("/auth/forgot-password", 30, 60),    # 30 req/dk
    ("/auth/reset-password", 50, 60),     # 50 req/dk
    ("/auth/refresh", 15, 60),            # 15 req/dk
    ("/upload/", 10, 60),                 # 10 req/dk
    ("/recommend", 10, 60),               # 10 req/dk
]

if os.getenv("TESTING") == "1":
    # In test mode use tighter limits for faster, deterministic tests
    RATE_LIMIT_RULES = [
        ("/auth/login", 6, 60),
        ("/auth/register", 4, 60),
        ("/auth/verify-register", 50, 300),
        ("/auth/resend-register-code", 30, 60),
        ("/auth/forgot-password", 30, 60),
        ("/auth/reset-password", 50, 60),
        ("/auth/refresh", 15, 60),
        ("/upload/", 10, 60),
        ("/recommend", 10, 60),
    ]

# Genel limit
GENERAL_RATE_LIMIT = 120  # 120 req/dk
GENERAL_WINDOW = 60


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Endpoint bazlı ve genel rate limiting middleware.
    Auth endpoint'leri daha sıkı limitlenir.
    """

    async def dispatch(self, request: Request, call_next):
        # GET /health, /docs gibi endpoint'leri atla
        path = request.url.path
        if path in ("/health", "/", "/docs", "/openapi.json", "/redoc") or path.startswith("/uploads/"):
            return await call_next(request)

        ip = get_client_ip(request)

        # IP kilidi kontrolü
        is_locked = await _store.is_locked_out(ip)
        if is_locked:
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin."},
            )

        # Endpoint bazlı rate limit
        for prefix, max_req, window in RATE_LIMIT_RULES:
            if path.startswith(prefix):
                key = f"{ip}:{prefix}"
                allowed, remaining = await _store.check_rate(key, max_req, window)
                if not allowed:
                    logger.warning("⚠️ Rate limit aşıldı: %s → %s", ip, prefix)
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin."},
                    )
                response = await call_next(request)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
                return response

        # Genel rate limit
        key = f"{ip}:general"
        allowed, remaining = await _store.check_rate(key, GENERAL_RATE_LIMIT, GENERAL_WINDOW)
        if not allowed:
            logger.warning("⚠️ Genel rate limit aşıldı: %s", ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin."},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

