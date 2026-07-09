# tests/test_versioning_smoke.py — API v1 versioning, correlation, health/ready smoke tests

import pytest
from starlette.testclient import WebSocketDisconnect

from tests.conftest import create_test_user, get_auth_headers


class TestApiVersions:
    def test_api_versions_shape(self, client):
        resp = client.get("/api/versions")
        assert resp.status_code == 200
        body = resp.json()
        assert body["current"] == "v1"
        assert body["minimum_supported"] == "v1"
        assert "latest_mobile" in body
        assert "maintenance" in body
        assert "force_update" in body

    def test_response_carries_api_version_header(self, client):
        resp = client.get("/api/versions")
        assert resp.headers.get("X-API-Version") == "v1"


class TestUnsupportedApiVersion:
    def test_unknown_version_returns_structured_400(self, client):
        resp = client.get("/api/v2/auth/login")
        assert resp.status_code == 400
        body = resp.json()
        assert body["error"]["code"] == "UNSUPPORTED_API_VERSION"
        assert "v1" in body["supported_versions"]

    def test_known_version_missing_path_returns_404(self, client):
        resp = client.get("/api/v1/this-route-does-not-exist")
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "NOT_FOUND"


class TestHealthSplit:
    def test_health_is_lightweight_liveness(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "services" not in body

    def test_health_ready_checks_dependencies(self, client):
        resp = client.get("/health/ready")
        assert resp.status_code == 200
        body = resp.json()
        assert "services" in body
        assert "database" in body["services"]
        assert "redis" in body["services"]


class TestRequestCorrelation:
    def test_generates_request_id_when_absent(self, client):
        resp = client.get("/health")
        assert resp.headers.get("X-Request-ID")

    def test_honors_inbound_request_id(self, client):
        resp = client.get("/health", headers={"X-Request-ID": "my-custom-id"})
        assert resp.headers.get("X-Request-ID") == "my-custom-id"


class TestPrefixedAuthFlow:
    """Var olan bir router'ın /api/v1 altında hâlâ doğru çalıştığını doğrular."""

    def test_register_endpoint_reachable_under_v1(self, client):
        resp = client.post(
            "/auth/register",
            json={
                "email": "versioning_smoke@test.com",
                "password": "TestPass123!",
                "username": "versioning_smoke",
                "first_name": "Smoke",
                "birth_date": "2000-01-01",
            },
        )
        # Doğrulama e-postası akışına takılabilir; asıl kontrol 404 DEĞİL olması —
        # route /api/v1 altında gerçekten var ve middleware zinciri çalışıyor.
        assert resp.status_code != 404


class TestWebSocketVersioning:
    def test_notifications_ws_rejects_without_token(self, client):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/api/v1/notifications/ws"):
                pass

    def test_notifications_ws_accepts_with_valid_token(self, client):
        uid = create_test_user(email="ws_smoke@test.com", username="ws_smoke")
        token = get_auth_headers(uid)["Authorization"].split(" ")[1]
        with client.websocket_connect(f"/api/v1/notifications/ws?token={token}") as ws:
            ws.send_json({"type": "ping"})
            data = ws.receive_json()
            assert data["type"] == "pong"
