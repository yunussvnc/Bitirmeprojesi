# main.py

# LLM opsiyonel: dosya yoksa backend patlamasın
try:
    from llm_recommend import llm_rerank_and_explain
except Exception:
    llm_rerank_and_explain = None

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, Base, SessionLocal

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mekan Öneri Sistemi API")

# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# ANA SAYFA
# -------------------------
@app.get("/")
def home():
    return {"mesaj": "Mekan Öneri Sistemi Backend API Aktif 🚀"}

# -------------------------
# AUTH
# -------------------------
@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta veya şifre"
        )
    return {"access_token": "MOCK_TOKEN_LOGIN_BASARILI", "token_type": "bearer"}

# -------------------------
# PLACE CRUD
# -------------------------
@app.post("/places/", response_model=schemas.Place)
def create_new_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    return crud.create_place(db=db, place=place)

@app.get("/places/", response_model=List[schemas.Place])
def read_places(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_places(db, skip=skip, limit=limit)

# -------------------------
# REVIEW CRUD
# -------------------------
@app.post("/reviews/", response_model=schemas.Review)
def post_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    return crud.create_review(db=db, review=review, user_id=1, is_verified=True)

@app.get("/places/{place_id}/reviews", response_model=List[schemas.Review])
def get_place_reviews(place_id: int, db: Session = Depends(get_db)):
    return crud.get_reviews_by_place(db, place_id=place_id)

# -------------------------
# ✅ TR -> EN normalize (chip'ler Türkçe geldiğinde backend patlamasın)
# -------------------------
def _norm_vibe(v: str | None) -> str:
    v = (v or "").strip().lower()
    if v in {"sessiz", "quiet"}:
        return "quiet"
    if v in {"canlı", "canli", "lively"}:
        return "lively"
    return v or "quiet"

def _norm_purpose(p: str | None) -> str:
    p = (p or "").strip().lower()
    if p in {"çalışma", "calisma", "work"}:
        return "work"
    if p in {"arkadaş", "arkadas", "friends"}:
        return "friends"
    if p in {"date"}:
        return "date"
    return p or "work"

def _norm_budget(b: str | None) -> str:
    b = (b or "").strip().lower()
    if b in {"düşük", "dusuk", "low"}:
        return "low"
    if b in {"orta", "mid"}:
        return "mid"
    if b in {"yüksek", "yuksek", "high"}:
        return "high"
    return b or "mid"

# -------------------------
# 🔥 RECOMMEND + (opsiyonel) LLM
# -------------------------
def _split_features(s: str | None) -> set[str]:
    if not s:
        return set()
    return {x.strip().lower() for x in s.split(",") if x.strip()}

def _budget_tag(price_range: int | None) -> str:
    # DB: 1=low, 2=mid, 3=high
    if price_range is None:
        return "mid"
    if price_range <= 1:
        return "low"
    if price_range == 2:
        return "mid"
    return "high"

def _vibe_tag(features: set[str], category: str | None) -> str:
    cat = (category or "").lower()
    if "quiet" in features:
        return "quiet"
    if "lively" in features:
        return "lively"
    if cat in {"bar", "music", "club"}:
        return "lively"
    return "quiet"

def _purpose_tag(features: set[str], category: str | None) -> str:
    cat = (category or "").lower()
    if "work" in features or "laptop_friendly" in features or "wifi" in features:
        return "work"
    if "friends" in features or "music" in features or cat in {"bar", "music"}:
        return "friends"
    if "date" in features or "romantic" in features or cat in {"restaurant"}:
        return "date"
    if cat == "cafe":
        return "work"
    if cat == "bar":
        return "friends"
    return "work"

def _score_place(req: schemas.RecommendRequest, place) -> tuple[int, list[str]]:
    q = (req.queryText or "").strip().lower()
    features = _split_features(getattr(place, "features", None))
    category = getattr(place, "category", None)

    budget = _budget_tag(getattr(place, "price_range", None))
    vibe = _vibe_tag(features, category)
    purpose = _purpose_tag(features, category)

    tags: list[str] = [vibe, purpose, budget]
    if category:
        tags.append(str(category).lower())

    score = 0

    # Query match (varsa)
    if q:
        hay = " ".join([
            str(getattr(place, "name", "") or ""),
            str(getattr(place, "description", "") or ""),
            str(getattr(place, "city", "") or ""),
            str(getattr(place, "address", "") or ""),
            str(category or ""),
            ",".join(sorted(features)),
        ]).lower()

        if q in hay:
            score += 3
        else:
            score -= 1

    # vibe/purpose/budget
    score += 2 if vibe == req.preferences.vibe else -1
    score += 2 if purpose == req.preferences.purpose else -1
    score += 2 if budget == req.preferences.budget else -1

    return score, tags

@app.post("/recommend", response_model=schemas.RecommendResponse)
def recommend_places(req: schemas.RecommendRequest, db: Session = Depends(get_db)):
    """
    1) DB'den mekanları al
    2) Tercihlere göre puanla/sırala + tags üret
    3) (Varsa) LLM ile rerank + explanation
    """

    # ✅ 2. kısım BURAYA: request içindeki TR değerleri EN'e çevriliyor
    req.preferences.vibe = _norm_vibe(getattr(req.preferences, "vibe", None))
    req.preferences.purpose = _norm_purpose(getattr(req.preferences, "purpose", None))
    req.preferences.budget = _norm_budget(getattr(req.preferences, "budget", None))

    places = crud.get_places(db, skip=0, limit=200)

    scored: list[tuple[int, any, list[str]]] = []
    for p in places:
        s, tags = _score_place(req, p)
        scored.append((s, p, tags))

    scored.sort(key=lambda x: x[0], reverse=True)

    # çok katı filtre yüzünden boş dönmesin:
    picked = [(p, tags) for (s, p, tags) in scored if s >= 2]
    used_fallback = False
    if not picked:
        used_fallback = True
        picked = [(p, tags) for (_, p, tags) in scored[:10]]

    items: list[schemas.RecommendItem] = []
    for p, tags in picked[:12]:
        items.append(
            schemas.RecommendItem(
                id=p.id,
                name=p.name,
                subtitle=(p.description or "")[:120],
                tags=tags,
            )
        )

    explanation = (
        "Tercihlerine (vibe/amaç/bütçe) ve arama metnine göre mekanları puanlayıp sıraladım."
        + (" (Uygun eşleşme az olduğu için en yakın sonuçları gösterdim.)" if used_fallback else "")
    )

    # LLM varsa: rerank + daha iyi açıklama
    if llm_rerank_and_explain:
        try:
            candidates = [
                {"id": it.id, "name": it.name, "subtitle": it.subtitle, "tags": it.tags}
                for it in items
            ]
            reranked, llm_expl = llm_rerank_and_explain(
                query=req.queryText,
                preferences=req.preferences.dict() if hasattr(req.preferences, "dict") else req.preferences,
                candidates=candidates,
            )

            if reranked:
                items = [schemas.RecommendItem(**x) for x in reranked]

            if llm_expl:
                explanation = llm_expl
        except Exception:
            pass

    return schemas.RecommendResponse(items=items, explanation=explanation)