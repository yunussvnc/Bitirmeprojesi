# routers/recommend.py — LLM tabanlı mekan önerisi endpoint'i

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import schemas, crud
from llm_recommend import recommend_pipeline
from app.dependencies import get_db, get_current_user
import models

router = APIRouter(tags=["Recommend"])


@router.post("/recommend", response_model=schemas.RecommendResponse)
def recommend_places(
    req: schemas.RecommendRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    places = crud.get_places(db, skip=0, limit=2000)

    user_lat = req.location.lat if req.location else None
    user_lng = req.location.lng if req.location else None

    result = recommend_pipeline(
        places=places,
        query=req.queryText,
        vibe=req.preferences.vibe or "quiet",
        purpose=req.preferences.purpose or "work",
        budget=req.preferences.budget or "mid",
        user_lat=user_lat,
        user_lng=user_lng,
        radius_m=req.radius_m,
        category=req.category,
    )

    items = [schemas.RecommendItem(**it) for it in result["items"]]
    return schemas.RecommendResponse(
        items=items,
        summary=result.get("summary", ""),
        cached=result.get("cached", False),
    )
