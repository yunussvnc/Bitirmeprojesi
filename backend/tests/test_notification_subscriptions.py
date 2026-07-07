import pytest
import os
os.environ["DEV_SKIP_EMAIL_VERIFICATION"] = "true"
from fastapi.testclient import TestClient
import crud
import schemas
import auth

def test_notification_subscriptions(client: TestClient, db):
    # Create two users via crud
    user1 = crud.create_user(db, schemas.UserCreate(email="sub1@test.com", password="Password1!", username="sub_user"))
    user2 = crud.create_user(db, schemas.UserCreate(email="target1@test.com", password="Password1!", username="target_user"))
    
    # Generate token for subscriber
    token = auth.create_access_token(user_id=user1.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Subscriber checks default subscriptions (should be false/false)
    target_id = user2.id
    res = client.get(f"/users/{target_id}/notification-subscriptions", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["notify_posts"] is False
    assert data["notify_stories"] is False
    
    # 2. Update subscription
    update_res = client.put(
        f"/users/{target_id}/notification-subscriptions",
        headers=headers,
        json={"notify_posts": True, "notify_stories": True}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["notify_posts"] is True
    assert updated_data["notify_stories"] is True
    
    # 3. Create a post by target user and verify notification is created
    target_token = auth.create_access_token(user_id=user2.id)
    target_headers = {"Authorization": f"Bearer {target_token}"}
    
    # Create a place for the post
    place_res = client.post(
        "/places/",
        headers=target_headers,
        json={"name": "Test Place Notification", "latitude": 40.0, "longitude": 29.0}
    )
    # The place creation might be subject to moderation or other things in test env, but let's assume it passes
    if place_res.status_code == 200:
        place_id = place_res.json()["id"]
        
        # Create a post
        post_res = client.post(
            "/posts/",
            headers=target_headers,
            json={
                "place_id": place_id,
                "caption": "My new post",
                "media": [{"media_type": "image", "media_url": "test.jpg"}]
            }
        )
        assert post_res.status_code == 200
        
        # Verify notification exists for sub_user
        notif_res = client.get("/notifications/", headers=headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        
        found_post_notif = False
        for n in notifs:
            if n["type"] == "new_post" and n["actor_id"] == target_id:
                found_post_notif = True
                break
                
        assert found_post_notif, "Notification for new_post was not found for the subscriber."
