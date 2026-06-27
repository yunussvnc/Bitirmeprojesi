import importlib.util
from pathlib import Path

import pytest

import models
from tests.conftest import create_test_place, create_test_user


BACKEND_DIR = Path(__file__).resolve().parents[1]


def _load_script(relative_path: str):
    path = BACKEND_DIR / relative_path
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_setup_place_owner_refuses_existing_owner_takeover(db):
    script = _load_script("scripts/setup_place_owner.py")
    current_owner_id = create_test_user(email="owner1@test.com", username="owner1")
    new_owner_id = create_test_user(email="owner2@test.com", username="owner2")
    place_id = create_test_place(name="Ora Coffee", owner_id=current_owner_id)

    with pytest.raises(RuntimeError, match="zaten baska bir kullaniciya ait"):
        script.assign_place(db, new_owner_id, "Ora Coffee", allow_takeover=False)

    db.rollback()
    place = db.query(models.Place).filter(models.Place.id == place_id).one()
    assert place.owner_id == current_owner_id


def test_create_venue_owner_requires_explicit_place_target(monkeypatch, db):
    script = _load_script("create_venue_owner.py")
    create_test_place(name="FirstPlace")
    monkeypatch.delenv("VENUE_PLACE_ID", raising=False)
    monkeypatch.delenv("VENUE_PLACE_NAME", raising=False)

    with pytest.raises(RuntimeError, match="VENUE_PLACE_ID veya VENUE_PLACE_NAME"):
        script._target_place(db)
