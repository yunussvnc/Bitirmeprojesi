import asyncio
from backend.database import SessionLocal
from backend import crud, schemas, models
from backend.app.services.moderator import AIModerator

db = SessionLocal()

def test_filtering():
    # Find or create a user and post
    user = db.query(models.User).first()
    if not user:
        print("No user found")
        return

    post = db.query(models.Post).filter_by(user_id=user.id).first()
    if not post:
        post = models.Post(user_id=user.id, caption="Test post", post_type="feed")
        db.add(post)
        db.commit()

    # Add an offensive comment
    # The AIModerator might be mocked or check for specific words
    # Let's mock AIModerator to flag "fuck"
    original_mod = AIModerator.moderate_text
    AIModerator.moderate_text = lambda text: "fuck" in text.lower()

    crud.add_post_comment(db, post.id, user.id, "This is a normal comment")
    crud.add_post_comment(db, post.id, user.id, "This is a fuck comment")
    db.commit()

    comments, total = crud.get_comments_paginated(db, post.id, 1, 100)
    print(f"Total comments: {total}")
    for c in comments:
        print(f"Comment: '{c.text}', Flagged: {c.is_flagged}")

    # Clean up
    db.query(models.PostComment).filter_by(post_id=post.id).delete()
    db.commit()

test_filtering()
