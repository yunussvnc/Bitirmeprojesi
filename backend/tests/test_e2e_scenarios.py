# tests/test_e2e_scenarios.py — Uçtan uca (E2E) senaryolar

"""
Tam kullanıcı yolculuklarını simüle eden kapsamlı test senaryoları.
Her senaryo birden fazla endpoint'i sıralı olarak kullanır.
"""

import pytest
from datetime import date
from unittest.mock import patch
from tests.conftest import (
    create_test_user, create_test_place, create_test_post,
    create_test_review, create_match_profile, create_match_conversation,
    get_auth_headers, create_admin_user, TestingSessionLocal,
)
import models, crud


class TestScenarioUserLifecycle:
    """Senaryo 1: Kayıt → Doğrulama → İlk Kurulum → Profil → Post."""

    @patch("app.services.email_service._send_welcome_email")
    @patch("app.services.email_service.send_email")
    def test_full_user_lifecycle(self, mock_send, mock_welcome, client):
        # 1. Kayıt
        reg_resp = client.post("/auth/register", json={
            "email": "lifecycle@test.com",
            "password": "LifePass123!",
            "username": "lifecycle",
            "first_name": "Hayat",
        })
        assert reg_resp.status_code == 200
        assert reg_resp.json()["ok"] is True

        # 2. Doğrulama kodu al
        db = TestingSessionLocal()
        pending = db.query(models.PendingUser).filter_by(email="lifecycle@test.com").first()
        code = pending.verification_code
        db.close()

        # 3. Doğrula
        verify_resp = client.post("/auth/verify-register", json={
            "email": "lifecycle@test.com",
            "code": code,
        })
        assert verify_resp.status_code == 200
        token = verify_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        user = verify_resp.json()["user"]
        assert user["is_email_verified"] is True

        # 4. Profil bilgilerini al
        me_resp = client.get("/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "lifecycle@test.com"

        # 5. Post oluştur
        post_resp = client.post("/posts", headers=headers, json={
            "caption": "İlk postum!",
            "media": [{"media_type": "image", "media_url": "https://ex.com/img.jpg"}],
        })
        assert post_resp.status_code == 200
        assert post_resp.json()["caption"] == "İlk postum!"


class TestScenarioMatchFlow:
    """Senaryo 2: İki kullanıcı eşleşme akışı."""

    def test_full_match_flow(self, client):
        # 1. İki 18+ kullanıcı oluştur
        uid1 = create_test_user(
            email="match1@test.com", username="match1", birth_date=date(2000, 1, 1)
        )
        uid2 = create_test_user(
            email="match2@test.com", username="match2", birth_date=date(2000, 6, 15)
        )

        # 2. Match profilleri oluştur
        h1 = get_auth_headers(uid1)
        h2 = get_auth_headers(uid2)

        client.post("/match-profile", headers=h1, json={
            "display_name": "Ali", "age": 25, "gender": "Erkek",
            "photo_urls": ["https://ex.com/ali.jpg"],
        })
        client.post("/match-profile", headers=h2, json={
            "display_name": "Ayşe", "age": 24, "gender": "Kadın",
            "photo_urls": ["https://ex.com/ayse.jpg"],
        })

        # 3. uid1 uid2'yi beğensin
        like1 = client.post("/match/like", headers=h1, json={
            "to_user_id": uid2, "action": "like",
        })
        assert like1.json()["matched"] is False

        # 4. uid2 uid1'i beğensin → MATCH!
        like2 = client.post("/match/like", headers=h2, json={
            "to_user_id": uid1, "action": "like",
        })
        assert like2.json()["matched"] is True
        conv_id = like2.json()["conversation_id"]
        assert conv_id is not None

        # 5. Mesaj gönder
        msg = client.post(f"/messages/{conv_id}", headers=h1, json={
            "content": "Merhaba Ayşe!",
        })
        assert msg.status_code == 200

        # 6. Mesajları oku
        msgs = client.get(f"/messages/{conv_id}", headers=h2)
        assert msgs.json()["total"] == 1
        assert msgs.json()["items"][0]["content"] == "Merhaba Ayşe!"

        # 7. Profil reveal
        client.post(f"/match/reveal-profile/{conv_id}", headers=h1)
        client.post(f"/match/reveal-profile/{conv_id}", headers=h2)

        # Otomatik takip kontrolü
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is True
        assert crud.is_following(db, uid2, uid1) is True
        db.close()


class TestScenarioVenueFlow:
    """Senaryo 3: Mekan sahibi akışı."""

    def test_venue_registration_to_dashboard(self, client):
        pid = create_test_place(name="E2E Cafe")
        # 1. Venue kayıt
        reg = client.post("/auth/venue-register", json={
            "venue_name": "E2E Cafe",
            "email": "e2ecafe@test.com",
            "password": "VenuePass123!",
            "claimed_place_id": pid,
        })
        assert reg.status_code == 200
        pending_id = reg.json()["id"]

        # 2. Admin onayı
        admin_id = create_admin_user(email="e2eadmin@test.com", username="e2eadmin")
        admin_headers = get_auth_headers(admin_id)
        approval = client.post(
            f"/auth/admin/approve-venue/{pending_id}",
            headers=admin_headers,
        )
        assert approval.status_code == 200
        venue_user_id = approval.json()["user_id"]

        # 3. Venue login
        login = client.post("/auth/login", json={
            "email": "e2ecafe@test.com",
            "password": "VenuePass123!",
        })
        assert login.status_code == 200
        venue_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # 4. Dashboard
        venue_resp = client.get("/places/my-venue", headers=venue_headers)
        assert venue_resp.status_code == 200
        assert venue_resp.json()["name"] == "E2E Cafe"

        # 5. Mekan güncelle
        update = client.put("/places/my-venue", headers=venue_headers, json={
            "campaign_text": "Açılış kampanyası!",
        })
        assert update.status_code == 200

        # 6. İstatistikler
        stats = client.get("/places/my-venue/stats", headers=venue_headers)
        assert stats.status_code == 200


class TestScenarioSocialInteraction:
    """Senaryo 4: Follow → Post → Like → Comment → Notification."""

    def test_social_interaction_flow(self, client):
        uid1 = create_test_user(email="soc1@test.com", username="social1")
        uid2 = create_test_user(email="soc2@test.com", username="social2")
        h1 = get_auth_headers(uid1)
        h2 = get_auth_headers(uid2)

        # 1. uid1, uid2'yi takip etsin
        follow = client.post(f"/users/{uid2}/follow", headers=h1)
        assert follow.json()["following"] is True

        # 2. uid2 post oluşsun
        post = client.post("/posts", headers=h2, json={
            "caption": "Sosyal post!",
            "media": [{"media_type": "image", "media_url": "https://ex.com/img.jpg"}],
        })
        post_id = post.json()["id"]

        # 3. uid1 postu beğensin
        like = client.post(f"/posts/{post_id}/like", headers=h1)
        assert like.json()["liked"] is True

        # 4. uid1 yorum yapsın
        comment = client.post(f"/posts/{post_id}/comments", headers=h1, json={
            "text": "Harika!",
        })
        assert comment.status_code == 200

        # 5. uid2'nin bildirimlerini kontrol et
        notifs = client.get("/notifications", headers=h2)
        assert notifs.status_code == 200
        notif_types = [n["type"] for n in notifs.json()["items"]]
        assert "follow" in notif_types
        assert "like" in notif_types
        assert "comment" in notif_types

        # 6. Takipten çık
        unfollow = client.post(f"/users/{uid2}/follow", headers=h1)
        assert unfollow.json()["following"] is False


class TestScenarioPasswordReset:
    """Senaryo 5: Şifre unutma → sıfırlama → login."""

    @patch("app.services.email_service.send_email")
    def test_password_reset_flow(self, mock_send, client):
        create_test_user(email="reset@test.com", password="OldPass123!", username="resetuser")

        # 1. Şifre unuttum
        forgot = client.post("/auth/forgot-password", json={"email": "reset@test.com"})
        assert forgot.status_code == 200

        # 2. Kodu al
        db = TestingSessionLocal()
        reset = db.query(models.PasswordReset).first()
        code = reset.reset_code
        db.close()

        # 3. Şifreyi sıfırla
        reset_resp = client.post("/auth/reset-password", json={
            "email": "reset@test.com",
            "code": code,
            "new_password": "NewPass456!",
        })
        assert reset_resp.status_code == 200

        # 4. Yeni şifre ile giriş
        login = client.post("/auth/login", json={
            "email": "reset@test.com",
            "password": "NewPass456!",
        })
        assert login.status_code == 200


class TestScenarioBlockFlow:
    """Senaryo 6: Engelleme akışı."""

    def test_block_flow(self, client):
        uid1 = create_test_user(email="bflow1@test.com", username="bflow1")
        uid2 = create_test_user(email="bflow2@test.com", username="bflow2")
        h1 = get_auth_headers(uid1)

        # 1. Takip et
        client.post(f"/users/{uid2}/follow", headers=h1)

        # 2. Engelle
        block = client.post(f"/users/{uid2}/block", headers=h1)
        assert block.json()["blocked"] is True

        # 3. Takip otomatik silinmiş olmalı
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is False
        db.close()

        # 4. Aramada görünmemeli
        search = client.get("/users/search?q=bflow2", headers=h1)
        usernames = [u["username"] for u in search.json()["items"]]
        assert "bflow2" not in usernames

        # 5. Engellenen kullanıcı mesaj gönderemez
        cid = create_match_conversation(uid1, uid2, place_name="Block Cafe")
        h2 = get_auth_headers(uid2)
        msg = client.post(f"/messages/{cid}", headers=h2, json={"content": "Engel testi"})
        assert msg.status_code == 403

        # 6. Engeli kaldır
        unblock = client.post(f"/users/{uid2}/block", headers=h1)
        assert unblock.json()["blocked"] is False


class TestScenarioAccountDeletion:
    """Senaryo 8: Hesap silme ve cascade."""

    def test_account_deletion_cascade(self, client):
        uid = create_test_user(email="del@test.com", username="deluser")
        pid = create_test_place(name="DelCafe")
        post_id = create_test_post(uid, pid)
        create_test_review(uid, pid)
        headers = get_auth_headers(uid)

        # Yorum ekle
        client.post(f"/posts/{post_id}/comments", headers=headers, json={"text": "yorum"})

        # Hesap sil
        delete = client.delete("/auth/me", headers=headers)
        assert delete.status_code == 200
        assert delete.json()["ok"] is True

        # Kullanıcı DB'de olmamalı
        db = TestingSessionLocal()
        user = db.query(models.User).filter_by(email="del@test.com").first()
        assert user is None
        db.close()

        # Login başarısız olmalı
        login = client.post("/auth/login", json={
            "email": "del@test.com",
            "password": "TestPass123!",
        })
        assert login.status_code == 404


class TestScenarioPlaceDiscovery:
    """Senaryo 9: Mekan keşfi akışı."""

    def test_place_discovery_flow(self, client):
        uid = create_test_user(email="disc@test.com", username="discuser")
        headers = get_auth_headers(uid)

        # 1. Mekanlar oluştur
        pid1 = create_test_place(name="Keşif Cafe 1", city="Istanbul", category="Kafe",
                                  latitude=41.01, longitude=28.97)
        pid2 = create_test_place(name="Keşif Restoran", city="Istanbul", category="Restoran",
                                  latitude=41.02, longitude=28.98)
        create_test_review(uid, pid1, rating=5, comment_text="Harika mekan!")

        # 2. Arama
        search = client.get("/places/search?q=Keşif")
        assert search.json()["total"] == 2

        # 3. Kategori filtresi
        filtered = client.get("/places/search?category=Kafe")
        assert all(p["category"] == "Kafe" for p in filtered.json()["items"])

        # 4. Yakındaki mekanlar
        nearby = client.get("/places/nearby?lat=41.0&lng=28.97&radius=5")
        assert nearby.json()["total"] >= 1

        # 5. Detay görüntüle
        detail = client.get(f"/places/{pid1}")
        assert detail.status_code == 200
        assert detail.json()["name"] == "Keşif Cafe 1"


class TestScenarioTokenLifecycle:
    """Senaryo 10: Token yaşam döngüsü."""

    def test_token_lifecycle(self, client):
        create_test_user(email="tkn@test.com", password="TknPass123!", username="tknuser")

        # 1. Login → token çifti
        login = client.post("/auth/login", json={
            "email": "tkn@test.com",
            "password": "TknPass123!",
        })
        assert login.status_code == 200
        access_token = login.json()["access_token"]
        refresh_token = login.json()["refresh_token"]

        # 2. Access token ile istek
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        assert me.status_code == 200

        # 3. Refresh token ile yenile
        refresh = client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert refresh.status_code == 200
        new_access = refresh.json()["access_token"]
        assert isinstance(new_access, str)
        assert len(new_access) > 20

        # 4. Yeni token ile istek
        me2 = client.get("/auth/me", headers={"Authorization": f"Bearer {new_access}"})
        assert me2.status_code == 200
