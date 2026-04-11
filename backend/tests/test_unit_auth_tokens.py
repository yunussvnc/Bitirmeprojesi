# tests/test_unit_auth_tokens.py — JWT token birim testleri

"""
Token oluşturma, decode ve doğrulama fonksiyonlarının izole testleri.
"""

import pytest
import time
from datetime import datetime, timedelta
from jose import jwt

from auth import create_access_token, create_refresh_token, decode_token
from config import get_settings

settings = get_settings()


class TestAccessToken:
    """Access token oluşturma ve decode testleri."""

    def test_create_access_token_returns_string(self):
        token = create_access_token(1)
        assert isinstance(token, str)
        assert len(token) > 20

    def test_access_token_contains_sub(self):
        token = create_access_token(42)
        payload = decode_token(token)
        assert payload["sub"] == "42"

    def test_access_token_type_is_access(self):
        token = create_access_token(1)
        payload = decode_token(token)
        assert payload["type"] == "access"

    def test_access_token_has_expiry(self):
        token = create_access_token(1)
        payload = decode_token(token)
        assert "exp" in payload

    def test_different_users_different_tokens(self):
        t1 = create_access_token(1)
        t2 = create_access_token(2)
        assert t1 != t2


class TestRefreshToken:
    """Refresh token oluşturma ve decode testleri."""

    def test_create_refresh_token_returns_string(self):
        token = create_refresh_token(1)
        assert isinstance(token, str)

    def test_refresh_token_type_is_refresh(self):
        token = create_refresh_token(1)
        payload = decode_token(token)
        assert payload["type"] == "refresh"

    def test_refresh_token_contains_sub(self):
        token = create_refresh_token(99)
        payload = decode_token(token)
        assert payload["sub"] == "99"


class TestDecodeToken:
    """decode_token fonksiyonu edge case'leri."""

    def test_decode_valid_token(self):
        token = create_access_token(1)
        payload = decode_token(token)
        assert payload.get("sub") == "1"
        assert payload.get("type") == "access"

    def test_decode_invalid_token(self):
        """Geçersiz token → boş dict."""
        payload = decode_token("this.is.invalid")
        assert payload == {}

    def test_decode_empty_token(self):
        payload = decode_token("")
        assert payload == {}

    def test_decode_expired_token(self):
        """Süresi dolmuş token → boş dict."""
        expired_payload = {
            "sub": "1",
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access",
        }
        expired_token = jwt.encode(
            expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )
        result = decode_token(expired_token)
        assert result == {}

    def test_decode_wrong_secret(self):
        """Farklı secret ile oluşturulan token → boş dict."""
        payload = {
            "sub": "1", "exp": datetime.utcnow() + timedelta(hours=1), "type": "access"
        }
        token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        result = decode_token(token)
        assert result == {}

    def test_token_payload_manipulation(self):
        """Token payload değiştirilirse decode başarısız olmalı."""
        token = create_access_token(1)
        parts = token.split(".")
        # Payload'u manipüle et
        import base64
        payload_bytes = base64.urlsafe_b64decode(parts[1] + "==")
        manipulated = payload_bytes.replace(b'"1"', b'"999"')
        parts[1] = base64.urlsafe_b64encode(manipulated).rstrip(b"=").decode()
        tampered = ".".join(parts)
        result = decode_token(tampered)
        # Ya boş dönmeli ya da sub 1 olmalı (imza geçersiz)
        assert result == {} or result.get("sub") == "1"
