from database import engine, SessionLocal
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()
u = db.query(models.User).filter_by(email="test@cafe.com").first()
if not u:
    u = models.User(
        email="test@cafe.com",
        username="testcafe",
        password_hash=pwd_context.hash("12345678"),
        role="venue",
        is_active=True,
        is_email_verified=True
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    print("Created test@cafe.com")
else:
    u.password_hash = pwd_context.hash("12345678")
    u.role = "venue"
    db.commit()
    print("Updated test@cafe.com")

place = db.query(models.Place).filter_by(owner_id=u.id).first()
if not place:
    place = models.Place(
        name="Test Cafe",
        owner_id=u.id,
        category="cafe",
        average_rating=4.5
    )
    db.add(place)
    db.commit()
    print("Created Place for test@cafe.com")
