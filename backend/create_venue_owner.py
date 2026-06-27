"""
Create/update a venue user and attach one explicit venue.

Required environment variables:
  VENUE_OWNER_EMAIL
  VENUE_OWNER_PASSWORD
  VENUE_PLACE_ID or VENUE_PLACE_NAME

Optional environment variables:
  VENUE_OWNER_USERNAME
  VENUE_OWNER_FIRST_NAME
  VENUE_OWNER_LAST_NAME
  VENUE_OWNER_ALLOW_TAKEOVER   Set to "1" to reassign an already-owned place.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import func


BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from crud import _hash_password  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import Place, User  # noqa: E402


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} ortam degiskeni zorunludur.")
    return value


def _target_place(db):
    place_id = os.environ.get("VENUE_PLACE_ID")
    place_name = os.environ.get("VENUE_PLACE_NAME")

    if place_id:
        return db.query(Place).filter(Place.id == int(place_id)).first()
    if place_name:
        return db.query(Place).filter(func.lower(Place.name) == place_name.lower()).first()

    raise RuntimeError("VENUE_PLACE_ID veya VENUE_PLACE_NAME ortam degiskeni zorunludur.")


def _upsert_user(db):
    email = _required_env("VENUE_OWNER_EMAIL")
    password = _required_env("VENUE_OWNER_PASSWORD")
    username = os.environ.get("VENUE_OWNER_USERNAME", "venue_owner")
    first_name = os.environ.get("VENUE_OWNER_FIRST_NAME", "Venue")
    last_name = os.environ.get("VENUE_OWNER_LAST_NAME", "Owner")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(user)

    user.password_hash = _hash_password(password)
    user.role = "venue"
    user.is_active = True
    user.is_email_verified = True
    if not user.username:
        user.username = username
    if not user.first_name:
        user.first_name = first_name
    if not user.last_name:
        user.last_name = last_name
    return user


def main() -> None:
    allow_takeover = os.environ.get("VENUE_OWNER_ALLOW_TAKEOVER") == "1"

    db = SessionLocal()
    try:
        user = _upsert_user(db)
        place = _target_place(db)
        if not place:
            raise RuntimeError("Hedef mekan bulunamadi.")

        if place.owner_id and place.owner_id != user.id and not allow_takeover:
            raise RuntimeError(
                f"{place.name!r} zaten baska bir kullaniciya ait: owner_id={place.owner_id}. "
                "Devralmak icin VENUE_OWNER_ALLOW_TAKEOVER=1 ayarlayin."
            )

        db.flush()
        place.owner_id = user.id
        db.commit()
        print(f"Venue owner hazirlandi: user_id={user.id}, place_id={place.id}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
