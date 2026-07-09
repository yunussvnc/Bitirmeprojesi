# tests/conftest.py — Ortak test altyapısı
# Tüm test dosyaları bu fixture'ları paylaşır.

import os
import sys

os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///./test_suite.db"

import pytest
from datetime import datetime, timedelta, timezone, date
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Backend klasörünü sys.path'e ekle
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import Base
from main import app
from app.dependencies import get_db
import models
from crud import _hash_password
from auth import create_access_token, create_refresh_token

# ---------------------------------------------------------------------------
# Test veritabanı yapılandırması — her test dosyası aynı in-memory DB'yi kullanır
# ---------------------------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_suite.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_engine():
    """Test DB engine'i (session scope)."""
    return engine


@pytest.fixture()
def db():
    """Her test için bağımsız bir veritabanı oturumu."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# Testler bare path kullanır (ör. "/auth/login") — router'lar main.py'de
# /api/v1 altında mount edildiği için burada otomatik prefix ekleniyor.
# Böylece onlarca test dosyasındaki path literal'lerine dokunmaya gerek kalmadı.
_UNPREFIXED_PATHS = ("/", "/health", "/docs", "/openapi.json", "/redoc")
_UNPREFIXED_STARTSWITH = ("/api/", "/health", "/uploads/")


class _VersionedTestClient(TestClient):
    def request(self, method, url, *args, **kwargs):
        url_str = str(url)
        if url_str not in _UNPREFIXED_PATHS and not url_str.startswith(_UNPREFIXED_STARTSWITH):
            url_str = f"/api/v1{url_str}"
        return super().request(method, url_str, *args, **kwargs)


# Bazı test dosyaları (ör. test_auth_features.py) fixture kullanmadan modül
# seviyesinde kendi `TestClient(app)` örneğini oluşturuyor — bu durumları da
# kapsamak için `fastapi.testclient.TestClient` adını burada, conftest.py
# tüm test modüllerinden önce import edildiği için, global olarak değiştiriyoruz.
import fastapi.testclient
fastapi.testclient.TestClient = _VersionedTestClient


@pytest.fixture()
def client():
    """FastAPI TestClient — her testte kullanılır. Bare path'leri otomatik /api/v1 ile prefixler."""
    return _VersionedTestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Her testte tabloları silip yeniden oluşturur. Rate-limit cache temizler."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Rate-limit cache'ini sıfırla
    try:
        from app.services.email_service import _resend_timestamps
        _resend_timestamps.clear()
    except Exception:
        pass
    try:
        from app.middleware.rate_limiter import _store, _failed_logins
        _store._requests.clear()
        _store._lockouts.clear()
        _failed_logins.clear()
    except Exception:
        pass
    yield
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Yardımcı fonksiyonlar (helper factories)
# ---------------------------------------------------------------------------

def create_test_user(
    email="user@test.com",
    password="TestPass123!",
    username="testuser",
    first_name="Test",
    role="standard",
    is_email_verified=True,
    birth_date=None,
):
    """Veritabanına doğrulanmış bir test kullanıcısı ekler. (user_id, user) döner."""
    db = TestingSessionLocal()
    user = models.User(
        email=email,
        password_hash=_hash_password(password),
        username=username,
        first_name=first_name,
        role=role,
        is_active=True,
        is_email_verified=is_email_verified,
        birth_date=birth_date or date(2000, 1, 1),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    uid = user.id
    db.close()
    return uid


def create_test_place(
    name="Test Cafe",
    address="Test Sokak 1",
    city="Istanbul",
    category="Kafe",
    latitude=41.0082,
    longitude=28.9784,
    owner_id=None,
):
    """Veritabanına bir test mekanı ekler. (place_id) döner."""
    db = TestingSessionLocal()
    place = models.Place(
        name=name,
        address=address,
        city=city,
        category=category,
        latitude=latitude,
        longitude=longitude,
        average_rating=0.0,
        owner_id=owner_id,
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    pid = place.id
    db.close()
    return pid


def create_test_post(user_id, place_id=None, caption="Test post", post_type="photo"):
    """Veritabanına bir test postu ekler. (post_id) döner."""
    db = TestingSessionLocal()
    post = models.Post(
        user_id=user_id,
        place_id=place_id,
        caption=caption,
        post_type=post_type,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    # Medya ekle
    media = models.PostMedia(
        post_id=post.id,
        media_type="image",
        media_url="https://example.com/test.jpg",
        order_index=0,
    )
    db.add(media)
    db.commit()
    pid = post.id
    db.close()
    return pid


def create_test_review(user_id, place_id, rating=4, comment_text="Güzel mekan!"):
    """Veritabanına bir test yorumu ekler. (review_id) döner."""
    db = TestingSessionLocal()
    review = models.Review(
        user_id=user_id,
        place_id=place_id,
        rating=rating,
        comment_text=comment_text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    rid = review.id
    db.close()
    return rid


def create_match_profile(
    user_id,
    display_name="Test User",
    age=25,
    bio="Merhaba!",
    gender="Erkek",
):
    """Eşleşme profili oluşturur. (profile_id) döner."""
    import json
    db = TestingSessionLocal()
    profile = models.MatchProfile(
        user_id=user_id,
        display_name=display_name,
        age=age,
        bio=bio,
        gender=gender,
        photo_urls=json.dumps(["https://example.com/photo.jpg"]),
        interests=json.dumps(["müzik", "seyahat"]),
        prompts=json.dumps([]),
        is_active=True,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    pid = profile.id
    db.close()
    return pid


def create_match_conversation(user1_id, user2_id, place_name=None):
    """İki kullanıcı arasında eşleşme konuşması oluşturur."""
    db = TestingSessionLocal()
    u1 = min(user1_id, user2_id)
    u2 = max(user1_id, user2_id)
    conv = models.Conversation(
        user1_id=u1,
        user2_id=u2,
        place_name=place_name or "Test Cafe",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    cid = conv.id
    db.close()
    return cid


def get_auth_headers(user_id: int) -> dict:
    """Belirtilen kullanıcı için JWT token'lı Authorization header döner."""
    token = create_access_token(user_id)
    return {"Authorization": f"Bearer {token}"}


def create_admin_user(email="admin@test.com", username="admin"):
    """Admin rolünde test kullanıcısı oluşturur."""
    return create_test_user(
        email=email,
        username=username,
        role="admin",
        first_name="Admin",
    )


def create_venue_user(email="venue@test.com", username="venue_user"):
    """Venue rolünde test kullanıcısı oluşturur + mekan bağlar."""
    uid = create_test_user(
        email=email,
        username=username,
        role="venue",
        first_name="VenueMgr",
    )
    pid = create_test_place(name="Venue Cafe", owner_id=uid)
    return uid, pid
