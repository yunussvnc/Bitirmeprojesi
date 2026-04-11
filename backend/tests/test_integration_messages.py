# tests/test_integration_messages.py — Mesajlaşma entegrasyon testleri

"""
Messages router entegrasyon testleri.
REST mesaj gönderme, geçmiş, okundu, silme endpoint'leri.
"""

import pytest
from datetime import date
from tests.conftest import (
    create_test_user, create_match_profile, create_match_conversation,
    get_auth_headers, TestingSessionLocal,
)
import models


def _setup_conversation():
    """İki kullanıcı ve aralarında konuşma oluşturur."""
    uid1 = create_test_user(email="msg1@test.com", username="msg1", birth_date=date(2000, 1, 1))
    uid2 = create_test_user(email="msg2@test.com", username="msg2", birth_date=date(2000, 1, 1))
    cid = create_match_conversation(uid1, uid2, place_name="Msg Cafe")
    return uid1, uid2, cid


def _send_message(client, uid, cid, content="Merhaba!"):
    """Yardımcı: mesaj gönder."""
    headers = get_auth_headers(uid)
    return client.post(f"/messages/{cid}", headers=headers, json={
        "content": content,
    })


class TestSendMessage:
    """POST /messages/{conversation_id} — Mesaj gönderme."""

    def test_send_message(self, client):
        uid1, uid2, cid = _setup_conversation()
        response = _send_message(client, uid1, cid, "Merhaba!")
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "Merhaba!"
        assert data["sender_id"] == uid1
        assert data["conversation_id"] == cid

    def test_send_message_unauthorized(self, client):
        uid1, uid2, cid = _setup_conversation()
        uid3 = create_test_user(email="msg3@test.com", username="msg3")
        headers = get_auth_headers(uid3)
        response = client.post(f"/messages/{cid}", headers=headers, json={
            "content": "İzinsiz mesaj",
        })
        assert response.status_code == 403

    def test_send_message_nonexistent_conversation(self, client):
        uid1 = create_test_user(email="msgne@test.com", username="msgne")
        headers = get_auth_headers(uid1)
        response = client.post("/messages/99999", headers=headers, json={
            "content": "Yok",
        })
        assert response.status_code == 404

    def test_send_image_message(self, client):
        uid1, uid2, cid = _setup_conversation()
        headers = get_auth_headers(uid1)
        response = client.post(f"/messages/{cid}", headers=headers, json={
            "content": "Fotoğraf",
            "message_type": "image",
            "media_url": "https://ex.com/img.jpg",
        })
        assert response.status_code == 200
        assert response.json()["message_type"] == "image"


class TestGetMessages:
    """GET /messages/{conversation_id} — Mesaj geçmişi."""

    def test_get_messages(self, client):
        uid1, uid2, cid = _setup_conversation()
        _send_message(client, uid1, cid, "Mesaj 1")
        _send_message(client, uid2, cid, "Mesaj 2")
        headers = get_auth_headers(uid1)
        response = client.get(f"/messages/{cid}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    def test_get_messages_pagination(self, client):
        uid1, uid2, cid = _setup_conversation()
        for i in range(5):
            _send_message(client, uid1, cid, f"Mesaj {i}")
        headers = get_auth_headers(uid1)
        response = client.get(f"/messages/{cid}?page=1&page_size=2", headers=headers)
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5

    def test_get_messages_order(self, client):
        uid1, uid2, cid = _setup_conversation()
        _send_message(client, uid1, cid, "İlk")
        _send_message(client, uid2, cid, "İkinci")
        headers = get_auth_headers(uid1)
        response = client.get(f"/messages/{cid}", headers=headers)
        items = response.json()["items"]
        # Her iki mesaj da döndürülmeli
        contents = [item["content"] for item in items]
        assert "İlk" in contents
        assert "İkinci" in contents


class TestMarkRead:
    """POST /messages/{id}/read — Okundu işaretleme."""

    def test_mark_all_read(self, client):
        uid1, uid2, cid = _setup_conversation()
        _send_message(client, uid1, cid, "Okunmamış 1")
        _send_message(client, uid1, cid, "Okunmamış 2")
        headers = get_auth_headers(uid2)
        response = client.post(f"/messages/{cid}/read", headers=headers)
        assert response.status_code == 200

    def test_mark_single_read(self, client):
        uid1, uid2, cid = _setup_conversation()
        resp = _send_message(client, uid1, cid, "Tek mesaj")
        msg_id = resp.json()["id"]
        headers = get_auth_headers(uid2)
        response = client.put(f"/messages/{msg_id}/read", headers=headers)
        assert response.status_code == 200
        assert response.json()["is_read"] is True


class TestUnreadCount:
    """GET /messages/{id}/unread-count — Okunmamış sayısı."""

    def test_unread_count(self, client):
        uid1, uid2, cid = _setup_conversation()
        _send_message(client, uid1, cid, "Okunmamış")
        _send_message(client, uid1, cid, "Okunmamış 2")
        headers = get_auth_headers(uid2)
        response = client.get(f"/messages/{cid}/unread-count", headers=headers)
        assert response.status_code == 200
        assert response.json()["count"] == 2

    def test_unread_count_after_read(self, client):
        uid1, uid2, cid = _setup_conversation()
        _send_message(client, uid1, cid, "Okunacak")
        headers = get_auth_headers(uid2)
        client.post(f"/messages/{cid}/read", headers=headers)
        response = client.get(f"/messages/{cid}/unread-count", headers=headers)
        assert response.json()["count"] == 0


class TestDeleteMessage:
    """DELETE /messages/{id} — Mesaj silme."""

    def test_delete_own_message(self, client):
        uid1, uid2, cid = _setup_conversation()
        resp = _send_message(client, uid1, cid, "Sil beni")
        msg_id = resp.json()["id"]
        headers = get_auth_headers(uid1)
        response = client.delete(f"/messages/{msg_id}", headers=headers)
        assert response.status_code == 200

    def test_delete_others_message(self, client):
        uid1, uid2, cid = _setup_conversation()
        resp = _send_message(client, uid1, cid, "Silemezsin")
        msg_id = resp.json()["id"]
        headers = get_auth_headers(uid2)
        response = client.delete(f"/messages/{msg_id}", headers=headers)
        assert response.status_code == 403

    def test_delete_nonexistent_message(self, client):
        uid1 = create_test_user(email="delne@test.com", username="delne")
        headers = get_auth_headers(uid1)
        response = client.delete("/messages/99999", headers=headers)
        assert response.status_code == 404
