import os
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from crud import _hash_password

def seed_database():
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(models.User).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database with mock data...")

        # 1. Create Users
        users_data = [
            {"id": 1, "email": "ulascan1903@icloud.com", "username": "ulascan", "first_name": "Ulaş Can", "last_name": "Demirtaş"},
            {"id": 2, "email": "ahmet@test.com", "username": "ahmet", "first_name": "Ahmet", "last_name": "Yılmaz"},
            {"id": 3, "email": "elif@test.com", "username": "elif", "first_name": "Elif", "last_name": "Kaya"},
            {"id": 4, "email": "burak@test.com", "username": "burak", "first_name": "Burak", "last_name": "Diemir"},
            {"id": 5, "email": "zeynep@test.com", "username": "zeynep", "first_name": "Zeynep", "last_name": "Toprak"},
            {"id": 6, "email": "can@test.com", "username": "can", "first_name": "Can", "last_name": "Aydın"},
            {"id": 7, "email": "selin@test.com", "username": "selin", "first_name": "Selin", "last_name": "Arslan"},
            {"id": 8, "email": "mert@test.com", "username": "mert", "first_name": "Mert", "last_name": "Özkan"},
            {"id": 9, "email": "deniz@test.com", "username": "deniz", "first_name": "Deniz", "last_name": "Güneş"},
        ]

        pwd = _hash_password("123456")
        user_objects = []
        for u in users_data:
            user = models.User(
                id=u["id"],
                email=u["email"],
                username=u["username"],
                first_name=u["first_name"],
                last_name=u["last_name"],
                password_hash=pwd,
                is_email_verified=True
            )
            user_objects.append(user)
        db.add_all(user_objects)
        db.commit()

        # 2. Create Places
        places_data = [
            {"id": 1, "name": "Sortie - Kuruçeşme", "address": "Kuruçeşme, İstanbul", "photo_url": None, "category": "Gece Kulübü"},
            {"id": 2, "name": "Fakülte Teras - Beyoğlu", "address": "Beyoğlu, İstanbul", "photo_url": None, "category": "Bar"},
            {"id": 3, "name": "Kastel - Beyoğlu", "address": "Beyoğlu, İstanbul", "photo_url": None, "category": "Gece Kulübü"},
            {"id": 4, "name": "Oligark - Kuruçeşme", "address": "Kuruçeşme, İstanbul", "photo_url": None, "category": "Restoran"},
        ]
        
        place_objects = []
        for p in places_data:
            place = models.Place(
                id=p["id"],
                name=p["name"],
                address=p["address"],
                photo_url=p["photo_url"],
                category=p["category"],
                city="İstanbul",
                average_rating=4.5,
                price_range=3
            )
            place_objects.append(place)
        db.add_all(place_objects)
        db.commit()

        # 3. Create Conversations
        now = datetime.now(timezone.utc)
        convs_data = []
        # Conv 1: me (1) vs Ahmet (2)
        # Conv 2: me (1) vs Elif (3)
        # Conv 3: me (1) vs Burak (4)
        for i in range(1, 9):
            conv = models.Conversation(
                id=i,
                user1_id=1,
                user2_id=i+1,
                last_message_at=now,
                is_active=True
            )
            convs_data.append(conv)
        db.add_all(convs_data)
        db.commit()

        # 4. Create Messages
        msgs = [
            # Chat 1 (with Ahmet #2)
            {"conversation_id": 1, "sender_id": 2, "content": "Selam! Nasılsın?", "ts": now - timedelta(minutes=10)},
            {"conversation_id": 1, "sender_id": 1, "content": "İyiyim, sen nasılsın?", "ts": now - timedelta(minutes=9)},
            {"conversation_id": 1, "sender_id": 2, "content": "Dün harika bir mekan keşfettim, sana da önermek istedim!", "ts": now - timedelta(minutes=8)},
            {"conversation_id": 1, "sender_id": 1, "content": "Vay be çok güzel görünüyor! Boğaz manzarası varmış 😍", "ts": now - timedelta(minutes=5)},
            {"conversation_id": 1, "sender_id": 2, "content": "Evet, köprü manzaralı. Bu akşam gidelim mi?", "ts": now - timedelta(minutes=4)},
            {"conversation_id": 1, "sender_id": 1, "content": "Ben de burası güzel olur dedim, ne dersin? 🎵", "ts": now - timedelta(minutes=2)},
            {"conversation_id": 1, "sender_id": 2, "content": "Olur ikisine de bakalım! Haritada kaydediyorum 📌", "ts": now - timedelta(minutes=1)},
            
            # Chat 2 (with Elif #3)
            {"conversation_id": 2, "sender_id": 1, "content": "Merhaba Elif! Bu hafta sonu plan var mı?", "ts": now - timedelta(hours=1)},
            {"conversation_id": 2, "sender_id": 3, "content": "Henüz yok, bir fikrin mi var?", "ts": now - timedelta(minutes=55)},
            {"conversation_id": 2, "sender_id": 3, "content": "Burası yeni açılmış, gidelim mi? 🎉", "ts": now - timedelta(minutes=53)},
            {"conversation_id": 2, "sender_id": 1, "content": "Çok güzel görünüyor! Cumartesi akşamı olur mu?", "ts": now - timedelta(minutes=50)},
        ]
        
        message_objects = []
        for i, m in enumerate(msgs):
            msg = models.Message(
                id=i+1,
                conversation_id=m["conversation_id"],
                sender_id=m["sender_id"],
                content=m["content"],
                created_at=m["ts"],
                is_read=True
            )
            message_objects.append(msg)
        
        db.add_all(message_objects)
        db.commit()

        # Update sequences (PostgreSQL requires sequences to be updated when doing explicit ID inserts)
        from sqlalchemy import text
        db.execute(text("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"))
        db.execute(text("SELECT setval('places_id_seq', (SELECT MAX(id) FROM places));"))
        db.execute(text("SELECT setval('match_conversations_id_seq', (SELECT MAX(id) FROM match_conversations));"))
        db.execute(text("SELECT setval('messages_id_seq', (SELECT MAX(id) FROM messages));"))
        db.commit()

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
