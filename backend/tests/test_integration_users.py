# tests/test_integration_users.py — Kullanıcı entegrasyon testleri

"""
Users router + CRUD + DB entegrasyon testleri.
Profil, takip, engelleme, arama endpoint'lerini kapsar.
"""

import pytest
from unittest.mock import patch
from tests.conftest import (
    create_test_user, create_test_place, get_auth_headers,
    create_admin_user, create_venue_user, TestingSessionLocal,
)
import models, crud


class TestUserProfile:
    """GET /users/{id} — Profil görüntüleme."""

    def test_get_user_profile(self, client):
        uid = create_test_user(email="profile@test.com", username="profileuser")
        response = client.get(f"/users/{uid}")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "profileuser"
        assert "followers_count" in data
        assert "following_count" in data

    def test_get_user_profile_not_found(self, client):
        response = client.get("/users/99999")
        assert response.status_code == 404

    def test_get_user_profile_with_follow_counts(self, client):
        uid1 = create_test_user(email="pfcount1@test.com", username="pfcount1")
        uid2 = create_test_user(email="pfcount2@test.com", username="pfcount2")
        uid3 = create_test_user(email="pfcount3@test.com", username="pfcount3")
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid2, uid1)
        crud.toggle_follow(db, uid3, uid1)
        crud.toggle_follow(db, uid1, uid2)
        db.close()
        response = client.get(f"/users/{uid1}")
        data = response.json()
        assert data["followers_count"] == 2
        assert data["following_count"] == 1


class TestUpdateProfile:
    """PUT /auth/me — Profil güncelleme."""

    def test_update_bio(self, client):
        uid = create_test_user(email="ubio@test.com", username="ubio")
        headers = get_auth_headers(uid)
        response = client.put("/auth/me", headers=headers, json={"bio": "Yeni biyografi"})
        assert response.status_code == 200
        assert response.json()["bio"] == "Yeni biyografi"

    def test_update_username_conflict(self, client):
        create_test_user(email="exist@test.com", username="existing")
        uid2 = create_test_user(email="upconf@test.com", username="upconf")
        headers = get_auth_headers(uid2)
        response = client.put("/auth/me", headers=headers, json={"username": "existing"})
        assert response.status_code == 400
        assert "alınmış" in response.json()["detail"]

    def test_update_email_conflict(self, client):
        create_test_user(email="taken@test.com", username="taken")
        uid2 = create_test_user(email="emailconf@test.com", username="emailconf")
        headers = get_auth_headers(uid2)
        response = client.put("/auth/me", headers=headers, json={"email": "taken@test.com"})
        assert response.status_code == 400

    def test_update_phone_conflict(self, client):
        uid1 = create_test_user(email="phone1@test.com", username="phone1")
        db = TestingSessionLocal()
        user = db.query(models.User).filter_by(id=uid1).first()
        user.phone_number = "+905551234567"
        db.commit()
        db.close()
        uid2 = create_test_user(email="phone2@test.com", username="phone2")
        headers = get_auth_headers(uid2)
        response = client.put("/auth/me", headers=headers, json={"phone_number": "5551234567"})
        assert response.status_code == 400

    def test_patch_me(self, client):
        uid = create_test_user(email="patchme@test.com", username="patchme")
        headers = get_auth_headers(uid)
        response = client.patch("/auth/me", headers=headers, json={"first_name": "Patched"})
        assert response.status_code == 200
        assert response.json()["first_name"] == "Patched"


class TestUserSearch:
    """GET /users/search — Kullanıcı arama."""

    def test_search_by_username(self, client):
        create_test_user(email="search1@test.com", username="aramatest")
        response = client.get("/users/search?q=aramatest")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(u["username"] == "aramatest" for u in data["items"])

    def test_search_by_first_name(self, client):
        create_test_user(email="search2@test.com", username="namefind", first_name="Ahmet")
        response = client.get("/users/search?q=Ahmet")
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_search_excludes_venues(self, client):
        create_venue_user(email="searchvenue@test.com", username="searchvenue")
        create_test_user(email="searchnormal@test.com", username="searchnorm")
        response = client.get("/users/search?q=search")
        data = response.json()
        usernames = [u["username"] for u in data["items"]]
        assert "searchvenue" not in usernames

    def test_search_excludes_blocked_users(self, client):
        uid1 = create_test_user(email="srchblk1@test.com", username="srchblk1")
        uid2 = create_test_user(email="srchblk2@test.com", username="srchblk2")
        db = TestingSessionLocal()
        crud.toggle_block_user(db, uid1, uid2)
        db.close()
        headers = get_auth_headers(uid1)
        response = client.get("/users/search?q=srchblk", headers=headers)
        data = response.json()
        usernames = [u["username"] for u in data["items"]]
        assert "srchblk2" not in usernames

    def test_search_min_length(self, client):
        response = client.get("/users/search?q=")
        assert response.status_code == 422

    def test_search_pagination(self, client):
        for i in range(5):
            create_test_user(email=f"paguser{i}@test.com", username=f"paguser{i}")
        response = client.get("/users/search?q=paguser&page=1&page_size=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5


class TestFollow:
    """POST /users/{id}/follow — Takip işlemleri."""

    def test_follow_user(self, client):
        uid1 = create_test_user(email="fw1@test.com", username="fw1")
        uid2 = create_test_user(email="fw2@test.com", username="fw2")
        headers = get_auth_headers(uid1)
        response = client.post(f"/users/{uid2}/follow", headers=headers)
        assert response.status_code == 200
        assert response.json()["following"] is True

    def test_unfollow_user(self, client):
        uid1 = create_test_user(email="ufw1@test.com", username="ufw1")
        uid2 = create_test_user(email="ufw2@test.com", username="ufw2")
        headers = get_auth_headers(uid1)
        client.post(f"/users/{uid2}/follow", headers=headers)
        # Tekrar → unfollow
        response = client.post(f"/users/{uid2}/follow", headers=headers)
        assert response.json()["following"] is False

    def test_follow_self(self, client):
        uid = create_test_user(email="fself@test.com", username="fself")
        headers = get_auth_headers(uid)
        response = client.post(f"/users/{uid}/follow", headers=headers)
        assert response.status_code == 400

    def test_follow_nonexistent(self, client):
        uid = create_test_user(email="fne@test.com", username="fne")
        headers = get_auth_headers(uid)
        response = client.post("/users/99999/follow", headers=headers)
        assert response.status_code == 404

    def test_follow_requires_auth(self, client):
        uid = create_test_user(email="fnauth@test.com", username="fnauth")
        response = client.post(f"/users/{uid}/follow")
        assert response.status_code == 401


class TestBlock:
    """POST /users/{id}/block — Engelleme işlemleri."""

    def test_block_user(self, client):
        uid1 = create_test_user(email="bk1@test.com", username="bk1")
        uid2 = create_test_user(email="bk2@test.com", username="bk2")
        headers = get_auth_headers(uid1)
        response = client.post(f"/users/{uid2}/block", headers=headers)
        assert response.status_code == 200
        assert response.json()["blocked"] is True

    def test_unblock_user(self, client):
        uid1 = create_test_user(email="ubk1@test.com", username="ubk1")
        uid2 = create_test_user(email="ubk2@test.com", username="ubk2")
        headers = get_auth_headers(uid1)
        client.post(f"/users/{uid2}/block", headers=headers)
        response = client.post(f"/users/{uid2}/block", headers=headers)
        assert response.json()["blocked"] is False

    def test_block_self(self, client):
        uid = create_test_user(email="bself@test.com", username="bself")
        headers = get_auth_headers(uid)
        response = client.post(f"/users/{uid}/block", headers=headers)
        assert response.status_code == 400

    def test_block_removes_follow(self, client):
        uid1 = create_test_user(email="brm1@test.com", username="brm1")
        uid2 = create_test_user(email="brm2@test.com", username="brm2")
        headers = get_auth_headers(uid1)
        client.post(f"/users/{uid2}/follow", headers=headers)
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is True
        db.close()
        client.post(f"/users/{uid2}/block", headers=headers)
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is False
        db.close()


class TestFollowerFollowingList:
    """GET /users/{id}/followers, /following — Liste endpoint'leri."""

    def test_get_followers(self, client):
        uid1 = create_test_user(email="flst1@test.com", username="flst1")
        uid2 = create_test_user(email="flst2@test.com", username="flst2")
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid2, uid1)
        db.close()
        response = client.get(f"/users/{uid1}/followers")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["username"] == "flst2"

    def test_get_following(self, client):
        uid1 = create_test_user(email="fing1@test.com", username="fing1")
        uid2 = create_test_user(email="fing2@test.com", username="fing2")
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid1, uid2)
        db.close()
        response = client.get(f"/users/{uid1}/following")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["username"] == "fing2"


class TestUserStats:
    """GET /users/{id}/stats, /auth/me/stats — İstatistikler."""

    def test_get_user_stats(self, client):
        uid = create_test_user(email="stat@test.com", username="statuser")
        response = client.get(f"/users/{uid}/stats")
        assert response.status_code == 200
        data = response.json()
        assert "post_count" in data
        assert "follower_count" in data

    def test_get_my_stats(self, client):
        uid = create_test_user(email="mystat@test.com", username="mystat")
        headers = get_auth_headers(uid)
        response = client.get("/auth/me/stats", headers=headers)
        assert response.status_code == 200

    def test_get_blocked_users(self, client):
        uid1 = create_test_user(email="gblk1@test.com", username="gblk1")
        uid2 = create_test_user(email="gblk2@test.com", username="gblk2")
        headers = get_auth_headers(uid1)
        client.post(f"/users/{uid2}/block", headers=headers)
        response = client.get("/users/blocked", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1


class TestUserBatch:
    """POST /users/batch — Toplu profil bilgisi getirme."""

    def test_get_users_batch_success(self, client):
        uid1 = create_test_user(email="batch1@test.com", username="batch1")
        uid2 = create_test_user(email="batch2@test.com", username="batch2")
        uid3 = create_test_user(email="batch3@test.com", username="batch3")

        response = client.post("/users/batch", json={"user_ids": [uid1, uid2, uid3]})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        usernames = [u["username"] for u in data["items"]]
        assert "batch1" in usernames
        assert "batch2" in usernames
        assert "batch3" in usernames

    def test_get_users_batch_with_block(self, client):
        uid1 = create_test_user(email="batchblk1@test.com", username="batchblk1")
        uid2 = create_test_user(email="batchblk2@test.com", username="batchblk2")
        uid3 = create_test_user(email="batchblk3@test.com", username="batchblk3")

        # Block user 2
        db = TestingSessionLocal()
        crud.toggle_block_user(db, uid1, uid2)
        db.close()

        # Call with auth headers for user 1
        headers = get_auth_headers(uid1)
        response = client.post(
            "/users/batch",
            headers=headers,
            json={"user_ids": [uid1, uid2, uid3]}
        )
        assert response.status_code == 200
        data = response.json()
        # Should exclude user 2 because they are blocked
        usernames = [u["username"] for u in data["items"]]
        assert "batchblk1" in usernames
        assert "batchblk2" not in usernames
        assert "batchblk3" in usernames
