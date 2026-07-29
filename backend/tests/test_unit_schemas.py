# tests/test_unit_schemas.py — Pydantic şema doğrulama birim testleri

"""
Tüm Pydantic schema'larının validation kurallarını test eder:
- Zorunlu alan kontrolleri
- Min/max değer sınırları
- Regex pattern doğrulama
- Tür uyumsuzlukları
"""

import pytest
from pydantic import ValidationError

import schemas


# ===========================================================================
# USER ŞEMALARI
# ===========================================================================

class TestUserSchemas:
    """UserCreate, UserUpdate, UserLogin doğrulamaları."""

    def test_user_create_valid(self):
        user = schemas.UserCreate(email="test@test.com", password="Pass123!")
        assert user.email == "test@test.com"

    def test_user_create_invalid_email(self):
        with pytest.raises(ValidationError):
            schemas.UserCreate(email="not-an-email", password="Pass123!")

    def test_user_create_missing_password(self):
        with pytest.raises(ValidationError):
            schemas.UserCreate(email="test@test.com")

    def test_user_login_valid(self):
        login = schemas.UserLogin(email="test@test.com", password="pass")
        assert login.email == "test@test.com"

    def test_user_login_invalid_email(self):
        with pytest.raises(ValidationError):
            schemas.UserLogin(email="bad", password="pass")

    def test_user_update_optional_fields(self):
        """Tüm alanlar opsiyonel — boş update geçerli olmalı."""
        update = schemas.UserUpdate()
        assert update.username is None
        assert update.bio is None


# ===========================================================================
# REVIEW ŞEMALARI
# ===========================================================================

class TestReviewSchemas:
    """ReviewCreate doğrulamaları."""

    def test_review_create_valid(self):
        review = schemas.ReviewCreate(
            place_id=1, comment_text="Güzel mekan!", rating=5
        )
        assert review.rating == 5

    def test_review_rating_too_low(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(place_id=1, comment_text="Kötü", rating=0)

    def test_review_rating_too_high(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(place_id=1, comment_text="Süper", rating=6)

    def test_review_comment_too_short(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(place_id=1, comment_text="ab", rating=3)

    def test_review_comment_too_long(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(
                place_id=1, comment_text="x" * 10001, rating=3
            )

    def test_review_valid_visit_type(self):
        review = schemas.ReviewCreate(
            place_id=1, comment_text="Güzel!", rating=4, visit_type="friends"
        )
        assert review.visit_type == "friends"

    def test_review_invalid_visit_type(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(
                place_id=1, comment_text="Güzel!", rating=4, visit_type="invalid"
            )

    def test_review_negative_spent_amount(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(
                place_id=1, comment_text="Test", rating=3, spent_amount=-10
            )

    def test_review_food_rating_boundary(self):
        """Kategorik puanlar 1-5 arası olmalı."""
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(
                place_id=1, comment_text="Test", rating=3, food_rating=6
            )

    def test_review_wait_time_max(self):
        with pytest.raises(ValidationError):
            schemas.ReviewCreate(
                place_id=1, comment_text="Test", rating=3, wait_time_minutes=481
            )


# ===========================================================================
# PLACE ŞEMALARI
# ===========================================================================

class TestPlaceSchemas:
    """PlaceBase, PlaceCreate doğrulamaları."""

    def test_place_create_valid(self):
        place = schemas.PlaceCreate(
            name="Test Cafe", address="Adres 1", city="Istanbul",
            latitude=41.0, longitude=28.9
        )
        assert place.name == "Test Cafe"

    def test_place_latitude_too_low(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Bad", address="Adres", city="X",
                latitude=-91, longitude=0
            )

    def test_place_latitude_too_high(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Bad", address="Adres", city="X",
                latitude=91, longitude=0
            )

    def test_place_longitude_boundaries(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Bad", address="Adres", city="X",
                latitude=0, longitude=181
            )

    def test_place_price_range_valid(self):
        place = schemas.PlaceCreate(
            name="Cafe", address="Adres", city="X", price_range=3
        )
        assert place.price_range == 3

    def test_place_price_range_too_low(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Cafe", address="Adres", city="X", price_range=0
            )

    def test_place_price_range_too_high(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Cafe", address="Adres", city="X", price_range=5
            )

    def test_place_opening_time_format(self):
        place = schemas.PlaceCreate(
            name="Cafe", address="Adres", city="X",
            opening_time="09:00", closing_time="22:00"
        )
        assert place.opening_time == "09:00"

    def test_place_opening_time_invalid_format(self):
        with pytest.raises(ValidationError):
            schemas.PlaceCreate(
                name="Cafe", address="Adres", city="X",
                opening_time="9:00"
            )


# ===========================================================================
# POST ŞEMALARI
# ===========================================================================

class TestPostSchemas:
    """PostCreate, PostCommentCreate doğrulamaları."""

    def test_post_create_valid(self):
        post = schemas.PostCreate(
            caption="Güzel gün!",
            media=[schemas.PostMediaCreate(media_type="image", media_url="https://x.com/img.jpg")]
        )
        assert len(post.media) == 1

    def test_post_comment_create_valid(self):
        comment = schemas.PostCommentCreate(text="Harika!")
        assert comment.text == "Harika!"

    def test_post_comment_empty(self):
        with pytest.raises(ValidationError):
            schemas.PostCommentCreate(text="")

    def test_post_comment_too_long(self):
        with pytest.raises(ValidationError):
            schemas.PostCommentCreate(text="x" * 1001)


# ===========================================================================
# MESSAGE ŞEMALARI
# ===========================================================================

class TestMessageSchemas:
    """MessageCreate doğrulamaları."""

    def test_message_create_valid(self):
        msg = schemas.MessageCreate(content="Merhaba!")
        assert msg.content == "Merhaba!"

    def test_message_create_empty(self):
        with pytest.raises(ValidationError):
            schemas.MessageCreate(content="")

    def test_message_create_too_long(self):
        with pytest.raises(ValidationError):
            schemas.MessageCreate(content="x" * 5001)


# ===========================================================================
# TOKEN VE PREFERENCES ŞEMALARI
# ===========================================================================

class TestMiscSchemas:
    """Token, Preferences, Report şemaları."""

    def test_push_token_request(self):
        token = schemas.PushTokenRequest(token="ExponentPushToken[xxx]")
        assert token.token.startswith("ExponentPushToken")

    def test_report_create_valid(self):
        report = schemas.ReportCreate(
            target_type="post", target_id=1, reason="spam"
        )
        assert report.target_type == "post"

    def test_preferences_update_all_optional(self):
        prefs = schemas.UserPreferencesUpdate()
        assert prefs.language is None

    def test_verify_register_request(self):
        req = schemas.VerifyRegisterRequest(email="test@test.com", code="123456")
        assert req.code == "123456"
