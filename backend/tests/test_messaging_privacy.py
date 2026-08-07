# tests/test_messaging_privacy.py — Mesajlaşma gizlilik kuralları testleri
# BUG 1: Ping-pong mesaj limiti
# BUG 2: Duplikat konuşma önleme
# BUG 3: unknown_message_requests ve show_read_receipts entegrasyonu

"""
Mesajlaşma gizlilik motoru (_get_messaging_permission) testleri.
Her senaryo için izin durumlarını doğrular.
"""

import pytest
from datetime import date
from tests.conftest import (
    create_test_user, create_match_conversation,
    get_auth_headers, TestingSessionLocal,
)
import models
import crud


def _setup_mutual_follow_conversation():
    """İki kullanıcı, karşılıklı takip ve konuşma oluşturur (tam mesajlaşma izni)."""
    uid1 = create_test_user(email="priv1@test.com", username="priv1", birth_date=date(2000, 1, 1))
    uid2 = create_test_user(email="priv2@test.com", username="priv2", birth_date=date(2000, 1, 1))
    db = TestingSessionLocal()
    crud.toggle_follow(db, uid1, uid2)
    crud.toggle_follow(db, uid2, uid1)
    db.close()
    cid = create_match_conversation(uid1, uid2, place_name="Privacy Cafe")
    return uid1, uid2, cid


def _setup_no_follow_conversation():
    """İki kullanıcı, takip yok ama konuşma var (kısıtlı mod)."""
    uid1 = create_test_user(email="nf1@test.com", username="nf1", birth_date=date(2000, 1, 1))
    uid2 = create_test_user(email="nf2@test.com", username="nf2", birth_date=date(2000, 1, 1))
    cid = create_match_conversation(uid1, uid2, place_name="NoFollow Cafe")
    return uid1, uid2, cid


def _send_message(client, uid, cid, content="Test mesaj"):
    """Yardımcı: mesaj gönder."""
    headers = get_auth_headers(uid)
    return client.post(f"/messages/{cid}", headers=headers, json={
        "content": content,
    })


def _get_permission(client, uid, cid):
    """Yardımcı: izin durumunu getir."""
    headers = get_auth_headers(uid)
    return client.get(f"/messages/{cid}/permission", headers=headers)


def _set_user_preferences(uid, **kwargs):
    """Kullanıcıya tercih ayarları ekler."""
    db = TestingSessionLocal()
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == uid
    ).first()
    if not prefs:
        prefs = models.UserPreferences(user_id=uid)
        db.add(prefs)
    for key, value in kwargs.items():
        setattr(prefs, key, value)
    db.commit()
    db.close()


# ═══════════════════════════════════════════════════════════════
# BUG 1: Ping-pong mesaj limiti testleri
# ═══════════════════════════════════════════════════════════════

class TestPingPongLimit:
    """Kısıtlı modda mesaj limiti: B cevap verdikten sonra A sadece 1 mesaj daha gönderebilir."""

    def test_first_message_allowed(self, client):
        """Takip yok, B açık hesap → A ilk mesajını gönderebilir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        resp = _send_message(client, uid1, cid, "İlk mesaj")
        assert resp.status_code == 200

    def test_second_message_blocked_without_reply(self, client):
        """A 1 mesaj gönderdi, B cevap vermedi → A 2. mesajı gönderemez."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _send_message(client, uid1, cid, "İlk mesaj")
        resp = _send_message(client, uid1, cid, "İkinci mesaj")
        assert resp.status_code == 403

    def test_reply_unlocks_one_more_message(self, client):
        """A mesaj gönderdi, B cevap verdi → A tekrar 1 mesaj gönderebilir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _send_message(client, uid1, cid, "Merhaba")
        # B cevap veriyor
        _send_message(client, uid2, cid, "Merhaba sana da")
        # A tekrar 1 mesaj gönderebilir
        resp = _send_message(client, uid1, cid, "Nasılsın?")
        assert resp.status_code == 200

    def test_reply_does_not_unlock_unlimited(self, client):
        """A mesaj gönderdi, B cevap verdi → A 1 mesaj gönderir → 2. mesaj yine engellenir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _send_message(client, uid1, cid, "Merhaba")
        _send_message(client, uid2, cid, "Cevap")
        _send_message(client, uid1, cid, "Tekrar merhaba")
        # A'nın 2. mesajı B'den cevap gelmeden engellenmeli
        resp = _send_message(client, uid1, cid, "Bu engellenmeli")
        assert resp.status_code == 403

    def test_ping_pong_multiple_rounds(self, client):
        """Birden fazla tur ping-pong çalışır."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        # Tur 1
        assert _send_message(client, uid1, cid, "1A").status_code == 200
        assert _send_message(client, uid2, cid, "1B").status_code == 200
        # Tur 2
        assert _send_message(client, uid1, cid, "2A").status_code == 200
        assert _send_message(client, uid2, cid, "2B").status_code == 200
        # Tur 3
        assert _send_message(client, uid1, cid, "3A").status_code == 200
        # B cevap vermeden A 2. mesaj → engel
        assert _send_message(client, uid1, cid, "3A-ekstra").status_code == 403

    def test_permission_endpoint_shows_awaiting_reply(self, client):
        """İzin endpoint'i awaiting_reply durumunu doğru gösterir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _send_message(client, uid1, cid, "Bekle")
        perm = _get_permission(client, uid1, cid)
        assert perm.status_code == 200
        data = perm.json()
        assert data["can_send"] is False
        assert data["reason"] == "awaiting_reply"
        assert data["awaiting_reply"] is True


# ═══════════════════════════════════════════════════════════════
# BUG 2: Duplikat konuşma önleme testleri
# ═══════════════════════════════════════════════════════════════

class TestDuplicateConversationPrevention:
    """Konuşma açılırken user ID'leri sıralanarak duplikat önlenir."""

    def test_open_conversation_both_directions_same_id(self, client):
        """A→B ve B→A aynı konuşma ID'sini döndürmeli."""
        uid1 = create_test_user(email="dup1@test.com", username="dup1", birth_date=date(2000, 1, 1))
        uid2 = create_test_user(email="dup2@test.com", username="dup2", birth_date=date(2000, 1, 1))

        # A→B konuşma aç
        headers1 = get_auth_headers(uid1)
        resp1 = client.post("/messages/conversation/open", headers=headers1, json={"user_id": uid2})
        assert resp1.status_code == 200
        cid1 = resp1.json()["conversation_id"]

        # B→A konuşma aç
        headers2 = get_auth_headers(uid2)
        resp2 = client.post("/messages/conversation/open", headers=headers2, json={"user_id": uid1})
        assert resp2.status_code == 200
        cid2 = resp2.json()["conversation_id"]

        # Aynı konuşma ID'si olmalı
        assert cid1 == cid2

    def test_open_conversation_user_ids_sorted(self, client):
        """Oluşturulan konuşmada user1_id < user2_id olmalı."""
        uid1 = create_test_user(email="sort1@test.com", username="sort1", birth_date=date(2000, 1, 1))
        uid2 = create_test_user(email="sort2@test.com", username="sort2", birth_date=date(2000, 1, 1))

        # uid2 > uid1 olduğunu varsayarak, uid2 konuşmayı açsın
        bigger = max(uid1, uid2)
        smaller = min(uid1, uid2)
        headers = get_auth_headers(bigger)
        resp = client.post("/messages/conversation/open", headers=headers, json={"user_id": smaller})
        assert resp.status_code == 200
        cid = resp.json()["conversation_id"]

        # DB'den kontrol et
        db = TestingSessionLocal()
        conv = db.query(models.Conversation).filter(models.Conversation.id == cid).first()
        assert conv.user1_id == smaller
        assert conv.user2_id == bigger
        db.close()


# ═══════════════════════════════════════════════════════════════
# BUG 3: unknown_message_requests ve show_read_receipts testleri
# ═══════════════════════════════════════════════════════════════

class TestUnknownMessageRequests:
    """unknown_message_requests = False ise tanınmayan kişilerden mesaj engeli."""

    def test_unknown_messages_disabled_blocks_stranger(self, client):
        """B, unknown_message_requests=False ayarlamış → takip etmeyen A mesaj gönderemez."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _set_user_preferences(uid2, unknown_message_requests=False)

        resp = _send_message(client, uid1, cid, "Merhaba tanımadığım kişi")
        assert resp.status_code == 403

    def test_unknown_messages_disabled_permission_reason(self, client):
        """İzin endpoint'i unknown_messages_disabled reason döndürür."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _set_user_preferences(uid2, unknown_message_requests=False)

        perm = _get_permission(client, uid1, cid)
        assert perm.status_code == 200
        data = perm.json()
        assert data["can_send"] is False
        assert data["reason"] == "unknown_messages_disabled"

    def test_unknown_messages_disabled_mutual_follow_allowed(self, client):
        """B, unknown_message_requests=False ama karşılıklı takip var → mesaj serbest."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()
        _set_user_preferences(uid2, unknown_message_requests=False)

        resp = _send_message(client, uid1, cid, "Karşılıklı takip ile serbest")
        assert resp.status_code == 200

    def test_unknown_messages_enabled_allows_stranger(self, client):
        """B, unknown_message_requests=True (varsayılan) → A mesaj gönderebilir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _set_user_preferences(uid2, unknown_message_requests=True)

        resp = _send_message(client, uid1, cid, "Tanımadığım kişiye mesaj")
        assert resp.status_code == 200


class TestShowReadReceipts:
    """show_read_receipts = False ise karşılıklı takipleşmede bile görüldü gizlenir."""

    def test_read_receipt_hidden_when_disabled(self, client):
        """B, show_read_receipts=False → karşılıklı takip olsa bile hide_read_receipt=True."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()
        _set_user_preferences(uid2, show_read_receipts=False)

        perm = _get_permission(client, uid1, cid)
        assert perm.status_code == 200
        data = perm.json()
        assert data["can_send"] is True
        assert data["reason"] == "mutual_follow"
        assert data["hide_read_receipt"] is True

    def test_read_receipt_shown_when_enabled(self, client):
        """B, show_read_receipts=True (varsayılan) → karşılıklı takipte görüldü gösterilir."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()
        _set_user_preferences(uid2, show_read_receipts=True)

        perm = _get_permission(client, uid1, cid)
        assert perm.status_code == 200
        data = perm.json()
        assert data["can_send"] is True
        assert data["hide_read_receipt"] is False

    def test_read_receipt_default_mutual_follow(self, client):
        """Varsayılan ayarlarla karşılıklı takipte görüldü gösterilir."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()

        perm = _get_permission(client, uid1, cid)
        assert perm.status_code == 200
        data = perm.json()
        assert data["hide_read_receipt"] is False


# ═══════════════════════════════════════════════════════════════
# Mevcut senaryoların doğruluğu
# ═══════════════════════════════════════════════════════════════

class TestExistingScenarios:
    """Mevcut senaryoların hâlâ doğru çalıştığını kontrol et."""

    def test_mutual_follow_full_access(self, client):
        """Karşılıklı takip → tam izin."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()
        perm = _get_permission(client, uid1, cid)
        data = perm.json()
        assert data["can_send"] is True
        assert data["can_send_media"] is True
        assert data["reason"] == "mutual_follow"

    def test_private_account_no_mutual_blocked(self, client):
        """B gizli hesap, karşılıklı takip yok → mesaj engeli."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        _set_user_preferences(uid2, is_private_account=True)

        perm = _get_permission(client, uid1, cid)
        data = perm.json()
        assert data["can_send"] is False
        assert data["reason"] == "private_account_no_mutual"

    def test_media_blocked_in_restricted_mode(self, client):
        """Kısıtlı modda medya gönderimi engellenir."""
        uid1, uid2, cid = _setup_no_follow_conversation()
        headers = get_auth_headers(uid1)
        resp = client.post(f"/messages/{cid}", headers=headers, json={
            "content": "Fotoğraf",
            "message_type": "image",
            "media_url": "https://example.com/photo.jpg",
        })
        assert resp.status_code == 403

    def test_blocked_user_cannot_message(self, client):
        """Engellenmiş kullanıcı mesaj gönderemez."""
        uid1, uid2, cid = _setup_mutual_follow_conversation()
        db = TestingSessionLocal()
        crud.toggle_block_user(db, uid1, uid2)
        db.close()

        resp = _send_message(client, uid2, cid, "Engellenmiş mesaj")
        assert resp.status_code == 403
