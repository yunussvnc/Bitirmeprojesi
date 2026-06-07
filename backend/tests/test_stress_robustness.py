# tests/test_stress_robustness.py — Stress test & hata yakalama (robustness)

"""
Geçersiz girdiler, sınır değerler, SQL injection, XSS, rate limiting,
brute-force koruması ve edge case'ler.
"""

import pytest
from tests.conftest import (
    create_test_user, create_test_place, create_test_post,
    get_auth_headers, TestingSessionLocal,
)


class TestInvalidJSON:
    """Geçersiz / eksik JSON gövdeleri."""

    def test_empty_body_login(self, client):
        response = client.post("/auth/login", content="", headers={"Content-Type": "application/json"})
        assert response.status_code == 422

    def test_invalid_json_login(self, client):
        response = client.post("/auth/login", content="{bad json", headers={"Content-Type": "application/json"})
        assert response.status_code == 422

    def test_missing_required_fields(self, client):
        response = client.post("/auth/login", json={"email": "test@test.com"})
        assert response.status_code == 422

    def test_extra_unknown_fields_ignored(self, client):
        """Bilinmeyen alanlar görmezden gelinmeli (Pydantic default)."""
        create_test_user(email="extra@test.com", password="Pass123!", username="extra")
        response = client.post("/auth/login", json={
            "email": "extra@test.com",
            "password": "Pass123!",
            "unknown_field": "value",
        })
        # Pydantic extra alanları ignore eder veya 422 döner (konfigürasyona bağlı)
        assert response.status_code in (200, 422)


class TestSQLInjection:
    """SQL injection denemeleri."""

    def test_sql_injection_login_email(self, client):
        response = client.post("/auth/login", json={
            "email": "' OR 1=1 --@test.com",
            "password": "pass",
        })
        assert response.status_code in (401, 422)

    def test_sql_injection_search(self, client):
        response = client.get("/users/search?q=' OR 1=1 --")
        assert response.status_code == 200
        # Tüm kullanıcılar dönmemeli
        assert response.json()["total"] == 0

    def test_sql_injection_place_search(self, client):
        response = client.get("/places/search?q='; DROP TABLE places; --")
        assert response.status_code == 200


class TestXSSPrevention:
    """XSS denemeleri (HTML/script injection)."""

    def test_xss_in_bio(self, client):
        uid = create_test_user(email="xss@test.com", username="xssuser")
        headers = get_auth_headers(uid)
        xss_payload = '<script>alert("XSS")</script>'
        response = client.put("/auth/me", headers=headers, json={"bio": xss_payload})
        assert response.status_code == 200
        # XSS script DB'ye kaydedilir ama frontend tarafında escape edilmelidir
        # Backend'de yapının bozulmaması önemli
        assert response.json()["bio"] == xss_payload

    def test_xss_in_comment(self, client):
        uid = create_test_user(email="xsscmt@test.com", username="xsscmt")
        post_id = create_test_post(uid)
        headers = get_auth_headers(uid)
        response = client.post(f"/posts/{post_id}/comments", headers=headers, json={
            "text": '<img src=x onerror="alert(1)">',
        })
        assert response.status_code == 200

    def test_xss_in_username(self, client):
        uid = create_test_user(email="xssun@test.com", username="xssun")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me", headers=headers, json={
            "username": "<script>alert(1)</script>",
        })
        # Username genelde alfanumerik olmalı ama backend şu an kabul ediyor
        assert response.status_code in (200, 400, 422)


class TestBoundaryValues:
    """Sınır değer testleri."""

    def test_negative_user_id(self, client):
        response = client.get("/users/-1")
        assert response.status_code == 404

    def test_zero_user_id(self, client):
        response = client.get("/users/0")
        assert response.status_code == 404

    def test_very_large_id(self, client):
        response = client.get("/users/999999999")
        assert response.status_code == 404

    def test_rating_boundary_1(self, client):
        uid = create_test_user(email="rb1@test.com", username="rb1")
        pid = create_test_place(name="BoundCafe")
        headers = get_auth_headers(uid)
        response = client.post("/reviews/", headers=headers, json={
            "place_id": pid,
            "comment_text": "Minimum puan",
            "rating": 1,
        })
        assert response.status_code == 200

    def test_rating_boundary_5(self, client):
        uid = create_test_user(email="rb5@test.com", username="rb5")
        pid = create_test_place(name="Bound5Cafe")
        headers = get_auth_headers(uid)
        response = client.post("/reviews/", headers=headers, json={
            "place_id": pid,
            "comment_text": "Maksimum puan",
            "rating": 5,
        })
        assert response.status_code == 200

    def test_latitude_boundary(self, client):
        response = client.get("/places/nearby?lat=90&lng=180&radius=1")
        assert response.status_code == 200

    def test_page_zero(self, client):
        """page=0 → validation error."""
        response = client.get("/feed?page=0")
        assert response.status_code == 422

    def test_page_size_101(self, client):
        """page_size=101 → validation error (max 100)."""
        response = client.get("/feed?page_size=101")
        assert response.status_code == 422


class TestUnicodeHandling:
    """Unicode ve özel karakter desteği."""

    def test_emoji_in_bio(self, client):
        uid = create_test_user(email="emoji@test.com", username="emojiuser")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me", headers=headers, json={
            "bio": "Merhaba 🌍🎉🎶 Dünya!",
        })
        assert response.status_code == 200
        assert "🌍" in response.json()["bio"]

    def test_turkish_chars_in_name(self, client):
        uid = create_test_user(email="turkish@test.com", username="turkuser")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me", headers=headers, json={
            "first_name": "Şükrü",
            "last_name": "Öztürk",
        })
        assert response.status_code == 200
        assert response.json()["first_name"] == "Şükrü"

    def test_cjk_in_caption(self, client):
        uid = create_test_user(email="cjk@test.com", username="cjkuser")
        headers = get_auth_headers(uid)
        response = client.post("/posts", headers=headers, json={
            "caption": "日本語テスト 中文测试",
            "media": [{"media_type": "image", "media_url": "https://ex.com/img.jpg"}],
        })
        assert response.status_code == 200

    def test_arabic_in_search(self, client):
        response = client.get("/users/search?q=مرحبا")
        assert response.status_code == 200


class TestRateLimiting:
    """Rate limiting ve brute-force koruması."""

    def test_login_rate_limit(self, client):
        """6 ardışık başarısız login → 429."""
        for i in range(6):
            client.post("/auth/login", json={
                "email": f"rl{i}@test.com",
                "password": "wrong",
            })
        response = client.post("/auth/login", json={
            "email": "rl_last@test.com",
            "password": "wrong",
        })
        # 6. istek sonrası rate limit devreye girmeli
        assert response.status_code == 429

    def test_register_rate_limit(self, client):
        """4 ardışık register → 429."""
        for i in range(4):
            client.post("/auth/register", json={
                "email": f"rr{i}@test.com",
                "password": "Pass123!",
            })
        response = client.post("/auth/register", json={
            "email": "rr_last@test.com",
            "password": "Pass123!",
        })
        assert response.status_code == 429


class TestBruteForceProtection:
    """Brute-force login koruması (IP kilidi)."""

    def test_brute_force_lockout(self, client):
        """10+ başarısız login → IP kilidi (429)."""
        create_test_user(email="brute@test.com", password="Pass123!", username="brute")
        for i in range(11):
            client.post("/auth/login", json={
                "email": "brute@test.com",
                "password": f"wrong_{i}",
            })
        # Doğru şifre ile bile kilitli
        response = client.post("/auth/login", json={
            "email": "brute@test.com",
            "password": "Pass123!",
        })
        assert response.status_code == 429


class TestLargePayload:
    """Büyük payload'lar."""

    def test_very_long_bio(self, client):
        uid = create_test_user(email="longbio@test.com", username="longbio")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me", headers=headers, json={
            "bio": "A" * 10000,
        })
        # Backend uzun bio'yu kabul edebilir veya truncate edebilir
        assert response.status_code in (200, 400, 422)

    def test_many_media_items(self, client):
        uid = create_test_user(email="manymedia@test.com", username="manymedia")
        headers = get_auth_headers(uid)
        media = [
            {"media_type": "image", "media_url": f"https://ex.com/img{i}.jpg"}
            for i in range(50)
        ]
        response = client.post("/posts", headers=headers, json={
            "caption": "Çok medya",
            "media": media,
        })
        assert response.status_code == 200


class TestEdgeCases:
    """Diğer edge case'ler."""

    def test_nonexistent_endpoint(self, client):
        response = client.get("/this/does/not/exist")
        assert response.status_code in (404, 405)

    def test_wrong_method_on_post_endpoint(self, client):
        response = client.get("/auth/login")
        assert response.status_code == 405

    def test_duplicate_like(self, client):
        """Aynı postu iki kez beğenme — idempotent toggle olmalı."""
        uid = create_test_user(email="duplike@test.com", username="duplike")
        post_id = create_test_post(uid)
        headers = get_auth_headers(uid)
        r1 = client.post(f"/posts/{post_id}/like", headers=headers)
        r2 = client.post(f"/posts/{post_id}/like", headers=headers)
        assert r1.json()["liked"] is True
        assert r2.json()["liked"] is False

    def test_double_follow(self, client):
        """Aynı kullanıcıyı iki kez takip → toggle."""
        uid1 = create_test_user(email="df1@test.com", username="df1")
        uid2 = create_test_user(email="df2@test.com", username="df2")
        headers = get_auth_headers(uid1)
        r1 = client.post(f"/users/{uid2}/follow", headers=headers)
        r2 = client.post(f"/users/{uid2}/follow", headers=headers)
        assert r1.json()["following"] is True
        assert r2.json()["following"] is False

    def test_empty_feed(self, client):
        response = client.get("/feed")
        assert response.status_code == 200
        assert response.json()["has_more"] is False
        assert response.json()["items"] == []

