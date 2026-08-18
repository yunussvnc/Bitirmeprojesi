import os
import sys
import random
from datetime import datetime, timezone, timedelta

# PYTHONPATH ayarı
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

def get_random_stub_users(db, count):
    users = db.query(models.User).filter(models.User.email.like("%@reviews.placeholder")).limit(count * 2).all()
    if not users:
        # Fallback to any users
        users = db.query(models.User).limit(count * 2).all()
    random.shuffle(users)
    return users[:count]

def main():
    db = SessionLocal()
    
    # Yorumu olmayan mekanları bul
    subquery = db.query(models.Review.place_id).distinct()
    places_without_reviews = db.query(models.Place).filter(~models.Place.id.in_(subquery)).all()
    
    if not places_without_reviews:
        print("Tüm mekanların zaten yorumu var.")
        return
        
    print(f"{len(places_without_reviews)} adet yorumsuz mekan bulundu.")
    
    fake_reviews = {
        "Sortie - Kuruçeşme": [
            {"text": "Boğaz manzarası eşliğinde harika bir akşam yemeği. Müzikler ve kokteyller efsaneydi!", "rating": 5},
            {"text": "İş çıkışı arkadaşlarla geldik, atmosfer gerçekten büyüleyici. Fiyatlar biraz yüksek ama kesinlikle değiyor.", "rating": 4},
            {"text": "İstanbul'un en iyi gece kulüplerinden biri, eğlence hiç bitmiyor.", "rating": 5}
        ],
        "Fakülte Teras - Beyoğlu": [
            {"text": "Taksim'in kalbinde harika bir teras. Uygun fiyatlı ve öğrenci dostu bir mekan.", "rating": 5},
            {"text": "Manzarası çok güzel, arkadaş grupları için ideal bir buluşma noktası.", "rating": 4},
            {"text": "Hafta sonu oldukça kalabalıktı ama çalışanlar çok ilgiliydi. Tavsiye ederim.", "rating": 4}
        ],
        "Kastel - Beyoğlu": [
            {"text": "Harika elektronik müzik etkinlikleri oluyor. Ses sistemi ve ambiyans muazzam.", "rating": 5},
            {"text": "Gece hayatını sevenler için vazgeçilmez bir mekan. Müzik kalitesi çok iyi.", "rating": 5},
            {"text": "Farklı konsept partileriyle hafta sonunun en iyi alternatiflerinden.", "rating": 4}
        ],
        "Oligark - Kuruçeşme": [
            {"text": "Boğaz'ın tam kıyısında inanılmaz lüks ve kaliteli bir mekan. Kokteyllerine bayıldık.", "rating": 5},
            {"text": "Hizmet kalitesi ve yemekler harikaydı, manzarası zaten efsane.", "rating": 5},
            {"text": "Özel kutlamalar için kesinlikle tercih edilecek, şık ve nezih bir ortam.", "rating": 5}
        ]
    }
    
    generic_reviews = [
        {"text": "Gerçekten harika bir atmosfer, çok keyif aldık.", "rating": 5},
        {"text": "Hizmet çok iyiydi, kesinlikle tekrar geleceğim.", "rating": 4},
        {"text": "Beklentilerimin üzerindeydi, herkese tavsiye ederim.", "rating": 5}
    ]

    stub_users = get_random_stub_users(db, 20)
    if not stub_users:
        print("Kullanıcı bulunamadı!")
        return

    for place in places_without_reviews:
        print(f"\nİşleniyor: {place.name}")
        reviews_data = fake_reviews.get(place.name, generic_reviews)
        
        users_for_place = random.sample(stub_users, len(reviews_data))
        
        for idx, rev_data in enumerate(reviews_data):
            user = users_for_place[idx]
            
            # 1. Review oluştur
            new_review = models.Review(
                user_id=user.id,
                place_id=place.id,
                comment_text=rev_data["text"],
                rating=rev_data["rating"],
                is_verified=True,
                visit_type=random.choice(["friends", "couple", "solo", "family"])
            )
            db.add(new_review)
            db.commit()
            db.refresh(new_review)
            
            # Sadece 4+ yıldızlı olanları öne çıkan yorum (review_highlight) olarak da post'lara ekle
            if rev_data["rating"] >= 4:
                new_post = models.Post(
                    user_id=user.id,
                    place_id=place.id,
                    caption=rev_data["text"],
                    post_type="review_highlight"
                )
                db.add(new_post)
                db.commit()
                db.refresh(new_post)
                
                # PostMedia ekle (Arka plan olarak mekanın kendi fotosunu veya generic bir şey kullan)
                media_url = place.photo_url or "https://res.cloudinary.com/dprlugdak/image/upload/v1708453459/placeholder_lsq6x7.jpg"
                new_media = models.PostMedia(
                    post_id=new_post.id,
                    media_type="image",
                    media_url=media_url
                )
                db.add(new_media)
                db.commit()
                print(f"  + Eklendi: Review (ID: {new_review.id}) & Post Highlight (ID: {new_post.id}) by {user.username}")

if __name__ == '__main__':
    main()
