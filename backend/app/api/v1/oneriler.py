"""
Öneri Sistemi API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.core.config import settings
import httpx

router = APIRouter()


class OneriRequest(BaseModel):
    """Öneri isteği şeması"""
    kullanici_metni: str  # Kullanıcının doğal dilde ifadesi
    enlem: float  # Kullanıcı konumu
    boylam: float
    kategori: str = None  # Opsiyonel kategori filtresi


class MekanOneri(BaseModel):
    """Önerilen mekan şeması"""
    mekan_id: int
    ad: str
    aciklama: str
    kategori: str
    enlem: float
    boylam: float
    adres: str
    benzerlik_skoru: float  # Öneri sistemi tarafından hesaplanan skor
    gerekce: str  # Neden önerildiği açıklaması


class OneriResponse(BaseModel):
    """Öneri response şeması"""
    oneriler: List[MekanOneri]
    sorgu_analizi: str  # Kullanıcı sorgusunun analizi


@router.post("/", response_model=OneriResponse)
async def get_oneriler(
    oneri_request: OneriRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Kullanıcı için kişiselleştirilmiş mekan önerileri alır
    AI/LLM servisine istek gönderir
    """
    try:
        # AI servisine istek gönder
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AI_SERVICE_URL}/api/v1/recommend",
                json={
                    "kullanici_metni": oneri_request.kullanici_metni,
                    "enlem": oneri_request.enlem,
                    "boylam": oneri_request.boylam,
                    "kategori": oneri_request.kategori,
                    "kullanici_id": current_user.id
                },
                timeout=30.0
            )
            response.raise_for_status()
            ai_response = response.json()
            
        return OneriResponse(**ai_response)
    
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI servisi erişilemiyor: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Öneri alınırken hata oluştu: {str(e)}"
        )

