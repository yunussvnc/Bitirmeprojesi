# websocket/manager.py — WebSocket Connection Manager (Redis Pub/Sub Enhanced)

import json
import logging
import asyncio
import os
import uuid
from typing import Dict, Set
# pyrefly: ignore [missing-import]
from fastapi import WebSocket

from app.websocket.auth import WebSocketPrincipal, load_websocket_session_states

logger = logging.getLogger("asemos")


class ConnectionManager:
    """
    Redis Pub/Sub tabanlı Dağıtık (Distributed) WebSocket Yöneticisi.
    Çoklu sunucu ortamında (Multi-Node) farklı sunuculardaki kullanıcıların
    birbirine mesaj atabilmesini sağlar.
    """

    def __init__(self):
        # Local (RAM) bağlantıları tutarız. Sadece bu sunucuya bağlı olanlar.
        # conversation_id/room_key → user_id → aynı kullanıcıya ait socket kümesi
        self._conversations: Dict[str, Dict[int, Set[WebSocket]]] = {}
        # user_id → connection key → socket kümesi
        self._user_connections: Dict[int, Dict[str, Set[WebSocket]]] = {}
        # Global notification connections: user_id -> set of WebSockets
        self._global_connections: Dict[int, Set[WebSocket]] = {}
        # Her lokal socket'in bağlandığı access token sürümü.
        self._session_principals: Dict[WebSocket, WebSocketPrincipal] = {}
        self._node_id = f"{os.getenv('HOSTNAME', 'local')}:{uuid.uuid4().hex}"
        # Bounded lock striping: aynı kullanıcı serialize olur, farklı kullanıcılar
        # 64 şeride kadar paralel Redis I/O yapabilir; lock tablosu büyümez.
        self._presence_locks = tuple(asyncio.Lock() for _ in range(64))
        
        # Redis PubSub listener task'ı
        self._listener_task = None
        # Heartbeat task
        self._heartbeat_task = None

    async def start_redis_listener(self):
        """Sunucu kalktığında Redis Pub/Sub kanalını dinlemeye başlar."""
        self._listener_task = asyncio.create_task(self._listen_loop())

    async def start_heartbeat(self):
        """Periyodik heartbeat görevini başlatır."""
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def _heartbeat_loop(self):
        """Her 30 saniyede bir tüm bağlı kullanıcılara ping gönderir ve Redis TTL'lerini uzatır."""
        logger.info("💓 WebSocket Heartbeat başlatıldı (30s aralık)")
        while True:
            try:
                await asyncio.sleep(30)
                await self.revalidate_local_sessions()
                await self.heartbeat_global()
            except asyncio.CancelledError:
                logger.info("💓 WebSocket Heartbeat durduruldu")
                break
            except Exception as e:
                logger.error("💓 Heartbeat hatası: %s", str(e))
                await asyncio.sleep(5)

    async def _listen_loop(self):
        """Redis'ten gelen mesajları okuyup lokal WebSocket'lere dağıtır (Otomatik Reconnect ile)."""
        from app.core.redis_client import get_pubsub_redis
        
        MAX_CONSECUTIVE_FAILURES = 5
        consecutive_failures = 0
        
        while True:
            try:
                redis = get_pubsub_redis()
                if not redis:
                    from app.core.redis_client import connect_redis
                    await connect_redis()
                    redis = get_pubsub_redis()
                if not redis:
                    logger.warning("Redis Pub/Sub bağlantısı yok, 10 saniye sonra tekrar deneyecek.")
                    await asyncio.sleep(10)
                    continue

                pubsub = redis.pubsub()
                await pubsub.subscribe("ws:cluster:events")
                logger.info("📡 Redis Pub/Sub WebSocket listener başlatıldı (Channel: ws:cluster:events)")

                # Bağlantı başarılı oldu → sayacı sıfırla
                consecutive_failures = 0

                async for message in pubsub.listen():
                    if message["type"] != "message":
                        continue
                        
                    try:
                        payload = json.loads(message["data"])
                        if payload.get("origin_node_id") == self._node_id:
                            continue
                        await self._dispatch_event(payload)

                    except json.JSONDecodeError:
                        pass
                    except Exception as e:
                        logger.error("Pub/Sub mesaj işleme hatası: %s", str(e))

            except asyncio.CancelledError:
                logger.info("🛑 Redis Pub/Sub listener durduruldu (Cancelled).")
                break
            except Exception as e:
                consecutive_failures += 1
                if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                    logger.warning(
                        "⚠️ Redis Pub/Sub %d kez üst üste başarısız oldu. "
                        "Lokal teslim devam ediyor; listener yeniden kurulacak.",
                        consecutive_failures
                    )
                else:
                    logger.warning(
                        "Pub/Sub listener bağlantı koptu (%s). Deneme %d/%d — 5 sn içinde yeniden bağlanılıyor...",
                        str(e), consecutive_failures, MAX_CONSECUTIVE_FAILURES
                    )
                try:
                    from app.core.redis_client import connect_redis
                    await connect_redis()
                except Exception:
                    pass
                await asyncio.sleep(5)

    async def _publish_event(self, payload: dict):
        """Önce lokal teslim et, sonra diğer node'lara best-effort yayınla."""
        from app.core.redis_client import get_redis
        event = {**payload, "origin_node_id": self._node_id}
        await self._dispatch_event(event)
        redis = get_redis()
        if redis:
            try:
                await redis.publish("ws:cluster:events", json.dumps(event))
            except Exception as e:
                logger.error("Redis publish hatası: %s", str(e))

    async def _dispatch_event(self, payload: dict):
        target_type = payload.get("target_type")
        data = payload.get("data")
        if target_type == "global":
            await self._local_send_global(payload.get("user_id"), data)
        elif target_type == "user":
            await self._local_send_to_user(
                payload.get("conversation_id"), payload.get("user_id"), data
            )
        elif target_type == "conversation_broadcast":
            await self._local_broadcast_to_conversation(
                payload.get("conversation_id"), data, payload.get("exclude_user_id")
            )
        elif target_type == "room_broadcast":
            await self._local_broadcast_to_room(
                payload.get("room_id"), data, payload.get("exclude_user_id")
            )
        elif target_type == "disconnect_user":
            await self._local_close_user_connections(
                int(payload.get("user_id")),
                payload.get("reason") or "Oturum sonlandırıldı",
                payload.get("max_token_version"),
            )

    async def _simulate_local_pubsub(self, message):
        """Redis yoksa fallback olarak sadece lokal RAM'de işle."""
        payload = json.loads(message["data"])
        await self._dispatch_event(payload)


    # --- GLOBAL BAĞLANTI (NOVU INBOX STYLE) ---

    def _principal_is_current(self, principal: WebSocketPrincipal) -> bool:
        state = load_websocket_session_states([principal.user_id]).get(principal.user_id)
        return state == (True, principal.token_version)

    def _remove_socket(self, websocket: WebSocket) -> int | None:
        principal = self._session_principals.pop(websocket, None)
        if not principal:
            return None

        user_id = principal.user_id
        global_sockets = self._global_connections.get(user_id)
        if global_sockets:
            global_sockets.discard(websocket)
            if not global_sockets:
                self._global_connections.pop(user_id, None)

        user_connections = self._user_connections.get(user_id, {})
        for connection_key, sockets in list(user_connections.items()):
            if websocket not in sockets:
                continue
            sockets.discard(websocket)
            if not sockets:
                user_connections.pop(connection_key, None)

            connection = self._conversations.get(connection_key, {})
            connection_sockets = connection.get(user_id, set())
            connection_sockets.discard(websocket)
            if not connection_sockets:
                connection.pop(user_id, None)
            if not connection:
                self._conversations.pop(connection_key, None)

        if not user_connections:
            self._user_connections.pop(user_id, None)
        return user_id

    async def _reject_stale_registration(
        self,
        websocket: WebSocket,
        principal: WebSocketPrincipal,
    ) -> bool:
        if self._principal_is_current(principal):
            return False
        self._remove_socket(websocket)
        try:
            await websocket.close(code=4001, reason="Oturum geçersiz")
        except Exception:
            pass
        return True

    async def connect_global(self, websocket: WebSocket, principal: WebSocketPrincipal) -> bool:
        user_id = principal.user_id
        await websocket.accept()
        if user_id not in self._global_connections:
            self._global_connections[user_id] = set()
        self._global_connections[user_id].add(websocket)
        self._session_principals[websocket] = principal
        if await self._reject_stale_registration(websocket, principal):
            return False
        logger.info("🔌 WS Global bağlandı: user=%d", user_id)
        # Redis'te online işaretle (hata olursa WS düşmesin)
        await self._set_user_online(user_id)
        return True

    def disconnect_global(self, websocket: WebSocket, user_id: int):
        self._remove_socket(websocket)
        if user_id not in self._global_connections and user_id not in self._user_connections:
            asyncio.create_task(self._clear_user_online(user_id))
        logger.info("🔌 WS Global ayrıldı: user=%d", user_id)

    async def send_global_notification(self, user_id: int, data: dict):
        """Redis Pub/Sub ile global bildirim at."""
        await self._publish_event({
            "target_type": "global",
            "user_id": user_id,
            "data": data
        })
        
        # Kullanıcı online ise push gönderme.
        # Önce: Bu sunucudaki lokal bellek bağlantılarını kontrol et (en güvenilir yol)
        # Global notification WS'e bağlı mı?
        is_online = user_id in self._global_connections and len(self._global_connections[user_id]) > 0
        
        # Herhangi bir chat/sohbet WS'ine bağlı mı? (Mesaj ekranındayken de push gelmesin)
        if not is_online:
            is_online = user_id in self._user_connections and len(self._user_connections[user_id]) > 0
        
        # Sonra: Lokal bağlantı yoksa Redis'e bak (multi-node / farklı sunucu durumu için)
        if not is_online:
            is_online = await self._is_user_online_redis(user_id)
            
        if not is_online:
            asyncio.create_task(self._send_push_notification(user_id, data))


    async def _send_push_notification(self, user_id: int, data: dict):
        """Push bildirimini güvenli şekilde gönderir."""
        try:
            from app.services.push_provider import trigger_push_notification
            
            title = "Yeni Bildirim"
            body = "AsemOS'tan yeni bir bildiriminiz var."

            if data.get("type") == "new_message":
                title = data.get("sender_name", title)
                body = data.get("content", body)
            else:
                title = data.get("title", title)
                body = data.get("message", body)
                
            await trigger_push_notification(user_id, title, body, data)
        except Exception as e:
            logger.error("Push notification hatası: %s", str(e))


    async def _local_send_global(self, user_id: int, data: dict):
        """Sadece lokal RAM'deki websocket'e gönderir."""
        await self.revalidate_local_sessions({user_id})
        if user_id in self._global_connections:
            disconnected = []
            for ws in self._global_connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect_global(ws, user_id)


    # --- BİREBİR (DM) SOHBET ---

    async def connect(
        self,
        websocket: WebSocket,
        conversation_id: int,
        principal: WebSocketPrincipal,
    ) -> bool:
        user_id = principal.user_id
        await websocket.accept()
        conv_key = str(conversation_id)
        connection = self._conversations.setdefault(conv_key, {})
        connection.setdefault(user_id, set()).add(websocket)
        self._session_principals[websocket] = principal

        user_connections = self._user_connections.setdefault(user_id, {})
        user_connections.setdefault(conv_key, set()).add(websocket)

        if await self._reject_stale_registration(websocket, principal):
            return False

        logger.info("🔌 WS bağlandı: user=%d, conv=%d", user_id, conversation_id)
        await self._set_user_online(user_id)
        return True

    def disconnect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        self._remove_socket(websocket)
        if user_id not in self._global_connections and user_id not in self._user_connections:
            asyncio.create_task(self._clear_user_online(user_id))
        logger.info("🔌 WS ayrıldı: user=%d, conv=%d", user_id, conversation_id)

    async def send_to_user(self, conversation_id: int, user_id: int, data: dict) -> bool:
        """Redis üzerinden gönder. Bu fonksiyon artık cluster genelinde çalışır."""
        await self._publish_event({
            "target_type": "user",
            "conversation_id": str(conversation_id),
            "user_id": user_id,
            "data": data
        })
        
        # Kullanıcı Redis'te online ise True (Delivered), değilse False (Sent) döner
        return await self._is_user_online_redis(user_id)

    async def _local_send_to_user(self, conversation_id: str, user_id: int, data: dict):
        await self.revalidate_local_sessions({user_id})
        conv = self._conversations.get(conversation_id, {})
        disconnected = []
        for websocket in list(conv.get(user_id, set())):
            try:
                await websocket.send_json(data)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(websocket, int(conversation_id), user_id)

    async def broadcast_to_conversation(self, conversation_id: int, data: dict, exclude_user_id: int | None = None):
        await self._publish_event({
            "target_type": "conversation_broadcast",
            "conversation_id": str(conversation_id),
            "exclude_user_id": exclude_user_id,
            "data": data
        })

    async def _local_broadcast_to_conversation(self, conversation_id: str, data: dict, exclude_user_id: int | None):
        await self.revalidate_local_sessions()
        conv = self._conversations.get(conversation_id, {})
        disconnected = []
        for uid, sockets in list(conv.items()):
            if exclude_user_id and uid == exclude_user_id:
                continue
            for websocket in list(sockets):
                try:
                    await websocket.send_json(data)
                except Exception:
                    disconnected.append((uid, websocket))
        for uid, websocket in disconnected:
            self.disconnect(websocket, int(conversation_id), uid)


    # --- COMMUNITY ROOM (TOPLULUK ODASI) ---

    async def connect_room(
        self,
        websocket: WebSocket,
        room_id: str,
        principal: WebSocketPrincipal,
    ) -> bool:
        user_id = principal.user_id
        await websocket.accept()
        room_key = f"room:{room_id}"
        connection = self._conversations.setdefault(room_key, {})
        connection.setdefault(user_id, set()).add(websocket)
        self._session_principals[websocket] = principal

        user_connections = self._user_connections.setdefault(user_id, {})
        user_connections.setdefault(room_key, set()).add(websocket)

        if await self._reject_stale_registration(websocket, principal):
            return False

        logger.info("🏠 WS Topluluk odası bağlandı: user=%d, room=%s", user_id, room_id)
        await self._set_user_online(user_id)
        return True

    def disconnect_room(self, websocket: WebSocket, room_id: str, user_id: int):
        self._remove_socket(websocket)
        if user_id not in self._global_connections and user_id not in self._user_connections:
            asyncio.create_task(self._clear_user_online(user_id))
        logger.info("🏠 WS Topluluk odası ayrıldı: user=%d, room=%s", user_id, room_id)

    async def broadcast_to_room(self, room_id: str, data: dict, exclude_user_id: int | None = None):
        await self._publish_event({
            "target_type": "room_broadcast",
            "room_id": room_id,
            "exclude_user_id": exclude_user_id,
            "data": data
        })

    async def _local_broadcast_to_room(self, room_id: str, data: dict, exclude_user_id: int | None):
        await self.revalidate_local_sessions()
        room_key = f"room:{room_id}"
        conv = self._conversations.get(room_key, {})
        disconnected = []
        for uid, sockets in list(conv.items()):
            if exclude_user_id and uid == exclude_user_id:
                continue
            for websocket in list(sockets):
                try:
                    await websocket.send_json(data)
                except Exception:
                    disconnected.append((uid, websocket))
        for uid, websocket in disconnected:
            self.disconnect_room(websocket, room_id, uid)


    # --- UTILS & ONLINE STATE (Redis) ---

    async def close_user_connections(
        self,
        user_id: int,
        reason: str = "Oturum sonlandırıldı",
        max_token_version: int | None = None,
    ):
        """Kullanıcının bu node ve diğer node'lardaki tüm socketlerini kapatır."""
        await self._publish_event({
            "target_type": "disconnect_user",
            "user_id": user_id,
            "reason": reason,
            "max_token_version": max_token_version,
        })

    async def _local_close_user_connections(
        self,
        user_id: int,
        reason: str,
        max_token_version: int | None = None,
    ):
        sockets = {
            websocket
            for websocket, principal in self._session_principals.items()
            if principal.user_id == user_id
            and (
                max_token_version is None
                or principal.token_version <= max_token_version
            )
        }

        for websocket in sockets:
            self._remove_socket(websocket)
            try:
                await websocket.close(code=4001, reason=reason)
            except Exception:
                pass

        if user_id not in self._global_connections and user_id not in self._user_connections:
            await self._clear_user_online(user_id)

    async def revalidate_local_sessions(self, user_ids: Set[int] | None = None):
        """Aktiflik veya token_version değişmiş lokal socketleri kapatır."""
        principals = [
            (websocket, principal)
            for websocket, principal in self._session_principals.items()
            if user_ids is None or principal.user_id in user_ids
        ]
        states = load_websocket_session_states(
            principal.user_id for _, principal in principals
        )
        for websocket, principal in principals:
            state = states.get(principal.user_id)
            if state == (True, principal.token_version):
                continue
            self._remove_socket(websocket)
            try:
                await websocket.close(code=4001, reason="Oturum geçersiz")
            except Exception:
                pass

    async def _set_user_online(self, user_id: int):
        """Kullanıcının online durumunu Redis'e yazar (Distributed state).
        Hata olursa sessizce geçer — WebSocket bağlantısını düşürmez."""
        async with self._presence_locks[user_id % len(self._presence_locks)]:
            from app.core.redis_client import get_redis
            redis = get_redis()
            if redis:
                try:
                    # 90 saniye TTL. Heartbeat her 30 saniyede uzatır.
                    await redis.setex(f"online_user:{user_id}:{self._node_id}", 90, "1")
                except Exception as e:
                    logger.warning("Redis set_user_online hatası (user=%d): %s", user_id, str(e))

    async def _clear_user_online(self, user_id: int):
        """Yalnız bu node'un online üyeliğini Redis'ten siler."""
        async with self._presence_locks[user_id % len(self._presence_locks)]:
            if user_id in self._global_connections or user_id in self._user_connections:
                return
            from app.core.redis_client import get_redis
            redis = get_redis()
            if redis:
                try:
                    await redis.delete(f"online_user:{user_id}:{self._node_id}")
                except Exception:
                    pass

    async def _is_user_online_redis(self, user_id: int) -> bool:
        """Redis'te kullanıcının online olup olmadığını kontrol eder.
        Hata durumunda False döner (push gönderilsin, güvenli taraf)."""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if redis:
            try:
                async for _ in redis.scan_iter(match=f"online_user:{user_id}:*", count=1):
                    return True
            except Exception:
                pass
        return False

    def get_room_online_count(self, room_id: str) -> int:
        """Lokal online sayısı. Cluster geneli için Redis kümeleri kullanılmalıdır."""
        room_key = f"room:{room_id}"
        return len(self._conversations.get(room_key, {}))

    async def heartbeat_global(self):
        """Global socketlere ping gönder; tüm lokal socket kullanıcılarının TTL'ini uzat."""
        disconnected_pairs = []
        user_ids_to_refresh = set(self._user_connections)

        for user_id, ws_set in self._global_connections.items():
            user_ids_to_refresh.add(user_id)
            for ws in ws_set:
                try:
                    await ws.send_json({"type": "ping"})
                except Exception:
                    disconnected_pairs.append((ws, user_id))

        for ws, uid in disconnected_pairs:
            self.disconnect_global(ws, uid)

        # Kullanıcı-bazlı lock şeridi, reconnect ile clear yarışını önler.
        if user_ids_to_refresh:
            await asyncio.gather(
                *(self._set_user_online(uid) for uid in user_ids_to_refresh)
            )


# Global singleton
manager = ConnectionManager()
