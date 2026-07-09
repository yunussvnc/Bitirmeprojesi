# middleware/logging.py — Structured request/response logging

import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("asemos")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Her request için:
    - Unique request ID atar
    - Method, path, status code ve response süresi loglar
    """

    async def dispatch(self, request: Request, call_next):
        # İstemci (mobil app) veya nginx zaten bir X-Request-ID ürettiyse onu
        # kullan — uçtan uca korelasyon zinciri kırılmasın. Yoksa burada üret.
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.time()

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 1)

        # Health check'i flood etmeyelim
        if request.url.path not in ("/health", "/health/ready", "/docs", "/openapi.json"):
            app_version = request.headers.get("X-App-Version")
            build_number = request.headers.get("X-Build-Number")
            app_platform = request.headers.get("X-App-Platform")
            user_agent = request.headers.get("User-Agent")
            client_info = ""
            if app_version or build_number or app_platform:
                client_info = f" [app={app_version or '?'} build={build_number or '?'} platform={app_platform or '?'}]"
            elif user_agent:
                client_info = f" [ua={user_agent}]"
            logger.info(
                "[%s] %s %s → %s (%sms)%s",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                client_info,
            )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-API-Version"] = "v1"
        return response
