# services/analytics.py — Backend Analitik Servisi
#
# API endpoint hit'lerini, response time'ları ve kritik aksiyonları kaydeder.
# Munia felsefesiyle hafif ve asenkron çalışır.
# Provider-agnostic: Şimdi log, ileride PostHog/Mixpanel bağlanabilir.

import logging
import time
from typing import Optional, Dict, Any
from collections import deque
from datetime import datetime

logger = logging.getLogger("asemos")

# In-memory event queue (hafif — Redis/Kafka gerektirmez)
_event_queue: deque = deque(maxlen=1000)
_analytics_enabled = True


def track(
    event: str,
    user_id: Optional[int] = None,
    properties: Optional[Dict[str, Any]] = None,
):
    """
    Backend event kaydet.

    Kullanım:
        analytics.track("post_created", user_id=42, properties={"post_type": "photo"})
        analytics.track("account_deleted", user_id=99)
    """
    if not _analytics_enabled:
        return

    entry = {
        "event": event,
        "user_id": user_id,
        "properties": properties or {},
        "timestamp": datetime.utcnow().isoformat(),
    }

    _event_queue.append(entry)

    # TODO: PostHog veya Mixpanel'e gönder
    # Örnek PostHog:
    #   posthog.capture(distinct_id=str(user_id), event=event, properties=properties)

    logger.debug("📊 Analytics: %s (user=%s)", event, user_id)


def get_recent_events(limit: int = 50) -> list:
    """Son N event'i döndür (debug/admin paneli için)."""
    return list(_event_queue)[-limit:]


# --- Predefined Backend Event İsimleri ---
class BackendEvents:
    # Hesap
    USER_REGISTERED = "user_registered"
    USER_LOGIN = "user_login"
    USER_LOGOUT_ALL = "user_logout_all"
    ACCOUNT_DEACTIVATED = "account_deactivated"
    ACCOUNT_DELETED = "account_deleted"

    # İçerik
    POST_CREATED = "post_created"
    POST_DELETED = "post_deleted"
    STORY_CREATED = "story_created"
    REVIEW_CREATED = "review_created"

    # Sosyal
    FOLLOW_CREATED = "follow_created"
    FOLLOW_ACCEPTED = "follow_accepted"
    MESSAGE_SENT = "message_sent"
    COMMUNITY_ROOM_CREATED = "community_room_created"

    # Mekan
    PLACE_CREATED = "place_created"
    NEARBY_SEARCH = "nearby_search"
    QR_VERIFIED = "qr_verified"

    # Sistem
    API_ERROR_500 = "api_error_500"
    SLOW_QUERY = "slow_query"
