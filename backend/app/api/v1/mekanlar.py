"""
Mekanlar API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.mekan import Mekan as MekanModel
from app.models.user import User
from app.schemas.mekan import Mekan, MekanCreate, MekanUpdate
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Mekan])
def get_mekanlar(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    kategori: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Tüm mekanları listele"""
    query = db.query(MekanModel).filter(MekanModel.is_active == True)
    
    if kategori:
        query = query.filter(MekanModel.kategori == kategori)
    
    mekanlar = query.offset(skip).limit(limit).all()
    return mekanlar


@router.get("/{mekan_id}", response_model=Mekan)
def get_mekan(mekan_id: int, db: Session = Depends(get_db)):
    """Belirli bir mekanı getir"""
    mekan = db.query(MekanModel).filter(
        MekanModel.id == mekan_id,
        MekanModel.is_active == True
    ).first()
    
    if not mekan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mekan bulunamadı"
        )
    
    return mekan


@router.post("/", response_model=Mekan, status_code=status.HTTP_201_CREATED)
def create_mekan(
    mekan_data: MekanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Yeni mekan oluştur"""
    db_mekan = MekanModel(**mekan_data.dict())
    db.add(db_mekan)
    db.commit()
    db.refresh(db_mekan)
    return db_mekan


@router.put("/{mekan_id}", response_model=Mekan)
def update_mekan(
    mekan_id: int,
    mekan_data: MekanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mekan güncelle"""
    db_mekan = db.query(MekanModel).filter(MekanModel.id == mekan_id).first()
    
    if not db_mekan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mekan bulunamadı"
        )
    
    update_data = mekan_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_mekan, field, value)
    
    db.commit()
    db.refresh(db_mekan)
    return db_mekan


@router.delete("/{mekan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mekan(
    mekan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mekanı sil (soft delete)"""
    db_mekan = db.query(MekanModel).filter(MekanModel.id == mekan_id).first()
    
    if not db_mekan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mekan bulunamadı"
        )
    
    db_mekan.is_active = False
    db.commit()
    return None

