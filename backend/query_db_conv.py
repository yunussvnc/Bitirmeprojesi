import sys
from app.database import SessionLocal
from app import models

db = SessionLocal()
conv = db.query(models.MatchConversation).filter(models.MatchConversation.id == 2).first()
if conv:
    print(f"Conv 2: user1_id={conv.user1_id}, user2_id={conv.user2_id}")
else:
    print("Conv 2 does not exist")
