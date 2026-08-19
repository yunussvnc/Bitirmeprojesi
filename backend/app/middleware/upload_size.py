from typing import Any

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

UPLOAD_REQUEST_LIMITS = {
    "/api/v1/upload/image": 12 * 1024 * 1024,
    "/api/v1/upload/video": 102 * 1024 * 1024,
}

_INVALID_CONTENT_LENGTH = {"detail": "Geçersiz Content-Length."}
_REQUEST_TOO_LARGE = {"detail": "Upload isteği izin verilen boyutu aşıyor."}


class UploadContentLengthMiddleware:
    """Upload gövdesini header kontrolü ve gerçek ASGI byte sayımıyla sınırlar."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        max_bytes = UPLOAD_REQUEST_LIMITS.get(scope.get("path", ""))
        if max_bytes is None:
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        raw_content_length = headers.get(b"content-length")
        if raw_content_length:
            try:
                content_length = int(raw_content_length)
            except ValueError:
                await self._send_json(scope, receive, send, 400, _INVALID_CONTENT_LENGTH)
                return
            if content_length < 0:
                await self._send_json(scope, receive, send, 400, _INVALID_CONTENT_LENGTH)
                return
            if content_length > max_bytes:
                await self._send_json(scope, receive, send, 413, _REQUEST_TOO_LARGE)
                return

        received_bytes = 0
        limit_exceeded = False
        pending_response: list[Message] = []

        async def limited_receive() -> Message:
            nonlocal limit_exceeded, received_bytes
            if limit_exceeded:
                return {"type": "http.disconnect"}

            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > max_bytes:
                    limit_exceeded = True
                    return {"type": "http.disconnect"}
            return message

        async def buffered_send(message: Message) -> None:
            pending_response.append(message)

        try:
            await self.app(scope, limited_receive, buffered_send)
        except Exception:
            if not limit_exceeded:
                raise

        if limit_exceeded:
            await self._send_json(scope, receive, send, 413, _REQUEST_TOO_LARGE)
            return

        for message in pending_response:
            await send(message)

    @staticmethod
    async def _send_json(
        scope: Scope,
        receive: Receive,
        send: Send,
        status_code: int,
        content: dict[str, Any],
    ) -> None:
        response = JSONResponse(status_code=status_code, content=content)
        await response(scope, receive, send)
