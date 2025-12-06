"""
Mekan Servisi - İş Mantığı
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.mekan import Mekan as MekanModel


class MekanService:
    """Mekan iş mantığı servisi"""
    
    @staticmethod
    def get_mekanlar(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        kategori: Optional[str] = None
    ) -> List[MekanModel]:
        """Mekanları listele"""
        query = db.query(MekanModel).filter(MekanModel.is_active == True)
        
        if kategori:
            query = query.filter(MekanModel.kategori == kategori)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_mekan_by_id(db: Session, mekan_id: int) -> Optional[MekanModel]:
        """ID'ye göre mekan getir"""
        return db.query(MekanModel).filter(
            MekanModel.id == mekan_id,
            MekanModel.is_active == True
        ).first()

