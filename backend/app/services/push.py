# services/push.py — Expo Push Notification servisi

import logging
import httpx
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger("asemos")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(
    push_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    badge: Optional[int] = None,
    sound: str = "default",
) -> bool:
    """
    Tek bir Expo push notification gönder.
    Returns: True = başarılı, False = hata
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        return False

    message = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": sound,
    }
    if data:
        message["data"] = data
    if badge is not None:
        message["badge"] = badge

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            result = resp.json()

            if resp.status_code == 200:
                ticket = result.get("data", {})
                if ticket.get("status") == "error":
                    detail = ticket.get("details", {})
                    if detail.get("error") == "DeviceNotRegistered":
                        logger.warning("📱 Push token geçersiz (DeviceNotRegistered): %s", push_token[:30])
                        return False
                    logger.warning("📱 Push hatası: %s", ticket.get("message"))
                    return False
                return True
            else:
                logger.error("📱 Expo Push API hatası: %d — %s", resp.status_code, resp.text[:200])
                return False

    except Exception as e:
        logger.error("📱 Push gönderim hatası: %s", str(e))
        return False


async def send_push_batch(messages: List[dict]) -> List[bool]:
    """
    Toplu push notification gönder.
    Her message: {"to": token, "title": ..., "body": ..., "data": ...}
    """
    if not messages:
        return []

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            if resp.status_code == 200:
                tickets = resp.json().get("data", [])
                return [t.get("status") == "ok" for t in tickets]
    except Exception as e:
        logger.error("📱 Toplu push hatası: %s", str(e))

    return [False] * len(messages)


# --- Bildirim tipi → Push içeriği ---

def notification_push_content(
    notif_type: str,
    actor_name: str = "Birisi",
    extra: Optional[dict] = None,
) -> dict:
    """
    Bildirim tipine göre push başlık ve mesaj döndür.
    Returns: {"title": ..., "body": ..., "data": ...}
    """
    templates = {
        "like": {
            "title": "❤️ Beğeni",
            "body": f"{actor_name} gönderini beğendi",
        },
        "comment": {
            "title": "💬 Yorum",
            "body": f"{actor_name} gönderine yorum yaptı",
        },
        "follow": {
            "title": "👤 Yeni Takipçi",
            "body": f"{actor_name} seni takip etmeye başladı",
        },
        "match": {
            "title": "🔥 Yeni Eşleşme!",
            "body": f"{actor_name} ile eşleştin!",
        },
        "message": {
            "title": f"💬 {actor_name}",
            "body": extra.get("preview", "Yeni mesaj") if extra else "Yeni mesaj",
        },
    }

    template = templates.get(notif_type, {
        "title": "AsEmOs",
        "body": f"{actor_name} bir etkileşimde bulundu",
    })

    data = {"type": notif_type}
    if extra:
        data.update(extra)

    return {
        "title": template["title"],
        "body": template["body"],
        "data": data,
    }
