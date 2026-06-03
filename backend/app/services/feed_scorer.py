"""
feed_scorer.py — AsEmOs Keşfet (Explore / All) Akış Puanlama Motoru

Her gönderiye 0-100 arası bileşik bir skor verir.
Puanlama 3 ana sinyal üzerine kuruludur:

1. Etkileşim Puanı  (max 40 pt)
   - like_count ve comment_count'un logaritmik ağırlıklı toplamı
   - Yorum, beğeniden 2x ağırlıklı (aktif etkileşim göstergesi)

2. Tazelik Puanı  (max 20 pt)
   - Gönderinin ne kadar yeni olduğu — 24 saat taze = full puan, üstel düşüş

3. Sosyal Yakınlık Puanı  (max 25 pt)
   - Takip ettiklerimizin de takip ettiği hesaplar → +25
   - İlk derece: arkadaşın arkadaşı (FoF) → +15

4. İlgi Alanı Puanı  (max 15 pt)
   - Kullanıcının MatchProfile.interests ↔ Post bağlı Place.category eşleşmesi
   - Kullanıcının daha önce beğendiği postların mekân kategorileriyle eşleşme

Tüm sinyaller normalize edilerek (0-100) tek bir skorda birleştirilir.
Skor hesaplama saf Python'da yapılır (SQL'de değil) — esneklik için.
"""

from __future__ import annotations

import json
import math
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("asemos.feed_scorer")

# ─── Ağırlıklar (değiştirmek kolaylık için burada merkezi) ──────────────────
W_ENGAGEMENT = 40   # max puan: etkileşim
W_FRESHNESS  = 20   # max puan: tazelik
W_SOCIAL     = 25   # max puan: sosyal yakınlık
W_INTEREST   = 15   # max puan: ilgi alanı
W_VENUE_BOOST = 10  # bonus: daha önce etkileşim olan mekanın gönderisi

COMMENT_WEIGHT = 2.0   # yorumun beğeniye oranla ağırlığı
FRESHNESS_HALF_LIFE_HOURS = 48   # bu kadar saat sonra tazelik puanı %50 düşer


def _engagement_score(like_count: int, comment_count: int) -> float:
    """
    Logaritmik etkileşim skoru.
    log(1 + w*yorumlar + beğeniler) → 0..W_ENGAGEMENT
    Sonsuz büyüme engellemek için üst sınır: 10_000 etkileşim = max puan.
    """
    raw = like_count + COMMENT_WEIGHT * comment_count
    # log ölçeği: 0 → 0, 10_000 → W_ENGAGEMENT
    max_raw = 10_000.0
    normalized = math.log1p(raw) / math.log1p(max_raw)
    return min(normalized * W_ENGAGEMENT, W_ENGAGEMENT)


def _freshness_score(created_at: datetime) -> float:
    """
    Üstel azalan tazelik puanı.
    f(t) = W_FRESHNESS * 0.5^(t / half_life)
    """
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    hours_old = max((now - created_at).total_seconds() / 3600, 0)
    decay = math.pow(0.5, hours_old / FRESHNESS_HALF_LIFE_HOURS)
    return decay * W_FRESHNESS


def _social_score(
    post_author_id: int,
    friends_of_friends_ids: set[int],
    direct_friend_followings: set[int],
) -> float:
    """
    Sosyal yakınlık puanı.
    - Kullanıcının takip ettiklerinin takip ettikleri (FoF) ise +25
    - Arkadaşın arkadaşı (FoF ikinci derece) ise +15
    """
    if post_author_id in direct_friend_followings:
        return W_SOCIAL   # Takip edilen birinin takip ettiği — en güçlü sinyal
    if post_author_id in friends_of_friends_ids:
        return W_SOCIAL * 0.6   # İkinci derece bağlantı
    return 0.0


def _interest_score(
    place_category: Optional[str],
    user_interest_keywords: set[str],
    liked_categories: set[str],
) -> float:
    """
    İlgi alanı puanı.
    - MatchProfile.interests ↔ place.category kelime eşleşmesi
    - Daha önce beğenilen postların place.category'siyle eşleşme
    """
    if not place_category:
        return 0.0
    cat_lower = place_category.lower()
    score = 0.0
    # İlgi alanı keyword eşleşmesi
    for kw in user_interest_keywords:
        if kw in cat_lower or cat_lower in kw:
            score += W_INTEREST * 0.7
            break
    # Beğeni geçmişi eşleşmesi
    if cat_lower in liked_categories:
        score += W_INTEREST * 0.3
    return min(score, W_INTEREST)


# ─── Ana Skor Fonksiyonu ────────────────────────────────────────────────────

def score_post(
    post,                          # models.Post ORM nesnesi
    fof_ids: set[int],             # arkadaşın takip ettikleri (set)
    direct_following_of_friends: set[int],  # arkadaşın arkadaşları
    user_interest_keywords: set[str],       # MatchProfile.interests → lower set
    liked_place_categories: set[str],       # kullanıcının beğenilerinden gelen mekan kategorileri
    interacted_place_ids: set[int] | None = None,  # etkileşim skoru olan mekan ID'leri
) -> float:
    """Tek bir post için bileşik 0-100+ skor döner."""
    eng  = _engagement_score(post.like_count or 0, post.comment_count or 0)
    frs  = _freshness_score(post.created_at)
    soc  = _social_score(post.user_id, fof_ids, direct_following_of_friends)
    place_cat = post.place.category if post.place else None
    intr = _interest_score(place_cat, user_interest_keywords, liked_place_categories)
    # Mekan etkileşim boost'u: kullanıcı bu mekanla daha önce etkileşime girdiyse
    venue_boost = 0.0
    if interacted_place_ids and post.place_id and post.place_id in interacted_place_ids:
        venue_boost = W_VENUE_BOOST
    total = eng + frs + soc + intr + venue_boost
    return round(total, 4)


# ─── Bağlam Toplama (DB'den bir kez çek, cache'te sakla) ────────────────────

class FeedScoringContext:
    """
    Kullanıcı başına puanlama sinyallerini DB'den tek seferinde toplar.
    `get_feed_paginated_cursor` içinde çağrılır.
    """

    def __init__(
        self,
        fof_ids: set[int],
        direct_following_of_friends: set[int],
        user_interest_keywords: set[str],
        liked_place_categories: set[str],
        interacted_place_ids: set[int] | None = None,
    ):
        self.fof_ids = fof_ids
        self.direct_following_of_friends = direct_following_of_friends
        self.user_interest_keywords = user_interest_keywords
        self.liked_place_categories = liked_place_categories
        self.interacted_place_ids = interacted_place_ids or set()

    @classmethod
    def build(cls, db, current_user_id: int) -> "FeedScoringContext":
        """DB'den kullanıcıya özel puanlama bağlamını oluşturur."""
        import models

        # 1. Kullanıcının takip ettiklerinin ID listesi
        my_followings: list[int] = [
            r[0] for r in db.query(models.Follow.following_id)
            .filter(
                models.Follow.follower_id == current_user_id,
                models.Follow.status == "accepted",
            ).all()
        ]

        # 2. Arkadaşlarımın takip ettikleri (FoF) — "arkadaşların takip ettiği"
        #    Benim takip ettiğim kişinin takip ettikleri → sosyal yakınlık sinyali
        direct_following_of_friends: set[int] = set()
        if my_followings:
            rows = db.query(models.Follow.following_id).filter(
                models.Follow.follower_id.in_(my_followings),
                models.Follow.status == "accepted",
                models.Follow.following_id != current_user_id,
            ).distinct().all()
            direct_following_of_friends = {r[0] for r in rows} - set(my_followings)

        # 3. İkinci derece — FoF'un takip ettikleri (sadece set farkı için)
        fof_ids: set[int] = set()  # Şu an direkt following_of_friends yeterli

        # 4. İlgi alanı keyword'leri — MatchProfile.interests (JSON array)
        user_interest_keywords: set[str] = set()
        match_profile = db.query(models.MatchProfile).filter(
            models.MatchProfile.user_id == current_user_id
        ).first()
        if match_profile and match_profile.interests:
            try:
                interests_list = json.loads(match_profile.interests)
                user_interest_keywords = {str(i).lower() for i in interests_list}
            except (json.JSONDecodeError, TypeError):
                pass

        # 5. Kullanıcının beğendiği postların bağlı place kategorileri
        liked_place_categories: set[str] = set()
        liked_place_rows = (
            db.query(models.Place.category)
            .join(models.Post, models.Post.place_id == models.Place.id)
            .join(models.PostLike, models.PostLike.post_id == models.Post.id)
            .filter(
                models.PostLike.user_id == current_user_id,
                models.Place.category.isnot(None),
            )
            .distinct()
            .limit(50)   # fazla sorgu yapmaması için sınır
            .all()
        )
        liked_place_categories = {r[0].lower() for r in liked_place_rows if r[0]}

        # 6. Etkileşim skoru olan mekan ID'leri (kart açma, AI arama vb.)
        import crud as _crud
        interacted_ids = set(_crud.get_interacted_place_ids(db, current_user_id, min_score=2))

        logger.debug(
            "FeedScoringContext built: fof=%d, interests=%d, liked_cats=%d, interacted_places=%d",
            len(direct_following_of_friends),
            len(user_interest_keywords),
            len(liked_place_categories),
            len(interacted_ids),
        )

        return cls(
            fof_ids=fof_ids,
            direct_following_of_friends=direct_following_of_friends,
            user_interest_keywords=user_interest_keywords,
            liked_place_categories=liked_place_categories,
            interacted_place_ids=interacted_ids,
        )

    @classmethod
    def empty(cls) -> "FeedScoringContext":
        """Giriş yapmamış kullanıcılar için boş bağlam (sadece etkileşim+tazelik)."""
        return cls(
            fof_ids=set(),
            direct_following_of_friends=set(),
            user_interest_keywords=set(),
            liked_place_categories=set(),
            interacted_place_ids=set(),
        )
