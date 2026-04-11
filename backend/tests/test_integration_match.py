# tests/test_integration_match.py — Eşleşme sistemi entegrasyon testleri

"""
Match profile, candidates, like/pass, conversation, reveal endpoint'leri.
"""

import pytest
import json
from datetime import date
from tests.conftest import (
    create_test_user, create_test_place, create_match_profile,
    create_match_conversation, get_auth_headers, TestingSessionLocal,
)
import models, crud


def _adult_user(email, username, gender="Erkek"):
    """18+ kullanıcı + match profili oluşturur."""
    uid = create_test_user(
        email=email, username=username,
        birth_date=date(2000, 1, 1),
    )
    create_match_profile(uid, display_name=username, age=25, gender=gender)
    return uid


class TestMatchProfileCRUD:
    """POST/GET/DELETE /match-profile — Profil yönetimi."""

    def test_create_match_profile(self, client):
        uid = create_test_user(email="mp@test.com", username="mpuser", birth_date=date(2000, 1, 1))
        headers = get_auth_headers(uid)
        response = client.post("/match-profile", headers=headers, json={
            "display_name": "Profil Test",
            "age": 25,
            "bio": "Merhaba!",
            "gender": "Erkek",
            "photo_urls": ["https://ex.com/photo.jpg"],
            "interests": ["müzik", "seyahat"],
        })
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Profil Test"
        assert data["age"] == 25
        assert len(data["photo_urls"]) == 1

    def test_update_existing_profile(self, client):
        uid = create_test_user(email="mpup@test.com", username="mpup", birth_date=date(2000, 1, 1))
        headers = get_auth_headers(uid)
        # Oluştur
        client.post("/match-profile", headers=headers, json={
            "display_name": "İlk", "age": 25,
        })
        # Güncelle
        response = client.post("/match-profile", headers=headers, json={
            "display_name": "Güncellendi", "age": 26,
        })
        assert response.status_code == 200
        assert response.json()["display_name"] == "Güncellendi"

    def test_get_my_match_profile(self, client):
        uid = create_test_user(email="mpme@test.com", username="mpme", birth_date=date(2000, 1, 1))
        create_match_profile(uid, display_name="Ben")
        headers = get_auth_headers(uid)
        response = client.get("/match-profile/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["display_name"] == "Ben"

    def test_get_my_match_profile_not_found(self, client):
        uid = create_test_user(email="mpnf@test.com", username="mpnf", birth_date=date(2000, 1, 1))
        headers = get_auth_headers(uid)
        response = client.get("/match-profile/me", headers=headers)
        assert response.status_code == 404

    def test_delete_match_profile(self, client):
        uid = create_test_user(email="mpdel@test.com", username="mpdel", birth_date=date(2000, 1, 1))
        create_match_profile(uid)
        headers = get_auth_headers(uid)
        response = client.delete("/match-profile", headers=headers)
        assert response.status_code == 200
        assert response.json()["is_active"] is False


class TestAgeGate:
    """Yaş kapısı (18+) kontrolü."""

    def test_underage_cannot_create_profile(self, client):
        uid = create_test_user(
            email="young@test.com", username="young",
            birth_date=date(2015, 1, 1),  # ~11 yaşında
        )
        headers = get_auth_headers(uid)
        response = client.post("/match-profile", headers=headers, json={
            "display_name": "Young", "age": 11,
        })
        assert response.status_code == 403
        assert "18 yaşından" in response.json()["detail"]

    def test_no_birthdate_cannot_create_profile(self, client):
        uid = create_test_user(
            email="nobd@test.com", username="nobd",
            birth_date=None,
        )
        # birth_date None olarak oluşturalım
        db = TestingSessionLocal()
        user = db.query(models.User).filter_by(id=uid).first()
        user.birth_date = None
        db.commit()
        db.close()
        headers = get_auth_headers(uid)
        response = client.post("/match-profile", headers=headers, json={
            "display_name": "NoBD", "age": 25,
        })
        assert response.status_code == 403


class TestMatchCandidates:
    """GET /match/candidates — Aday listesi."""

    def test_get_candidates(self, client):
        uid1 = _adult_user("mc1@test.com", "mc1")
        uid2 = _adult_user("mc2@test.com", "mc2")
        headers = get_auth_headers(uid1)
        response = client.get("/match/candidates", headers=headers)
        assert response.status_code == 200
        data = response.json()
        user_ids = [c["user_id"] for c in data]
        assert uid2 in user_ids

    def test_candidates_excludes_blocked(self, client):
        uid1 = _adult_user("mcb1@test.com", "mcb1")
        uid2 = _adult_user("mcb2@test.com", "mcb2")
        db = TestingSessionLocal()
        crud.toggle_block_user(db, uid1, uid2)
        db.close()
        headers = get_auth_headers(uid1)
        response = client.get("/match/candidates", headers=headers)
        user_ids = [c["user_id"] for c in response.json()]
        assert uid2 not in user_ids

    def test_candidates_excludes_already_acted(self, client):
        uid1 = _adult_user("mca1@test.com", "mca1")
        uid2 = _adult_user("mca2@test.com", "mca2")
        headers = get_auth_headers(uid1)
        # uid1 uid2'yi beğensin
        client.post("/match/like", headers=headers, json={
            "to_user_id": uid2, "action": "like",
        })
        response = client.get("/match/candidates", headers=headers)
        user_ids = [c["user_id"] for c in response.json()]
        assert uid2 not in user_ids

    def test_candidates_requires_profile(self, client):
        uid = create_test_user(email="mcnp@test.com", username="mcnp", birth_date=date(2000, 1, 1))
        headers = get_auth_headers(uid)
        response = client.get("/match/candidates", headers=headers)
        assert response.status_code == 400


class TestMatchLike:
    """POST /match/like — Beğenme / geçme."""

    def test_like_user(self, client):
        uid1 = _adult_user("ml1@test.com", "ml1")
        uid2 = _adult_user("ml2@test.com", "ml2")
        headers = get_auth_headers(uid1)
        response = client.post("/match/like", headers=headers, json={
            "to_user_id": uid2, "action": "like",
        })
        assert response.status_code == 200
        assert response.json()["action"] == "like"
        assert response.json()["matched"] is False

    def test_mutual_like_creates_conversation(self, client):
        uid1 = _adult_user("mml1@test.com", "mml1")
        uid2 = _adult_user("mml2@test.com", "mml2")
        h1 = get_auth_headers(uid1)
        h2 = get_auth_headers(uid2)
        client.post("/match/like", headers=h1, json={
            "to_user_id": uid2, "action": "like",
        })
        response = client.post("/match/like", headers=h2, json={
            "to_user_id": uid1, "action": "like",
        })
        assert response.json()["matched"] is True
        assert response.json()["conversation_id"] is not None

    def test_pass_user(self, client):
        uid1 = _adult_user("mps1@test.com", "mps1")
        uid2 = _adult_user("mps2@test.com", "mps2")
        headers = get_auth_headers(uid1)
        response = client.post("/match/like", headers=headers, json={
            "to_user_id": uid2, "action": "pass",
        })
        assert response.json()["action"] == "pass"
        assert response.json()["matched"] is False

    def test_like_self(self, client):
        uid = _adult_user("mls@test.com", "mls")
        headers = get_auth_headers(uid)
        response = client.post("/match/like", headers=headers, json={
            "to_user_id": uid, "action": "like",
        })
        assert response.status_code == 400


class TestMatchConversations:
    """GET /match/conversations — Konuşma listesi."""

    def test_get_conversations(self, client):
        uid1 = _adult_user("conv1@test.com", "conv1")
        uid2 = _adult_user("conv2@test.com", "conv2")
        create_match_conversation(uid1, uid2, place_name="Conv Cafe")
        headers = get_auth_headers(uid1)
        response = client.get("/match/conversations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["other_user_id"] == uid2


class TestRevealProfile:
    """POST /match/reveal-profile/{id} — Profil gösterme."""

    def test_reveal_profile(self, client):
        uid1 = _adult_user("rev1@test.com", "rev1")
        uid2 = _adult_user("rev2@test.com", "rev2")
        cid = create_match_conversation(uid1, uid2)
        headers = get_auth_headers(uid1)
        response = client.post(f"/match/reveal-profile/{cid}", headers=headers)
        assert response.status_code == 200
        assert response.json()["revealed"] is True

    def test_mutual_reveal_auto_follows(self, client):
        uid1 = _adult_user("mrev1@test.com", "mrev1")
        uid2 = _adult_user("mrev2@test.com", "mrev2")
        cid = create_match_conversation(uid1, uid2)
        h1 = get_auth_headers(uid1)
        h2 = get_auth_headers(uid2)
        client.post(f"/match/reveal-profile/{cid}", headers=h1)
        client.post(f"/match/reveal-profile/{cid}", headers=h2)
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is True
        assert crud.is_following(db, uid2, uid1) is True
        db.close()


class TestUnmatch:
    """DELETE /match/conversations/{id} — Eşleşme sonlandırma."""

    def test_unmatch(self, client):
        uid1 = _adult_user("um1@test.com", "um1")
        uid2 = _adult_user("um2@test.com", "um2")
        cid = create_match_conversation(uid1, uid2)
        headers = get_auth_headers(uid1)
        response = client.delete(f"/match/conversations/{cid}", headers=headers)
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_unmatch_wrong_user(self, client):
        uid1 = _adult_user("umw1@test.com", "umw1")
        uid2 = _adult_user("umw2@test.com", "umw2")
        uid3 = _adult_user("umw3@test.com", "umw3")
        cid = create_match_conversation(uid1, uid2)
        headers = get_auth_headers(uid3)
        response = client.delete(f"/match/conversations/{cid}", headers=headers)
        assert response.status_code == 404


class TestQRVerify:
    """POST /venue/qr-verify — QR kod doğrulama."""

    def test_qr_verify(self, client):
        uid = _adult_user("qr@test.com", "qruser")
        pid = create_test_place(name="QR Cafe")
        headers = get_auth_headers(uid)
        response = client.post("/venue/qr-verify", headers=headers, json={
            "place_id": pid,
        })
        assert response.status_code == 200
        assert response.json()["verified"] is True
        assert response.json()["place_name"] == "QR Cafe"

    def test_qr_verify_invalid_place(self, client):
        uid = _adult_user("qri@test.com", "qriuser")
        headers = get_auth_headers(uid)
        response = client.post("/venue/qr-verify", headers=headers, json={
            "place_id": 99999,
        })
        assert response.status_code == 404
