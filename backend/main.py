from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud 
from database import engine, Base, SessionLocal

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine) 

app = FastAPI(title="Mekan Öneri Sistemi API")

# Bağımlılık (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ANA SAYFA ---
@app.get("/")
def home():
    return {"mesaj": "Mekan Öneri Sistemi Backend API Aktif 🚀"}

# --- KULLANICI İŞLEMLERİ (AUTH) ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # crud.py'daki authenticate_user fonksiyonunu kullanıyoruz
    user = crud.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta veya şifre"
        )
    return {"access_token": "MOCK_TOKEN_LOGIN_BASARILI", "token_type": "bearer"}

# --- MEKAN (PLACE) İŞLEMLERİ ---

@app.post("/places/", response_model=schemas.Place)
def create_new_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    """Sisteme yeni bir mekan ekler (Admin/İşletme yetkisiyle olması gerekir)"""
    return crud.create_place(db=db, place=place)

@app.get("/places/", response_model=List[schemas.Place])
def read_places(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Tüm mekanları listeler (Filtreleme ve RAG öncesi ham liste)"""
    return crud.get_places(db, skip=skip, limit=limit)

# --- YORUM (REVIEW) İŞLEMLERİ ---

@app.post("/reviews/", response_model=schemas.Review)
def post_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    """
    Kullanıcı yorumu ekler. 
    Not: user_id şimdilik manuel gönderilebilir, 
    ancak JWT entegrasyonundan sonra otomatik alınacak.
    """
    # Test amaçlı şimdilik user_id=1 kabul ediyoruz
    return crud.create_review(db=db, review=review, user_id=1, is_verified=True)

@app.get("/places/{place_id}/reviews", response_model=List[schemas.Review])
def get_place_reviews(place_id: int, db: Session = Depends(get_db)):
    """Belirli bir mekana ait tüm yorumları getirir"""
    return crud.get_reviews_by_place(db, place_id=place_id)
