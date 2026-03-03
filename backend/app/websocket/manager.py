# websocket/manager.py — WebSocket Connection Manager

import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("asemos")


class ConnectionManager:
    """
    WebSocket bağlantı yöneticisi.
    - Her conversation_id için aktif bağlantıları takip eder
    - Her user_id için aktif bağlantıları takip eder (online durumu)
    - Mesaj gönderme, typing indicator, broadcast
    """

    def __init__(self):
        # conversation_id → {user_id: WebSocket}
        self._conversations: Dict[int, Dict[int, WebSocket]] = {}
        # user_id → set of conversation_ids (online durumu)
        self._user_connections: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        """Kullanıcıyı conversation'a bağla"""
        await websocket.accept()

        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = {}
        self._conversations[conversation_id][user_id] = websocket

        if user_id not in self._user_connections:
            self._user_connections[user_id] = set()
        self._user_connections[user_id].add(conversation_id)

        logger.info("🔌 WS bağlandı: user=%d, conv=%d", user_id, conversation_id)

    def disconnect(self, conversation_id: int, user_id: int):
        """Kullanıcıyı conversation'dan çıkar"""
        if conversation_id in self._conversations:
            self._conversations[conversation_id].pop(user_id, None)
            if not self._conversations[conversation_id]:
                del self._conversations[conversation_id]

        if user_id in self._user_connections:
            self._user_connections[user_id].discard(conversation_id)
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]

        logger.info("🔌 WS ayrıldı: user=%d, conv=%d", user_id, conversation_id)

    async def send_to_user(self, conversation_id: int, user_id: int, data: dict):
        """Belirli bir kullanıcıya mesaj gönder"""
        conv = self._conversations.get(conversation_id, {})
        ws = conv.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(conversation_id, user_id)

    async def broadcast_to_conversation(self, conversation_id: int, data: dict, exclude_user_id: int | None = None):
        """Conversation'daki tüm kullanıcılara mesaj gönder (opsiyonel olarak birini hariç tut)"""
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
            self.disconnect(conversation_id, uid)

    def is_user_online(self, user_id: int) -> bool:
        """Kullanıcı herhangi bir conversation'da online mı?"""
        return user_id in self._user_connections and len(self._user_connections[user_id]) > 0

    def is_user_in_conversation(self, conversation_id: int, user_id: int) -> bool:
        """Kullanıcı bu conversation'da online mı?"""
        return user_id in self._conversations.get(conversation_id, {})

    def get_online_user_count(self) -> int:
        """Toplam online kullanıcı sayısı"""
        return len(self._user_connections)


# Global singleton
manager = ConnectionManager()
