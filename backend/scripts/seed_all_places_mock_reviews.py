import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

MOCK_REVIEWS = {
    'Restoran': [
        "Yemekleri çok lezzetliydi, ortamı ve servisi de gayet başarılı. Kesinlikle tekrar gideceğim.",
        "Ailecek gittik ve çok memnun kaldık, fiyat/performans açısından oldukça iyi bir mekan.",
        "Özellikle et yemekleri muazzamdı, servis elemanları da oldukça ilgiliydi.",
        "Hem manzarası hem de lezzetleriyle öne çıkan harika bir yer."
    ],
    'Kafe': [
        "Kahveleri harika, çalışmak veya kitap okumak için çok sakin ve güzel bir ortam.",
        "Tatlıları çok başarılı, özellikle cheesecake'i denemenizi tavsiye ederim.",
        "Arkadaşlarla sohbet etmek için ideal bir mekan, müzikler de çok hoş.",
        "Çok sıcak ve samimi bir atmosferi var, kahvesi de tam kıvamında."
    ],
    'Bar': [
        "Kokteylleri efsane, müzikler çok iyi, hafta sonu eğlenmek için birebir.",
        "Ortamı çok canlı, barmenler oldukça yetenekli. Tavsiye ederim.",
        "Mekan tasarımı çok şık, fiyatlar biraz ortalamanın üstünde ama değiyor.",
        "Arkadaşlarla harika bir akşam geçirdik, müzik seçimi mükemmeldi."
    ],
    'Gece Kulübü': [
        "İstanbul'un en iyi gece kulüplerinden biri, eğlence sabaha kadar sürüyor.",
        "Ses sistemi ve ışıklandırma muazzam, DJ performansları da çok iyiydi.",
        "Harika bir parti mekanı, dans etmek için en doğru adres."
    ],
    'Tatlıcı': [
        "Tatlı krizleri için birebir, porsiyonlar oldukça doyurucu.",
        "Sütlü tatlıları gerçekten çok hafif ve lezzetliydi.",
        "Özellikle çikolatalı tatlıları efsane, kesinlikle uğramalısınız."
    ],
    'Fast Food': [
        "Hızlı ve lezzetli, tam bir fiyat/performans mekanı.",
        "Burgerleri gerçekten çok başarılı, porsiyonlar da oldukça doyurucu.",
        "Hızlı bir atıştırmalık için en iyi adres, sosları çok lezzetli."
    ]
}

DEFAULT_REVIEWS = [
    "Harika bir mekan, herkese tavsiye ederim.",
    "Çok keyifli vakit geçirdik, servis oldukça iyiydi.",
    "Güzel bir deneyimdi, mutlaka tekrar geleceğiz.",
    "Fiyat/performans olarak oldukça başarılı, ortamı da çok hoş."
]

def main():
    db = SessionLocal()
    places = db.query(models.Place).filter(models.Place.description == None).all()
    updated = 0
    
    print(f"Toplam {len(places)} mekan için öne çıkan yorum oluşturulacak...")
    
    for place in places:
        cat = place.category
        
        # Kategoriye uygun yorum bul
        if cat in MOCK_REVIEWS:
            comment = random.choice(MOCK_REVIEWS[cat])
        else:
            # Fallback
            if cat and 'restoran' in cat.lower():
                comment = random.choice(MOCK_REVIEWS['Restoran'])
            elif cat and 'kafe' in cat.lower():
                comment = random.choice(MOCK_REVIEWS['Kafe'])
            else:
                comment = random.choice(DEFAULT_REVIEWS)
                
        place.description = f"Öne Çıkan Yorum: {comment}"
        updated += 1
    
    if updated > 0:
        db.commit()
        print(f"Başarılı! {updated} mekanın açıklaması mock 'Öne Çıkan Yorum' ile dolduruldu.")
    else:
        print("Güncellenecek mekan bulunamadı.")

if __name__ == '__main__':
    main()
