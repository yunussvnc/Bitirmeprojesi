# middleware/error_handler.py — Global exception handler

import logging
import traceback
from datetime import datetime

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("asemos")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Tüm unhandled exception'ları yakalar, tutarlı JSON formatında döner.
    Production'da stacktrace gizlenir, Sentry'ye bildirilir, analytics'e kaydedilir.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(
                "Unhandled exception on %s %s: %s",
                request.method,
                request.url.path,
                str(exc),
                exc_info=True,
            )

            # Sentry'ye bildir (kuruluysa)
            try:
                from app.middleware.sentry_middleware import capture_exception
                capture_exception(exc, path=request.url.path, method=request.method)
            except Exception:
                pass

            # Analytics'e kaydet
            try:
                from app.services.analytics import track, BackendEvents
                track(BackendEvents.API_ERROR_500, properties={
                    "path": request.url.path,
                    "method": request.method,
                    "error": str(exc)[:200],
                })
            except Exception:
                pass

            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                },
            )

