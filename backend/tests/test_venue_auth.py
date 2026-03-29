import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app
from app.dependencies import get_db
import models

# Set up text database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup: clean database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown
    Base.metadata.drop_all(bind=engine)

def test_venue_registration():
    response = client.post(
        "/auth/venue-register",
        json={
            "venue_name": "Test Cafe",
            "email": "testcafe@example.com",
            "password": "strongPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["venue_name"] == "Test Cafe"
    assert data["email"] == "testcafe@example.com"
    assert data["status"] == "pending"
    assert "id" in data

    pending_id = data["id"]

    # Test admin approval
    approval_response = client.post(f"/auth/admin/approve-venue/{pending_id}")
    assert approval_response.status_code == 200
    app_data = approval_response.json()
    assert app_data["ok"] is True
    assert "user_id" in app_data
    assert "place_id" in app_data

def test_venue_duplicate_registration():
    client.post(
        "/auth/venue-register",
        json={
            "venue_name": "Test Cafe 2",
            "email": "testcafe2@example.com",
            "password": "strongPassword123!"
        }
    )
    # Duplicate email
    response = client.post(
        "/auth/venue-register",
        json={
            "venue_name": "Test Cafe 3",
            "email": "testcafe2@example.com",
            "password": "strongPassword456!"
        }
    )
    assert response.status_code == 400
    assert "bekleyen bir mekan başvuru" in response.json()["detail"]

def test_first_time_setup():
    # Pre-create a user without username or birthdate
    db = TestingSessionLocal()
    from crud import _hash_password
    test_user = models.User(
        email="firsttimesetup@example.com",
        password_hash=_hash_password("testpwd"),
        is_active=True,
        is_email_verified=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    db.close()

    # Get a token
    from auth import create_access_token
    token = create_access_token(test_user.id)

    # First time setup positive test
    response = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "unique_username_123",
            "birth_date": "2000-01-01"
        }
    )
    assert response.status_code == 200
    assert response.json()["username"] == "unique_username_123"

    # Try setting again
    response_again = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "another_username",
            "birth_date": "2000-01-05"
        }
    )
    assert response_again.status_code == 400
    assert "zaten ayarlanmış" in response_again.json()["detail"]

def test_first_time_setup_age_restriction():
    # Pre-create a user 
    db = TestingSessionLocal()
    from crud import _hash_password
    test_user2 = models.User(
        email="underage@example.com",
        password_hash=_hash_password("testpwd"),
        is_active=True,
        is_email_verified=True
    )
    db.add(test_user2)
    db.commit()
    db.refresh(test_user2)
    db.close()

    from auth import create_access_token
    token = create_access_token(test_user2.id)

    from datetime import date
    too_young_year = date.today().year - 10 # 10 years old

    response = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "kid_user",
            "birth_date": f"{too_young_year}-01-01"
        }
    )
    assert response.status_code == 400
    assert "14 yaşından küçükler" in response.json()["detail"]
