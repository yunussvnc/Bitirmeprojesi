"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from app.services.moderator import AIModerator
from crud_core import _filter_non_flagged_posts
from crud_core import get_user_by_id
from crud_notifications import create_notification
from crud_places import get_followed_place_ids
from datetime import timedelta
from sqlalchemy import and_
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
import models
import schemas

def create_post(db: Session, user_id: int, data: schemas.PostCreate):
    # AI Moderation Check
    is_flagged = AIModerator.moderate_text(data.caption)
    # Check media (assuming first media URL if present)
    if not is_flagged and data.media:
        is_flagged = AIModerator.moderate_image(data.media[0].media_url)

    db_post = models.Post(
        user_id=user_id,
        place_id=data.place_id,
        caption=data.caption,
        post_type=data.post_type or "photo",
        comments_disabled=data.comments_disabled,
        likes_hidden=data.likes_hidden,
        is_flagged=is_flagged,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    for idx, m in enumerate(data.media):
        db_media = models.PostMedia(
            post_id=db_post.id,
            media_type=m.media_type,
            media_url=m.media_url,
            thumbnail_url=m.thumbnail_url,
            order_index=idx,
        )
        db.add(db_media)

    # Handle tagged users
    if data.tagged_user_ids:
        for tag_user_id in data.tagged_user_ids:
            # Verify user exists
            tagged_user = get_user_by_id(db, tag_user_id)
            if tagged_user and tagged_user.id != user_id:
                db_tag = models.PostTag(
                    post_id=db_post.id,
                    user_id=tag_user_id,
                )
                db.add(db_tag)
                # Send notification to tagged user
                create_notification(db, tag_user_id, "tag", user_id, post_id=db_post.id)

    db.commit()
    db.refresh(db_post)
    
    # Notify subscribers
    subscribers = db.query(models.NotificationSubscription).filter(
        models.NotificationSubscription.target_id == user_id,
        models.NotificationSubscription.notify_posts == True
    ).all()
    for sub in subscribers:
        create_notification(db, sub.subscriber_id, "new_post", user_id, post_id=db_post.id)
        
    return db_post


def get_feed_paginated(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    current_user_id: int | None = None,
    filter_mode: str = "all",
    post_type: str | None = None,
):
    base = db.query(models.Post)
    if filter_mode == "following" and current_user_id:
        following_ids = (
            db.query(models.Follow.following_id)
            .filter(models.Follow.follower_id == current_user_id)
            .subquery()
        )
        base = base.filter(models.Post.user_id.in_(following_ids))
    if post_type:
        base = base.filter(models.Post.post_type == post_type)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


def get_feed_paginated_cursor(
    db: Session,
    page_size: int = 12,
    cursor: str | None = None,
    current_user_id: int | None = None,
    filter_mode: str = "all",
    post_type: str | None = None,
    scoring_context=None,   # FeedScoringContext | None — dışarıdan geçilebilir (test kolaylığı)
):
    """
    Cursor tabanlı feed sayfalama.

    filter_mode = "all"  → Puanlanmış / kişiselleştirilmiş keşfet akışı.
        - Sadece hesabı açık (public) olan ve takip etmediğimiz kişilerin gönderileri.
        - Her gönderi FeedScoringContext ile puanlanır (etkileşim + tazelik + sosyal + ilgi).
        - Cursor formatı: "score:<float>:<post_id>"  (azalan skor sırası)

    filter_mode = "following" → Saf kronolojik takip akışı.
        - Sadece takip ettiklerinin gönderileri, zaman sırasıyla.
        - Cursor formatı: "<created_at_iso>:<post_id>"
    """
    from datetime import datetime as _dt
    # pyrefly: ignore [missing-import]
    from sqlalchemy import or_, and_

    if filter_mode == "following":
        # ── TAKIP AKışı: saf kronoloji + takip edilen MEKANLAR ─────────────
        if not current_user_id:
            return [], None, False

        following_ids_sq = (
            db.query(models.Follow.following_id)
            .filter(
                models.Follow.follower_id == current_user_id,
                models.Follow.status == "accepted",
            )
        )

        # Takip edilen mekan sahiplerinin ID'leri
        followed_place_ids = get_followed_place_ids(db, current_user_id)
        venue_owner_ids: list[int] = []
        if followed_place_ids:
            rows = db.query(models.Place.owner_id).filter(
                models.Place.id.in_(followed_place_ids),
                models.Place.owner_id.isnot(None),
            ).all()
            venue_owner_ids = [r[0] for r in rows if r[0]]

        # Kullanıcı takipleri + mekan sahiplerini birleştir
        feed_filters = [models.Post.user_id.in_(following_ids_sq)]
        if followed_place_ids and venue_owner_ids:
            feed_filters.append(
                and_(
                    models.Post.user_id.in_(venue_owner_ids),
                    models.Post.place_id.in_(followed_place_ids),
                )
            )
        base = _filter_non_flagged_posts(db.query(models.Post), db).filter(or_(*feed_filters))
        if post_type:
            base = base.filter(models.Post.post_type == post_type)

        # Cursor decode (created_at:id formatı)
        if cursor:
            try:
                cursor_dt_str, cursor_id_str = cursor.rsplit(":", 1)
                cursor_dt = _dt.fromisoformat(cursor_dt_str)
                cursor_id = int(cursor_id_str)
                base = base.filter(
                    or_(
                        models.Post.created_at < cursor_dt,
                        and_(
                            models.Post.created_at == cursor_dt,
                            models.Post.id < cursor_id,
                        ),
                    )
                )
            except (ValueError, AttributeError):
                pass

        posts = (
            base.options(
                joinedload(models.Post.user),
                joinedload(models.Post.place),
                joinedload(models.Post.media),
                joinedload(models.Post.tags).joinedload(models.PostTag.user),
            )
            .order_by(models.Post.created_at.desc(), models.Post.id.desc())
            .limit(page_size + 1)
            .all()
        )
        has_more = len(posts) > page_size
        if has_more:
            posts = posts[:page_size]
        next_cursor: str | None = None
        if has_more and posts:
            last = posts[-1]
            next_cursor = f"{last.created_at.isoformat()}:{last.id}"
        return posts, next_cursor, has_more


    # ── HERKES AKışI: Puanlanmış Keşfet Feed'i ─────────────────────────────
    # Sadece: hesabı açık + benim takip etmediğim (ve ben değilim) kişilerin gönderileri
    from app.services.feed_scorer import FeedScoringContext, score_post

    # Benim takip ettiklerimin ID seti
    my_following_ids: set[int] = set()
    if current_user_id:
        rows = db.query(models.Follow.following_id).filter(
            models.Follow.follower_id == current_user_id,
            models.Follow.status == "accepted",
        ).all()
        my_following_ids = {r[0] for r in rows}

    # Private hesapların ID seti
    private_user_ids: set[int] = {
        r[0] for r in db.query(models.UserPreferences.user_id)
        .filter(models.UserPreferences.is_private_account == True).all()
    }

    # Filtre: kamuya açık, takip etmediğim, benim değilim
    base = _filter_non_flagged_posts(db.query(models.Post), db)

    if current_user_id:
        # Engellediğim veya beni engelleyen kişileri bul
        blocked_by_me = {r[0] for r in db.query(models.UserBlock.blocked_id).filter(models.UserBlock.blocker_id == current_user_id).all()}
        blocked_me = {r[0] for r in db.query(models.UserBlock.blocker_id).filter(models.UserBlock.blocked_id == current_user_id).all()}
        all_blocked_ids = blocked_by_me | blocked_me
        
        # Takip ettiklerimi, private hesapları, kendimi ve engellenenleri çıkar
        exclude_ids = my_following_ids | private_user_ids | {current_user_id} | all_blocked_ids
        if exclude_ids:
            base = base.filter(models.Post.user_id.notin_(exclude_ids))
    else:
        # Giriş yapmamış → sadece public hesapların gönderileri
        if private_user_ids:
            base = base.filter(models.Post.user_id.notin_(private_user_ids))

    if post_type:
        base = base.filter(models.Post.post_type == post_type)

    # Cursor: "score:<float>:<post_id>"
    # Puanlı feed'de cursor'u basit kronoloji yerine skor bazlı tutuyoruz.
    # Pratik çözüm: cursor'dan sonraki sayfayı almak için geniş bir zaman penceresi çekip
    # Python'da puanla, sonra offset ile kes.
    # Büyük veritabanlarında bu pencereyi daraltmak gerekir; şu an son 30 günlük içerik yeterli.
    cursor_score_threshold: float | None = None
    cursor_post_id: int | None = None
    if cursor and cursor.startswith("score:"):
        try:
            _, score_str, post_id_str = cursor.split(":", 2)
            cursor_score_threshold = float(score_str)
            cursor_post_id = int(post_id_str)
        except (ValueError, AttributeError):
            pass

    # Puanlama bağlamını oluştur (dışarıdan geçilmemişse)
    if scoring_context is None:
        if current_user_id:
            scoring_context = FeedScoringContext.build(db, current_user_id)
        else:
            scoring_context = FeedScoringContext.empty()

    # Çekme penceresi: son 30 gün (çok eski içerik zaten düşük tazelik puanı alır)
    from datetime import timedelta, timezone as _tz
    window_start = _dt.now(_tz.utc) - timedelta(days=30)

    # Makul bir batch çek (page_size * 8), puanla, sırala, kes
    # Not: 25M+ veritabanında bu sorgu index taramasıyla hızlıdır.
    BATCH_MULTIPLIER = 8
    batch_size = page_size * BATCH_MULTIPLIER

    raw_posts = (
        base.filter(models.Post.created_at >= window_start)
        .options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .limit(batch_size)
        .all()
    )

    # Tüm postları puana göre sırala
    scored: list[tuple[float, models.Post]] = []
    for p in raw_posts:
        s = score_post(
            p,
            fof_ids=scoring_context.fof_ids,
            direct_following_of_friends=scoring_context.direct_following_of_friends,
            user_interest_keywords=scoring_context.user_interest_keywords,
            liked_place_categories=scoring_context.liked_place_categories,
            interacted_place_ids=scoring_context.interacted_place_ids,
        )
        scored.append((s, p))

    # Azalan puana göre sırala, eşit puanda en yeni önce
    scored.sort(key=lambda x: (-x[0], -x[1].id))

    # Cursor'dan sonrasını al
    if cursor_score_threshold is not None and cursor_post_id is not None:
        # Cursor noktasından sonraki elemanları bul
        cursor_idx = None
        for i, (s, p) in enumerate(scored):
            if p.id == cursor_post_id:
                cursor_idx = i
                break
        if cursor_idx is not None:
            scored = scored[cursor_idx + 1:]
        else:
            # Cursor bulunamadı (eski içerik temizlenmiş olabilir) — eşik bazlı geç
            scored = [(s, p) for s, p in scored if s < cursor_score_threshold or (s == cursor_score_threshold and p.id < cursor_post_id)]

    has_more = len(scored) > page_size
    page_scored = scored[:page_size]

    posts = [p for _, p in page_scored]

    next_cursor_all: str | None = None
    if has_more and page_scored:
        last_score, last_post = page_scored[-1]
        next_cursor_all = f"score:{last_score}:{last_post.id}"

    return posts, next_cursor_all, has_more


def get_post_by_id(db: Session, post_id: int):
    return (
        db.query(models.Post)
        .options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .filter(models.Post.id == post_id)
        .first()
    )


def delete_post(db: Session, post_id: int, user_id: int):
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.user_id == user_id).first()
    if post:
        db.delete(post)
        db.commit()
        return True
    return False


def toggle_post_like(db: Session, post_id: int, user_id: int):
    like = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id, models.PostLike.user_id == user_id
    ).first()
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        return None, False
    if like:
        db.delete(like)
        post.like_count = max(0, post.like_count - 1) # type: ignore
        db.commit()
        return post, False
    db.add(models.PostLike(post_id=post_id, user_id=user_id))
    post.like_count += 1 # type: ignore
    db.commit()
    db.refresh(post)
    return post, True


def is_post_liked_by_user(db: Session, post_id: int, user_id: int | None) -> bool:
    if not user_id:
        return False
    return db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id, models.PostLike.user_id == user_id
    ).first() is not None


def get_comments_paginated(db: Session, post_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.PostComment).filter(models.PostComment.post_id == post_id)
    total = base.count()
    offset = (page - 1) * page_size
    comments = (
        base.options(joinedload(models.PostComment.user))
        .order_by(models.PostComment.created_at.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return comments, total


def add_post_comment(db: Session, post_id: int, user_id: int, text: str):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        return None
    if post.comments_disabled:
        return None  # Yorumlar kapatılmış
        
    # AI Moderation Check
    is_flagged = AIModerator.moderate_text(text)
    
    comment = models.PostComment(
        post_id=post_id, 
        user_id=user_id, 
        text=text,
        is_flagged=is_flagged
    )
    db.add(comment)
    
    # Sadece temiz yorumlar sayacı artırır
    if not is_flagged:
        post.comment_count += 1 # type: ignore
        
    db.commit()
    db.refresh(comment)
    return comment


def get_posts_by_user(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.Post).filter(models.Post.user_id == user_id)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total


def get_posts_by_place(db: Session, place_id: int, page: int = 1, page_size: int = 20):
    base = db.query(models.Post).filter(models.Post.place_id == place_id)
    total = base.count()
    offset = (page - 1) * page_size
    posts = (
        base.options(
            joinedload(models.Post.user),
            joinedload(models.Post.place),
            joinedload(models.Post.media),
            joinedload(models.Post.tags).joinedload(models.PostTag.user),
        )
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return posts, total
