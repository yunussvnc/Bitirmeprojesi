"""
FastAPI Ana Uygulama Dosyası - AI/LLM Servisi
Yapay Zeka Destekli Mekan Öneri Platformu - AI Service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings

app = FastAPI(
    title="Mekan Öneri Platformu AI Service",
    description="RAG tabanlı kişiselleştirilmiş mekan öneri sistemi",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """API kök endpoint'i"""
    return {
        "message": "Mekan Öneri Platformu AI Service",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Sağlık kontrolü endpoint'i"""
    return {"status": "healthy"}


# API router'ları import et ve ekle
from src.api.recommendation import router as recommendation_router

app.include_router(recommendation_router, prefix="/api/v1", tags=["Recommendation"])

