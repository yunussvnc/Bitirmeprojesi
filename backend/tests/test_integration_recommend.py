# tests/test_integration_recommend.py — Mekan öneri entegrasyon testleri

import pytest
from tests.conftest import create_test_user, create_test_place, get_auth_headers, TestingSessionLocal
import models


class TestRecommendIntegration:
    """POST /recommend — Mekan öneri entegrasyon testleri."""

    def test_recommend_without_history(self, client):
        uid = create_test_user(email="rec_nohist@test.com", username="rec_nohist")
        pid1 = create_test_place(name="RecPlace1", category="Kafe", latitude=41.01, longitude=28.97)
        pid2 = create_test_place(name="RecPlace2", category="Restoran", latitude=41.01, longitude=28.97)

        headers = get_auth_headers(uid)
        response = client.post(
            "/recommend",
            headers=headers,
            json={
                "queryText": "Kafe",
                "preferences": {"vibe": "quiet", "purpose": "work", "budget": "mid"},
                "location": {"lat": 41.01, "lng": 28.97},
                "radius_m": 5000,
                "category": "Kafe"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert data["items"][0]["category"] == "Kafe"

    def test_recommend_with_interaction_history(self, client):
        uid = create_test_user(email="rec_hist@test.com", username="rec_hist")
        pid1 = create_test_place(name="OrdinaryPlace", category="Kafe", latitude=41.01, longitude=28.97)
        pid2 = create_test_place(name="InteractedPlace", category="Kafe", latitude=41.01, longitude=28.97)

        # Create a PlaceInteraction history for InteractedPlace
        db = TestingSessionLocal()
        interaction = models.PlaceInteraction(user_id=uid, place_id=pid2, score=20)
        db.add(interaction)
        db.commit()
        db.close()

        headers = get_auth_headers(uid)
        
        # Query with generic text where both match but InteractedPlace should rank first due to history bonus
        response = client.post(
            "/recommend",
            headers=headers,
            json={
                "queryText": "Kafe",
                "preferences": {"vibe": "quiet", "purpose": "work", "budget": "mid"},
                "location": {"lat": 41.01, "lng": 28.97},
                "radius_m": 5000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 2
        
        # InteractedPlace must be first because of interaction score bonus
        first_item = data["items"][0]
        assert first_item["name"] == "InteractedPlace"

    def test_recommend_chit_chat(self, client):
        uid = create_test_user(email="rec_chat@test.com", username="rec_chat")
        headers = get_auth_headers(uid)
        response = client.post(
            "/recommend",
            headers=headers,
            json={
                "queryText": "naber",
                "preferences": {"vibe": "quiet", "purpose": "work", "budget": "mid"},
                "location": {"lat": 41.01, "lng": 28.97},
                "radius_m": 5000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert "merhaba! ben senin yapay zeka" in data["summary"].lower()

    def test_recommend_inappropriate_content(self, client):
        uid = create_test_user(email="rec_inapp@test.com", username="rec_inapp")
        headers = get_auth_headers(uid)
        response = client.post(
            "/recommend",
            headers=headers,
            json={
                "queryText": "parti siyaset",
                "preferences": {"vibe": "quiet", "purpose": "work", "budget": "mid"},
                "location": {"lat": 41.01, "lng": 28.97},
                "radius_m": 5000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert "siyasi, dini veya argo" in data["summary"].lower()



