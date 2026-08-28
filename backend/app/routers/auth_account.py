"""Cohesive routes extracted from the parent router."""

import os
import secrets
import string
import uuid
import logging
import jwt
import requests as req_lib
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import schemas, crud, models
from auth import create_access_token, create_refresh_token, decode_token
from crud import _hash_password, _verify_password
from app.dependencies import get_db, get_current_user, get_admin_user
from app.middleware.rate_limiter import (
    get_client_ip,
    is_login_locked,
    record_failed_login,
    reset_failed_logins,
)
from app.websocket.manager import manager
from app.services.email_service import (
    create_verification_code, verify_code,
    create_password_reset_code, verify_password_reset,
    RateLimitError,
    _check_rate_limit,
    _build_verification_html,
    _send_welcome_email,
    send_email,
)

router = APIRouter()

@router.delete("/me")
def delete_account(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hesabı kalıcı olarak siler — tüm ilişkili veriler cascade ile temizlenir."""
    uid = current_user.id
    try:
        # ── 1. Bildirim & Raporlar & Loglar ──
        db.query(models.Notification).filter(
            (models.Notification.user_id == uid) | (models.Notification.actor_id == uid)
        ).delete(synchronize_session=False)
        db.query(models.Report).filter(
            (models.Report.reporter_id == uid) |
            ((models.Report.target_type == "user") & (models.Report.target_id == uid))
        ).delete(synchronize_session=False)
        db.query(models.AdminAuditLog).filter(models.AdminAuditLog.admin_id == uid).delete(synchronize_session=False)
        db.query(models.AIQueryLog).filter(models.AIQueryLog.user_id == uid).delete(synchronize_session=False)

        # ── 2. Blok & Gizleme ──
        db.query(models.UserBlock).filter(
            (models.UserBlock.blocker_id == uid) | (models.UserBlock.blocked_id == uid)
        ).delete(synchronize_session=False)
        db.query(models.StoryHiddenUser).filter(
            (models.StoryHiddenUser.user_id == uid) | (models.StoryHiddenUser.hidden_user_id == uid)
        ).delete(synchronize_session=False)

        # ── 3. Tercihler & Kayıtlılar ──
        db.query(models.UserPreferences).filter(models.UserPreferences.user_id == uid).delete()
        db.query(models.SavedPlace).filter(models.SavedPlace.user_id == uid).delete()
        db.query(models.SavedPost).filter(models.SavedPost.user_id == uid).delete()
        db.query(models.EmailVerification).filter(models.EmailVerification.user_id == uid).delete()
        db.query(models.PasswordReset).filter(models.PasswordReset.user_id == uid).delete()
        db.query(models.DeviceToken).filter(models.DeviceToken.user_id == uid).delete(synchronize_session=False)

        # ── 4. Takip & Etkileşim ──
        db.query(models.Follow).filter(
            (models.Follow.follower_id == uid) | (models.Follow.following_id == uid)
        ).delete(synchronize_session=False)
        db.query(models.PlaceFollow).filter(models.PlaceFollow.user_id == uid).delete(synchronize_session=False)
        db.query(models.PlaceInteraction).filter(models.PlaceInteraction.user_id == uid).delete(synchronize_session=False)

        # ── 5. Hikaye — önce reaction/view, sonra hikaye ──
        db.query(models.StoryReaction).filter(models.StoryReaction.user_id == uid).delete(synchronize_session=False)
        db.query(models.StoryView).filter(models.StoryView.viewer_id == uid).delete(synchronize_session=False)
        # Kullanıcının kendi hikayelerinin reaction + view kayıtlarını sil
        user_story_ids = [s.id for s in db.query(models.Story.id).filter(models.Story.user_id == uid).all()]
        if user_story_ids:
            db.query(models.StoryReaction).filter(models.StoryReaction.story_id.in_(user_story_ids)).delete(synchronize_session=False)
            db.query(models.StoryView).filter(models.StoryView.story_id.in_(user_story_ids)).delete(synchronize_session=False)
        db.query(models.Story).filter(models.Story.user_id == uid).delete()

        # ── 6. Beğeni & Yorum ──
        db.query(models.CommentLike).filter(models.CommentLike.user_id == uid).delete(synchronize_session=False)
        db.query(models.PostLike).filter(models.PostLike.user_id == uid).delete()
        db.query(models.PostComment).filter(models.PostComment.user_id == uid).delete()

        # ── 7. Postlar ve medya (kullanıcının kendi postları) ──
        db.query(models.PostTag).filter(models.PostTag.user_id == uid).delete(synchronize_session=False)
        for p in db.query(models.Post).filter(models.Post.user_id == uid).all():
            db.query(models.PostTag).filter(models.PostTag.post_id == p.id).delete(synchronize_session=False)
            db.query(models.PostMedia).filter(models.PostMedia.post_id == p.id).delete()
            db.query(models.PostLike).filter(models.PostLike.post_id == p.id).delete()
            db.query(models.CommentLike).filter(
                models.CommentLike.comment_id.in_(
                    db.query(models.PostComment.id).filter(models.PostComment.post_id == p.id)
                )
            ).delete(synchronize_session=False)
            db.query(models.PostComment).filter(models.PostComment.post_id == p.id).delete()
            db.query(models.SavedPost).filter(models.SavedPost.post_id == p.id).delete()
            db.delete(p)

        # ── 8. Reviewlar ──
        for r in db.query(models.Review).filter(models.Review.user_id == uid).all():
            db.query(models.ReviewMedia).filter(models.ReviewMedia.review_id == r.id).delete()
            db.delete(r)

        # ── 9. Mesajlaşma (DM) ──
        for conv in db.query(models.Conversation).filter(
            (models.Conversation.user1_id == uid) | (models.Conversation.user2_id == uid)
        ).all():
            db.query(models.Message).filter(models.Message.conversation_id == conv.id).delete()
            db.delete(conv)

        # ── 10. Topluluk ──
        db.query(models.CommunityMessage).filter(models.CommunityMessage.sender_id == uid).delete(synchronize_session=False)
        db.query(models.CommunityMember).filter(models.CommunityMember.user_id == uid).delete(synchronize_session=False)
        # Kullanıcının oluşturduğu topluluk odalarını temizle
        for room in db.query(models.CommunityRoom).filter(models.CommunityRoom.created_by == uid).all():
            db.query(models.CommunityMessage).filter(models.CommunityMessage.room_id == room.id).delete(synchronize_session=False)
            db.query(models.CommunityMember).filter(models.CommunityMember.room_id == room.id).delete(synchronize_session=False)
            db.delete(room)

        # ── 11. Match ──
        if hasattr(models, "MatchLike"):
            db.query(models.MatchLike).filter(
                (models.MatchLike.from_user_id == uid) | (models.MatchLike.to_user_id == uid)
            ).delete(synchronize_session=False)
        if hasattr(models, "MatchProfile"):
            db.query(models.MatchProfile).filter(models.MatchProfile.user_id == uid).first() and \
                db.query(models.MatchProfile).filter(models.MatchProfile.user_id == uid).delete(synchronize_session=False)

        # ── 12. Mekan sahipliğini NULL yap (mekanı silme!) ──
        db.query(models.Place).filter(models.Place.owner_id == uid).update(
            {"owner_id": None}, synchronize_session=False
        )

        # ── 13. Kullanıcıyı sil ve tek commit ──
        db.delete(current_user)
        db.commit()
        background_tasks.add_task(manager.close_user_connections, uid, "Hesap silindi")
        return {"ok": True, "message": "Hesabınız kalıcı olarak silindi."}

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Hesap silme sırasında bir hata oluştu: {str(e)}")


@router.post("/deactivate")
def deactivate_account(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Hesabı geçici olarak devre dışı bırakır (Soft Delete — GDPR uyumlu).
    Kullanıcı 30 gün içinde tekrar giriş yaparsa hesap yeniden aktif olur.
    """
    current_user.is_active = False
    # Token version'ı artır — tüm mevcut token'lar geçersiz olur
    current_user.token_version = (current_user.token_version or 0) + 1
    db.commit()
    background_tasks.add_task(
        manager.close_user_connections,
        current_user.id,
        "Hesap devre dışı bırakıldı",
    )
    return {"ok": True, "message": "Hesabınız devre dışı bırakıldı. 30 gün içinde giriş yaparak yeniden aktif edebilirsiniz."}


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Geçersiz refresh token.")
    user = crud.get_user_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    # Token version kontrolü
    token_ver = payload.get("ver", 0)
    user_ver = user.token_version if user.token_version is not None else 0
    if token_ver != user_ver:
        raise HTTPException(status_code=401, detail="Oturumunuz sonlandırılmış. Lütfen tekrar giriş yapın.")
    tv = user.token_version or 0
    return schemas.Token(
        access_token=create_access_token(user.id, tv, role=user.role),
        refresh_token=create_refresh_token(user.id, tv),
        user=schemas.User.model_validate(user),
    )


@router.post("/logout-all")
def logout_all_sessions(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tüm cihazlardan çıkış yap.
    token_version artırılarak mevcut tüm access ve refresh token'lar anında geçersiz kılınır.
    """
    current_user.token_version = (current_user.token_version or 0) + 1
    
    # Push token'ları temizle
    db.query(models.DeviceToken).filter(models.DeviceToken.user_id == current_user.id).delete()
    db.commit()
    background_tasks.add_task(
        manager.close_user_connections,
        current_user.id,
        "Tüm oturumlar sonlandırıldı",
        current_user.token_version - 1,
    )
    # Yeni token'lar üret (mevcut cihaz hâlâ giriş yapılı kalır)
    tv = current_user.token_version
    return {
        "ok": True,
        "message": "Tüm cihazlardan çıkış yapıldı.",
        "access_token": create_access_token(current_user.id, tv, role=current_user.role),
        "refresh_token": create_refresh_token(current_user.id, tv),
    }


@router.post("/device-token")
def register_device_token(
    data: schemas.DeviceTokenCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cihazın push token'ını kaydeder (Login veya app start sonrası çağrılır)
    
    token_version ile tek cihaz girişi zorlandığı için push da tek cihaza gitmelidir.
    Bu nedenle yeni token kaydedilmeden önce kullanıcının TÜM eski tokenları silinir.
    """
    try:
        # Önce bu token kimdeyse ondan sil (aynı cihaza farklı hesapla girilmiş olabilir)
        db.query(models.DeviceToken).filter(
            models.DeviceToken.token == data.token
        ).delete(synchronize_session=False)

        # Kullanıcının tüm eski cihaz tokenlarını sil (tek cihaz kuralı)
        db.query(models.DeviceToken).filter(
            models.DeviceToken.user_id == current_user.id
        ).delete(synchronize_session=False)

        # Silmelerin veritabanına gönderildiğinden emin ol (UNIQUE çakışmasını önler)
        db.flush()

        # Yeni token'ı kaydet
        new_token = models.DeviceToken(
            user_id=current_user.id,
            token=data.token,
            platform=data.platform,
            device_id=data.device_id
        )
        db.add(new_token)
        db.commit()
        return {"ok": True, "message": "Device token registered"}
    except IntegrityError:
        db.rollback()
        # Flush sonrası IntegrityError olmamalı, ama olursa yine de düzgün handle et
        # Token'ı zorla sil ve tekrar dene
        try:
            db.query(models.DeviceToken).filter(
                models.DeviceToken.token == data.token
            ).delete(synchronize_session=False)
            db.query(models.DeviceToken).filter(
                models.DeviceToken.user_id == current_user.id
            ).delete(synchronize_session=False)
            db.flush()
            new_token = models.DeviceToken(
                user_id=current_user.id,
                token=data.token,
                platform=data.platform,
                device_id=data.device_id
            )
            db.add(new_token)
            db.commit()
            return {"ok": True, "message": "Device token registered"}
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Cihaz token'ı kaydedilirken hata oluştu.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Cihaz token'ı kaydedilirken hata oluştu.")


@router.delete("/device-token")
def unregister_device_token(
    token: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Çıkış yaparken cihazın push token'ını siler"""
    db.query(models.DeviceToken).filter(
        models.DeviceToken.token == token,
        models.DeviceToken.user_id == current_user.id
    ).delete()
    db.commit()
    return {"ok": True, "message": "Device token removed"}


@router.get("/me", response_model=schemas.User)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.User)
def update_me(
    data: schemas.UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    
    if data.username and data.username != current_user.username:
        existing = crud.get_user_by_username(db, data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    # E-posta benzersizlik kontrolü
    if data.email and data.email != current_user.email:
        existing = crud.get_user_by_email(db, data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor.")
    
    # Telefon benzersizlik kontrolü
    if data.phone_number and data.phone_number != current_user.phone_number:
        existing = db.query(models.User).filter(
            models.User.phone_number == data.phone_number,
            models.User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kullanılıyor.")
    
    try:
        updated = crud.update_user(db, current_user.id, data)
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Profil güncellenirken bir çakışma oluştu. Benzersiz olması gereken bir alan (örn. telefon, e-posta) kullanılmış olabilir."
        )


@router.patch("/me", response_model=schemas.User)
def patch_me(
    data: schemas.UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kısmi profil güncellemesi (frontend personal.tsx kullanır)."""


    if data.username and data.username != current_user.username:
        existing = crud.get_user_by_username(db, data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")

    if data.email and data.email != current_user.email:
        existing = crud.get_user_by_email(db, data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor.")

    if data.phone_number and data.phone_number != current_user.phone_number:
        existing = db.query(models.User).filter(
            models.User.phone_number == data.phone_number,
            models.User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kullanılıyor.")

    try:
        updated = crud.update_user(db, current_user.id, data)
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Profil güncellenirken çakışma oluştu.")


@router.get("/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Oturum açmış kullanıcının istatistikleri (activity.tsx)."""
    return crud.get_user_stats(db, current_user.id)


@router.get("/me/preferences", response_model=schemas.UserPreferencesResponse)
def get_my_preferences(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcının sunucu tarafındaki tüm ayarlarını getirir."""
    prefs = crud.get_or_create_preferences(db, current_user.id)
    return crud.preferences_to_response(prefs)


@router.put("/me/preferences", response_model=schemas.UserPreferencesResponse)
def update_my_preferences(
    data: schemas.UserPreferencesUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcı tercihlerini günceller (upsert — yoksa oluşturur)."""
    # Geçerlilik kontrolleri
    VALID_AUDIENCES = {"everyone", "followers", "off"}
    VALID_QUALITIES = {"high", "auto", "data_saver"}
    VALID_LANGUAGES = {"tr", "en"}

    if data.comment_allowed_audience and data.comment_allowed_audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"Geçersiz yorum kitlesi: {data.comment_allowed_audience}")
    if data.story_reply_audience and data.story_reply_audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"Geçersiz hikaye yanıt kitlesi: {data.story_reply_audience}")
    if data.upload_quality and data.upload_quality not in VALID_QUALITIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz medya kalitesi: {data.upload_quality}")
    if data.language and data.language not in VALID_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Geçersiz dil: {data.language}")

    if data.is_private_account and data.story_reply_audience == "everyone":
        data.story_reply_audience = "followers"

    prefs = crud.update_preferences(db, current_user.id, data)

    # Hesap gizliden açığa alındığında bekleyen tüm takip isteklerini otomatik kabul et
    if data.is_private_account is False:
        import json
        pending_follows = db.query(models.Follow).filter(
            models.Follow.following_id == current_user.id,
            models.Follow.status == "pending",
        ).all()
        for follow_row in pending_follows:
            follow_row.status = "accepted"
            # Takip eden kişiye "kabul edildi" bildirimi gönder
            payload = json.dumps({
                "actor_avatar": current_user.avatar_url,
                "actor_username": current_user.username,
            })
            crud.create_notification(
                db, follow_row.follower_id, "follow_accepted", current_user.id, payload=payload
            )
            # Eski follow_request bildirimini kaldır (artık geçersiz)
            db.query(models.Notification).filter(
                models.Notification.user_id == current_user.id,
                models.Notification.actor_id == follow_row.follower_id,
                models.Notification.type == "follow_request",
            ).delete(synchronize_session=False)
        if pending_follows:
            db.commit()

    return crud.preferences_to_response(prefs)


@router.post("/push-token")
def save_push_token(
    body: schemas.PushTokenRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Expo push notification token'ını kaydet"""
    if not body.token.startswith("ExponentPushToken"):
        raise HTTPException(status_code=400, detail="Geçersiz push token formatı.")
    current_user.push_token = body.token
    current_user.push_token_updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.delete("/push-token")
def delete_push_token(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Çıkışta push token'ı sil"""
    current_user.push_token = None
    current_user.push_token_updated_at = None
    db.commit()
    return {"ok": True}
