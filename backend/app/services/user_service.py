"""
Kullanıcı Servisi - İş Mantığı
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Kullanıcı iş mantığı servisi"""
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        """Kullanıcı adına göre kullanıcı getir"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Email'e göre kullanıcı getir"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """ID'ye göre kullanıcı getir"""
        return db.query(User).filter(User.id == user_id).first()

