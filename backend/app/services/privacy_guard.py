# app/services/privacy_guard.py
"""
Munia-tarzı Gizlilik Doğrulama Katmanı (Privacy Validation Middleware).
Gizli profillerin verilerinin API üzerinden sızmasını engeller.
"""
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import models


class PrivacyGuard:
    """
    Gizli (Private) hesapların verilerinin takipçisi olmayan
    kullanıcılara sızmasını engelleyen katı gizlilik kontrolü.
    """

    @staticmethod
    def is_private(db: Session, user_id: int) -> bool:
        """Kullanıcının hesabının gizli olup olmadığını kontrol eder."""
        prefs = db.query(models.UserPreferences).filter(
            models.UserPreferences.user_id == user_id
        ).first()
        return prefs.is_private_account if prefs else False

    @staticmethod
    def is_follower(db: Session, viewer_id: int, target_id: int) -> bool:
        """Viewer'ın target'ın onaylanmış takipçisi olup olmadığını kontrol eder."""
        follow = db.query(models.Follow).filter(
            models.Follow.follower_id == viewer_id,
            models.Follow.following_id == target_id,
            models.Follow.status == "accepted",
        ).first()
        return follow is not None

    @staticmethod
    def can_view_content(db: Session, target_user_id: int, viewer_user_id: int | None) -> bool:
        """
        Hedef kullanıcının içeriklerini (postlar, yorumlar, istatistikler)
        görüntüleme yetkisi var mı?
        
        Kurallar:
        - Kendi profilin → her zaman True
        - Viewer veya Target birbirini engellemişse → False (Ghost mode)
        - Hedef public → True
        - Hedef private & viewer takipçi → True
        - Hedef private & viewer takipçi DEĞİL → False
        """
        if viewer_user_id and viewer_user_id == target_user_id:
            return True

        # Ghost Mode (Engelleme) Kontrolü
        if viewer_user_id:
            block_exists = db.query(models.UserBlock).filter(
                (
                    (models.UserBlock.blocker_id == viewer_user_id) & 
                    (models.UserBlock.blocked_id == target_user_id)
                ) | (
                    (models.UserBlock.blocker_id == target_user_id) & 
                    (models.UserBlock.blocked_id == viewer_user_id)
                )
            ).first()
            if block_exists:
                return False

        if not PrivacyGuard.is_private(db, target_user_id):
            return True

        if not viewer_user_id:
            return False

        return PrivacyGuard.is_follower(db, viewer_user_id, target_user_id)

    @staticmethod
    def filter_profile_for_non_follower(profile_data: dict) -> dict:
        """
        Gizli profillerde takipçi olmayan kullanıcılara gösterilecek
        kısıtlanmış profil verisi. Sadece temel bilgiler döner.
        """
        return {
            **profile_data,
            "is_private": True,
            "posts_hidden": True,
        }
