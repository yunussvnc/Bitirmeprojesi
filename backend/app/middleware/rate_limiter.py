# middleware/rate_limiter.py — In-memory rate limiter

import time
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
    """
    Redis tabanlı dağıtık (distributed) rate limiter.
    Çoklu sunucu ortamında (Multi-Node) güvenli hız sınırlaması sağlar.
    INCR ve EXPIRE komutlarıyla Fixed Window algoritması kullanır.
    """

    async def is_locked_out(self, key: str) -> bool:
        """IP kilidi kontrolü"""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if not redis:
            return False
            
        lock_key = f"lockout:{key}"
        return await redis.exists(lock_key) > 0

    async def lock_out(self, key: str, duration_seconds: int = 900):
        """IP'yi belirli süre kilitle (varsayılan 15 dk)"""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if not redis:
            return
            
        lock_key = f"lockout:{key}"
        await redis.setex(lock_key, duration_seconds, "1")
        logger.warning("🔒 IP kilitlendi (Redis): %s (%d saniye)", key, duration_seconds)

    async def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        """
        Rate limit kontrolü.
        Returns: (izin_var_mı, kalan_hak)
        """
        from app.core.redis_client import get_redis
        redis = get_redis()
        
        # Redis yoksa trafiği kesme (Graceful degradation)
        if not redis:
            return True, max_requests
            
        rate_key = f"ratelimit:{key}"
        
        try:
            # Pipeline ile iki işlemi atomik yap
            pipe = redis.pipeline()
            pipe.incr(rate_key)
            # Kaç saniye ömrü kaldığını kontrol et (yoksa -1 veya -2 döner)
            pipe.ttl(rate_key)
            results = await pipe.execute()
            
            count = results[0]
            ttl = results[1]
            
            # Anahtar yeni oluşturulduysa TTL set et
            if count == 1 or ttl < 0:
                await redis.expire(rate_key, window_seconds)
                
            if count > max_requests:
                return False, 0
                
            return True, max_requests - count
            
        except Exception as e:
            logger.error("Rate limiter hatası: %s", str(e))
            return True, max_requests


# Global store
_store = RedisRateLimitStore()

MAX_FAILED_LOGINS = 10
LOCKOUT_DURATION = 900  # 15 dakika

async def record_failed_login(ip: str):
    """Başarısız login girişimini Redis'e kaydet"""
    from app.core.redis_client import get_redis
    redis = get_redis()
    if not redis:
        return
        
    fail_key = f"failed_login:{ip}"
    count = await redis.incr(fail_key)
    if count == 1:
        await redis.expire(fail_key, LOCKOUT_DURATION)
        
    if count >= MAX_FAILED_LOGINS:
        await _store.lock_out(ip, LOCKOUT_DURATION)
        await redis.delete(fail_key)
        logger.warning("🚨 Brute-force tespit edildi: %s — %d dk kilitlendi", ip, LOCKOUT_DURATION // 60)

async def reset_failed_logins(ip: str):
    """Başarılı login sonrası Redis'teki sayacı sıfırla"""
    from app.core.redis_client import get_redis
    redis = get_redis()
    if redis:
        await redis.delete(f"failed_login:{ip}")


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

