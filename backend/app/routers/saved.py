# routers/saved.py — Kayıtlı mekan ve post endpoint'leri

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas, crud
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/saved", tags=["Saved"])


# --- MEKAN KAYDETME ---

@router.post("/places/{place_id}")
def toggle_save_place(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mekanı kaydet / kaydı kaldır (toggle)."""
    place = crud.get_place_by_id(db, place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
    is_saved = crud.toggle_save_place(db, current_user.id, place_id)
    return {"saved": is_saved}


@router.get("/places", response_model=schemas.PaginatedPlaces)
def get_saved_places(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının kaydettiği mekanları listeler."""
    places, total = crud.get_saved_places(db, current_user.id, page, page_size)
    return schemas.PaginatedPlaces(items=places, total=total, page=page, page_size=page_size)


# --- POST KAYDETME ---

@router.post("/posts/{post_id}")
def toggle_save_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Postu kaydet / kaydı kaldır (toggle)."""
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    is_saved = crud.toggle_save_post(db, current_user.id, post_id)
    return {"saved": is_saved}


@router.get("/posts", response_model=schemas.PaginatedPosts)
def get_saved_posts(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının kaydettiği postları listeler."""
    from app.routers.feed import _post_to_schema
    posts, total = crud.get_saved_posts(db, current_user.id, page, page_size)
    items = [_post_to_schema(p, db, current_user.id) for p in posts]
    return schemas.PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.delete("/places")
def clear_saved_places(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının tüm kayıtlı mekanlarını siler."""
    crud.clear_saved_places(db, current_user.id)
    return {"ok": True, "message": "Tüm kayıtlı mekanlar temizlendi."}


@router.delete("/posts")
def clear_saved_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Kullanıcının tüm kayıtlı gönderilerini siler."""
    crud.clear_saved_posts(db, current_user.id)
    return {"ok": True, "message": "Tüm kayıtlı gönderiler temizlendi."}
