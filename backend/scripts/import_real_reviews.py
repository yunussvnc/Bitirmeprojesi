import os
import sys
import logging

# Proje kk dizinini Python path'e ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.google_reviews import fetch_google_reviews
from datetime import datetime, timezone
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db: Session = SessionLocal()
    try:
        # google_place_id'si dolu olan ilk 2 mekanı seçiyoruz
        places = db.query(models.Place).filter(
            models.Place.google_place_id != None,
            models.Place.google_place_id != ""
        ).limit(2).all()

        if not places:
            logger.error("Veritabanında google_place_id bilgisi dolu olan mekan bulunamadı.")
            return

        for place in places:
            logger.info(f"Mekan için yorumlar çekiliyor: {place.name} (ID: {place.id}, google_place_id: {place.google_place_id})")
            
            # Google'dan max 50 yorum çek
            reviews_data = fetch_google_reviews(place.google_place_id, max_reviews=50)
            
            if not reviews_data:
                logger.warning(f"{place.name} için yorum bulunamadı veya API anahtarı eksik/hatalı.")
                continue

            added_count = 0
            for r_data in reviews_data:
                author_name = r_data.get("author_name")
                text = r_data.get("text")
                rating = r_data.get("rating")
                avatar_url = r_data.get("avatar_url")
                
                if not text or len(text.strip()) < 3:
                    continue
                
                # Bu yorumun daha önce eklenip eklenmediğini kontrol et (aynı metin var mı?)
                existing_review = db.query(models.Review).filter(
                    models.Review.place_id == place.id,
                    models.Review.comment_text == text
                ).first()
                
                if existing_review:
                    continue # Zaten var
                
                # Kullanıcı var mı diye isimden ara, yoksa oluştur
                user = db.query(models.User).filter(models.User.first_name == author_name).first()
                if not user:
                    # Benzersiz ve geçersiz bir email uyduralım
                    unique_email = f"google_review_{random.randint(100000, 99999999)}@example.com"
                    user = models.User(
                        email=unique_email,
                        username=author_name.replace(" ", "").lower() + str(random.randint(100,999)),
                        first_name=author_name,
                        last_name="",
                        role="user",
                        is_active=True,
                        is_email_verified=True,
                        avatar_url=avatar_url,
                        password_hash="hashed_placeholder"
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)

                # Yeni yorum oluştur
                new_review = models.Review(
                    user_id=user.id,
                    place_id=place.id,
                    comment_text=text,
                    rating=int(rating) if rating else 5,
                    created_at=datetime.now(timezone.utc),
                    is_verified=True,
                    verify_method="google_import"
                )
                db.add(new_review)
                added_count += 1
            
            db.commit()
            logger.info(f"{place.name} için {added_count} adet gerçek yorum başarıyla veritabanına eklendi!")

    except Exception as e:
        logger.error(f"Hata oluştu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
