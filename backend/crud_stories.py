"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from crud_notifications import create_notification
from datetime import datetime
from datetime import timedelta
from datetime import timezone
from sqlalchemy import and_
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
import models
import schemas

def create_story(db: Session, user_id: int, data: schemas.StoryCreate):
    import json as _json
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    # Gizlilik tipi: eski is_close_friends alanına geriye dönük destek
    privacy_type = data.resolved_privacy_type() if hasattr(data, 'resolved_privacy_type') else (
        "close_friends" if data.is_close_friends else data.privacy_type
    )

    # Mention: list → JSON string
    mentioned_json = _json.dumps(data.mentioned_user_ids) if data.mentioned_user_ids else None

    story = models.Story(
        user_id=user_id,
        place_id=data.place_id,
        media_type=data.media_type,
        media_url=data.media_url,
        thumbnail_url=data.thumbnail_url,
        privacy_type=privacy_type,
        location_data=_json.dumps(data.location_data) if data.location_data else None,
        mentioned_user_ids=mentioned_json,
        link_type=data.link_type,
        link_id=data.link_id,
        link_label=data.link_label,
        expires_at=expires_at,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    
    # Notify subscribers
    subscribers = db.query(models.NotificationSubscription).filter(
        models.NotificationSubscription.target_id == user_id,
        models.NotificationSubscription.notify_stories == True
    ).all()
    
    # Hikaye close_friends'e özelse, sadece close friend olan abonelere bildirim gitmeli
    # Ancak şu an basitçe herkese atıyoruz, çünkü close friend mantığı henüz bu fonksiyonda çok detaylı yok
    for sub in subscribers:
        # Eğer story 'close_friends' ise ve subscriber arkadaş değilse bildirimi atma
        if privacy_type == "close_friends":
            # Mutual friendship control
            is_mutual = is_following(db, sub.subscriber_id, user_id) and is_following(db, user_id, sub.subscriber_id)
            if not is_mutual:
                continue
        create_notification(db, sub.subscriber_id, "new_story", user_id)

    return story


def get_stories_by_place(db: Session, place_id: int, page: int = 1, page_size: int = 50):
    now = datetime.now(timezone.utc)
    base = (
        db.query(models.Story)
        .filter(models.Story.place_id == place_id, models.Story.expires_at > now)
        # Mekan hikayelerinde sadece genel (public) hikayeler görünür
        .filter(models.Story.privacy_type == "public")
    )
    total = base.count()
    offset = (page - 1) * page_size
    stories = (
        base.options(
            joinedload(models.Story.user),
            joinedload(models.Story.place),
        )
        .order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return stories, total


def get_feed_stories(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    current_user_id: int | None = None,
    filter_mode: str = "all",
):
    """
    Akış hikayelerini getirir.

    Gizlilik filtresi (AŞAMA 4):
    • public hikayeler herkese görünür
    • close_friends hikayeler SADECE o kullanıcının
      'close_friends' listesindeki kullanıcılara görünür.

    Yakın arkadaş listesi mantığı:
      Hikaye sahibinin, izleyiciyi takip etmesi (mutual follow) VE
      hikayeyi close_friends olarak işaretlemesi gerekir.
      Bu implementasyonda basitlik için: mutual follow = close_friends listesi.
    """
    now = datetime.now(timezone.utc)

    if current_user_id:
        # Kullanıcının takip ettikleri (following)
        following_ids_sq = (
            db.query(models.Follow.following_id)
            .filter(models.Follow.follower_id == current_user_id)
        )
        # Kullanıcıyı takip edenler (followers) — mutual için gerekli
        follower_ids_sq = (
            db.query(models.Follow.follower_id)
            .filter(models.Follow.following_id == current_user_id)
        )

        # pyrefly: ignore [missing-import]
        from sqlalchemy import or_, and_  # noqa – already imported at top level; kept for clarity

        # Gizlilik koşulu:
        # 1. Genel hikayeler herkes görebilir
        # 2. close_friends hikayeleri sadece mutual follow (karşılıklı takip) varsa
        privacy_filter = or_(
            models.Story.privacy_type == "public",
            and_(
                models.Story.privacy_type == "close_friends",
                # Hikaye sahibi beni takip ediyor (ben close_friends listesindeyim)
                models.Story.user_id.in_(follower_ids_sq),
            )
        )

        # Engellenen kullanıcılar
        blocked_by_me_sq = (
            db.query(models.UserBlock.blocked_id)
            .filter(models.UserBlock.blocker_id == current_user_id)
        )
        blocked_me_sq = (
            db.query(models.UserBlock.blocker_id)
            .filter(models.UserBlock.blocked_id == current_user_id)
        )

        # Gizli (Hide from) Kontrolü
        # (Eğer hikaye sahibi beni gizli listesine eklediyse, o hikayeyi göremem)
        hidden_by_sq = (
            db.query(models.StoryHiddenUser.user_id)
            .filter(models.StoryHiddenUser.hidden_user_id == current_user_id)
        )

        # TODO (Scenario 5): İleride "Kullanıcıyı Sessize Al (Mute)" özelliği eklendiğinde,
        # akışa düşmesini istemediğimiz kullanıcıları filtreleyen "muted_users_sq" buraya eklenecektir.

        base = (
            db.query(models.Story)
            .outerjoin(models.UserPreferences, models.UserPreferences.user_id == models.Story.user_id)
            .filter(
                models.Story.expires_at > now,
                privacy_filter,
                ~models.Story.user_id.in_(hidden_by_sq),
                ~models.Story.user_id.in_(blocked_by_me_sq),
                ~models.Story.user_id.in_(blocked_me_sq),
                or_(
                    models.UserPreferences.is_private_account == False,
                    models.UserPreferences.is_private_account == None,
                    models.Story.user_id.in_(following_ids_sq),
                    models.Story.user_id == current_user_id
                )
            )
        )

        if filter_mode == "following":
            base = base.filter(models.Story.user_id.in_(following_ids_sq))
    else:
        # Giriş yapmamış kullanıcı: sadece public hikayeler
        base = (
            db.query(models.Story)
            .outerjoin(models.UserPreferences, models.UserPreferences.user_id == models.Story.user_id)
            .filter(
                models.Story.expires_at > now,
                models.Story.privacy_type == "public",
                or_(
                    models.UserPreferences.is_private_account == False,
                    models.UserPreferences.is_private_account == None
                )
            )
        )

    total = base.count()
    offset = (page - 1) * page_size
    stories = (
        base.options(
            joinedload(models.Story.user),
            joinedload(models.Story.place),
        )
        .order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return stories, total


def get_hidden_story_users(db: Session, user_id: int):
    """Kullanıcının hikayesini gizlediği kişileri getirir."""
    hidden_users = (
        db.query(models.User)
        .join(models.StoryHiddenUser, models.StoryHiddenUser.hidden_user_id == models.User.id)
        .filter(models.StoryHiddenUser.user_id == user_id)
        .all()
    )
    return hidden_users


def update_hidden_story_users(db: Session, user_id: int, hidden_user_ids: list[int]):
    """Kullanıcının hikayesini gizlediği kişilerin listesini günceller."""
    # Eski listeyi sil
    db.query(models.StoryHiddenUser).filter(models.StoryHiddenUser.user_id == user_id).delete()
    
    # Yeni listeyi ekle
    new_hidden_users = [
        models.StoryHiddenUser(user_id=user_id, hidden_user_id=h_id)
        for h_id in hidden_user_ids
    ]
    if new_hidden_users:
        db.add_all(new_hidden_users)
        
    db.commit()
    return get_hidden_story_users(db, user_id)


def toggle_follow(db: Session, follower_id: int, following_id: int) -> tuple[bool, bool]:
    """Takip et / takipten çık. Returns (is_following, was_created).
    is_following is True when the follow relationship is active ("accepted")."""
    if follower_id == following_id:
        return False, False
    
    existing = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return False, False

    # Check if target user is private
    target_prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id == following_id).first()
    is_private = target_prefs.is_private_account if target_prefs else False
    
    status = "pending" if is_private else "accepted"
    new_follow = models.Follow(follower_id=follower_id, following_id=following_id, status=status)
    db.add(new_follow)
    db.commit()
    is_following = status == "accepted"
    return is_following, True


def accept_follow_request(db: Session, follower_id: int, following_id: int) -> bool:
    """Pending bir takip isteğini onaylar."""
    req = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "pending"
    ).first()
    if req:
        req.status = "accepted"
        db.commit()
        return True
    return False


def reject_follow_request(db: Session, follower_id: int, following_id: int) -> bool:
    """Pending bir takip isteğini reddeder (siler)."""
    req = db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "pending"
    ).first()
    if req:
        db.delete(req)
        db.commit()
        return True
    return False


def is_following(db: Session, follower_id: int, following_id: int) -> bool:
    if not follower_id or follower_id == following_id:
        return False
    return db.query(models.Follow).filter(
        models.Follow.follower_id == follower_id,
        models.Follow.following_id == following_id,
        models.Follow.status == "accepted",
    ).first() is not None


def get_follower_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.follower_id).filter(
        models.Follow.following_id == user_id,
        models.Follow.status == "accepted"
    ).all()]


def get_following_ids(db: Session, user_id: int) -> list[int]:
    return [r[0] for r in db.query(models.Follow.following_id).filter(
        models.Follow.follower_id == user_id,
        models.Follow.status == "accepted"
    ).all()]


def get_mutual_friend_ids(db: Session, user_id: int) -> list[int]:
    """Karşılıklı accepted follow olan kullanıcıların id listesi (arkadaşlar)."""
    following_ids = set(get_following_ids(db, user_id))
    follower_ids = set(get_follower_ids(db, user_id))
    return list(following_ids & follower_ids)
