# services/tasks.py — Background Tasks (Story cleanup, Push token cleanup)

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from database import SessionLocal
import models

logger = logging.getLogger("asemos")

# ---------------------------------------------------------------------------
# Story Temizleme — 24 saat sonra süresi dolanları sil
# ---------------------------------------------------------------------------

def cleanup_expired_stories():
    """Süresi dolan hikayeleri veritabanından sil"""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        expired = db.query(models.Story).filter(
            models.Story.expires_at < now
        ).all()

        count = len(expired)
        if count > 0:
            for story in expired:
                db.delete(story)
            db.commit()
            logger.info("🧹 %d süresi dolmuş hikaye temizlendi", count)
        return count
    except Exception as e:
        db.rollback()
        logger.error("🧹 Story cleanup hatası: %s", str(e))
        return 0
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Push Token Temizleme — 30 gün güncellenmemiş tokenları sil
# ---------------------------------------------------------------------------

def cleanup_stale_push_tokens(days: int = 30):
    """Uzun süredir güncellenmemiş push token'ları temizle"""
    db: Session = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        stale = db.query(models.User).filter(
            models.User.push_token.isnot(None),
            models.User.push_token_updated_at < cutoff,
        ).all()

        count = len(stale)
        if count > 0:
            for user in stale:
                user.push_token = None
                user.push_token_updated_at = None
            db.commit()
            logger.info("🧹 %d eski push token temizlendi", count)
        return count
    except Exception as e:
        db.rollback()
        logger.error("🧹 Push token cleanup hatası: %s", str(e))
        return 0
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Background Scheduler — Periyodik temizlik
# ---------------------------------------------------------------------------

async def background_scheduler():
    """
    Arka plan zamanlayıcı — her 30 dakikada bir çalışır.
    - Story cleanup
    - Push token cleanup (günde 1 kez kontrol yeterli)
    """
    cleanup_counter = 0
    logger.info("⏰ Background scheduler başlatıldı")

    while True:
        try:
            await asyncio.sleep(30 * 60)  # 30 dakika
            cleanup_counter += 1

            # Her 30 dakikada story temizliği
            cleanup_expired_stories()

            # Her 24 saatte push token temizliği (48 * 30dk = 24h)
            if cleanup_counter % 48 == 0:
                cleanup_stale_push_tokens()

        except asyncio.CancelledError:
            logger.info("⏰ Background scheduler durduruldu")
            break
        except Exception as e:
            logger.error("⏰ Scheduler hatası: %s", str(e))
            await asyncio.sleep(60)  # Hata durumunda 1 dk bekle
