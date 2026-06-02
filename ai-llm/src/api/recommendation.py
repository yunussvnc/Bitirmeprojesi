"""
Öneri API Endpoints
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from src.recommendation.engine import RecommendationEngine

router = APIRouter()
recommendation_engine = RecommendationEngine()


class RecommendationRequest(BaseModel):
    """Öneri isteği şeması"""
    kullanici_metni: str
    enlem: float
    boylam: float
    kategori: Optional[str] = None
    kullanici_id: Optional[int] = None
    language: Optional[str] = None
    locale: Optional[str] = None


class MekanOneri(BaseModel):
    """Önerilen mekan şeması"""
    mekan_id: Optional[int] = None
    ad: Optional[str] = None
    aciklama: str = ""
    kategori: str = ""
    enlem: Optional[float] = None
    boylam: Optional[float] = None
    adres: str = ""
    benzerlik_skoru: float = 0.0
    gerekce: str = ""


class RecommendationResponse(BaseModel):
    """Öneri response şeması"""
    oneriler: List[MekanOneri]
    sorgu_analizi: str


@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Kişiselleştirilmiş mekan önerileri al
    
    RAG (Retrieval-Augmented Generation) yaklaşımı kullanarak:
    1. Kullanıcı sorgusunu anlar
    2. İlgili mekanları vektör araması ile bulur
    3. LLM ile kişiselleştirilmiş öneri metni üretir
    """
    try:
        recommendations = recommendation_engine.get_recommendations(
            kullanici_metni=request.kullanici_metni,
            enlem=request.enlem,
            boylam=request.boylam,
            kategori=request.kategori,
            kullanici_id=request.kullanici_id,
            language=request.language or request.locale or "tr"
        )
        
        return RecommendationResponse(**recommendations)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Öneri alınırken hata oluştu: {str(e)}"
        )

