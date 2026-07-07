# websocket/manager.py — WebSocket Connection Manager (Redis Pub/Sub Enhanced)

import json
import logging
import asyncio
from typing import Dict, Set
# pyrefly: ignore [missing-import]
from fastapi import WebSocket

logger = logging.getLogger("asemos")


class ConnectionManager:
    """
    Redis Pub/Sub tabanlı Dağıtık (Distributed) WebSocket Yöneticisi.
    Çoklu sunucu ortamında (Multi-Node) farklı sunuculardaki kullanıcıların
    birbirine mesaj atabilmesini sağlar.
    """

    def __init__(self):
        # Local (RAM) bağlantıları tutarız. Sadece bu sunucuya bağlı olanlar.
        # conversation_id → {user_id: WebSocket}
        self._conversations: Dict[str, Dict[int, WebSocket]] = {}
        # user_id → set of conversation_ids/room_keys
        self._user_connections: Dict[int, Set[str]] = {}
        # Global notification connections: user_id -> set of WebSockets
        self._global_connections: Dict[int, Set[WebSocket]] = {}
        
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
                        target_type = payload.get("target_type")
                        data = payload.get("data")
                        
                        if target_type == "global":
                            user_id = payload.get("user_id")
                            await self._local_send_global(user_id, data)
                        
                        elif target_type == "user":
                            conversation_id = payload.get("conversation_id")
                            user_id = payload.get("user_id")
                            await self._local_send_to_user(conversation_id, user_id, data)
                            
                        elif target_type == "conversation_broadcast":
                            conversation_id = payload.get("conversation_id")
                            exclude_uid = payload.get("exclude_user_id")
                            await self._local_broadcast_to_conversation(conversation_id, data, exclude_uid)
                            
                        elif target_type == "room_broadcast":
                            room_id = payload.get("room_id")
                            exclude_uid = payload.get("exclude_user_id")
                            await self._local_broadcast_to_room(room_id, data, exclude_uid)

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
                        "Tek sunucu (single-instance) moduna geçiliyor. "
                        "WebSocket mesajları lokal olarak yönlendirilecek, işlevsellik kaybı yok.",
                        consecutive_failures
                    )
                    break  # Sonsuz döngüden çık, lokal fallback (_simulate_local_pubsub) devralacak
                logger.warning(
                    "Pub/Sub listener bağlantı koptu (%s). Deneme %d/%d — 5 sn içinde yeniden bağlanılıyor...",
                    str(e), consecutive_failures, MAX_CONSECUTIVE_FAILURES
                )
                await asyncio.sleep(5)

    async def _publish_event(self, payload: dict):
        """Tüm cluster'a (diğer sunuculara da) event fırlat."""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if redis:
            try:
                await redis.publish("ws:cluster:events", json.dumps(payload))
            except Exception as e:
                logger.error("Redis publish hatası: %s", str(e))
                # Fallback: Lokal olarak işle
                await self._simulate_local_pubsub({"type": "message", "data": json.dumps(payload)})
        else:
            # Redis yoksa sadece lokalde çalıştır (Graceful degradation)
            msg = {"type": "message", "data": json.dumps(payload)}
            asyncio.create_task(self._simulate_local_pubsub(msg))

    async def _simulate_local_pubsub(self, message):
        """Redis yoksa fallback olarak sadece lokal RAM'de işle."""
        payload = json.loads(message["data"])
        target_type = payload.get("target_type")
        data = payload.get("data")
        
        if target_type == "global":
            await self._local_send_global(payload.get("user_id"), data)
        elif target_type == "user":
            await self._local_send_to_user(payload.get("conversation_id"), payload.get("user_id"), data)
        elif target_type == "conversation_broadcast":
            await self._local_broadcast_to_conversation(payload.get("conversation_id"), data, payload.get("exclude_user_id"))
        elif target_type == "room_broadcast":
            await self._local_broadcast_to_room(payload.get("room_id"), data, payload.get("exclude_user_id"))


    # --- GLOBAL BAĞLANTI (NOVU INBOX STYLE) ---

    async def connect_global(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self._global_connections:
            self._global_connections[user_id] = set()
        self._global_connections[user_id].add(websocket)
        logger.info("🔌 WS Global bağlandı: user=%d", user_id)
        # Redis'te online işaretle (hata olursa WS düşmesin)
        await self._set_user_online(user_id)

    def disconnect_global(self, websocket: WebSocket, user_id: int):
        if user_id in self._global_connections:
            self._global_connections[user_id].discard(websocket)
            if not self._global_connections[user_id]:
                del self._global_connections[user_id]
                # Son bağlantı da kapandı → Redis'teki online durumunu temizle
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

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        await websocket.accept()
        conv_key = str(conversation_id)
        if conv_key not in self._conversations:
            self._conversations[conv_key] = {}
        self._conversations[conv_key][user_id] = websocket

        if user_id not in self._user_connections:
            self._user_connections[user_id] = set()
        self._user_connections[user_id].add(conv_key)

        logger.info("🔌 WS bağlandı: user=%d, conv=%d", user_id, conversation_id)
        await self._set_user_online(user_id)

    def disconnect(self, conversation_id: int, user_id: int):
        conv_key = str(conversation_id)
        if conv_key in self._conversations:
            self._conversations[conv_key].pop(user_id, None)
            if not self._conversations[conv_key]:
                del self._conversations[conv_key]

        if user_id in self._user_connections:
            self._user_connections[user_id].discard(conv_key)
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]
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
        conv = self._conversations.get(conversation_id, {})
        ws = conv.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(int(conversation_id), user_id)

    async def broadcast_to_conversation(self, conversation_id: int, data: dict, exclude_user_id: int | None = None):
        await self._publish_event({
            "target_type": "conversation_broadcast",
            "conversation_id": str(conversation_id),
            "exclude_user_id": exclude_user_id,
            "data": data
        })

    async def _local_broadcast_to_conversation(self, conversation_id: str, data: dict, exclude_user_id: int | None):
        conv = self._conversations.get(conversation_id, {})
        disconnected = []
        for uid, ws in conv.items():
            if exclude_user_id and uid == exclude_user_id:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(int(conversation_id), uid)


    # --- COMMUNITY ROOM (TOPLULUK ODASI) ---

    async def connect_room(self, websocket: WebSocket, room_id: str, user_id: int):
        await websocket.accept()
        room_key = f"room:{room_id}"
        if room_key not in self._conversations:
            self._conversations[room_key] = {}
        self._conversations[room_key][user_id] = websocket

        if user_id not in self._user_connections:
            self._user_connections[user_id] = set()
        self._user_connections[user_id].add(room_key)

        logger.info("🏠 WS Topluluk odası bağlandı: user=%d, room=%s", user_id, room_id)
        await self._set_user_online(user_id)

    def disconnect_room(self, room_id: str, user_id: int):
        room_key = f"room:{room_id}"
        if room_key in self._conversations:
            self._conversations[room_key].pop(user_id, None)
            if not self._conversations[room_key]:
                del self._conversations[room_key]

        if user_id in self._user_connections:
            self._user_connections[user_id].discard(room_key)
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]
        logger.info("🏠 WS Topluluk odası ayrıldı: user=%d, room=%s", user_id, room_id)

    async def broadcast_to_room(self, room_id: str, data: dict, exclude_user_id: int | None = None):
        await self._publish_event({
            "target_type": "room_broadcast",
            "room_id": room_id,
            "exclude_user_id": exclude_user_id,
            "data": data
        })

    async def _local_broadcast_to_room(self, room_id: str, data: dict, exclude_user_id: int | None):
        room_key = f"room:{room_id}"
        conv = self._conversations.get(room_key, {})
        disconnected = []
        for uid, ws in conv.items():
            if exclude_user_id and uid == exclude_user_id:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect_room(room_id, uid)


    # --- UTILS & ONLINE STATE (Redis) ---

    async def _set_user_online(self, user_id: int):
        """Kullanıcının online durumunu Redis'e yazar (Distributed state).
        Hata olursa sessizce geçer — WebSocket bağlantısını düşürmez."""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if redis:
            try:
                # 90 saniye TTL. Heartbeat her 30 saniyede uzatır.
                await redis.setex(f"online_user:{user_id}", 90, "1")
            except Exception as e:
                logger.warning("Redis set_user_online hatası (user=%d): %s", user_id, str(e))

    async def _clear_user_online(self, user_id: int):
        """Kullanıcının online durumunu Redis'ten siler."""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if redis:
            try:
                await redis.delete(f"online_user:{user_id}")
            except Exception:
                pass

    async def _is_user_online_redis(self, user_id: int) -> bool:
        """Redis'te kullanıcının online olup olmadığını kontrol eder.
        Hata durumunda False döner (push gönderilsin, güvenli taraf)."""
        from app.core.redis_client import get_redis
        redis = get_redis()
        if redis:
            try:
                return await redis.exists(f"online_user:{user_id}") > 0
            except Exception:
                pass
        return False

    def get_room_online_count(self, room_id: str) -> int:
        """Lokal online sayısı. Cluster geneli için Redis kümeleri kullanılmalıdır."""
        room_key = f"room:{room_id}"
        return len(self._conversations.get(room_key, {}))

    async def heartbeat_global(self):
        """Tüm lokal global bağlantılara ping gönder ve Redis online süresini uzat."""
        disconnected_pairs = []
        user_ids_to_refresh = []

        for user_id, ws_set in self._global_connections.items():
            user_ids_to_refresh.append(user_id)
            for ws in ws_set:
                try:
                    await ws.send_json({"type": "ping"})
                except Exception:
                    disconnected_pairs.append((ws, user_id))

        for ws, uid in disconnected_pairs:
            self.disconnect_global(ws, uid)

        # Redis TTL batch uzatma (tek tek değil, toplu olarak)
        if user_ids_to_refresh:
            from app.core.redis_client import get_redis
            redis = get_redis()
            if redis:
                try:
                    pipe = redis.pipeline(transaction=False)
                    for uid in user_ids_to_refresh:
                        pipe.setex(f"online_user:{uid}", 90, "1")
                    await pipe.execute()
                except Exception as e:
                    logger.warning("Heartbeat Redis batch TTL hatası: %s", str(e))


# Global singleton
manager = ConnectionManager()
