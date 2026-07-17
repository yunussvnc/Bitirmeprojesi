"""
setup_place_owner.py
- ulascan1903@icloud.com kullanıcısını oluşturur / günceller
- Şifreyi UcD.7491 olarak set eder
- Role 'venue' yapar (böylece mobil uygulamada Mekan girişinden girebilir)
- Järn Coffee ve Ora Coffee mekanlarını bu kullanıcıya atar (eğer Järn Coffee yoksa veritabanına ekler)
"""

import sys
import os

# Backend dizinini path'e ekle
sys.path.insert(0, "/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend")
os.chdir("/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend")

from dotenv import load_dotenv
load_dotenv("/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend/.env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import bcrypt

# DB bağlantısı
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

EMAIL    = os.environ.get("ADMIN_EMAIL")
PASSWORD = os.environ.get("ADMIN_PASSWORD")

if not EMAIL or not PASSWORD:
    print("❌ Lütfen ADMIN_EMAIL ve ADMIN_PASSWORD çevre değişkenlerini (.env) ayarlayın.")
    sys.exit(1)

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

with Session(engine) as db:
    # ─── 1. Kullanıcı bul ya da oluştur ────────────────────────────────────
    result = db.execute(text("SELECT id, email, role FROM users WHERE email = :email"), {"email": EMAIL})
    user = result.fetchone()

    new_hash = hash_password(PASSWORD)

    if user:
        user_id = user[0]
        db.execute(text("""
            UPDATE users
            SET password_hash = :hash,
                role = 'venue',
                is_active = true,
                is_email_verified = true,
                username = COALESCE(username, 'ulascan_owner'),
                first_name = COALESCE(first_name, 'Ulaş Can'),
                last_name  = COALESCE(last_name,  'Demirtaş')
            WHERE id = :id
        """), {"hash": new_hash, "id": user_id})
        print(f"✅ Mevcut kullanıcı güncellendi (role='venue', id={user_id})")
    else:
        db.execute(text("""
            INSERT INTO users
                (email, password_hash, username, first_name, last_name, role, is_active, is_email_verified)
            VALUES
                (:email, :hash, 'ulascan_owner', 'Ulaş Can', 'Demirtaş', 'venue', true, true)
        """), {"email": EMAIL, "hash": new_hash})
        res2 = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": EMAIL})
        user_id = res2.fetchone()[0]
        print(f"✅ Yeni kullanıcı oluşturuldu (role='venue', id={user_id})")

    # ─── 2. Järn Coffee kontrol et ve yoksa ekle ───────────────────────────
    res_jarn = db.execute(
        text("SELECT id, name FROM places WHERE LOWER(name) LIKE '%jarn%' OR LOWER(name) LIKE '%järn%' LIMIT 1")
    )
    jarn_place = res_jarn.fetchone()

    if jarn_place:
        jarn_id = jarn_place[0]
        db.execute(
            text("UPDATE places SET owner_id = :uid WHERE id = :pid"),
            {"uid": user_id, "pid": jarn_id}
        )
        print(f"✅ Järn Coffee bulundu ve bağlandı: '{jarn_place[1]}' (id={jarn_id}) → owner_id={user_id}")
    else:
        # Järn Coffee veritabanında yok, yeni bir tane oluşturalım
        db.execute(text("""
            INSERT INTO places 
                (name, address, city, description, category, latitude, longitude, average_rating, owner_id)
            VALUES 
                (:name, :address, :city, :description, :category, :lat, :lon, :rating, :uid)
        """), {
            "name": "Järn Coffee",
            "address": "Cihannüma, Maşuklar Yd. No:2, 34353 Beşiktaş/İstanbul",
            "city": "İstanbul",
            "description": "Nitelikli kahve ve sakin bir çalışma ortamı sunan özel Beşiktaş kahvecisi.",
            "category": "Kahve / Kafe",
            "lat": 41.0433,
            "lon": 29.0061,
            "rating": 4.8,
            "uid": user_id
        })
        res_new_jarn = db.execute(
            text("SELECT id FROM places WHERE LOWER(name) = 'järn coffee' OR LOWER(name) = 'jarn coffee'")
        )
        jarn_id = res_new_jarn.fetchone()[0]
        print(f"✅ Järn Coffee veritabanında yoktu, yeni oluşturuldu ve bağlandı (id={jarn_id}) → owner_id={user_id}")

    # ─── 3. Ora Coffee kontrol et ve bağla ─────────────────────────────────
    res_ora = db.execute(
        text("SELECT id, name FROM places WHERE id = 989 OR LOWER(name) LIKE '%ora coffee%' LIMIT 1")
    )
    ora_place = res_ora.fetchone()

    if ora_place:
        ora_id = ora_place[0]
        db.execute(
            text("UPDATE places SET owner_id = :uid WHERE id = :pid"),
            {"uid": user_id, "pid": ora_id}
        )
        print(f"✅ Ora Coffee bulundu ve bağlandı: '{ora_place[1]}' (id={ora_id}) → owner_id={user_id}")
    else:
        # Ora Coffee de yoksa oluşturalım
        db.execute(text("""
            INSERT INTO places 
                (name, address, city, description, category, latitude, longitude, average_rating, owner_id)
            VALUES 
                (:name, :address, :city, :description, :category, :lat, :lon, :rating, :uid)
        """), {
            "name": "Ora Coffee",
            "address": "Caddebostan, Kadıköy/İstanbul",
            "city": "İstanbul",
            "description": "Özel kavrulmuş çekirdekleri ve leziz tatlıları ile Kadıköy'ün sevilen kahve noktası.",
            "category": "Kahve / Kafe",
            "lat": 40.9701,
            "lon": 29.0601,
            "rating": 4.7,
            "uid": user_id
        })
        res_new_ora = db.execute(
            text("SELECT id FROM places WHERE LOWER(name) = 'ora coffee'")
        )
        ora_id = res_new_ora.fetchone()[0]
        print(f"✅ Ora Coffee veritabanında yoktu, yeni oluşturuldu ve bağlandı (id={ora_id}) → owner_id={user_id}")

    db.commit()
    print()
    print("─" * 50)
    print(f"  E-Posta  : {EMAIL}")
    print(f"  Şifre    : {PASSWORD}")
    print(f"  Role     : venue")
    print(f"  User ID  : {user_id}")
    print(f"  Mekan 1  : Järn Coffee (id={jarn_id})")
    print(f"  Mekan 2  : Ora Coffee (id={ora_id})")
    print("─" * 50)
    print("Cloud database güncellendi!")

