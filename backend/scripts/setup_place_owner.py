"""
Create/update a venue owner and attach explicitly named venues.

Required environment variables:
  VENUE_OWNER_EMAIL
  VENUE_OWNER_PASSWORD

Optional environment variables:
  VENUE_OWNER_USERNAME
  VENUE_OWNER_FIRST_NAME
  VENUE_OWNER_LAST_NAME
  VENUE_OWNER_PLACE_NAMES      Comma-separated exact place names.
  VENUE_OWNER_ALLOW_TAKEOVER   Set to "1" to reassign an already-owned place.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from database import SessionLocal  # noqa: E402
from crud import _hash_password  # noqa: E402


DEFAULT_PLACE_NAMES = ("Järn Coffee", "Ora Coffee")
DEFAULT_PLACE_DATA = {
    "Järn Coffee": {
        "address": "Cihannüma, Maşuklar Yd. No:2, 34353 Beşiktaş/İstanbul",
        "city": "İstanbul",
        "description": "Nitelikli kahve ve sakin bir çalışma ortamı sunan özel Beşiktaş kahvecisi.",
        "category": "Kahve / Kafe",
        "latitude": 41.0433,
        "longitude": 29.0061,
        "average_rating": 4.8,
    },
    "Ora Coffee": {
        "address": "Caddebostan, Kadıköy/İstanbul",
        "city": "İstanbul",
        "description": "Özel kavrulmuş çekirdekleri ve leziz tatlıları ile Kadıköy'ün sevilen kahve noktası.",
        "category": "Kahve / Kafe",
        "latitude": 40.9701,
        "longitude": 29.0601,
        "average_rating": 4.7,
    },
}


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} ortam degiskeni zorunludur.")
    return value


def _place_names_from_env() -> list[str]:
    raw_value = os.environ.get("VENUE_OWNER_PLACE_NAMES")
    if not raw_value:
        return list(DEFAULT_PLACE_NAMES)
    names = [name.strip() for name in raw_value.split(",") if name.strip()]
    if not names:
        raise RuntimeError("VENUE_OWNER_PLACE_NAMES en az bir mekan adi icermelidir.")
    return names


def upsert_venue_user(db: Session) -> int:
    email = _required_env("VENUE_OWNER_EMAIL")
    password = _required_env("VENUE_OWNER_PASSWORD")
    username = os.environ.get("VENUE_OWNER_USERNAME", "venue_owner")
    first_name = os.environ.get("VENUE_OWNER_FIRST_NAME", "Venue")
    last_name = os.environ.get("VENUE_OWNER_LAST_NAME", "Owner")
    password_hash = _hash_password(password)

    result = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": email},
    )
    existing_user = result.fetchone()

    if existing_user:
        user_id = existing_user[0]
        db.execute(
            text(
                """
                UPDATE users
                SET password_hash = :password_hash,
                    role = 'venue',
                    is_active = true,
                    is_email_verified = true,
                    username = COALESCE(username, :username),
                    first_name = COALESCE(first_name, :first_name),
                    last_name = COALESCE(last_name, :last_name)
                WHERE id = :user_id
                """
            ),
            {
                "password_hash": password_hash,
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "user_id": user_id,
            },
        )
        print(f"Mevcut venue kullanicisi guncellendi: id={user_id}")
        return user_id

    db.execute(
        text(
            """
            INSERT INTO users
                (email, password_hash, username, first_name, last_name, role, is_active, is_email_verified)
            VALUES
                (:email, :password_hash, :username, :first_name, :last_name, 'venue', true, true)
            """
        ),
        {
            "email": email,
            "password_hash": password_hash,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
        },
    )
    result = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
    user_id = result.fetchone()[0]
    print(f"Yeni venue kullanicisi olusturuldu: id={user_id}")
    return user_id


def _create_place(db: Session, place_name: str, owner_id: int) -> int:
    place_data = DEFAULT_PLACE_DATA.get(place_name)
    if not place_data:
        raise RuntimeError(
            f"{place_name!r} bulunamadi. Varsayilan olmayan mekanlar otomatik olusturulmez."
        )

    db.execute(
        text(
            """
            INSERT INTO places
                (name, address, city, description, category, latitude, longitude, average_rating, owner_id)
            VALUES
                (:name, :address, :city, :description, :category, :latitude, :longitude,
                 :average_rating, :owner_id)
            """
        ),
        {"name": place_name, "owner_id": owner_id, **place_data},
    )
    result = db.execute(
        text("SELECT id FROM places WHERE LOWER(name) = LOWER(:name)"),
        {"name": place_name},
    )
    return result.fetchone()[0]


def assign_place(db: Session, user_id: int, place_name: str, allow_takeover: bool) -> int:
    result = db.execute(
        text("SELECT id, owner_id FROM places WHERE LOWER(name) = LOWER(:name) LIMIT 1"),
        {"name": place_name},
    )
    place = result.fetchone()

    if not place:
        place_id = _create_place(db, place_name, user_id)
        print(f"Mekan olusturuldu ve baglandi: {place_name!r} id={place_id}")
        return place_id

    place_id, owner_id = place
    if owner_id and owner_id != user_id and not allow_takeover:
        raise RuntimeError(
            f"{place_name!r} zaten baska bir kullaniciya ait: owner_id={owner_id}. "
            "Devralmak icin VENUE_OWNER_ALLOW_TAKEOVER=1 ayarlayin."
        )

    db.execute(
        text("UPDATE places SET owner_id = :user_id WHERE id = :place_id"),
        {"user_id": user_id, "place_id": place_id},
    )
    print(f"Mekan baglandi: {place_name!r} id={place_id} owner_id={user_id}")
    return place_id


def main() -> None:
    allow_takeover = os.environ.get("VENUE_OWNER_ALLOW_TAKEOVER") == "1"
    place_names = _place_names_from_env()

    with SessionLocal() as db:
        try:
            user_id = upsert_venue_user(db)
            place_ids = [
                assign_place(db, user_id, place_name, allow_takeover)
                for place_name in place_names
            ]
            db.commit()
        except Exception:
            db.rollback()
            raise

    print("-" * 50)
    print(f"E-Posta : {os.environ['VENUE_OWNER_EMAIL']}")
    print("Role    : venue")
    print(f"User ID : {user_id}")
    print(f"Mekanlar: {', '.join(str(place_id) for place_id in place_ids)}")
    print("Venue owner kurulumu tamamlandi.")


if __name__ == "__main__":
    main()
