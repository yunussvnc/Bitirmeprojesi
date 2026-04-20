"""
migrate.py — Ana migration dosyası
===================================
Backend her başladığında main.py tarafından otomatik çalışır.
Yeni kolonlar eklendiğinde bu dosyaya eklenmeli.
Tüm migration'lar idempotent (IF NOT EXISTS / tekrar çalıştırılabilir).

Bölümler:
  TABLE  — Yeni tablo oluşturma
  COLUMN — Mevcut tabloya kolon ekleme
  INDEX  — Performans indeksi
"""

import logging
from sqlalchemy import create_engine, text
from config import get_settings

logger = logging.getLogger("asemos.migrate")


# ============================================================
# MIGRATION LISTESI — Her satır bağımsız çalışır, sıralı gelir
# ============================================================

MIGRATIONS = [

    # -------------------------------------------------------
    # TABLO: pending_users (kayıt doğrulama bekleyen kullanıcılar)
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS pending_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        username VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        birth_date DATE,
        verification_code VARCHAR NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: pending_venues (mekan başvuruları)
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS pending_venues (
        id SERIAL PRIMARY KEY,
        venue_name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: email_verifications
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        verification_code VARCHAR NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: password_resets
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reset_code VARCHAR NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: saved_places (yer imleri)
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS saved_places (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT uq_saved_place_user_place UNIQUE (user_id, place_id)
    )
    """,

    # -------------------------------------------------------
    # TABLO: saved_posts
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS saved_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT uq_saved_post_user_post UNIQUE (user_id, post_id)
    )
    """,

    # -------------------------------------------------------
    # TABLO: reports
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type VARCHAR NOT NULL,
        target_id INTEGER NOT NULL,
        reason VARCHAR NOT NULL,
        description TEXT,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: user_blocks
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS user_blocks (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id)
    )
    """,

    # -------------------------------------------------------
    # TABLO: review_media
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS review_media (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        media_type VARCHAR,
        media_url VARCHAR NOT NULL,
        thumbnail_url VARCHAR,
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        duration_seconds INTEGER,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
    )
    """,

    # -------------------------------------------------------
    # TABLO: user_preferences
    # -------------------------------------------------------
    """
    CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_private_account BOOLEAN DEFAULT FALSE,
        default_comments_disabled BOOLEAN DEFAULT FALSE,
        comment_allowed_audience VARCHAR DEFAULT 'everyone',
        unknown_message_requests BOOLEAN DEFAULT TRUE,
        story_reply_audience VARCHAR DEFAULT 'everyone',
        show_read_receipts BOOLEAN DEFAULT TRUE,
        story_save_to_archive BOOLEAN DEFAULT TRUE,
        story_save_to_camera_roll BOOLEAN DEFAULT FALSE,
        hide_offensive_words BOOLEAN DEFAULT TRUE,
        hidden_words_json TEXT,
        upload_quality VARCHAR DEFAULT 'auto',
        wifi_auto_high_quality BOOLEAN DEFAULT TRUE,
        include_location_in_posts BOOLEAN DEFAULT TRUE,
        language VARCHAR DEFAULT 'tr',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ
    )
    """,

    # -------------------------------------------------------
    # KOLON: users — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'standard'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE",

    # -------------------------------------------------------
    # KOLON: places — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS vector_id VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS google_place_id VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS price_range INTEGER",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS features TEXT",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS video_url VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS campaign_text VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS opening_time VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS closing_time VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS opening_hours_json TEXT",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS phone_number VARCHAR",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS gallery_urls TEXT",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS menu_items_json TEXT",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER",

    # -------------------------------------------------------
    # KOLON: reviews — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verify_method VARCHAR",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS distance_meters INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visit_date TIMESTAMPTZ",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visit_type VARCHAR",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS spent_amount FLOAT",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS spent_currency VARCHAR DEFAULT 'TRY'",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS wait_time_minutes INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ordered_items TEXT",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS food_rating INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS service_rating INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS atmosphere_rating INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS value_rating INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_response TEXT",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_response_at TIMESTAMPTZ",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",

    # -------------------------------------------------------
    # KOLON: posts — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_disabled BOOLEAN DEFAULT FALSE",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_hidden BOOLEAN DEFAULT FALSE",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR DEFAULT 'photo'",

    # -------------------------------------------------------
    # KOLON: post_media — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR",
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS duration_seconds INTEGER",
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS aspect_ratio FLOAT",
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS width INTEGER",
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS height INTEGER",
    "ALTER TABLE post_media ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0",

    # -------------------------------------------------------
    # KOLON: post_comments — parent_id (threaded yorumlar)
    # -------------------------------------------------------
    "ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE",

    # -------------------------------------------------------
    # KOLON: stories — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE stories ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR",
    "ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_close_friends BOOLEAN DEFAULT FALSE",

    # -------------------------------------------------------
    # KOLON: match_profiles — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS height INTEGER",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS education VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS location_text VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS smoking VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS drinking VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS looking_for VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS interests TEXT",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS star_sign VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS family_plans VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS exercise VARCHAR",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS prompts TEXT",
    "ALTER TABLE match_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",

    # -------------------------------------------------------
    # KOLON: match_conversations — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE match_conversations ADD COLUMN IF NOT EXISTS place_name VARCHAR",
    "ALTER TABLE match_conversations ADD COLUMN IF NOT EXISTS user1_revealed BOOLEAN DEFAULT FALSE",
    "ALTER TABLE match_conversations ADD COLUMN IF NOT EXISTS user2_revealed BOOLEAN DEFAULT FALSE",
    "ALTER TABLE match_conversations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
    "ALTER TABLE match_conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ",

    # -------------------------------------------------------
    # KOLON: messages — eksik alanlar
    # -------------------------------------------------------
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR DEFAULT 'text'",
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url VARCHAR",
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS shared_post_id INTEGER",
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE",

]


def run_migrations(engine=None):
    """
    Tüm migration'ları sırayla çalıştırır.
    Başarısız olanları loglar ama durdurmaz (IF NOT EXISTS sayesinde).
    """
    if engine is None:
        settings = get_settings()
        engine = create_engine(settings.DATABASE_URL)

    ok = 0
    skipped = 0
    errors = 0

    with engine.connect() as conn:
        for sql in MIGRATIONS:
            sql = sql.strip()
            short = sql[:70].replace('\n', ' ')
            try:
                conn.execute(text(sql))
                ok += 1
            except Exception as e:
                err_msg = str(e).split('\n')[0]
                # "already exists" hataları beklenen — sessizce geç
                if "already exists" in err_msg.lower() or "duplicate" in err_msg.lower():
                    skipped += 1
                else:
                    logger.warning("Migration WARN (%s...): %s", short, err_msg)
                    errors += 1
        conn.commit()

    logger.info(
        "✅ Migration tamamlandı — %d OK | %d zaten var | %d hata",
        ok, skipped, errors
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
    run_migrations()
    print("Migration bitti.")
