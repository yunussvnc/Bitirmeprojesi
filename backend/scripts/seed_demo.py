"""
Kademe 7 Demo Verisi Seed Script

- 5-10 demo kullanıcı
- Takip ilişkileri
- Örnek gönderiler (fotoğraf + caption + mekan)
- Örnek yorumlar ve puanlar
- Post yorumları

Kullanım:
  cd backend && source venv/bin/activate
  python scripts/seed_demo.py
"""

import sys
import os
from datetime import datetime, timedelta, timezone
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
import crud
import schemas

DEMO_PASSWORD = "demo123"

DEMO_USERS = [
    {"email": "demo1@asemos.app", "username": "ayse_gezgin", "first_name": "Ayşe"},
    {"email": "demo2@asemos.app", "username": "mehmet_kafe", "first_name": "Mehmet"},
    {"email": "demo3@asemos.app", "username": "zeynep_food", "first_name": "Zeynep"},
    {"email": "demo4@asemos.app", "username": "can_istanbul", "first_name": "Can"},
    {"email": "demo5@asemos.app", "username": "elif_mekan", "first_name": "Elif"},
    {"email": "demo6@asemos.app", "username": "burak_bar", "first_name": "Burak"},
    {"email": "demo7@asemos.app", "username": "defne_cafe", "first_name": "Defne"},
]

SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800",
]

POST_CAPTIONS = [
    "Harika bir kahve molası ☕",
    "Bu mekan kesinlikle tekrar gelinir!",
    "Kadıköy'ün en iyi kahvesi burada",
    "Arkadaşlarla güzel bir akşam geçirdik",
    "Çalışmak için ideal ortam",
]

REVIEW_COMMENTS = [
    "Kahvesi çok güzeldi, ortam da çok rahat.",
    "Fiyatlar makul, servis hızlı.",
    "WiFi hızlı, çalışmak için ideal.",
]

POST_COMMENTS = [
    "Çok güzel görünüyor!",
    "Ben de gitmek istiyorum",
    "Harika mekan 👍",
]


def create_stories(db, users, places):
    """Her mekandan 1–3 hikaye oluştur."""
    count = 0
    for place in places[:25]:  # İlk 25 mekana hikaye
        n_stories = random.randint(1, 3)
        for _ in range(n_stories):
            author = random.choice(users)
            media_url = random.choice(SAMPLE_IMAGES)
            media_type = "image"
            expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
            s = models.Story(
                user_id=author.id,
                place_id=place.id,
                media_type=media_type,
                media_url=media_url,
                expires_at=expires_at,
            )
            db.add(s)
            count += 1
    db.commit()
    return count


def ensure_demo_users(db):
    users = []
    for u in DEMO_USERS:
        existing = crud.get_user_by_email(db, u["email"])
        if existing:
            users.append(existing)
            print(f"  Kullanıcı zaten var: {u['username']}")
        else:
            user_data = schemas.UserCreate(
                email=u["email"],
                username=u["username"],
                first_name=u["first_name"],
                password=DEMO_PASSWORD,
            )
            user = crud.create_user(db, user_data)
            users.append(user)
            print(f"  ✅ Demo kullanıcı oluşturuldu: {u['username']}")
    return users


def create_follows(db, users):
    # Basit takip grafiği: 0->1, 1->2, 2->0, 3->0, 3->1, 4->2, vb.
    pairs = [
        (0, 1), (1, 2), (2, 0),
        (3, 0), (3, 1), (4, 2), (4, 3),
        (5, 1), (5, 3), (6, 0), (6, 2),
    ]
    count = 0
    for i, j in pairs:
        if i < len(users) and j < len(users):
            _, now_following = crud.toggle_follow(db, users[i].id, users[j].id)
            if now_following:
                count += 1
    print(f"  ✅ {count} takip ilişkisi oluşturuldu")


def create_posts(db, users, places):
    if not places:
        print("  ⚠️ Mekan yok, gönderi atlanıyor. Önce seed_real_places veya add_istanbul_places çalıştırın.")
        return
    count = 0
    for user in users[:5]:
        n_posts = random.randint(2, 4)
        for _ in range(n_posts):
            place = random.choice(places)
            caption = random.choice(POST_CAPTIONS)
            img = random.choice(SAMPLE_IMAGES)
            try:
                post_data = schemas.PostCreate(
                    caption=caption,
                    place_id=place.id,
                    post_type="photo",
                    media=[{"media_type": "image", "media_url": img, "order_index": 0}],
                )
                crud.create_post(db, user.id, post_data)
                count += 1
            except Exception as e:
                print(f"  ⚠️ Post oluşturma hatası: {e}")
    print(f"  ✅ {count} gönderi oluşturuldu")


def create_reviews(db, users, places):
    if not places:
        return
    count = 0
    for user in users[:5]:
        n_reviews = random.randint(2, 4)
        for _ in range(n_reviews):
            place = random.choice(places)
            comment = random.choice(REVIEW_COMMENTS)
            try:
                review_data = schemas.ReviewCreate(
                    place_id=place.id,
                    comment_text=comment,
                    rating=random.randint(4, 5),
                )
                crud.create_review(db, review_data, user.id)
                count += 1
            except Exception as e:
                pass
    print(f"  ✅ {count} yorum oluşturuldu")


def main():
    print("🚀 Kademe 7 Demo verisi seed ediliyor...\n")
    db = SessionLocal()
    try:
        # 1. Demo kullanıcılar
        print("1. Demo kullanıcılar")
        users = ensure_demo_users(db)

        # 2. Mekanları al
        places = db.query(models.Place).limit(80).all()
        print(f"\n2. Mekanlar: {len(places)} adet bulundu")

        # 3. Takip ilişkileri
        print("\n3. Takip ilişkileri")
        create_follows(db, users)

        # 4. Gönderiler
        print("\n4. Gönderiler")
        create_posts(db, users, places)

        # 5. Yorumlar (reviews)
        print("\n5. Mekan yorumları")
        create_reviews(db, users, places)

        # 6. Hikayeler
        print("\n6. Hikayeler")
        story_count = create_stories(db, users, places)
        print(f"  ✅ {story_count} hikaye oluşturuldu")

        # 7. Post yorumları
        posts = db.query(models.Post).all()
        print("\n7. Post yorumları")
        count = 0
        for post in posts[:15]:
            commenter = random.choice(users)
            if commenter.id != post.user_id:
                text = random.choice(POST_COMMENTS)
                db_comment = models.PostComment(post_id=post.id, user_id=commenter.id, text=text)
                db.add(db_comment)
                post.comment_count = (post.comment_count or 0) + 1
                count += 1
        db.commit()
        print(f"  ✅ {count} post yorumu eklendi")

        print("\n✅ Demo seed tamamlandı!")
        print(f"   Demo giriş: {DEMO_USERS[0]['email']} / {DEMO_PASSWORD}")
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
