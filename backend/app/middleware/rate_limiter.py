# middleware/rate_limiter.py — In-memory rate limiter

import hashlib
import ipaddress
import logging
import os
import time
from collections import defaultdict

# pyrefly: ignore [missing-import]
from fastapi import Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("asemos")

_ATOMIC_INCREMENT_WITH_EXPIRY = """
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if count == 1 or ttl < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""


async def _redis_increment_with_expiry(redis, key: str, ttl_seconds: int) -> int:
    return int(
        await redis.eval(
            _ATOMIC_INCREMENT_WITH_EXPIRY,
            1,
            key,
            ttl_seconds,
        )
    )

_DEFAULT_TRUSTED_PROXY_NETWORKS = "127.0.0.0/8,::1/128"


def _load_trusted_proxy_networks() -> tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, ...]:
    configured = os.getenv("TRUSTED_PROXY_NETWORKS", _DEFAULT_TRUSTED_PROXY_NETWORKS)
    networks = []
    for value in configured.split(","):
        value = value.strip()
        if not value:
            continue
        try:
            networks.append(ipaddress.ip_network(value, strict=False))
        except ValueError:
            logger.error("Geçersiz TRUSTED_PROXY_NETWORKS girdisi atlandı: %s", value)
    return tuple(networks)


TRUSTED_PROXY_NETWORKS = _load_trusted_proxy_networks()


def _normalize_ip(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return str(ipaddress.ip_address(value.strip()))
    except ValueError:
        return None


def _is_trusted_proxy(value: str | None) -> bool:
    normalized = _normalize_ip(value)
    if not normalized:
        return False
    address = ipaddress.ip_address(normalized)
    return any(address in network for network in TRUSTED_PROXY_NETWORKS)


def get_login_account_key(identifier: str) -> str:
    normalized = identifier.strip().casefold()
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return f"account:{digest}"


def get_ip_lock_key(ip: str) -> str:
    return f"ip:{ip}"


class RedisRateLimitStore:
    """Redis-backed fixed-window rate limiter (Render REDIS_URL)."""

    def __init__(self, redis):
        self._redis = redis

    async def is_locked_out(self, key: str) -> bool:
        if not self._redis:
            return False
        ttl = await self._redis.ttl(f"lockout:{key}")
        return ttl is not None and ttl > 0

    async def lock_out(self, key: str, duration_seconds: int = 900):
        if not self._redis:
            return
        await self._redis.setex(f"lockout:{key}", duration_seconds, "1")
        logger.warning("🔒 Rate-limit anahtarı kilitlendi (Redis): %s (%d saniye)", key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        if not self._redis:
            return True, max_requests
        redis_key = f"rate:{key}"
        count = await _redis_increment_with_expiry(
            self._redis,
            redis_key,
            window_seconds,
        )
        if count > max_requests:
            return False, 0
        return True, max_requests - count


class InMemoryRateLimitStore:
    """Simple in-memory fixed-window rate limiter for tests and local dev.
    Stores _requests and _lockouts dicts so tests can clear them.
    """
    def __init__(self):
        self._requests: dict[str, tuple[int, float, int]] = {}
        self._lockouts: dict[str, float] = {}  # key -> lock_expiry_ts
        self._last_prune = 0.0

    def _prune(self, now: float):
        if now - self._last_prune < 60:
            return
        for key, entry in list(self._requests.items()):
            if now - entry[1] >= entry[2]:
                self._requests.pop(key, None)
        for key, expiry in list(self._lockouts.items()):
            if expiry <= now:
                self._lockouts.pop(key, None)
        self._last_prune = now

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
        logger.warning("🔒 Rate-limit anahtarı kilitlendi (InMemory): %s (%d saniye)", key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        self._prune(now)
        entry = self._requests.get(key)
        if not entry:
            self._requests[key] = (1, now, window_seconds)
            return True, max_requests - 1
        count, start, _ = entry
        if now - start >= window_seconds:
            self._requests[key] = (1, now, window_seconds)
            return True, max_requests - 1
        count += 1
        self._requests[key] = (count, start, window_seconds)
        if count > max_requests:
            return False, 0
        return True, max_requests - count


class RateLimitStore:
    """Her zaman lokal sınır uygular, Redis'i dağıtık koordinasyon için ekler."""
    def __init__(self):
        self._inmemory = InMemoryRateLimitStore()
        # expose attrs for tests
        self._requests = self._inmemory._requests
        self._lockouts = self._inmemory._lockouts

    def _redis_store(self):
        from app.core.redis_client import get_redis
        try:
            redis = get_redis()
            return RedisRateLimitStore(redis) if redis else None
        except Exception as exc:
            logger.warning("Rate limit Redis istemcisi alınamadı: %s", exc)
            return None

    async def is_locked_out(self, key: str) -> bool:
        if await self._inmemory.is_locked_out(key):
            return True
        redis_store = self._redis_store()
        if redis_store:
            try:
                return await redis_store.is_locked_out(key)
            except Exception as exc:
                logger.warning("Rate limit Redis lock kontrolü başarısız: %s", exc)
        return False

    async def lock_out(self, key: str, duration_seconds: int = 900):
        await self._inmemory.lock_out(key, duration_seconds)
        redis_store = self._redis_store()
        if redis_store:
            try:
                await redis_store.lock_out(key, duration_seconds)
            except Exception as exc:
                logger.warning("Rate limit Redis lock yazımı başarısız: %s", exc)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        local_allowed, local_remaining = await self._inmemory.check_rate(
            key, max_requests, window_seconds
        )
        redis_store = self._redis_store()
        if not redis_store:
            return local_allowed, local_remaining
        try:
            redis_allowed, redis_remaining = await redis_store.check_rate(
                key, max_requests, window_seconds
            )
            return (
                local_allowed and redis_allowed,
                min(local_remaining, redis_remaining),
            )
        except Exception as exc:
            logger.warning("Rate limit Redis sayaç kontrolü başarısız: %s", exc)
            return local_allowed, local_remaining


# Global store (use facade so conftest can clear ._requests and ._lockouts)
_store = RateLimitStore()

MAX_FAILED_LOGINS = 10
LOCKOUT_DURATION = 900  # 15 dakika

# In-memory failed login counter: key -> (count, window_start_ts)
_failed_logins: dict[str, tuple[int, float]] = {}
_failed_logins_last_prune = 0.0

async def _record_failed_login_async(ip: str, account_identifier: str | None = None):
    """Internal async implementation that records failed login in Redis or in-memory store."""
    global _failed_logins_last_prune
    from app.core.redis_client import get_redis
    redis = None
    try:
        redis = get_redis()
    except Exception:
        redis = None

    targets = [get_ip_lock_key(ip)]
    if account_identifier:
        targets.append(get_login_account_key(account_identifier))

    now = time.time()
    if now - _failed_logins_last_prune >= 60:
        for stale_key, (_, window_start) in list(_failed_logins.items()):
            if now - window_start >= LOCKOUT_DURATION:
                _failed_logins.pop(stale_key, None)
        _failed_logins_last_prune = now

    for target in targets:
        local_count, window_start = _failed_logins.get(target, (0, now))
        if now - window_start >= LOCKOUT_DURATION:
            local_count, window_start = 0, now
        local_count += 1
        _failed_logins[target] = (local_count, window_start)
        if local_count >= MAX_FAILED_LOGINS:
            await _store.lock_out(target, LOCKOUT_DURATION)
            _failed_logins.pop(target, None)
            logger.warning("🚨 Brute-force anahtarı kilitlendi: %s", target.split(":", 1)[0])

        if redis:
            fail_key = f"failed_login:{target}"
            try:
                count = await _redis_increment_with_expiry(
                    redis,
                    fail_key,
                    LOCKOUT_DURATION,
                )
                if count >= MAX_FAILED_LOGINS:
                    await _store.lock_out(target, LOCKOUT_DURATION)
                    await redis.delete(fail_key)
            except Exception as exc:
                logger.warning("Başarısız login Redis sayacı kullanılamadı: %s", exc)


def _run_async_from_sync(func, *args):
    from anyio.from_thread import run
    import asyncio

    try:
        return run(func, *args)
    except RuntimeError as exc:
        if "AnyIO worker thread" not in str(exc):
            raise
        return asyncio.run(func(*args))


def record_failed_login(ip: str, account_identifier: str | None = None):
    """Public helper: run failed login logic synchronously from a sync endpoint
    using anyio to avoid creating new Redis connections.
    """
    try:
        _run_async_from_sync(_record_failed_login_async, ip, account_identifier)
    except Exception as e:
        logger.error(f"record_failed_login error: {e}")


async def _reset_failed_logins_async(ip: str, account_identifier: str | None = None):
    """Başarılı login sonrası Redis'teki sayacı sıfırla veya in-memory temizle"""
    from app.core.redis_client import get_redis
    redis = None
    try:
        redis = get_redis()
    except Exception:
        redis = None
    targets = [get_ip_lock_key(ip)]
    if account_identifier:
        targets.append(get_login_account_key(account_identifier))
    for target in targets:
        _failed_logins.pop(target, None)
    if redis:
        try:
            await redis.delete(*(f"failed_login:{target}" for target in targets))
        except Exception as exc:
            logger.warning("Başarısız login Redis sıfırlaması kullanılamadı: %s", exc)


def reset_failed_logins(ip: str, account_identifier: str | None = None):
    try:
        _run_async_from_sync(_reset_failed_logins_async, ip, account_identifier)
    except Exception as exc:
        logger.error("reset_failed_logins error: %s", exc)


async def _is_login_locked_async(ip: str, account_identifier: str) -> bool:
    return (
        await _store.is_locked_out(get_ip_lock_key(ip))
        or await _store.is_locked_out(get_login_account_key(account_identifier))
    )


def is_login_locked(ip: str, account_identifier: str) -> bool:
    return bool(_run_async_from_sync(_is_login_locked_async, ip, account_identifier))


def get_client_ip(request: Request) -> str:
    """Forwarded başlıklarını yalnız güvenilir doğrudan proxy'den kabul eder."""
    peer = _normalize_ip(request.client.host if request.client else None)
    if peer and _is_trusted_proxy(peer):
        # Nginx gelen XFF'yi silip tek bir doğrulanmış adres yazar.
        forwarded_values = request.headers.get("x-forwarded-for", "").split(",")
        if len(forwarded_values) == 1:
            forwarded = _normalize_ip(forwarded_values[0])
            if forwarded:
                return forwarded
        real_ip = _normalize_ip(request.headers.get("x-real-ip"))
        if real_ip:
            return real_ip
    return peer or "unknown"


# Rate limit kuralları: (path_prefix, max_requests, window_seconds)
# NOT: path'ler /api/v1 altında — router'lar main.py'de bu prefix ile mount ediliyor.
RATE_LIMIT_RULES = [
    ("/api/v1/auth/login", 50, 60),              # 50 req/dk (Geliştirme için artırıldı)
    ("/api/v1/auth/register", 30, 60),           # 30 req/dk
    ("/api/v1/auth/verify-register", 50, 300),   # 50 req/5 dk
    ("/api/v1/auth/resend-register-code", 30, 60),# 30 req/dk
    ("/api/v1/auth/forgot-password", 30, 60),    # 30 req/dk
    ("/api/v1/auth/reset-password", 50, 60),     # 50 req/dk
    ("/api/v1/auth/refresh", 15, 60),            # 15 req/dk
    ("/api/v1/upload/", 10, 60),                 # 10 req/dk
    ("/api/v1/recommend", 10, 60),               # 10 req/dk
]

if os.getenv("TESTING") == "1":
    # In test mode use tighter limits for faster, deterministic tests
    RATE_LIMIT_RULES = [
        ("/api/v1/auth/login", 6, 60),
        ("/api/v1/auth/register", 4, 60),
        ("/api/v1/auth/verify-register", 50, 300),
        ("/api/v1/auth/resend-register-code", 30, 60),
        ("/api/v1/auth/forgot-password", 30, 60),
        ("/api/v1/auth/reset-password", 50, 60),
        ("/api/v1/auth/refresh", 15, 60),
        ("/api/v1/upload/", 10, 60),
        ("/api/v1/recommend", 10, 60),
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
        if path in ("/health", "/health/ready", "/", "/docs", "/openapi.json", "/redoc") or path.startswith("/uploads/"):
            return await call_next(request)

        ip = get_client_ip(request)

        # IP kilidi kontrolü
        is_locked = await _store.is_locked_out(get_ip_lock_key(ip))
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
