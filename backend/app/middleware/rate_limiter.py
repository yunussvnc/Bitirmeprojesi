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


class RateLimitStore:
    """
    Sliding window rate limiter — bellek tabanlı.
    Her IP+endpoint çifti için son istek zaman damgalarını tutar.
    """

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lockouts: dict[str, float] = {}  # IP → lockout bitiş zamanı

    def _cleanup(self, key: str, window: int):
        """Pencere dışındaki eski kayıtları temizle"""
        now = time.time()
        self._requests[key] = [
            t for t in self._requests[key] if now - t < window
        ]

    def is_locked_out(self, key: str) -> bool:
        """IP kilidi kontrolü"""
        if key in self._lockouts:
            if time.time() < self._lockouts[key]:
                return True
            del self._lockouts[key]
        return False

    def lock_out(self, key: str, duration_seconds: int = 900):
        """IP'yi belirli süre kilitle (varsayılan 15 dk)"""
        self._lockouts[key] = time.time() + duration_seconds
        logger.warning("🔒 IP kilitlendi: %s (%d saniye)", key, duration_seconds)

    def check_rate(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        """
        Rate limit kontrolü.
        Returns: (izin_var_mı, kalan_hak)
        """
        self._cleanup(key, window_seconds)
        count = len(self._requests[key])

        if count >= max_requests:
            return False, 0

        self._requests[key].append(time.time())
        return True, max_requests - count - 1


# Global store
_store = RateLimitStore()

# Failed login sayacı (brute-force koruması)
_failed_logins: dict[str, int] = defaultdict(int)
MAX_FAILED_LOGINS = 10
LOCKOUT_DURATION = 900  # 15 dakika


def get_client_ip(request: Request) -> str:
    """Gerçek client IP'sini al (proxy arkasındaysa X-Forwarded-For)"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def record_failed_login(ip: str):
    """Başarısız login girişimini kaydet"""
    _failed_logins[ip] += 1
    if _failed_logins[ip] >= MAX_FAILED_LOGINS:
        _store.lock_out(ip, LOCKOUT_DURATION)
        _failed_logins[ip] = 0
        logger.warning("🚨 Brute-force tespit edildi: %s — %d dk kilitlendi", ip, LOCKOUT_DURATION // 60)


def reset_failed_logins(ip: str):
    """Başarılı login sonrası sayacı sıfırla"""
    _failed_logins.pop(ip, None)


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
        if _store.is_locked_out(ip):
            remaining = int(_store._lockouts.get(ip, 0) - time.time())
            return JSONResponse(
                status_code=429,
                content={"detail": f"Çok fazla başarısız deneme. {remaining} saniye sonra tekrar deneyin."},
            )

        # Endpoint bazlı rate limit
        for prefix, max_req, window in RATE_LIMIT_RULES:
            if path.startswith(prefix):
                key = f"{ip}:{prefix}"
                allowed, remaining = _store.check_rate(key, max_req, window)
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
        allowed, remaining = _store.check_rate(key, GENERAL_RATE_LIMIT, GENERAL_WINDOW)
        if not allowed:
            logger.warning("⚠️ Genel rate limit aşıldı: %s", ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin."},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

