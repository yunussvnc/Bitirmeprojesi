# tests/test_unit_crud.py — CRUD katmanı birim testleri
# pyright: reportOptionalMemberAccess=false
# pyright: reportArgumentType=false

"""
CRUD fonksiyonlarının doğrudan veritabanı katmanında test edilmesi.
Her test izole bir DB oturumu üzerinde çalışır.
"""

import pytest
from datetime import datetime, timedelta, timezone, date

import models, schemas, crud
from crud import _hash_password, _verify_password, _to_bcrypt_password
from tests.conftest import (
    TestingSessionLocal, create_test_user, create_test_place,
    create_test_post, create_test_review,
)


# ===========================================================================
# ŞİFRE HASHLEME
# ===========================================================================

class TestPasswordHashing:
    """_hash_password / _verify_password birim testleri."""

    def test_hash_password_returns_string(self):
        hashed = _hash_password("SecurePass123!")
        assert isinstance(hashed, str)
        assert len(hashed) > 20

    def test_verify_correct_password(self):
        hashed = _hash_password("TestPassword!")
        assert _verify_password("TestPassword!", hashed) is True

    def test_verify_wrong_password(self):
        hashed = _hash_password("CorrectPassword!")
        assert _verify_password("WrongPassword!", hashed) is False

    def test_verify_empty_password(self):
        hashed = _hash_password("SomePassword!")
        assert _verify_password("", hashed) is False

    def test_hash_72_byte_limit(self):
        """bcrypt 72 byte sınırını aşan şifrelerde kesme kontrolü."""
        long_pw = "A" * 100
        hashed = _hash_password(long_pw)
        assert _verify_password(long_pw, hashed) is True

    def test_to_bcrypt_password_truncates(self):
        long_pw = "Ü" * 50  # Unicode: her char > 1 byte
        result = _to_bcrypt_password(long_pw)
        assert len(result) <= 72

    def test_different_passwords_different_hashes(self):
        h1 = _hash_password("password1")
        h2 = _hash_password("password2")
        assert h1 != h2

    def test_unicode_password(self):
        hashed = _hash_password("şifre123Ğ!")
        assert _verify_password("şifre123Ğ!", hashed) is True


# ===========================================================================
# KULLANICI İŞLEMLERİ
# ===========================================================================

class TestUserCRUD:
    """Kullanıcı CRUD fonksiyonları."""

    def test_create_user(self):
        db = TestingSessionLocal()
        user_data = schemas.UserCreate(
            email="new@test.com", password="Pass123!", username="newuser", first_name="New"
        )
        user = crud.create_user(db, user_data)
        assert user.id is not None
        assert user.email == "new@test.com"
        assert user.username == "newuser"
        assert user.password_hash != "Pass123!"  # Hash'lenmiş olmalı
        db.close()

    def test_get_user_by_email(self):
        create_test_user(email="find@test.com", username="finduser")
        db = TestingSessionLocal()
        user = crud.get_user_by_email(db, "find@test.com")
        assert user is not None
        assert user.email == "find@test.com"
        db.close()

    def test_get_user_by_email_not_found(self):
        db = TestingSessionLocal()
        user = crud.get_user_by_email(db, "nonexistent@test.com")
        assert user is None
        db.close()

    def test_get_user_by_username(self):
        create_test_user(email="uname@test.com", username="uniqueuser")
        db = TestingSessionLocal()
        user = crud.get_user_by_username(db, "uniqueuser")
        assert user is not None
        assert user.username == "uniqueuser"
        db.close()

    def test_get_user_by_id(self):
        uid = create_test_user(email="byid@test.com", username="byiduser")
        db = TestingSessionLocal()
        user = crud.get_user_by_id(db, uid)
        assert user is not None
        assert user.id == uid
        db.close()

    def test_update_user(self):
        uid = create_test_user(email="update@test.com", username="updateuser")
        db = TestingSessionLocal()
        data = schemas.UserUpdate(bio="Yeni biyografi", first_name="Updated")
        updated = crud.update_user(db, uid, data)
        assert updated.bio == "Yeni biyografi"
        assert updated.first_name == "Updated"
        db.close()

    def test_update_user_not_found(self):
        db = TestingSessionLocal()
        data = schemas.UserUpdate(bio="test")
        result = crud.update_user(db, 99999, data)
        assert result is None
        db.close()

    def test_authenticate_user_success(self):
        create_test_user(email="auth@test.com", password="AuthPass123!", username="authuser")
        db = TestingSessionLocal()
        user = crud.authenticate_user(db, "auth@test.com", "AuthPass123!")
        assert user is not False
        assert user.email == "auth@test.com"
        db.close()

    def test_authenticate_user_wrong_password(self):
        create_test_user(email="authfail@test.com", password="Correct!", username="authfailuser")
        db = TestingSessionLocal()
        result = crud.authenticate_user(db, "authfail@test.com", "Wrong!")
        assert result is False
        db.close()

    def test_authenticate_user_not_found(self):
        db = TestingSessionLocal()
        result = crud.authenticate_user(db, "ghost@test.com", "any")
        assert result is False
        db.close()


# ===========================================================================
# PENDING USER İŞLEMLERİ
# ===========================================================================

class TestPendingUserCRUD:
    """Pending user (kayıt bekliyor) işlemleri."""

    def test_create_pending_user(self):
        db = TestingSessionLocal()
        user_data = schemas.UserCreate(
            email="pending@test.com", password="Pass123!", username="penduser"
        )
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        pending = crud.create_pending_user(db, user_data, "123456", expires)
        assert pending.id is not None
        assert pending.email == "pending@test.com"
        assert pending.verification_code == "123456"
        db.close()

    def test_get_pending_user_by_email(self):
        db = TestingSessionLocal()
        user_data = schemas.UserCreate(
            email="getpend@test.com", password="Pass123!"
        )
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        crud.create_pending_user(db, user_data, "654321", expires)
        found = crud.get_pending_user_by_email(db, "getpend@test.com")
        assert found is not None
        assert found.verification_code == "654321"
        db.close()

    def test_delete_pending_user(self):
        db = TestingSessionLocal()
        user_data = schemas.UserCreate(
            email="delpend@test.com", password="Pass123!"
        )
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        crud.create_pending_user(db, user_data, "111111", expires)
        crud.delete_pending_user(db, "delpend@test.com")
        found = crud.get_pending_user_by_email(db, "delpend@test.com")
        assert found is None
        db.close()

    def test_create_user_from_pending(self):
        db = TestingSessionLocal()
        user_data = schemas.UserCreate(
            email="frompend@test.com", password="Pass123!", username="frompenduser", first_name="From"
        )
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        pending = crud.create_pending_user(db, user_data, "000000", expires)
        user = crud.create_user_from_pending(db, pending)
        assert user.email == "frompend@test.com"
        assert user.is_email_verified is True
        # Pending silinmiş olmalı
        assert crud.get_pending_user_by_email(db, "frompend@test.com") is None
        db.close()


# ===========================================================================
# MEKAN İŞLEMLERİ
# ===========================================================================

class TestPlaceCRUD:
    """Mekan CRUD fonksiyonları."""

    def test_create_place(self):
        db = TestingSessionLocal()
        place_data = schemas.PlaceCreate(
            name="Yeni Kafe", address="Adres 1", city="Ankara",
            category="Kafe", latitude=39.92, longitude=32.85
        )
        place = crud.create_place(db, place_data)
        assert place.id is not None
        assert place.name == "Yeni Kafe"
        db.close()

    def test_get_place_by_id(self):
        pid = create_test_place(name="GetById Cafe")
        db = TestingSessionLocal()
        place = crud.get_place_by_id(db, pid)
        assert place is not None
        assert place.name == "GetById Cafe"
        db.close()

    def test_get_place_by_id_not_found(self):
        db = TestingSessionLocal()
        place = crud.get_place_by_id(db, 99999)
        assert place is None
        db.close()

    def test_search_places_by_name(self):
        create_test_place(name="Lucca Cafe")
        create_test_place(name="Starbucks")
        db = TestingSessionLocal()
        items, total = crud.search_places(db, q="Lucca")
        assert total == 1
        assert items[0].name == "Lucca Cafe"
        db.close()

    def test_search_places_by_category(self):
        create_test_place(name="Cafe1", category="Kafe")
        create_test_place(name="Restoran1", category="Restoran")
        db = TestingSessionLocal()
        items, total = crud.search_places(db, category="Kafe")
        assert total == 1
        assert items[0].category == "Kafe"
        db.close()

    def test_search_places_by_city(self):
        create_test_place(name="IstCafe", city="Istanbul")
        create_test_place(name="AnkCafe", city="Ankara")
        db = TestingSessionLocal()
        items, total = crud.search_places(db, city="Istanbul")
        assert total == 1
        db.close()

    def test_get_nearby_places(self):
        create_test_place(name="Near", latitude=41.01, longitude=28.97)
        create_test_place(name="Far", latitude=39.90, longitude=32.80)
        db = TestingSessionLocal()
        items, total = crud.get_nearby_places(db, lat=41.00, lng=28.97, radius_km=5.0)
        assert total >= 1
        names = [p.name for p in items]
        assert "Near" in names
        db.close()

    def test_delete_place(self):
        pid = create_test_place(name="ToDelete")
        db = TestingSessionLocal()
        result = crud.delete_place(db, pid)
        assert result is True
        assert crud.get_place_by_id(db, pid) is None
        db.close()

    def test_delete_place_not_found(self):
        db = TestingSessionLocal()
        result = crud.delete_place(db, 99999)
        assert result is False
        db.close()

    def test_get_places_paginated(self):
        for i in range(5):
            create_test_place(name=f"PagPlace{i}", city=f"City{i}")
        db = TestingSessionLocal()
        items, total = crud.get_places_paginated(db, page=1, page_size=3)
        assert total == 5
        assert len(items) == 3
        db.close()


# ===========================================================================
# YORUM İŞLEMLERİ
# ===========================================================================

class TestReviewCRUD:
    """Review CRUD fonksiyonları."""

    def test_create_review(self):
        uid = create_test_user(email="reviewer@test.com", username="reviewer")
        pid = create_test_place(name="ReviewCafe")
        db = TestingSessionLocal()
        review_data = schemas.ReviewCreate(
            place_id=pid, comment_text="Harika bir mekan!", rating=5
        )
        review = crud.create_review(db, review_data, uid)
        assert review.id is not None
        assert review.rating == 5
        assert review.user_id == uid
        db.close()

    def test_update_place_average_rating(self):
        uid = create_test_user(email="rater@test.com", username="rater")
        pid = create_test_place(name="RatedCafe")
        create_test_review(uid, pid, rating=4)
        create_test_review(uid, pid, rating=2)
        db = TestingSessionLocal()
        crud.update_place_average_rating(db, pid)
        place = crud.get_place_by_id(db, pid)
        assert place.average_rating == 3.0
        db.close()

    def test_mark_review_helpful(self):
        uid = create_test_user(email="helpful@test.com", username="helpful")
        pid = create_test_place(name="HelpCafe")
        rid = create_test_review(uid, pid)
        db = TestingSessionLocal()
        review = crud.mark_review_helpful(db, rid)
        assert review.helpful_count == 1
        crud.mark_review_helpful(db, rid)
        db.refresh(review)
        assert review.helpful_count == 2
        db.close()

    def test_add_owner_response(self):
        uid = create_test_user(email="owner@test.com", username="owner")
        pid = create_test_place(name="OwnerCafe")
        rid = create_test_review(uid, pid)
        db = TestingSessionLocal()
        review = crud.add_owner_response(db, rid, "Teşekkür ederiz!")
        assert review.owner_response == "Teşekkür ederiz!"
        assert review.owner_response_at is not None
        db.close()


# ===========================================================================
# POST İŞLEMLERİ
# ===========================================================================

class TestPostCRUD:
    """Post CRUD fonksiyonları."""

    def test_create_post(self):
        uid = create_test_user(email="poster@test.com", username="poster")
        pid = create_test_place(name="PostCafe")
        db = TestingSessionLocal()
        post_data = schemas.PostCreate(
            caption="Güzel gün!", place_id=pid, post_type="photo",
            media=[schemas.PostMediaCreate(media_type="image", media_url="https://x.com/img.jpg")]
        )
        post = crud.create_post(db, uid, post_data)
        assert post.id is not None
        assert post.caption == "Güzel gün!"
        assert len(post.media) == 1
        db.close()

    def test_toggle_post_like(self):
        uid = create_test_user(email="liker@test.com", username="liker")
        post_id = create_test_post(uid)
        db = TestingSessionLocal()
        # İlk like
        post, liked = crud.toggle_post_like(db, post_id, uid)
        assert liked is True
        assert post.like_count == 1
        # Unlike
        post, liked = crud.toggle_post_like(db, post_id, uid)
        assert liked is False
        assert post.like_count == 0
        db.close()

    def test_add_post_comment(self):
        uid = create_test_user(email="commenter@test.com", username="commenter")
        post_id = create_test_post(uid)
        db = TestingSessionLocal()
        comment = crud.add_post_comment(db, post_id, uid, "Harika!")
        assert comment is not None
        assert comment.text == "Harika!"
        db.close()

    def test_add_comment_disabled_post(self):
        uid = create_test_user(email="disabled@test.com", username="disabled")
        db = TestingSessionLocal()
        post = models.Post(
            user_id=uid, caption="No comments", post_type="photo", comments_disabled=True
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        result = crud.add_post_comment(db, post.id, uid, "Try comment")
        assert result is None  # Yorumlar kapalı
        db.close()

    def test_delete_post(self):
        uid = create_test_user(email="delpost@test.com", username="delpost")
        post_id = create_test_post(uid)
        db = TestingSessionLocal()
        assert crud.delete_post(db, post_id, uid) is True
        assert crud.get_post_by_id(db, post_id) is None
        db.close()

    def test_delete_post_wrong_user(self):
        uid1 = create_test_user(email="postowner@test.com", username="postowner")
        uid2 = create_test_user(email="notowner@test.com", username="notowner")
        post_id = create_test_post(uid1)
        db = TestingSessionLocal()
        assert crud.delete_post(db, post_id, uid2) is False
        db.close()

    def test_is_post_liked_by_user(self):
        uid = create_test_user(email="isliked@test.com", username="isliked")
        post_id = create_test_post(uid)
        db = TestingSessionLocal()
        assert crud.is_post_liked_by_user(db, post_id, uid) is False
        crud.toggle_post_like(db, post_id, uid)
        assert crud.is_post_liked_by_user(db, post_id, uid) is True
        db.close()


# ===========================================================================
# TAKİP İŞLEMLERİ
# ===========================================================================

class TestFollowCRUD:
    """Follow CRUD fonksiyonları."""

    def test_toggle_follow(self):
        uid1 = create_test_user(email="follower@test.com", username="followerx")
        uid2 = create_test_user(email="following@test.com", username="followingx")
        db = TestingSessionLocal()
        is_following, created = crud.toggle_follow(db, uid1, uid2)
        assert is_following is True
        assert created is True
        # Unfollow
        is_following, created = crud.toggle_follow(db, uid1, uid2)
        assert is_following is False
        db.close()

    def test_follow_self(self):
        uid = create_test_user(email="selffollow@test.com", username="selffollow")
        db = TestingSessionLocal()
        is_following, created = crud.toggle_follow(db, uid, uid)
        assert is_following is False
        assert created is False
        db.close()

    def test_is_following(self):
        uid1 = create_test_user(email="isf1@test.com", username="isf1")
        uid2 = create_test_user(email="isf2@test.com", username="isf2")
        db = TestingSessionLocal()
        assert crud.is_following(db, uid1, uid2) is False
        crud.toggle_follow(db, uid1, uid2)
        assert crud.is_following(db, uid1, uid2) is True
        db.close()

    def test_get_follower_ids(self):
        uid1 = create_test_user(email="gf1@test.com", username="gf1")
        uid2 = create_test_user(email="gf2@test.com", username="gf2")
        uid3 = create_test_user(email="gf3@test.com", username="gf3")
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid2, uid1)  # uid2 follows uid1
        crud.toggle_follow(db, uid3, uid1)  # uid3 follows uid1
        followers = crud.get_follower_ids(db, uid1)
        assert set(followers) == {uid2, uid3}
        db.close()

    def test_get_following_ids(self):
        uid1 = create_test_user(email="gfi1@test.com", username="gfi1")
        uid2 = create_test_user(email="gfi2@test.com", username="gfi2")
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid1, uid2)  # uid1 follows uid2
        following = crud.get_following_ids(db, uid1)
        assert uid2 in following
        db.close()


# ===========================================================================
# ENGELLEME İŞLEMLERİ
# ===========================================================================

class TestBlockCRUD:
    """Block CRUD fonksiyonları."""

    def test_toggle_block(self):
        uid1 = create_test_user(email="blocker@test.com", username="blocker")
        uid2 = create_test_user(email="blocked@test.com", username="blocked")
        db = TestingSessionLocal()
        is_blocked = crud.toggle_block_user(db, uid1, uid2)
        assert is_blocked is True
        # Unblock
        is_blocked = crud.toggle_block_user(db, uid1, uid2)
        assert is_blocked is False
        db.close()

    def test_is_blocked(self):
        uid1 = create_test_user(email="isb1@test.com", username="isb1")
        uid2 = create_test_user(email="isb2@test.com", username="isb2")
        db = TestingSessionLocal()
        assert crud.is_blocked(db, uid1, uid2) is False
        crud.toggle_block_user(db, uid1, uid2)
        assert crud.is_blocked(db, uid1, uid2) is True
        db.close()

    def test_get_blocked_user_ids(self):
        uid1 = create_test_user(email="gbi1@test.com", username="gbi1")
        uid2 = create_test_user(email="gbi2@test.com", username="gbi2")
        uid3 = create_test_user(email="gbi3@test.com", username="gbi3")
        db = TestingSessionLocal()
        crud.toggle_block_user(db, uid1, uid2)
        crud.toggle_block_user(db, uid1, uid3)
        blocked = crud.get_blocked_user_ids(db, uid1)
        assert set(blocked) == {uid2, uid3}
        db.close()


# ===========================================================================
# BİLDİRİM İŞLEMLERİ
# ===========================================================================

class TestNotificationCRUD:
    """Notification CRUD fonksiyonları."""

    def test_create_notification(self):
        uid1 = create_test_user(email="notif1@test.com", username="notif1")
        uid2 = create_test_user(email="notif2@test.com", username="notif2")
        db = TestingSessionLocal()
        n = crud.create_notification(db, uid1, "follow", uid2)
        assert n is not None
        assert n.type == "follow"
        assert n.user_id == uid1
        assert n.actor_id == uid2
        db.close()

    def test_create_notification_self(self):
        """Kendi kendine bildirim oluşturulmamalı."""
        uid = create_test_user(email="selfnotif@test.com", username="selfnotif")
        db = TestingSessionLocal()
        n = crud.create_notification(db, uid, "like", uid)
        assert n is None
        db.close()

    def test_unread_notification_count(self):
        uid1 = create_test_user(email="unread1@test.com", username="unread1")
        uid2 = create_test_user(email="unread2@test.com", username="unread2")
        db = TestingSessionLocal()
        crud.create_notification(db, uid1, "like", uid2)
        crud.create_notification(db, uid1, "follow", uid2)
        count = crud.get_unread_notification_count(db, uid1)
        assert count == 2
        db.close()

    def test_mark_notifications_read(self):
        uid1 = create_test_user(email="markread1@test.com", username="markread1")
        uid2 = create_test_user(email="markread2@test.com", username="markread2")
        db = TestingSessionLocal()
        crud.create_notification(db, uid1, "like", uid2)
        crud.mark_notifications_read(db, uid1)
        count = crud.get_unread_notification_count(db, uid1)
        assert count == 0
        db.close()


# ===========================================================================
# KAYDETME İŞLEMLERİ
# ===========================================================================

class TestSavedCRUD:
    """Saved place/post CRUD fonksiyonları."""

    def test_toggle_save_place(self):
        uid = create_test_user(email="saver@test.com", username="saver")
        pid = create_test_place(name="SaveCafe")
        db = TestingSessionLocal()
        saved = crud.toggle_save_place(db, uid, pid)
        assert saved is True
        assert crud.is_place_saved(db, uid, pid) is True
        # Unsave
        saved = crud.toggle_save_place(db, uid, pid)
        assert saved is False
        assert crud.is_place_saved(db, uid, pid) is False
        db.close()

    def test_toggle_save_post(self):
        uid = create_test_user(email="postsaver@test.com", username="postsaver")
        post_id = create_test_post(uid)
        db = TestingSessionLocal()
        saved = crud.toggle_save_post(db, uid, post_id)
        assert saved is True
        saved = crud.toggle_save_post(db, uid, post_id)
        assert saved is False
        db.close()


# ===========================================================================
# TERCİHLER
# ===========================================================================

class TestPreferencesCRUD:
    """UserPreferences CRUD fonksiyonları."""

    def test_get_or_create_preferences(self):
        uid = create_test_user(email="prefs@test.com", username="prefs")
        db = TestingSessionLocal()
        prefs = crud.get_or_create_preferences(db, uid)
        assert prefs is not None
        assert prefs.language == "tr"
        assert prefs.is_private_account is False
        db.close()

    def test_update_preferences(self):
        uid = create_test_user(email="upprefs@test.com", username="upprefs")
        db = TestingSessionLocal()
        data = schemas.UserPreferencesUpdate(language="en", is_private_account=True)
        prefs = crud.update_preferences(db, uid, data)
        assert prefs.language == "en"
        assert prefs.is_private_account is True
        db.close()

    def test_preferences_to_response(self):
        uid = create_test_user(email="respprefs@test.com", username="respprefs")
        db = TestingSessionLocal()
        prefs = crud.get_or_create_preferences(db, uid)
        response = crud.preferences_to_response(prefs)
        assert response["language"] == "tr"
        assert isinstance(response["hidden_words"], list)
        db.close()


# ===========================================================================
# KULLANICI İSTATİSTİKLERİ
# ===========================================================================

class TestUserStatsCRUD:
    """get_user_stats fonksiyonu."""

    def test_empty_stats(self):
        uid = create_test_user(email="emptystats@test.com", username="emptystats")
        db = TestingSessionLocal()
        stats = crud.get_user_stats(db, uid)
        assert stats["post_count"] == 0
        assert stats["follower_count"] == 0
        assert stats["review_count"] == 0
        db.close()

    def test_stats_with_data(self):
        uid = create_test_user(email="fullstats@test.com", username="fullstats")
        uid2 = create_test_user(email="fstats2@test.com", username="fstats2")
        pid = create_test_place(name="StatsCafe")
        create_test_post(uid, pid)
        create_test_review(uid, pid)
        db = TestingSessionLocal()
        crud.toggle_follow(db, uid2, uid)  # uid2 follows uid
        stats = crud.get_user_stats(db, uid)
        assert stats["post_count"] == 1
        assert stats["follower_count"] == 1
        assert stats["review_count"] == 1
        db.close()
