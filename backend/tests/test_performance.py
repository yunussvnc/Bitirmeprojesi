# tests/test_performance.py — Performans testleri

"""
Response time, büyük veri seti, sayfalama, N+1 sorgu kontrolü.
"""

import pytest
import time
from tests.conftest import (
    create_test_user, create_test_place, create_test_post,
    create_test_review, get_auth_headers, TestingSessionLocal,
)


class TestResponseTime:
    """Basit endpoint'lerin response time kontrolü."""

    def test_root_response_time(self, client):
        start = time.time()
        response = client.get("/")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 1.0, f"Root endpoint {elapsed:.2f}s sürdü (limit: 1s)"

    def test_health_response_time(self, client):
        start = time.time()
        response = client.get("/health")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 2.0, f"Health endpoint {elapsed:.2f}s sürdü (limit: 2s)"

    def test_feed_response_time(self, client):
        uid = create_test_user(email="perfeed@test.com", username="perfeed")
        for i in range(10):
            create_test_post(uid, caption=f"Perf post {i}")
        start = time.time()
        response = client.get("/feed")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 3.0, f"Feed endpoint {elapsed:.2f}s sürdü (limit: 3s)"


class TestLargeDataset:
    """Büyük veri setleri ile performans."""

    def test_feed_with_many_posts(self, client):
        uid = create_test_user(email="lgfeed@test.com", username="lgfeed")
        for i in range(30):
            create_test_post(uid, caption=f"Post {i}")
        start = time.time()
        response = client.get("/feed?page=1&page_size=20")
        elapsed = time.time() - start
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 30
        assert len(data["items"]) == 20
        assert elapsed < 5.0, f"30 post feed {elapsed:.2f}s sürdü"

    def test_search_with_many_places(self, client):
        for i in range(30):
            create_test_place(name=f"PerfCafe{i}", city="Istanbul")
        start = time.time()
        response = client.get("/places/search?q=PerfCafe")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert response.json()["total"] == 30
        assert elapsed < 5.0, f"30 mekan arama {elapsed:.2f}s sürdü"

    def test_user_search_with_many_users(self, client):
        for i in range(20):
            create_test_user(email=f"perfuser{i}@test.com", username=f"perfuser{i}")
        start = time.time()
        response = client.get("/users/search?q=perfuser")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert response.json()["total"] == 20
        assert elapsed < 5.0, f"20 kullanıcı arama {elapsed:.2f}s sürdü"


class TestPaginationAccuracy:
    """Büyük veri setinde sayfalama doğruluğu."""

    def test_pagination_consistency(self, client):
        uid = create_test_user(email="pagacc@test.com", username="pagacc")
        for i in range(10):
            create_test_post(uid, caption=f"PagPost {i}")

        # Sayfa 1
        r1 = client.get("/feed?page=1&page_size=3")
        # Sayfa 2
        r2 = client.get("/feed?page=2&page_size=3")
        # Sayfa 3
        r3 = client.get("/feed?page=3&page_size=3")

        all_ids = set()
        for r in [r1, r2, r3]:
            for item in r.json()["items"]:
                all_ids.add(item["id"])

        # Sayfalar arasında çakışma olmamalı
        assert len(all_ids) == 9  # 3 * 3 = 9 unique post

    def test_last_page_partial(self, client):
        uid = create_test_user(email="lastpg@test.com", username="lastpg")
        for i in range(5):
            create_test_post(uid, caption=f"LastPg {i}")

        response = client.get("/feed?page=2&page_size=3")
        data = response.json()
        assert len(data["items"]) == 2  # 5 - 3 = 2
        assert data["total"] == 5


class TestNearbyPerformance:
    """Haversine hesaplama performansı."""

    def test_nearby_with_many_places(self, client):
        import random
        random.seed(42)
        for i in range(50):
            create_test_place(
                name=f"NearPerf{i}",
                latitude=41.0 + random.uniform(-0.1, 0.1),
                longitude=28.97 + random.uniform(-0.1, 0.1),
            )
        start = time.time()
        response = client.get("/places/nearby?lat=41.0&lng=28.97&radius=10")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 5.0, f"50 mekan nearby {elapsed:.2f}s sürdü"


class TestPopularSortingPerformance:
    """Popüler mekan sıralaması performansı."""

    def test_popular_with_reviews(self, client):
        uid = create_test_user(email="popp@test.com", username="popp")
        for i in range(10):
            pid = create_test_place(name=f"PopPerf{i}")
            for j in range(3):
                create_test_review(uid, pid, rating=4, comment_text=f"Yorum {j}")

        start = time.time()
        response = client.get("/places/popular")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 5.0, f"Popüler sıralama {elapsed:.2f}s sürdü"


class TestConcurrentLikePerformance:
    """Birden fazla kullanıcının aynı postu beğenmesi."""

    def test_multiple_users_like_same_post(self, client):
        poster = create_test_user(email="cpost@test.com", username="cpost")
        post_id = create_test_post(poster, caption="Popüler post")

        for i in range(10):
            uid = create_test_user(email=f"cliker{i}@test.com", username=f"cliker{i}")
            headers = get_auth_headers(uid)
            resp = client.post(f"/posts/{post_id}/like", headers=headers)
            assert resp.status_code == 200
            assert resp.json()["liked"] is True

        # Son durumda like_count 10 olmalı
        post_resp = client.get(f"/posts/{post_id}")
        assert post_resp.json()["like_count"] == 10
