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
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_global_notification(user_id, notification_data))
        except RuntimeError:
            pass  # No running loop
        except Exception as e:
            logger.error(f"InAppProvider Hatası: {e}")


class PushProvider(NotificationProvider):
    """
    Expo Push Notification servisi üzerinden cihaza gerçek bildirim gönderir.
    User.push_token alanından token çekilerek push.py'deki send_push() çağrılır.
    """
    def __init__(self, db=None, actor_name: str = "Birisi"):
        self._db = db
        self._actor_name = actor_name

    async def send(self, user_id: int, notification_data: dict, push_extra: dict = None):
        try:
            if not self._db:
                return

            import models as _models
            from app.services.push import send_push, notification_push_content

            # Kullanıcının push token'ını al
            user = self._db.query(_models.User).filter(_models.User.id == user_id).first()
            if not user or not user.push_token:
                return  # Token kayıtlı değil; sessizce geç

            n_type = notification_data.get("type", "")
            content = notification_push_content(
                notif_type=n_type,
                actor_name=self._actor_name,
                extra=push_extra,
            )

            ok = await send_push(
                push_token=user.push_token,
                title=content["title"],
                body=content["body"],
                data=content.get("data"),
            )
            if ok:
                logger.info(
                    "📲 Push gönderildi → user_id=%s type=%s token=%.20s…",
                    user_id, n_type, user.push_token,
                )
            else:
                logger.warning(
                    "📲 Push gönderilemedi → user_id=%s type=%s",
                    user_id, n_type,
                )
        except Exception as e:
            logger.error(f"PushProvider Hatası: {e}")


class OmnichannelManager:
    """
    Novu Channel Manager: Gelen bildirimi önce veritabanına kaydeder (Repository Pattern),
    sonra kayıtlı tüm provider'lardan fırlatır (InApp, Push).
    """
    def __init__(self, repo, db=None):
        self.repo = repo
        self.db = db

    def notify(
        self,
        user_id: int,
        type: str,
        actor_id: int,
        post_id: Optional[int] = None,
        place_id: Optional[int] = None,
        payload: Optional[str] = None,
        comment_text: Optional[str] = None,
        push_extra: Optional[dict] = None,
    ):
        """Veritabanına yazar ve background task olarak provider'lara dağıtır."""
        # 1. DB (Munia Repo) Yazma
        notif = self.repo.create(
            user_id=user_id,
            type=type,
            actor_id=actor_id,
            post_id=post_id,
            place_id=place_id,
            payload=payload,
        )
        if not notif:
            return None

        # Aktör adını çek (push içeriği için)
        actor_name = "Birisi"
        if self.db and actor_id:
            try:
                import models as _models
                actor = self.db.query(_models.User).filter(_models.User.id == actor_id).first()
                if actor:
                    actor_name = actor.username or actor.first_name or "Birisi"
            except Exception:
                pass

        # Provider listesini her seferinde taze kur (PushProvider için db + actor bilgisi)
        providers = [
            InAppProvider(),
            PushProvider(db=self.db, actor_name=actor_name),
        ]

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
            for provider in providers:
                loop.create_task(provider.send(user_id, ws_data, push_extra))
        except RuntimeError:
            # Sync context — push'u fire-and-forget thread'de çalıştır
            import threading

            def _run_push():
                import asyncio as _asyncio
                _loop = _asyncio.new_event_loop()
                _asyncio.set_event_loop(_loop)
                try:
                    for provider in providers:
                        _loop.run_until_complete(provider.send(user_id, ws_data, push_extra))
                finally:
                    _loop.close()

            t = threading.Thread(target=_run_push, daemon=True)
            t.start()

        return notif
