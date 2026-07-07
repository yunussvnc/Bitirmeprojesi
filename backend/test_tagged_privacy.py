import os
import sys
from dotenv import load_dotenv

load_dotenv(".env")
# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
import app.models as models

def run_test():
    db: Session = SessionLocal()
    try:
        print("--- Starting Privacy Test ---")
        
        # 1. Create dummy users
        u_owner = models.User(email="test_owner@example.com", username="test_owner", password_hash="123", role="standard")
        u_tagged = models.User(email="test_tagged@example.com", username="test_tagged", password_hash="123", role="standard")
        u_unrelated = models.User(email="test_unrel@example.com", username="test_unrel", password_hash="123", role="standard")
        u_follower = models.User(email="test_foll@example.com", username="test_foll", password_hash="123", role="standard")
        
        db.add_all([u_owner, u_tagged, u_unrelated, u_follower])
        db.commit()
        
        # 2. Create preferences for owner (Public initially)
        pref_owner = models.UserPreferences(user_id=u_owner.id, is_private_account=False)
        # Tagged user is public so anyone can view their profile
        pref_tagged = models.UserPreferences(user_id=u_tagged.id, is_private_account=False)
        db.add_all([pref_owner, pref_tagged])
        db.commit()
        
        # 3. FollowerViewer follows PostOwner
        follow = models.Follow(follower_id=u_follower.id, following_id=u_owner.id, status="accepted")
        db.add(follow)
        db.commit()
        
        # 4. PostOwner creates a post
        post = models.Post(user_id=u_owner.id, content="Test privacy post", media_type="image", media_url="test.jpg")
        db.add(post)
        db.commit()
        
        # PostOwner tags TaggedUser
        post_tag = models.PostTag(post_id=post.id, user_id=u_tagged.id)
        db.add(post_tag)
        db.commit()
        
        print(f"Created Owner(ID={u_owner.id}), Tagged(ID={u_tagged.id}), Unrelated(ID={u_unrelated.id}), Follower(ID={u_follower.id})")
        print(f"Created Post(ID={post.id})")

        # Function to simulate get_user_tagged_posts query
        def fetch_tagged_posts(viewer_id):
            post_ids = [r[0] for r in db.query(models.PostTag.post_id).filter(models.PostTag.user_id == u_tagged.id).all()]
            query = db.query(models.Post).filter(models.Post.id.in_(post_ids))
            query = query.outerjoin(models.UserPreferences, models.UserPreferences.user_id == models.Post.user_id)
            
            from sqlalchemy import or_
            if viewer_id:
                following_query = db.query(models.Follow.following_id).filter(
                    models.Follow.follower_id == viewer_id,
                    models.Follow.status == "accepted"
                ).subquery()

                query = query.filter(
                    or_(
                        models.UserPreferences.is_private_account == False,
                        models.UserPreferences.is_private_account == None,
                        models.Post.user_id == viewer_id,
                        models.Post.user_id.in_(following_query)
                    )
                )
            return query.all()

        print("\n--- TEST CASE 1: Owner is PUBLIC ---")
        unrel_posts = fetch_tagged_posts(u_unrelated.id)
        foll_posts = fetch_tagged_posts(u_follower.id)
        print(f"Unrelated viewer sees {len(unrel_posts)} posts (Expected: 1)")
        print(f"Follower viewer sees {len(foll_posts)} posts (Expected: 1)")
        assert len(unrel_posts) == 1
        assert len(foll_posts) == 1
        
        print("\n--- TEST CASE 2: Owner is PRIVATE ---")
        pref_owner.is_private_account = True
        db.commit()
        
        unrel_posts2 = fetch_tagged_posts(u_unrelated.id)
        foll_posts2 = fetch_tagged_posts(u_follower.id)
        print(f"Unrelated viewer sees {len(unrel_posts2)} posts (Expected: 0)")
        print(f"Follower viewer sees {len(foll_posts2)} posts (Expected: 1)")
        assert len(unrel_posts2) == 0
        assert len(foll_posts2) == 1
        
        print("\nAll tests PASSED successfully!")
        
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        # Cleanup
        db.query(models.PostTag).filter(models.PostTag.post_id == post.id).delete()
        db.query(models.Post).filter(models.Post.id == post.id).delete()
        db.query(models.Follow).filter(models.Follow.follower_id == u_follower.id).delete()
        db.query(models.UserPreferences).filter(models.UserPreferences.user_id.in_([u_owner.id, u_tagged.id])).delete()
        db.query(models.User).filter(models.User.id.in_([u_owner.id, u_tagged.id, u_unrelated.id, u_follower.id])).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    run_test()
