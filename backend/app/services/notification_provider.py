# app/services/notification_provider.py
from abc import ABC, abstractmethod
import logging
import asyncio
from typing import Optional

logger = logging.getLogger("asemos")

class NotificationProvider(ABC):
    """Novu Provider Interface"""
    @abstractmethod
    async def send(self, user_id: int, notification_data: dict, push_extra: dict = None):
        pass

class InAppProvider(NotificationProvider):
    """WebSocket üzerinden anlık In-App bildirim gönderir."""
    async def send(self, user_id: int, notification_data: dict, push_extra: dict = None):
        try:
            from app.websocket.manager import manager
            # Yalnızca async loop varsa çalıştır
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_global_notification(user_id, notification_data))
        except RuntimeError:
            pass # No running loop
        except Exception as e:
            logger.error(f"InAppProvider Hatası: {e}")

class PushProvider(NotificationProvider):
    """
    FCM (Firebase) veya APNs üzerinden cihaza Push Notification atar.
    Şu an loglama yapar. FCM json yüklendiğinde anında çalışacak soyutlama katmanı.
    """
    async def send(self, user_id: int, notification_data: dict, push_extra: dict = None):
        try:
            # İleride FCM token'ı veritabanından çekilecek
            # target_user = repo.get_user(user_id)
            # if target_user and target_user.push_token: ...
            
            title = "AsemOS"
            body = "Yeni bir bildiriminiz var!"
            n_type = notification_data.get("type")
            
            if n_type == "follow_request":
                body = "Biri seni takip etmek istiyor."
            elif n_type == "like":
                body = "Gönderin beğenildi."
                
            logger.info(f"📲 [PUSH NOTIFICATION YOLKANDI] UserID: {user_id} | Title: {title} | Body: {body}")
            
            # import firebase_admin.messaging
            # message = messaging.Message(
            #     notification=messaging.Notification(title=title, body=body),
            #     token=target_user.push_token
            # )
            # messaging.send(message)
        except Exception as e:
            logger.error(f"PushProvider Hatası: {e}")

class OmnichannelManager:
    """
    Novu Channel Manager: Gelen bildirimi önce veritabanına kaydeder (Repository Pattern),
    sonra kayıtlı tüm provider'lardan fırlatır (InApp, Push, Email).
    """
    def __init__(self, repo):
        self.repo = repo
        self.providers: list[NotificationProvider] = [InAppProvider(), PushProvider()]

    def notify(
        self,
        user_id: int,
        type: str,
        actor_id: int,
        post_id: Optional[int] = None,
        place_id: Optional[int] = None,
        payload: Optional[str] = None,
        comment_text: Optional[str] = None,
        push_extra: Optional[dict] = None
    ):
        """Veritabanına yazar ve background task olarak provider'lara dağıtır."""
        # 1. DB (Munia Repo) Yazma
        notif = self.repo.create(
            user_id=user_id,
            type=type,
            actor_id=actor_id,
            post_id=post_id,
            place_id=place_id,
            payload=payload
        )
        if not notif:
            return None
            
        # 2. Provider'lara (Novu Channels) Dağıtım
        ws_data = {
            "id": notif.id,
            "type": notif.type,
            "actor_id": notif.actor_id,
            "post_id": notif.post_id,
            "place_id": notif.place_id,
            "payload": notif.payload,
            "group_key": notif.group_key,
            "created_at": notif.created_at.isoformat() if notif.created_at else None,
        }

        try:
            loop = asyncio.get_running_loop()
            for provider in self.providers:
                loop.create_task(provider.send(user_id, ws_data, push_extra))
        except RuntimeError:
            # Sync context
            pass
            
        return notif
