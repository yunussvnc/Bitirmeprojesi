"""Domain-specific CRUD operations extracted from :mod:`crud`."""

from crud_places import _enrich_places_with_stats
from datetime import datetime
from datetime import timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
import models

def toggle_comment_like(db: Session, comment_id: int, user_id: int) -> tuple[bool, int]:
    """Yorumu beğen / beğeniyi geri al."""
    like = db.query(models.CommentLike).filter(
        models.CommentLike.comment_id == comment_id,
        models.CommentLike.user_id == user_id
    ).first()
    if like:
        db.delete(like)
        liked = False
    else:
        new_like = models.CommentLike(comment_id=comment_id, user_id=user_id)
        db.add(new_like)
        liked = True
    db.commit()
    count = db.query(models.CommentLike).filter(models.CommentLike.comment_id == comment_id).count()
    return liked, count


def is_comment_liked_by_user(db: Session, comment_id: int, user_id: int) -> bool:
    """Yorumun kullanıcı tarafından beğenilip beğenilmediğini kontrol et."""
    return db.query(models.CommentLike).filter(
        models.CommentLike.comment_id == comment_id,
        models.CommentLike.user_id == user_id
    ).first() is not None


def record_story_view(db: Session, story_id: int, viewer_id: int, source: str | None = None) -> bool:
    """Hikaye izlenme kaydı oluştur veya güncelle. Daha önce izlediyse süreyi/tarihi günceller."""
    exists = db.query(models.StoryView).filter(
        models.StoryView.story_id == story_id,
        models.StoryView.viewer_id == viewer_id
    ).first()
    if exists:
        from sqlalchemy.sql import func
        exists.created_at = func.now()
        if source:
            exists.source = source
        db.commit()
        return False
    view = models.StoryView(
        story_id=story_id,
        viewer_id=viewer_id,
        source=source,
    )
    db.add(view)
    db.commit()
    return True


def update_story_view_analytics(
    db: Session,
    story_id: int,
    viewer_id: int,
    watch_duration_seconds: int = 0,
    did_visit_profile: bool = False,
    did_visit_place: bool = False,
    source: str | None = None,
) -> bool:
    """Mevcut izleme kaydının analitik alanlarını güncelle (UPSERT mantığı)."""
    view = db.query(models.StoryView).filter(
        models.StoryView.story_id == story_id,
        models.StoryView.viewer_id == viewer_id
    ).first()
    if not view:
        # Kaydı daha önce açmadıysa oluştur
        view = models.StoryView(
            story_id=story_id,
            viewer_id=viewer_id,
            watch_duration_seconds=watch_duration_seconds,
            did_visit_profile=did_visit_profile,
            did_visit_place=did_visit_place,
            source=source,
        )
        db.add(view)
    else:
        # Güncelle — toplam süreyi biriktir
        view.watch_duration_seconds = max(view.watch_duration_seconds, watch_duration_seconds)
        if did_visit_profile:
            view.did_visit_profile = True
        if did_visit_place:
            view.did_visit_place = True
        if source and not view.source:
            view.source = source
    db.commit()
    return True


def get_story_views_count(db: Session, story_id: int) -> int:
    """Hikayenin toplam benzersiz izlenme sayısını al."""
    return db.query(models.StoryView).filter(models.StoryView.story_id == story_id).count()


def is_story_viewed_by_user(db: Session, story_id: int, user_id: int) -> bool:
    """Hikayenin kullanıcı tarafından izlenip izlenmediğini kontrol et."""
    return db.query(models.StoryView).filter(
        models.StoryView.story_id == story_id,
        models.StoryView.viewer_id == user_id
    ).first() is not None


def get_story_viewers_with_analytics(db: Session, story_id: int) -> list[models.StoryView]:
    """Hikayeyi izleyenleri analitik alanlarla birlikte getirir."""
    return (
        db.query(models.StoryView)
        .filter(models.StoryView.story_id == story_id)
        .order_by(models.StoryView.created_at.desc())
        .all()
    )


def get_story_viewers(db: Session, story_id: int) -> list[models.User]:
    """Geriye dönük uyumluluk: Hikayeyi izleyen User listesi."""
    views = db.query(models.StoryView).filter(models.StoryView.story_id == story_id).all()
    viewer_ids = [v.viewer_id for v in views]
    if not viewer_ids:
        return []
    return db.query(models.User).filter(models.User.id.in_(viewer_ids)).all()


ALLOWED_STORY_EMOJIS = {'❤️', '🔥', '😍', '👏', '😂'}


def upsert_story_reaction(
    db: Session,
    story_id: int,
    user_id: int,
    emoji: str,
) -> tuple[models.StoryReaction, bool]:
    """
    Tepki ekle veya değiştir.
    Returns: (reaction, created)
    """
    existing = db.query(models.StoryReaction).filter(
        models.StoryReaction.story_id == story_id,
        models.StoryReaction.user_id == user_id,
    ).first()
    if existing:
        existing.emoji = emoji
        db.commit()
        db.refresh(existing)
        return existing, False
    reaction = models.StoryReaction(story_id=story_id, user_id=user_id, emoji=emoji)
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    return reaction, True


def delete_story_reaction(db: Session, story_id: int, user_id: int) -> bool:
    """Tepkiyi kaldır."""
    existing = db.query(models.StoryReaction).filter(
        models.StoryReaction.story_id == story_id,
        models.StoryReaction.user_id == user_id,
    ).first()
    if not existing:
        return False
    db.delete(existing)
    db.commit()
    return True


def get_story_reactions(db: Session, story_id: int) -> list[models.StoryReaction]:
    """Hikayenin tüm tepkilerini getir."""
    return (
        db.query(models.StoryReaction)
        .filter(models.StoryReaction.story_id == story_id)
        .order_by(models.StoryReaction.created_at.desc())
        .all()
    )


def get_story_reaction_counts(db: Session, story_id: int) -> dict:
    """Emoji bazlı tepki sayılarını getirir: {'❤️': 5, '🔥': 3}"""
    # pyrefly: ignore [missing-import]
    from sqlalchemy import func as sqlfunc
    rows = (
        db.query(models.StoryReaction.emoji, sqlfunc.count(models.StoryReaction.id))
        .filter(models.StoryReaction.story_id == story_id)
        .group_by(models.StoryReaction.emoji)
        .all()
    )
    return {emoji: count for emoji, count in rows}


def get_my_story_reaction(db: Session, story_id: int, user_id: int) -> str | None:
    """Kullanıcının bu hikayeye verdiği tepkiyi getirir."""
    r = db.query(models.StoryReaction).filter(
        models.StoryReaction.story_id == story_id,
        models.StoryReaction.user_id == user_id,
    ).first()
    return r.emoji if r else None


def get_archived_stories(db: Session, user_id: int, page: int = 1, page_size: int = 30):
    """Kullanıcının arşivlenmiş hikayelerini getir."""
    base = (
        db.query(models.Story)
        .filter(
            models.Story.user_id == user_id,
            models.Story.is_archived == True,
        )
        .order_by(models.Story.created_at.desc())
    )
    total = base.count()
    stories = base.offset((page - 1) * page_size).limit(page_size).all()
    return stories, total


def archive_expired_stories(db: Session, user_id: int | None = None) -> int:
    """
    Süresi dolmuş hikayeleri arşivler (is_archived=True).
    user_id verilirse sadece o kullanıcının hikayeleri arşivlenir.
    Returns: arşivlenen hikaye sayısı
    """
    now = datetime.now(timezone.utc)
    q = db.query(models.Story).filter(
        models.Story.expires_at <= now,
        models.Story.is_archived == False,
    )
    if user_id is not None:
        q = q.filter(models.Story.user_id == user_id)
    stories = q.all()
    if not stories:
        return 0

    user_ids = {s.user_id for s in stories}
    prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id.in_(user_ids)).all()
    archive_pref_map = {p.user_id: p.story_save_to_archive for p in prefs}

    archived_count = 0
    for s in stories:
        save_to_archive = archive_pref_map.get(s.user_id, True)
        if save_to_archive:
            s.is_archived = True
            archived_count += 1
        else:
            db.delete(s)

    db.commit()
    return archived_count


def log_interaction(db: Session, user_id: int, place_id: int, interaction_type: str, weight: int = 1):
    """
    Kullanıcının mekan etkileşimini (tıklama, kart açma vs.) kaydeder.
    """
    interaction = models.UserPlaceInteraction(
        user_id=user_id,
        place_id=place_id,
        interaction_type=interaction_type,
        weight=weight
    )
    db.add(interaction)
    db.commit()
    return interaction


def haversine_distance(lat1, lon1, lat2, lon2):
    """İki koordinat arasındaki mesafeyi kilometre cinsinden hesaplar."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    R = 6371.0 # Dünya yarıçapı (km)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_foryou_places(db: Session, user_id: int | None, lat: float | None, lng: float | None, limit: int = 12):
    """
    Kişiselleştirilmiş mekan önerme motoru.
    Puanlama:
    Base Score: Rating * 4 (Maks 20) + Like_Count (Maks 10)
    Distance: <1km=40, <3km=30, <5km=20, <10km=10
    Interaction: Belirli bir mekan için toplam ağırlık (Maks 30)
    Category: (Şimdilik Interaction içine yedirilebilir veya ayrıca hesaplanabilir)
    """
    # 1. Tüm aktif mekanları çekmek yerine en yüksek puanlı veya kullanıcıya en yakın 200 mekanı çekiyoruz (Performans optimizasyonu)
    query = db.query(models.Place).filter(models.Place.latitude.isnot(None))
    
    if lat and lng:
        # Eğer kullanıcının konumu varsa, kaba bir bounding box (yaklaşık 50km) ile filtreleyip 200 tane getirebiliriz. 
        # Basitlik açısından en yüksek puanlı 200 mekan ile çalışıyoruz.
        query = query.order_by(models.Place.average_rating.desc()).limit(200)
    else:
        query = query.order_by(models.Place.average_rating.desc()).limit(200)
        
    places = query.all()

    # 2. Etkileşim geçmişini çek (Eğer kullanıcı giriş yapmışsa)
    user_interactions = {}
    if user_id:
        interactions = db.query(
            models.UserPlaceInteraction.place_id, 
            func.sum(models.UserPlaceInteraction.weight).label('total_weight')
        ).filter(models.UserPlaceInteraction.user_id == user_id)\
         .group_by(models.UserPlaceInteraction.place_id).all()
        
        for p_id, tw in interactions:
            user_interactions[p_id] = min(tw or 0, 30) # Maks 30 puan

    scored_places = []
    for p in places:
        score = 0.0
        
        # Base Score (Maks 30)
        rating = p.average_rating or 3.0
        score += (rating * 4)
        # Popülerlik puanı
        likes = len(p.saved_by) if hasattr(p, 'saved_by') else 0 # Veya yorum sayısı vb.
        score += min(likes * 2, 10) 

        # Distance Score (Maks 40)
        if lat and lng and p.latitude and p.longitude:
            dist = haversine_distance(lat, lng, p.latitude, p.longitude)
            if dist <= 1.0:
                score += 40
            elif dist <= 3.0:
                score += 30
            elif dist <= 5.0:
                score += 20
            elif dist <= 10.0:
                score += 10

        # Interaction Score (Maks 30)
        interaction_score = user_interactions.get(p.id, 0)
        score += interaction_score

        scored_places.append((score, p))

    # Puana göre sırala (Büyükten küçüğe)
    scored_places.sort(key=lambda x: x[0], reverse=True)
    
    # En iyi mekanları seç
    top_places = [p for score, p in scored_places[:limit]]
    
    # Detayları (yorumlar, fotoğraflar vs) doldur
    enriched = _enrich_places_with_stats(db, top_places)
    return enriched
