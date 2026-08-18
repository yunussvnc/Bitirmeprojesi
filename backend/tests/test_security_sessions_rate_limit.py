import asyncio
from datetime import datetime, timedelta, timezone

import pytest
from starlette.requests import Request
from starlette.testclient import WebSocketDisconnect

import models
import app.middleware.rate_limiter as rate_limiter
from app.middleware.rate_limiter import (
    _failed_logins,
    _redis_increment_with_expiry,
    _store,
    get_client_ip,
    get_login_account_key,
    is_login_locked,
    record_failed_login,
)
from app.websocket.auth import WebSocketPrincipal
from app.websocket.manager import ConnectionManager
from auth import create_access_token
from tests.conftest import TestingSessionLocal, create_test_user


def _request(peer: str, headers: list[tuple[bytes, bytes]]) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "client": (peer, 12345),
            "scheme": "https",
            "server": ("testserver", 443),
            "query_string": b"",
        }
    )


def _set_user_state(user_id: int, *, active: bool | None = None, version: int | None = None):
    with TestingSessionLocal() as db:
        user = db.query(models.User).filter(models.User.id == user_id).one()
        if active is not None:
            user.is_active = active
        if version is not None:
            user.token_version = version
        db.commit()


class _FakeWebSocket:
    def __init__(self):
        self.closed = None
        self.sent = []

    async def close(self, code: int, reason: str):
        self.closed = (code, reason)

    async def send_json(self, data):
        self.sent.append(data)


def test_untrusted_peer_cannot_spoof_forwarded_ip():
    request = _request(
        "203.0.113.10",
        [(b"x-forwarded-for", b"198.51.100.55")],
    )
    assert get_client_ip(request) == "203.0.113.10"


def test_trusted_proxy_accepts_one_valid_forwarded_ip():
    request = _request(
        "127.0.0.1",
        [(b"x-forwarded-for", b"198.51.100.55")],
    )
    assert get_client_ip(request) == "198.51.100.55"


def test_trusted_proxy_rejects_forwarded_chain():
    request = _request(
        "127.0.0.1",
        [(b"x-forwarded-for", b"198.51.100.55, 203.0.113.9")],
    )
    assert get_client_ip(request) == "127.0.0.1"


def test_login_account_key_is_normalized_and_does_not_expose_email():
    first = get_login_account_key(" User@Example.com ")
    second = get_login_account_key("user@example.com")
    assert first == second
    assert "user@example.com" not in first


def test_account_lock_applies_across_source_ips():
    email = "target@example.com"
    for index in range(10):
        record_failed_login(f"198.51.100.{index + 1}", email)
    assert is_login_locked("203.0.113.200", email) is True


def test_notifications_ws_rejects_inactive_user(client):
    user_id = create_test_user(email="inactive-ws@test.com", username="inactive_ws")
    token = create_access_token(user_id, 0)
    _set_user_state(user_id, active=False)

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/v1/notifications/ws?token={token}"):
            pass


def test_notifications_ws_rejects_stale_token_version(client):
    user_id = create_test_user(email="stale-ws@test.com", username="stale_ws")
    token = create_access_token(user_id, 0)
    _set_user_state(user_id, version=1)

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/v1/notifications/ws?token={token}"):
            pass


def test_connected_ws_is_closed_after_token_version_changes(client):
    user_id = create_test_user(email="rotate-ws@test.com", username="rotate_ws")
    token = create_access_token(user_id, 0)

    with client.websocket_connect(f"/api/v1/notifications/ws?token={token}") as websocket:
        _set_user_state(user_id, version=1)
        websocket.send_json({"type": "ping"})
        with pytest.raises(WebSocketDisconnect):
            websocket.receive_json()


def test_manager_closes_and_removes_all_local_user_connections():
    manager = ConnectionManager()
    user_id = 42
    principal = WebSocketPrincipal(user_id=user_id, token_version=3)
    global_ws = _FakeWebSocket()
    chat_ws = _FakeWebSocket()
    room_ws = _FakeWebSocket()

    manager._global_connections[user_id] = {global_ws}
    manager._conversations["7"] = {user_id: {chat_ws}}
    manager._conversations["room:9"] = {user_id: {room_ws}}
    manager._user_connections[user_id] = {
        "7": {chat_ws},
        "room:9": {room_ws},
    }
    manager._session_principals = {
        global_ws: principal,
        chat_ws: principal,
        room_ws: principal,
    }

    asyncio.run(manager._local_close_user_connections(user_id, "Oturum sonlandırıldı"))

    assert global_ws.closed == (4001, "Oturum sonlandırıldı")
    assert chat_ws.closed == (4001, "Oturum sonlandırıldı")
    assert room_ws.closed == (4001, "Oturum sonlandırıldı")
    assert user_id not in manager._global_connections
    assert user_id not in manager._user_connections
    assert manager._session_principals == {}


def test_version_filtered_disconnect_keeps_fresh_socket_open():
    manager = ConnectionManager()
    user_id = 45
    stale_socket = _FakeWebSocket()
    fresh_socket = _FakeWebSocket()
    manager._global_connections[user_id] = {stale_socket, fresh_socket}
    manager._session_principals = {
        stale_socket: WebSocketPrincipal(user_id=user_id, token_version=2),
        fresh_socket: WebSocketPrincipal(user_id=user_id, token_version=3),
    }

    asyncio.run(
        manager._local_close_user_connections(
            user_id,
            "Yeni oturum açıldı",
            max_token_version=2,
        )
    )

    assert stale_socket.closed == (4001, "Yeni oturum açıldı")
    assert fresh_socket.closed is None
    assert manager._global_connections[user_id] == {fresh_socket}


def test_removing_old_socket_does_not_orphan_new_socket():
    manager = ConnectionManager()
    user_id = 43
    principal = WebSocketPrincipal(user_id=user_id, token_version=1)
    old_socket = _FakeWebSocket()
    new_socket = _FakeWebSocket()

    manager._conversations["11"] = {user_id: {old_socket, new_socket}}
    manager._user_connections[user_id] = {"11": {old_socket, new_socket}}
    manager._session_principals = {
        old_socket: principal,
        new_socket: principal,
    }

    manager._remove_socket(old_socket)

    assert manager._conversations["11"][user_id] == {new_socket}
    assert manager._user_connections[user_id]["11"] == {new_socket}
    assert new_socket in manager._session_principals


def test_outbound_delivery_revalidates_and_closes_stale_socket(monkeypatch):
    manager = ConnectionManager()
    user_id = 44
    websocket = _FakeWebSocket()
    principal = WebSocketPrincipal(user_id=user_id, token_version=2)
    manager._global_connections[user_id] = {websocket}
    manager._session_principals[websocket] = principal

    monkeypatch.setattr(
        "app.websocket.manager.load_websocket_session_states",
        lambda user_ids: {user_id: (True, 3)},
    )
    asyncio.run(manager._local_send_global(user_id, {"type": "secret"}))

    assert websocket.sent == []
    assert websocket.closed == (4001, "Oturum geçersiz")


def test_publish_delivers_locally_even_without_redis_subscribers(monkeypatch):
    class _RedisWithoutSubscribers:
        def __init__(self):
            self.events = []

        async def publish(self, channel, payload):
            self.events.append((channel, payload))
            return 0

    manager = ConnectionManager()
    redis = _RedisWithoutSubscribers()
    user_id = 46
    websocket = _FakeWebSocket()
    principal = WebSocketPrincipal(user_id=user_id, token_version=1)
    manager._global_connections[user_id] = {websocket}
    manager._session_principals[websocket] = principal
    monkeypatch.setattr(
        "app.websocket.manager.load_websocket_session_states",
        lambda user_ids: {user_id: (True, 1)},
    )
    monkeypatch.setattr("app.core.redis_client.get_redis", lambda: redis)

    asyncio.run(
        manager._publish_event(
            {"target_type": "global", "user_id": user_id, "data": {"type": "notice"}}
        )
    )

    assert websocket.sent == [{"type": "notice"}]
    assert len(redis.events) == 1


def test_presence_clear_cannot_delete_reconnected_presence(monkeypatch):
    async def scenario():
        class _ControlledRedis:
            def __init__(self):
                self.present = True
                self.delete_started = asyncio.Event()
                self.allow_delete = asyncio.Event()

            async def delete(self, key):
                self.delete_started.set()
                await self.allow_delete.wait()
                self.present = False

            async def setex(self, key, ttl, value):
                self.present = True

        manager = ConnectionManager()
        redis = _ControlledRedis()
        monkeypatch.setattr("app.core.redis_client.get_redis", lambda: redis)
        user_id = 47
        clear_task = asyncio.create_task(manager._clear_user_online(user_id))
        await redis.delete_started.wait()

        websocket = _FakeWebSocket()
        manager._global_connections[user_id] = {websocket}
        manager._session_principals[websocket] = WebSocketPrincipal(
            user_id=user_id,
            token_version=1,
        )
        set_task = asyncio.create_task(manager._set_user_online(user_id))
        redis.allow_delete.set()
        await asyncio.gather(clear_task, set_task)
        assert redis.present is True

    asyncio.run(scenario())


def test_redis_increment_and_expiry_are_one_atomic_eval():
    class _EvalRedis:
        def __init__(self):
            self.calls = []

        async def eval(self, script, key_count, key, ttl):
            self.calls.append((script, key_count, key, ttl))
            return 1

    redis = _EvalRedis()
    count = asyncio.run(_redis_increment_with_expiry(redis, "rate:test", 60))

    assert count == 1
    assert len(redis.calls) == 1
    script, key_count, key, ttl = redis.calls[0]
    assert "INCR" in script and "EXPIRE" in script and "TTL" in script
    assert (key_count, key, ttl) == (1, "rate:test", 60)


def test_redis_failure_falls_back_to_local_account_lock(monkeypatch):
    class _BrokenRedisStore:
        async def is_locked_out(self, key):
            raise ConnectionError("redis unavailable")

        async def lock_out(self, key, duration_seconds=900):
            raise ConnectionError("redis unavailable")

        async def check_rate(self, key, max_requests, window_seconds):
            raise ConnectionError("redis unavailable")

    monkeypatch.setattr(_store, "_redis_store", lambda: _BrokenRedisStore())
    email = "redis-outage@example.com"
    assert is_login_locked("203.0.113.250", email) is False
    allowed, remaining = asyncio.run(_store.check_rate("outage:test", 3, 60))
    assert allowed is True
    assert remaining == 2
    for _ in range(10):
        record_failed_login("198.51.100.250", email)

    assert is_login_locked("203.0.113.250", email) is True


def test_failed_login_counter_expires_before_threshold(monkeypatch):
    clock = [1_000.0]
    monkeypatch.setattr(rate_limiter.time, "time", lambda: clock[0])
    monkeypatch.setattr(rate_limiter, "_failed_logins_last_prune", 0.0)
    email = "windowed@example.com"

    for _ in range(9):
        record_failed_login("198.51.100.90", email)
    clock[0] += rate_limiter.LOCKOUT_DURATION + 1
    record_failed_login("198.51.100.90", email)

    account_count, _ = _failed_logins[get_login_account_key(email)]
    assert account_count == 1
    assert is_login_locked("203.0.113.90", email) is False


def test_password_change_revokes_existing_access_token(client):
    user_id = create_test_user(
        email="change-password-session@test.com",
        username="change_password_session",
    )
    token = create_access_token(user_id, 0)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(
        "/auth/change-password",
        headers=headers,
        json={
            "current_password": "TestPass123!",
            "new_password": "NewSecurePass456!",
        },
    )

    assert response.status_code == 200
    assert client.get("/auth/me", headers=headers).status_code == 401


def test_password_reset_revokes_existing_access_token(client):
    user_id = create_test_user(
        email="reset-password-session@test.com",
        username="reset_password_session",
    )
    token = create_access_token(user_id, 0)
    headers = {"Authorization": f"Bearer {token}"}
    with TestingSessionLocal() as db:
        db.add(
            models.PasswordReset(
                user_id=user_id,
                reset_code="123456",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            )
        )
        db.commit()

    response = client.post(
        "/auth/reset-password",
        json={
            "email": "reset-password-session@test.com",
            "code": "123456",
            "new_password": "ResetSecurePass789!",
        },
    )

    assert response.status_code == 200
    assert client.get("/auth/me", headers=headers).status_code == 401
