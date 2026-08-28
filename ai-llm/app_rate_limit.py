"""
Arama endpoint'leri için basit per-IP rate limiter.

Neden gerekli: boş/anormal sorgular (embedding'e giren ama cache'e düşmeyen
sorgular — özellikle çok kısa/anlamsız metinler) tüm mekan korpusunu (4735
mekan) yeniden encode ettirip container'ı CPU/RAM limitine kilitleyebiliyor
(prod'da gerçekten yaşandı: art arda birkaç istek CPU %190, RAM limite yakın
seviyeye çıkardı). Bu middleware, tek bir IP'nin art arda arama isteğiyle
servisi kilitlemesini engeller.

In-memory tutulur (Redis'e gerek yok): ai-llm tek instance/tek worker
çalışıyor, worker periyodik restart edildiğinde (bkz. Dockerfile
--limit-max-requests) sayaç sıfırlanır, bu kabul edilebilir çünkü amaç
güvenlik değil kaza/kötüye kullanım koruması.
"""

import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

_RATE_LIMITED_PREFIXES = ("/api/smart-search-v2", "/api/rag-search")
_MAX_REQUESTS = 20
_WINDOW_SECONDS = 60

_requests: dict[str, deque] = defaultdict(deque)


def _get_client_ip(request: Request) -> str:
    """nginx X-Real-IP'yi tercih eder (bkz. infra/nginx/conf.d/proxy.conf),
    yoksa doğrudan bağlantının adresine düşer (örn. backend'den docker-network
    içi çağrı)."""
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


class SearchRateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not any(path.startswith(prefix) for prefix in _RATE_LIMITED_PREFIXES):
            return await call_next(request)

        ip = _get_client_ip(request)
        now = time.time()
        window = _requests[ip]
        while window and now - window[0] > _WINDOW_SECONDS:
            window.popleft()

        if len(window) >= _MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla arama isteği gönderdiniz. Lütfen birkaç saniye bekleyip tekrar deneyin."},
            )

        window.append(now)
        return await call_next(request)
