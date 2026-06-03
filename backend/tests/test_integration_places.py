# tests/test_integration_places.py — Mekan entegrasyon testleri

"""
Places router + CRUD + DB entegrasyon testleri.
Mekan CRUD, arama, yakın mekanlar, popüler, venue dashboard.
"""

# pyrefly: ignore [missing-import]
import pytest
from tests.conftest import (
    create_test_user, create_test_place, create_test_review,
    get_auth_headers, create_admin_user, create_venue_user,
    TestingSessionLocal,
)
import models


class TestPlaceList:
    """GET /places/ — Mekan listeleme."""

    def test_list_places(self, client):
        create_test_place(name="ListCafe1")
        create_test_place(name="ListCafe2")
        response = client.get("/places/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    def test_list_places_pagination(self, client):
        for i in range(5):
            create_test_place(name=f"PagCafe{i}", city=f"City{i}")
        response = client.get("/places/?page=1&page_size=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1

    def test_list_places_legacy_skip_limit(self, client):
        for i in range(3):
            create_test_place(name=f"SkipCafe{i}", city=f"City{i}")
        response = client.get("/places/?skip=0&limit=2")
        data = response.json()
        assert len(data["items"]) == 2


class TestPlaceDetail:
    """GET /places/{id} — Mekan detay."""

    def test_get_place_detail(self, client):
        pid = create_test_place(name="DetailCafe", city="Istanbul", category="Kafe")
        response = client.get(f"/places/{pid}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "DetailCafe"
        assert data["city"] == "Istanbul"
        assert "review_count" in data
        assert "saved_count" in data

    def test_get_place_not_found(self, client):
        response = client.get("/places/99999")
        assert response.status_code == 404


class TestPlaceCreate:
    """POST /places/ — Mekan oluşturma."""

    def test_create_place(self, client):
        response = client.post("/places/", json={
            "name": "Yeni Kafe",
            "address": "Adres 1",
            "city": "Ankara",
            "category": "Kafe",
            "latitude": 39.92,
            "longitude": 32.85,
        })
        assert response.status_code == 200
        assert response.json()["name"] == "Yeni Kafe"

    def test_create_place_minimal(self, client):
        response = client.post("/places/", json={
            "name": "Minimal Cafe",
            "address": "Adres",
            "city": "Istanbul",
        })
        assert response.status_code == 200


class TestPlaceSearch:
    """GET /places/search — Mekan arama."""

    def test_search_by_name(self, client):
        create_test_place(name="Lucca Bebek")
        create_test_place(name="Starbucks")
        response = client.get("/places/search?q=Lucca")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Lucca Bebek"

    def test_search_by_category(self, client):
        create_test_place(name="Kafe1", category="Kafe")
        create_test_place(name="Rest1", category="Restoran")
        response = client.get("/places/search?category=Restoran")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["category"] == "Restoran"

    def test_search_by_city(self, client):
        create_test_place(name="IstCafe", city="Istanbul")
        create_test_place(name="AnkCafe", city="Ankara")
        response = client.get("/places/search?city=Ankara")
        data = response.json()
        assert data["total"] == 1

    def test_search_combined_filters(self, client):
        create_test_place(name="IstKafe", city="Istanbul", category="Kafe")
        create_test_place(name="IstRest", city="Istanbul", category="Restoran")
        create_test_place(name="AnkKafe", city="Ankara", category="Kafe")
        response = client.get("/places/search?city=Istanbul&category=Kafe")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "IstKafe"

    def test_search_empty_results(self, client):
        response = client.get("/places/search?q=NonExistentPlace")
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []


class TestNearbyPlaces:
    """GET /places/nearby — Yakındaki mekanlar."""

    def test_nearby_finds_close_places(self, client):
        create_test_place(name="Near1", latitude=41.01, longitude=28.97)
        create_test_place(name="Near2", latitude=41.02, longitude=28.98)
        create_test_place(name="Far1", latitude=39.0, longitude=32.0)
        response = client.get("/places/nearby?lat=41.0&lng=28.97&radius=5")
        data = response.json()
        names = [p["name"] for p in data["items"]]
        assert "Near1" in names
        assert "Far1" not in names

    def test_nearby_empty_result(self, client):
        create_test_place(name="Isolated", latitude=0.0, longitude=0.0)
        response = client.get("/places/nearby?lat=50.0&lng=50.0&radius=1")
        data = response.json()
        assert data["total"] == 0


class TestPopularPlaces:
    """GET /places/popular — Popüler mekanlar."""

    def test_popular_sorted_by_score(self, client):
        uid = create_test_user(email="popu@test.com", username="popu")
        pid1 = create_test_place(name="Popular1")
        pid2 = create_test_place(name="LessPopular")
        for _ in range(5):
            create_test_review(uid, pid1, rating=5)
        create_test_review(uid, pid2, rating=2)
        response = client.get("/places/popular")
        data = response.json()
        assert len(data["items"]) >= 2
        # İlk mekan daha yüksek skora sahip olmalı
        assert data["items"][0]["name"] == "Popular1"


class TestVenueDashboard:
    """Venue yetkilisi dashboard endpoint'leri."""

    def test_get_my_venue(self, client):
        uid, pid = create_venue_user(email="myv@test.com", username="myvenuer")
        headers = get_auth_headers(uid)
        response = client.get("/places/my-venue", headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Venue Cafe"

    def test_get_my_venue_forbidden_for_normal_user(self, client):
        uid = create_test_user(email="novenue@test.com", username="novenue")
        headers = get_auth_headers(uid)
        response = client.get("/places/my-venue", headers=headers)
        assert response.status_code == 403

    def test_get_my_venue_stats(self, client):
        uid, pid = create_venue_user(email="vs@test.com", username="venuestat")
        reviewer_uid = create_test_user(email="vrev@test.com", username="vreviewer")
        create_test_review(reviewer_uid, pid, rating=5)
        create_test_review(reviewer_uid, pid, rating=4)
        headers = get_auth_headers(uid)
        response = client.get("/places/my-venue/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_reviews"] == 2
        assert "star_distribution" in data

    def test_update_my_venue(self, client):
        uid, pid = create_venue_user(email="uv@test.com", username="updatevenue")
        headers = get_auth_headers(uid)
        response = client.put("/places/my-venue", headers=headers, json={
            "campaign_text": "2 al 1 bedava!",
            "phone_number": "555-1234",
        })
        assert response.status_code == 200
        assert response.json()["campaign_text"] == "2 al 1 bedava!"

    def test_admin_update_place(self, client):
        pid = create_test_place(name="AdminUpdate")
        admin_id = create_admin_user(email="admupp@test.com", username="admupp")
        headers = get_auth_headers(admin_id)
        response = client.put(f"/places/{pid}", headers=headers, json={
            "name": "Updated Name",
        })
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"


class TestPlaceFollow:
    """Mekan takip sistem testleri."""

    def test_follow_toggle_flow(self, client):
        uid = create_test_user(email="follower@test.com", username="follower")
        pid = create_test_place(name="FollowCafe")
        headers = get_auth_headers(uid)

        # 1. İlk durum: takip etmiyor
        response = client.get(f"/places/{pid}/follow-status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is False
        assert data["follower_count"] == 0

        # 2. Takip et
        response = client.post(f"/places/{pid}/follow", headers=headers)
        assert response.status_code == 200
        assert response.json()["followed"] is True

        # 3. Durumu kontrol et
        response = client.get(f"/places/{pid}/follow-status", headers=headers)
        data = response.json()
        assert data["is_following"] is True
        assert data["follower_count"] == 1

        # 4. Takipten çık (toggle)
        response = client.post(f"/places/{pid}/follow", headers=headers)
        assert response.status_code == 200
        assert response.json()["followed"] is False

        # 5. Son durumu kontrol et
        response = client.get(f"/places/{pid}/follow-status", headers=headers)
        data = response.json()
        assert data["is_following"] is False
        assert data["follower_count"] == 0


class TestPlaceSocialContent:
    """Mekan sosyal içerik testleri (posts & stories)."""

    def test_get_place_posts(self, client):
        pid = create_test_place(name="SocialCafe")
        response = client.get(f"/places/{pid}/posts")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_place_stories(self, client):
        pid = create_test_place(name="SocialCafe2")
        response = client.get(f"/places/{pid}/stories")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_place_posts_privacy_filtering(self, client):
        from tests.conftest import create_test_post
        pid = create_test_place(name="PrivacyCafe")
        
        # 1. Gizli hesap oluştur ve UserPreferences üzerinden private yap
        private_uid = create_test_user(email="private_user@test.com", username="private_user")
        db = TestingSessionLocal()
        prefs = models.UserPreferences(user_id=private_uid, is_private_account=True)
        db.add(prefs)
        db.commit()
        db.close()
        
        create_test_post(user_id=private_uid, place_id=pid, caption="Private Post")

        # 2. Açık hesap oluştur ve post paylaş
        public_uid = create_test_user(email="public_user@test.com", username="public_user")
        create_test_post(user_id=public_uid, place_id=pid, caption="Public Post")

        # 3. Mekan gönderilerini çek
        response = client.get(f"/places/{pid}/posts")
        assert response.status_code == 200
        data = response.json()
        
        # Sadece açık hesabın gönderisi görünmeli
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["caption"] == "Public Post"


class TestPlaceInteract:
    """Mekan etkileşim kayıt testleri."""

    def test_record_place_interaction(self, client):
        uid = create_test_user(email="interactor@test.com", username="interactor")
        pid = create_test_place(name="InteractCafe")
        headers = get_auth_headers(uid)

        response = client.post(f"/places/{pid}/interact?interaction_type=view", headers=headers)
        assert response.status_code == 200
        assert response.json()["ok"] is True

