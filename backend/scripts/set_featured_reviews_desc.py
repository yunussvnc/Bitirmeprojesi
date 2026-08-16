import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

def main():
    db = SessionLocal()
    
    # Tüm mekanları getir
    places = db.query(models.Place).all()
    updated = 0
    
    print(f"Toplam {len(places)} mekan incelenecek...")
    
    for place in places:
        # Mekana ait yorumları getir
        best_review = db.query(models.Review).filter(models.Review.place_id == place.id).order_by(models.Review.rating.desc(), models.Review.id.desc()).first()
        
        if best_review and best_review.comment_text:
            text = best_review.comment_text.strip()
            # Eğer yorum çok kısaysa (mesela < 10 karakter) öne çıkarma
            if len(text) > 10:
                new_desc = f"Öne Çıkan Yorum: {text}"
                # Eğer mevcut description aynı değilse güncelle
                if place.description != new_desc:
                    place.description = new_desc
                    updated += 1
    
    if updated > 0:
        db.commit()
        print(f"Başarılı! {updated} mekanın açıklaması 'Öne Çıkan Yorum' ile güncellendi.")
    else:
        print("Güncellenecek mekan bulunamadı.")

if __name__ == '__main__':
    main()
