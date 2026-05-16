# middleware/sentry_middleware.py — Sentry Hata İzleme Middleware (FastAPI)
#
# Unhandled exception'ları Sentry'ye bildirir.
# SENTRY_DSN env yoksa sessizce devre dışı kalır.
#
# Kurulum: pip install sentry-sdk[fastapi]
# .env'ye ekle: SENTRY_DSN=https://xxx@sentry.io/yyy

import os
import logging

logger = logging.getLogger("asemos")

_sentry_sdk = None
_sentry_enabled = False


def init_sentry(app=None):
    """
    Sentry SDK'yı başlat. main.py'de çağrılmalı.
    DSN yoksa sessizce devre dışı kalır.
    """
    global _sentry_sdk, _sentry_enabled

    dsn = os.getenv("SENTRY_DSN", "")
    if not dsn:
        logger.info("⚠️  SENTRY_DSN bulunamadı, Sentry devre dışı.")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=os.getenv("ENVIRONMENT", "development"),
            traces_sample_rate=0.2,  # %20 trace sampling (prod performansı korur)
            profiles_sample_rate=0.1,  # %10 profiling
            send_default_pii=False,  # KVKK: Kişisel veri gönderme
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            # Hassas verileri filtrele
            before_send=_filter_sensitive_data,
        )

        _sentry_sdk = sentry_sdk
        _sentry_enabled = True
        logger.info("✅ Sentry başlatıldı (%s)", dsn[:40] + "...")
    except ImportError:
        logger.info("⚠️  sentry-sdk kurulu değil, Sentry devre dışı.")
    except Exception as e:
        logger.error("Sentry başlatma hatası: %s", str(e))


def _filter_sensitive_data(event, hint):
    """KVKK uyumlu: Hassas verileri Sentry'ye gönderme."""
    # Authorization header'ını temizle
    if "request" in event and "headers" in event["request"]:
        headers = event["request"]["headers"]
        if isinstance(headers, dict):
            headers.pop("authorization", None)
            headers.pop("Authorization", None)
        elif isinstance(headers, list):
            event["request"]["headers"] = [
                h for h in headers
                if not (isinstance(h, (list, tuple)) and h[0].lower() == "authorization")
            ]
    return event


def capture_exception(exc: Exception, **extra):
    """Hata yakala ve Sentry'ye gönder."""
    if not _sentry_enabled or not _sentry_sdk:
        return

    try:
        with _sentry_sdk.push_scope() as scope:
            for key, value in extra.items():
                scope.set_extra(key, value)
            _sentry_sdk.capture_exception(exc)
    except Exception:
        pass  # Sentry hatası uygulamayı kesmemeli


def capture_message(message: str, level: str = "info"):
    """Mesaj gönder (error olmayan ama önemli durumlar)."""
    if not _sentry_enabled or not _sentry_sdk:
        return
    try:
        _sentry_sdk.capture_message(message, level=level)
    except Exception:
        pass


def set_user(user_id: int, username: str = None):
    """Kullanıcı bilgisini Sentry'ye set et."""
    if not _sentry_enabled or not _sentry_sdk:
        return
    try:
        _sentry_sdk.set_user({"id": str(user_id), "username": username})
    except Exception:
        pass
