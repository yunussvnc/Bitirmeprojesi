# pyright: reportOptionalMemberAccess=false
# pyright: reportArgumentType=false
# pyright: reportAttributeAccessIssue=false
# pyright: reportGeneralTypeIssues=false

"""
=========================================
Tüm yeni authentication özelliklerini test eder:
- Kayıt + PendingUser + email doğrulama
- Login
- First-time setup
- Venue kayıt + onay
- Forgot / reset password
- Change password
- Refresh token
- Hesap silme

Email gönderimi mock'lanmıştır — SMTP gerekmez.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app
from app.dependencies import get_db
import models
from crud import _hash_password
from auth import create_access_token

# ---------------------------------------------------------------------------
# Test veritabanı yapılandırması
# ---------------------------------------------------------------------------
from tests.conftest import TestingSessionLocal, create_test_place



client = TestClient(app)

# ---------------------------------------------------------------------------
# Yardımcı fonksiyonlar
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Yardımcı fonksiyonlar
# ---------------------------------------------------------------------------
def _create_verified_user(email="user@test.com", password="TestPass123!",
                          username="testuser", first_name="Test"):
    """Doğrudan veritabanına doğrulanmış kullanıcı ekler."""
    db = TestingSessionLocal()
    user = models.User(
        email=email,
        password_hash=_hash_password(password),
        username=username,
        first_name=first_name,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    uid = user.id
    db.close()
    return uid


def _get_token(user_id: int) -> str:
    return create_access_token(user_id)


# ===========================================================================
# 1. KAYIT & EMAIL DOĞRULAMA
# ===========================================================================

@patch("app.routers.auth.send_email")
def test_register_creates_pending_user(mock_send):
    """POST /auth/register → PendingUser oluşturulur, doğrulama kodu gönderilir."""
    response = client.post("/auth/register", json={
        "email": "new@test.com",
        "password": "SecurePass123!",
        "username": "newuser",
        "first_name": "Yeni"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["email"] == "new@test.com"
    assert "Doğrulama kodu" in data["message"]

    # PendingUser veritabanında mı?
    db = TestingSessionLocal()
    pending = db.query(models.PendingUser).filter_by(email="new@test.com").first()
    assert pending is not None
    assert pending.verification_code is not None
    assert len(pending.verification_code) == 6
    db.close()


@patch("app.services.email_service.send_email")
def test_register_duplicate_email(mock_send):
    """Zaten kayıtlı e-posta ile register → 400."""
    _create_verified_user(email="existing@test.com")

    response = client.post("/auth/register", json={
        "email": "existing@test.com",
        "password": "SecurePass123!",
    })
    assert response.status_code == 400
    assert "zaten kayıtlı" in response.json()["detail"]


@patch("app.services.email_service.send_email")
def test_register_overwrites_expired_pending(mock_send):
    """Aynı e-posta ile tekrar kayıt → eski PendingUser silinir, yenisi oluşur."""
    # İlk kayıt
    client.post("/auth/register", json={
        "email": "retry@test.com",
        "password": "Pass1234!",
    })
    db = TestingSessionLocal()
    old_code = db.query(models.PendingUser).filter_by(email="retry@test.com").first().verification_code
    db.close()

    # Tekrar kayıt
    client.post("/auth/register", json={
        "email": "retry@test.com",
        "password": "Pass1234!",
    })
    db = TestingSessionLocal()
    pending = db.query(models.PendingUser).filter_by(email="retry@test.com").first()
    assert pending is not None
    # Yeni kod farklı olabilir (rastgele)
    count = db.query(models.PendingUser).filter_by(email="retry@test.com").count()
    assert count == 1  # Eski silinmiş olmalı
    db.close()


@patch("app.routers.auth._send_welcome_email")
@patch("app.routers.auth.send_email")
def test_verify_register_success(mock_send, mock_welcome):
    """Doğru kod ile verify-register → User oluşur, token döner."""
    # Önce kayıt
    client.post("/auth/register", json={
        "email": "verify@test.com",
        "password": "Pass1234!",
        "username": "verifyuser",
        "first_name": "Doğrula",
    })

    # Kodu al
    db = TestingSessionLocal()
    pending = db.query(models.PendingUser).filter_by(email="verify@test.com").first()
    code = pending.verification_code
    db.close()

    # Doğrula
    response = client.post("/auth/verify-register", json={
        "email": "verify@test.com",
        "code": code,
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "verify@test.com"
    assert data["user"]["is_email_verified"] is True

    # PendingUser silinmiş olmalı
    db = TestingSessionLocal()
    assert db.query(models.PendingUser).filter_by(email="verify@test.com").first() is None
    # User oluşmuş olmalı
    user = db.query(models.User).filter_by(email="verify@test.com").first()
    assert user is not None
    assert user.is_email_verified is True
    db.close()


@patch("app.routers.auth._verify_google_id_token")
def test_google_social_login_creates_verified_active_user(mock_verify):
    """Google ID token doğrulandıysa kullanıcı doğrulanmış/aktif oluşur."""
    mock_verify.return_value = {
        "email": "google-user@test.com",
        "email_verified": True,
        "given_name": "Google",
        "family_name": "User",
        "iss": "https://accounts.google.com",
    }

    response = client.post("/auth/google", json={"token": "verified-google-id-token"})

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "google-user@test.com"
    assert data["user"]["is_email_verified"] is True
    assert data["user"]["is_active"] is True

    db = TestingSessionLocal()
    user = db.query(models.User).filter_by(email="google-user@test.com").first()
    assert user is not None
    assert user.is_email_verified is True
    assert user.is_active is True
    db.close()


@patch("app.routers.auth._verify_google_id_token")
def test_google_social_login_rejects_unverified_email(mock_verify):
    """Google email_verified false ise hesap açılmaz."""
    mock_verify.return_value = {
        "email": "not-verified@test.com",
        "email_verified": False,
    }

    response = client.post("/auth/google", json={"token": "verified-google-id-token"})

    assert response.status_code == 400
    assert "doğrulanmamış" in response.json()["detail"]


@patch("app.routers.auth._verify_apple_identity_token")
def test_apple_social_login_creates_verified_active_user(mock_verify):
    """Apple identity token doğrulandıysa kullanıcı doğrulanmış/aktif oluşur."""
    mock_verify.return_value = {
        "email": "apple-user@test.com",
        "email_verified": "true",
        "sub": "apple-subject",
    }

    response = client.post("/auth/apple", json={"token": "verified-apple-identity-token"})

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "apple-user@test.com"
    assert data["user"]["is_email_verified"] is True
    assert data["user"]["is_active"] is True


@patch("app.routers.auth._verify_apple_identity_token")
def test_apple_social_login_requires_email(mock_verify):
    """Provider id saklanmadığı için email gelmeyen Apple token reddedilir."""
    mock_verify.return_value = {
        "sub": "apple-subject-without-email",
        "email_verified": "true",
    }

    response = client.post("/auth/apple", json={"token": "verified-apple-identity-token"})

    assert response.status_code == 400
    assert "e-posta" in response.json()["detail"]


@patch("app.services.email_service.send_email")
def test_verify_register_wrong_code(mock_send):
    """Yanlış kod ile verify-register → 400."""
    client.post("/auth/register", json={
        "email": "wrongcode@test.com",
        "password": "Pass1234!",
    })

    response = client.post("/auth/verify-register", json={
        "email": "wrongcode@test.com",
        "code": "000000",
    })
    assert response.status_code == 400
    assert "hatalı" in response.json()["detail"]


@patch("app.services.email_service.send_email")
def test_verify_register_expired_code(mock_send):
    """Süresi dolmuş kod ile verify-register → 400."""
    client.post("/auth/register", json={
        "email": "expired@test.com",
        "password": "Pass1234!",
    })

    # Kodu expire et
    db = TestingSessionLocal()
    pending = db.query(models.PendingUser).filter_by(email="expired@test.com").first()
    code = pending.verification_code
    pending.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()
    db.close()

    response = client.post("/auth/verify-register", json={
        "email": "expired@test.com",
        "code": code,
    })
    assert response.status_code == 400
    assert "süresi dolmuş" in response.json()["detail"]


@patch("app.routers.auth.send_email")
def test_resend_register_code(mock_send):
    """POST /auth/resend-register-code → Yeni kod gönderilir."""
    client.post("/auth/register", json={
        "email": "resend@test.com",
        "password": "Pass1234!",
    })

    db = TestingSessionLocal()
    old_code = db.query(models.PendingUser).filter_by(email="resend@test.com").first().verification_code
    db.close()

    # Rate-limit cache temizle
    from app.services.email_service import _resend_timestamps
    _resend_timestamps.clear()

    response = client.post("/auth/resend-register-code", json={
        "email": "resend@test.com",
    })
    assert response.status_code == 200
    assert response.json()["ok"] is True

    db = TestingSessionLocal()
    new_code = db.query(models.PendingUser).filter_by(email="resend@test.com").first().verification_code
    db.close()
    # Yeni kod atanmış olmalı (eski koddan farklı olma garantisi yok ama atanmış olmalı)
    assert new_code is not None
    assert len(new_code) == 6


def test_resend_register_code_not_found():
    """Kayıt isteği olmayan e-posta için resend → 400."""
    response = client.post("/auth/resend-register-code", json={
        "email": "ghost@test.com",
    })
    assert response.status_code == 400


# ===========================================================================
# 2. LOGIN
# ===========================================================================

def test_login_success():
    """Başarılı giriş → token döner."""
    _create_verified_user(email="login@test.com", password="LoginPass123!")

    response = client.post("/auth/login", json={
        "email": "login@test.com",
        "password": "LoginPass123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "login@test.com"


def test_login_wrong_password():
    """Yanlış şifre → 401."""
    _create_verified_user(email="loginwrong@test.com", password="CorrectPass123!")

    response = client.post("/auth/login", json={
        "email": "loginwrong@test.com",
        "password": "WrongPass!"
    })
    assert response.status_code == 401


def test_login_nonexistent_email():
    """Kayıtsız e-posta → 401."""
    response = client.post("/auth/login", json={
        "email": "nobody@test.com",
        "password": "SomePass123!"
    })
    assert response.status_code == 401


# ===========================================================================
# 3. FIRST-TIME SETUP
# ===========================================================================

def test_first_time_setup_success():
    """İlk kurulum — username + birth_date ayarlama."""
    db = TestingSessionLocal()
    user = models.User(
        email="setup@test.com",
        password_hash=_hash_password("SetupPass!"),
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    uid = user.id
    db.close()

    token = _get_token(uid)
    response = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "setup_user", "birth_date": "2000-06-15"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "setup_user"


def test_first_time_setup_already_set():
    """Zaten ayarlanmış → 400."""
    uid = _create_verified_user(email="alreadyset@test.com")

    # Bu kullanıcı zaten username'e sahip, birth_date ekleyelim
    db = TestingSessionLocal()
    user = db.query(models.User).filter_by(id=uid).first()
    user.birth_date = date(2000, 1, 1)
    db.commit()
    db.close()

    token = _get_token(uid)
    response = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "another_name", "birth_date": "2001-01-01"},
    )
    assert response.status_code == 400
    assert "zaten ayarlanmış" in response.json()["detail"]


def test_first_time_setup_underage():
    """14 yaşından küçük → 400."""
    db = TestingSessionLocal()
    user = models.User(
        email="kid@test.com",
        password_hash=_hash_password("KidPass!"),
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    uid = user.id
    db.close()

    token = _get_token(uid)
    young_year = date.today().year - 10  # 10 yaşında
    response = client.post(
        "/auth/first-time-setup",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "kid_user", "birth_date": f"{young_year}-01-01"},
    )
    assert response.status_code == 400
    assert "14 yaşından küçükler" in response.json()["detail"]


# ===========================================================================
# 4. VENUE KAYIT & ONAY
# ===========================================================================

def test_venue_register():
    """Mekan kayıt başvurusu → PendingVenue oluşur."""
    pid = create_test_place(name="Cafe Test")
    response = client.post("/auth/venue-register", json={
        "venue_name": "Cafe Test",
        "email": "cafe@test.com",
        "password": "VenuePass123!",
        "claimed_place_id": pid,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["venue_name"] == "Cafe Test"
    assert data["status"] == "pending"


def test_venue_register_duplicate():
    """Aynı e-posta ile tekrar venue kayıt → 400."""
    pid1 = create_test_place(name="Cafe A")
    pid2 = create_test_place(name="Cafe B")
    client.post("/auth/venue-register", json={
        "venue_name": "Cafe A",
        "email": "dup_venue@test.com",
        "password": "Pass123!",
        "claimed_place_id": pid1,
    })
    response = client.post("/auth/venue-register", json={
        "venue_name": "Cafe B",
        "email": "dup_venue@test.com",
        "password": "Pass123!",
        "claimed_place_id": pid2,
    })
    assert response.status_code == 400
    assert "bekleyen bir mekan başvuru" in response.json()["detail"]


def test_venue_approval():
    """Admin onayı → User (role=venue) + Place oluşur."""
    pid = create_test_place(name="Onay Cafe")
    reg = client.post("/auth/venue-register", json={
        "venue_name": "Onay Cafe",
        "email": "onay@test.com",
        "password": "Pass123!",
        "claimed_place_id": pid,
    })
    pending_id = reg.json()["id"]

    # Create admin user
    db = TestingSessionLocal()
    admin_user = models.User(email="admin@test.com", password_hash=_hash_password("adminpass"), username="admin1", role="admin", is_active=True, is_email_verified=True)
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    admin_token = _get_token(admin_user.id)
    db.close()

    response = client.post(f"/auth/admin/approve-venue/{pending_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "user_id" in data
    assert "place_id" in data

    # User venue rolünde mi?
    db = TestingSessionLocal()
    user = db.query(models.User).filter_by(id=data["user_id"]).first()
    assert user.role == "venue"
    # Place oluşmuş mu?
    place = db.query(models.Place).filter_by(id=data["place_id"]).first()
    assert place is not None
    assert place.name == "Onay Cafe"
    db.close()


# ===========================================================================
# 5. FORGOT PASSWORD & RESET PASSWORD
# ===========================================================================

@patch("app.services.email_service.send_email")
def test_forgot_and_reset_password(mock_send):
    """Şifre sıfırlama — kod gönder + doğru kod ile şifre güncelle."""
    uid = _create_verified_user(email="forgot@test.com", password="OldPass123!")

    # Forgot password
    response = client.post("/auth/forgot-password", json={"email": "forgot@test.com"})
    assert response.status_code == 200

    # Kodu al
    db = TestingSessionLocal()
    reset = db.query(models.PasswordReset).filter_by(user_id=uid).first()
    assert reset is not None
    code = reset.reset_code
    db.close()

    # Reset password
    response = client.post("/auth/reset-password", json={
        "email": "forgot@test.com",
        "code": code,
        "new_password": "NewPass456!",
    })
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # Yeni şifre ile giriş
    login_resp = client.post("/auth/login", json={
        "email": "forgot@test.com",
        "password": "NewPass456!",
    })
    assert login_resp.status_code == 200


@patch("app.services.email_service.send_email")
def test_reset_password_wrong_code(mock_send):
    """Yanlış sıfırlama kodu → 400."""
    _create_verified_user(email="resetwrong@test.com", password="Pass123!")
    client.post("/auth/forgot-password", json={"email": "resetwrong@test.com"})

    response = client.post("/auth/reset-password", json={
        "email": "resetwrong@test.com",
        "code": "999999",
        "new_password": "NewPass!",
    })
    assert response.status_code == 400


def test_forgot_password_nonexistent_email():
    """Kayıtsız e-posta ile forgot-password → yine 200 (bilgi sızdırmaz)."""
    response = client.post("/auth/forgot-password", json={"email": "ghost@test.com"})
    assert response.status_code == 200  # Güvenlik: her zaman aynı cevap


# ===========================================================================
# 6. CHANGE PASSWORD
# ===========================================================================

def test_change_password_success():
    """Mevcut şifre doğru → şifre değişir."""
    uid = _create_verified_user(email="change@test.com", password="OldPwd123!")
    token = _get_token(uid)

    response = client.put(
        "/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "OldPwd123!", "new_password": "NewPwd456!"},
    )
    assert response.status_code == 200

    # Yeni şifre ile giriş
    login_resp = client.post("/auth/login", json={
        "email": "change@test.com",
        "password": "NewPwd456!",
    })
    assert login_resp.status_code == 200


def test_change_password_wrong_current():
    """Mevcut şifre yanlış → 400."""
    uid = _create_verified_user(email="changefail@test.com", password="Correct123!")
    token = _get_token(uid)

    response = client.put(
        "/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Wrong!", "new_password": "NewPwd456!"},
    )
    assert response.status_code == 400


# ===========================================================================
# 7. REFRESH TOKEN
# ===========================================================================

def test_refresh_token():
    """Geçerli refresh token → yeni token çifti."""
    uid = _create_verified_user(email="refresh@test.com")
    from auth import create_refresh_token
    refresh = create_refresh_token(uid)

    response = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_refresh_token_invalid():
    """Geçersiz refresh token → 401."""
    response = client.post("/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert response.status_code == 401


# ===========================================================================
# 8. HESAP SİLME
# ===========================================================================

def test_delete_account():
    """DELETE /auth/me → Hesap kalıcı olarak silinir."""
    uid = _create_verified_user(email="delete@test.com")
    token = _get_token(uid)

    response = client.delete(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # Kullanıcı artık DB'de olmamalı
    db = TestingSessionLocal()
    user = db.query(models.User).filter_by(email="delete@test.com").first()
    assert user is None
    db.close()

    # Silinen hesapla giriş denemesi
    login_resp = client.post("/auth/login", json={
        "email": "delete@test.com",
        "password": "TestPass123!",
    })
    assert login_resp.status_code == 401


# ===========================================================================
# 9. GET /auth/me
# ===========================================================================

def test_get_me():
    """Token ile kendi profilini çek."""
    uid = _create_verified_user(email="me@test.com")
    token = _get_token(uid)

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_get_me_no_token():
    """Token olmadan → 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401
