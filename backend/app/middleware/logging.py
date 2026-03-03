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
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.time()

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 1)

        # Health check'i flood etmeyelim
        if request.url.path not in ("/health", "/docs", "/openapi.json"):
            logger.info(
                "[%s] %s %s → %s (%sms)",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

        response.headers["X-Request-ID"] = request_id
        return response
