import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
from models import Place, User, Review

db = SessionLocal()

# Ensure we have a seed user
user = db.query(User).filter(User.email == "test_reviewer@example.com").first()
if not user:
    user = User(email="test_reviewer@example.com", username="test_reviewer", password_hash="dummy", first_name="Test", last_name="Reviewer", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)

# Function to add place and reviews
def setup_place_and_reviews(name, count):
    place = db.query(Place).filter(Place.name == name).first()
    if not place:
        place = Place(name=name, address="Kadıköy", city="İstanbul", category="Kafe", price_range=2, average_rating=4.5)
        db.add(place)
        db.commit()
        db.refresh(place)
    
    # Delete existing reviews if any
    db.query(Review).filter(Review.place_id == place.id).delete()
    db.commit()

    # Add reviews
    for i in range(count):
        rev = Review(user_id=user.id, place_id=place.id, rating=5, comment_text=f"Gerçek yorum {i+1} için {name}. Harika bir mekan, kahveleri çok lezzetli!")
        db.add(rev)
    
    db.commit()
    print(f"{name} (ID: {place.id}) mekanına {count} adet yorum eklendi.")

setup_place_and_reviews("V Coffee Kadıköy", 41)
setup_place_and_reviews("Florida Coffee Kadıköy", 45)

db.close()
