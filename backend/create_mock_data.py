import json
from database import engine, SessionLocal, Base
from crud import _hash_password as get_password_hash
from models import User, Place

def seed_data():
    # 1. Veritabanı tablolarını oluştur (SQLite için .db dosyasını otomatik açar)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Mevcut verileri kontrol et (Çift eklemeyi önlemek için)
    if db.query(User).count() > 0:
        print("Veritabanı zaten dolu. Yeni veri eklenmedi.")
        db.close()
        return

    print("Tablolar oluşturuldu, mock veriler ekleniyor...")

    # 2. Normal Kullanıcı
    user1 = User(
        email="user@test.com",
        password_hash=get_password_hash("test1234"),
        username="normaluser",
        first_name="Standart",
        last_name="Kullanici",
        role="standard",
        is_active=True,
        is_email_verified=True
    )

    # 3. Mekan Sahibi Kullanıcı
    owner1 = User(
        email="mekan@test.com",
        password_hash=get_password_hash("test1234"),
        username="mekansahibi",
        first_name="Mekan",
        last_name="Sahibi",
        role="venue_owner", # Sistemdeki mekan sahibi rolünüz buysa
        is_active=True,
        is_email_verified=True
    )

    db.add(user1)
    db.add(owner1)
    db.commit()
    db.refresh(owner1)

    # 4. Mekan (Venue) verileri
    place1 = Place(
        name="AsEmOs Kafe",
        address="Kadıköy Moda Caddesi No: 42",
        city="İstanbul",
        description="Deniz manzaralı, harika kahveleri olan nezih bir çalışma ve sosyalleşme mekanı.",
        category="Kafe",
        owner_id=owner1.id,
        features=json.dumps(["Wi-Fi", "Priz", "Açık Alan", "Deniz Manzarası"]),
        latitude=40.985,
        longitude=29.025,
        average_rating=4.8,
        price_range=2
    )

    place2 = Place(
        name="AsEmOs Restoran",
        address="Beşiktaş Çarşı No: 12",
        city="İstanbul",
        description="Akşam yemekleri ve canlı müzik için mükemmel bir atmosfer.",
        category="Restoran",
        owner_id=owner1.id,
        features=json.dumps(["Canlı Müzik", "Alkollü İçecek", "Açık Alan"]),
        latitude=41.042,
        longitude=29.002,
        average_rating=4.5,
        price_range=3
    )

    db.add(place1)
    db.add(place2)
    db.commit()

    print("Mock data başarıyla eklendi!")
    print("-" * 30)
    print("Test Hesapları:")
    print("Normal Kullanıcı: email=user@test.com | şifre=test1234")
    print("Mekan Sahibi: email=mekan@test.com | şifre=test1234")
    print("-" * 30)
    db.close()

if __name__ == "__main__":
    seed_data()
