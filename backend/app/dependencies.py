# dependencies.py — Ortak dependency'ler (get_db, get_current_user, get_optional_user)

from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
from database import SessionLocal
from auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not token:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor.")
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    # Token version kontrolü (Oturum Yönetimi)
    token_ver = payload.get("ver", 0)
    user_ver = user.token_version if user.token_version is not None else 0
    if token_ver != user_ver:
        raise HTTPException(status_code=401, detail="Oturumunuz sonlandırılmış. Lütfen tekrar giriş yapın.")
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not token:
        return None
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        return None
    return db.query(models.User).filter(models.User.id == int(user_id)).first()

def get_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Sadece yöneticiler bu işlemi yapabilir.")
    return current_user
