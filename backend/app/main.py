"""
FastAPI Ana Uygulama Dosyası
Yapay Zeka Destekli Mekan Öneri Platformu - Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Mekan Öneri Platformu API",
    description="Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu Backend API",
    version="1.0.0",
)

# CORS middleware - Frontend ile iletişim için
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
        "message": "Mekan Öneri Platformu API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Sağlık kontrolü endpoint'i"""
    return {"status": "healthy"}


# API router'ları import et ve ekle
from app.api.v1 import auth, mekanlar, oneriler

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(mekanlar.router, prefix="/api/v1/mekanlar", tags=["Mekanlar"])
app.include_router(oneriler.router, prefix="/api/v1/oneriler", tags=["Öneriler"])

