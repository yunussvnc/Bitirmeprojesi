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
    Production'da stacktrace gizlenir, sadece log'a yazılır.
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
