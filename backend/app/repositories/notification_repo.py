# app/repositories/notification_repo.py
from abc import ABC, abstractmethod
from typing import Tuple, List, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import models
import crud

class BaseNotificationRepository(ABC):
    """
    Munia Abstract Repository Pattern.
    Bildirim verilerinin NoSQL, Redis veya PostgreSQL'de tutulmasını soyutlar.
    """
    
    @abstractmethod
    def create(
        self, 
        user_id: int, 
        type: str, 
        actor_id: int, 
        post_id: Optional[int] = None, 
        place_id: Optional[int] = None,
        payload: Optional[str] = None, 
        group_key: Optional[str] = None
    ) -> models.Notification:
        pass

    @abstractmethod
    def get_paginated(self, user_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[models.Notification], int]:
        pass

    @abstractmethod
    def get_follow_requests(self, user_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[models.Notification], int]:
        pass

    @abstractmethod
    def mark_all_read(self, user_id: int) -> None:
        pass

    @abstractmethod
    def mark_read(self, notification_id: int, user_id: int) -> bool:
        pass

    @abstractmethod
    def delete(self, notification_id: int, user_id: int) -> bool:
        pass

    @abstractmethod
    def get_unread_count(self, user_id: int) -> int:
        pass

class PostgresNotificationRepository(BaseNotificationRepository):
    """
    PostgreSQL implementasyonu (mevcut sistem).
    """
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, 
        user_id: int, 
        type: str, 
        actor_id: int, 
        post_id: Optional[int] = None, 
        place_id: Optional[int] = None,
        payload: Optional[str] = None, 
        group_key: Optional[str] = None
    ) -> models.Notification:
        if user_id == actor_id:
            return None

        # Munia: Zengin payload oluşturma
        if not payload:
            payload = crud._build_rich_payload(self.db, actor_id, post_id=post_id)

        # Novu: Digest group key
        if not group_key:
            group_key = crud._compute_group_key(type, post_id)

        n = models.Notification(
            user_id=user_id,
            type=type,
            actor_id=actor_id,
            post_id=post_id,
            place_id=place_id,
            payload=payload,
            group_key=group_key,
        )
        self.db.add(n)
        self.db.commit()
        self.db.refresh(n)
        
        # En fazla 30 bildirim tut (eski bildirimleri sil)
        total_count = self.db.query(models.Notification).filter(models.Notification.user_id == user_id).count()
        if total_count > 50:
            excess = total_count - 50
            oldest_notifications = (
                self.db.query(models.Notification.id)
                .filter(models.Notification.user_id == user_id)
                .order_by(models.Notification.created_at.asc())
                .limit(excess)
                .all()
            )
            oldest_ids = [notif[0] for notif in oldest_notifications]
            if oldest_ids:
                self.db.query(models.Notification).filter(
                    models.Notification.id.in_(oldest_ids)
                ).delete(synchronize_session=False)
                self.db.commit()

        return n

    def get_paginated(self, user_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[models.Notification], int]:
        # Engellenen kullanıcıların bildirimlerini gizle (Geçmişe dönük temizlik yapılmamış olanlar için)
        blocked_by_me = {r[0] for r in self.db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == user_id).all()}
        blocked_me = {r[0] for r in self.db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == user_id).all()}
        exclude_actor_ids = blocked_by_me | blocked_me

        # actor_id null olabilir (sistem bildirimi). Değilse, actor is_active=True olmak zorunda.
        base = self.db.query(models.Notification).join(
            models.User, models.Notification.actor_id == models.User.id, isouter=True
        ).filter(
            models.Notification.user_id == user_id,
            (models.Notification.actor_id == None) | (models.User.is_active == True)
        )

        if exclude_actor_ids:
            base = base.filter(
                (models.Notification.actor_id == None) | (~models.Notification.actor_id.in_(exclude_actor_ids))
            )

        total = base.count()
        offset = (page - 1) * page_size
        items = base.order_by(models.Notification.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    def get_follow_requests(self, user_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[models.Notification], int]:
        # Only show follow_request notifications where the Follow row is STILL pending
        # This prevents stale notifications after the requester unfollowed
        pending_follower_ids = (
            self.db.query(models.Follow.follower_id)
            .filter(
                models.Follow.following_id == user_id,
                models.Follow.status == "pending",
            )
            .subquery()
        )
        base = self.db.query(models.Notification).join(
            models.User, models.Notification.actor_id == models.User.id, isouter=True
        ).filter(
            models.Notification.user_id == user_id,
            models.Notification.type == "follow_request",
            models.Notification.actor_id.in_(pending_follower_ids),
            (models.Notification.actor_id == None) | (models.User.is_active == True)
        )
        total = base.count()
        offset = (page - 1) * page_size
        items = base.order_by(models.Notification.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    def mark_all_read(self, user_id: int) -> None:
        self.db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.is_read == False,
        ).update({models.Notification.is_read: True})
        self.db.commit()

    def mark_read(self, notification_id: int, user_id: int) -> bool:
        n = self.db.query(models.Notification).filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == user_id,
        ).first()
        if n:
            n.is_read = True
            self.db.commit()
            return True
        return False

    def delete(self, notification_id: int, user_id: int) -> bool:
        """Kullanıcının kendi bildirimini silmesi (hard delete)"""
        notif = self.db.query(models.Notification).filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == user_id
        ).first()
        if notif:
            self.db.delete(notif)
            self.db.commit()
            return True
        return False

    def delete_like_notification(self, user_id: int, actor_id: int, post_id: int) -> bool:
        """Beğeni geri çekildiğinde bildirimi silmek için (tekrar beğenince spam olmaması için)"""
        deleted_count = self.db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.actor_id == actor_id,
            models.Notification.post_id == post_id,
            models.Notification.type == "like"
        ).delete()
        if deleted_count > 0:
            self.db.commit()
            return True
        return False

    def get_unread_count(self, user_id: int) -> int:
        blocked_by_me = {r[0] for r in self.db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == user_id).all()}
        blocked_me = {r[0] for r in self.db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == user_id).all()}
        exclude_actor_ids = blocked_by_me | blocked_me

        base = self.db.query(models.Notification).join(
            models.User, models.Notification.actor_id == models.User.id, isouter=True
        ).filter(
            models.Notification.user_id == user_id,
            models.Notification.is_read == False,
            (models.Notification.actor_id == None) | (models.User.is_active == True)
        )
        
        if exclude_actor_ids:
            base = base.filter(
                (models.Notification.actor_id == None) | (~models.Notification.actor_id.in_(exclude_actor_ids))
            )
            
        return base.count()
