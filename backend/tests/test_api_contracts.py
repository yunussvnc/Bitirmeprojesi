# tests/test_api_contracts.py — API sözleşme testleri

"""
HTTP durum kodları, response şema doğrulamaları, header kontrolleri.
Her endpoint'in döndüğü JSON yapısının sözleşmeye uygunluğunu test eder.
"""

import pytest
from unittest.mock import patch
from tests.conftest import (
    create_test_user, create_test_place, create_test_post,
    get_auth_headers, create_admin_user, create_venue_user,
    TestingSessionLocal,
)


class TestResponseContentType:
    """Tüm yanıtların Content-Type kontrolü."""

    def test_root_json(self, client):
        response = client.get("/")
        assert response.headers["content-type"].startswith("application/json")

    def test_health_json(self, client):
        response = client.get("/health")
        assert response.headers["content-type"].startswith("application/json")


class TestRootAndHealth:
    """GET / ve GET /health — Temel endpoint'ler."""

    def test_root_returns_message(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "mesaj" in data

    def test_health_returns_status(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "services" in data
        assert "database" in data["services"]


class TestTokenResponseContract:
    """Login / register → Token response formatı."""

    def test_login_token_format(self, client):
        create_test_user(email="contract@test.com", password="Pass123!", username="contract")
        response = client.post("/auth/login", json={
            "email": "contract@test.com",
            "password": "Pass123!",
        })
        assert response.status_code == 200
        data = response.json()
        # Token response sözleşmesi
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        # User objesi sözleşmesi
        user = data["user"]
        assert "id" in user
        assert "email" in user
        assert "role" in user
        assert "is_active" in user
        assert "is_email_verified" in user


class TestPaginationContract:
    """Sayfalama response formatı sözleşmesi."""

    def test_places_pagination_format(self, client):
        create_test_place(name="ContractPlace")
        response = client.get("/places/")
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert isinstance(data["items"], list)
        assert isinstance(data["total"], int)

    def test_feed_pagination_format(self, client):
        uid = create_test_user(email="feedcont@test.com", username="feedcont")
        create_test_post(uid)
        response = client.get("/feed")
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    def test_search_pagination_format(self, client):
        response = client.get("/places/search?q=test")
        data = response.json()
        assert "items" in data
        assert "total" in data


class TestPlaceResponseContract:
    """Place response şema sözleşmesi."""

    def test_place_response_fields(self, client):
        pid = create_test_place(name="Schema Cafe", city="Istanbul", category="Kafe")
        response = client.get(f"/places/{pid}")
        data = response.json()
        required_fields = ["id", "name", "address", "city", "average_rating"]
        for field in required_fields:
            assert field in data, f"'{field}' eksik"
        optional_fields = ["review_count", "saved_count", "popularity_score", "gallery_urls", "menu_items"]
        for field in optional_fields:
            assert field in data, f"'{field}' eksik"


class TestPostResponseContract:
    """Post response şema sözleşmesi."""

    def test_post_response_fields(self, client):
        uid = create_test_user(email="postcont@test.com", username="postcont")
        post_id = create_test_post(uid, caption="Contract post")
        response = client.get(f"/posts/{post_id}")
        data = response.json()
        required_fields = [
            "id", "user_id", "caption", "post_type",
            "like_count", "comment_count", "created_at",
            "is_liked", "media",
        ]
        for field in required_fields:
            assert field in data, f"'{field}' eksik"
        assert isinstance(data["media"], list)


class TestUserProfileContract:
    """UserProfile response sözleşmesi."""

    def test_user_profile_fields(self, client):
        uid = create_test_user(email="profcont@test.com", username="profcont")
        response = client.get(f"/users/{uid}")
        data = response.json()
        required_fields = [
            "id", "email", "username", "role",
            "is_active", "followers_count", "following_count", "is_following",
        ]
        for field in required_fields:
            assert field in data, f"'{field}' eksik"


class TestErrorResponseContract:
    """Hata response formatı sözleşmesi."""

    def test_404_has_detail(self, client):
        response = client.get("/users/99999")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_401_has_detail(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_400_has_detail(self, client):
        create_test_user(email="err@test.com", username="erruser")
        response = client.post("/auth/register", json={
            "email": "err@test.com",
            "password": "Pass123!",
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_422_validation_error(self, client):
        response = client.post("/auth/login", json={
            "email": "not-email",
            "password": "pass",
        })
        assert response.status_code == 422


class TestStatusCodes:
    """Farklı senaryolarda doğru HTTP durum kodları."""

    def test_200_successful_get(self, client):
        assert client.get("/").status_code == 200

    def test_401_no_auth(self, client):
        assert client.get("/auth/me").status_code == 401

    def test_403_venue_only(self, client):
        uid = create_test_user(email="forbid@test.com", username="forbid")
        headers = get_auth_headers(uid)
        assert client.get("/places/my-venue", headers=headers).status_code == 403

    def test_404_resource_not_found(self, client):
        assert client.get("/places/99999").status_code == 404

    def test_405_wrong_method(self, client):
        response = client.put("/")
        assert response.status_code == 405


class TestRateLimitHeaders:
    """Rate-limit header'ları sözleşmesi."""

    def test_rate_limit_header_exists(self, client):
        create_test_user(email="rl@test.com", password="Pass123!", username="rluser")
        response = client.post("/auth/login", json={
            "email": "rl@test.com",
            "password": "Pass123!",
        })
        assert "x-ratelimit-remaining" in response.headers


class TestUserStatsContract:
    """UserStats response sözleşmesi."""

    def test_stats_fields(self, client):
        uid = create_test_user(email="statc@test.com", username="statc")
        response = client.get(f"/users/{uid}/stats")
        data = response.json()
        required_fields = [
            "post_count", "follower_count", "following_count",
            "review_count", "visit_count", "visits_this_month",
        ]
        for field in required_fields:
            assert field in data, f"'{field}' eksik"


class TestNotificationContract:
    """Bildirim response formatı."""

    def test_notification_list(self, client):
        uid = create_test_user(email="notfc@test.com", username="notfc")
        headers = get_auth_headers(uid)
        response = client.get("/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data


class TestPreferencesContract:
    """Tercihler response formatı."""

    def test_preferences_response(self, client):
        uid = create_test_user(email="prefc@test.com", username="prefc")
        headers = get_auth_headers(uid)
        response = client.get("/auth/me/preferences", headers=headers)
        assert response.status_code == 200
        data = response.json()
        expected = [
            "is_private_account", "language", "upload_quality",
            "show_read_receipts", "hide_offensive_words",
        ]
        for field in expected:
            assert field in data, f"'{field}' eksik"

    def test_update_preferences_response(self, client):
        uid = create_test_user(email="upprefc@test.com", username="upprefc")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me/preferences", headers=headers, json={
            "language": "en",
        })
        assert response.status_code == 200
        assert response.json()["language"] == "en"

    def test_invalid_preference_value(self, client):
        uid = create_test_user(email="invpref@test.com", username="invpref")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me/preferences", headers=headers, json={
            "language": "de",  # Geçersiz dil
        })
        assert response.status_code == 400
