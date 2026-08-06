# core/redis_client.py — Redis Connection Manager (Optimized Pool)

import os
import logging
from redis import asyncio as aioredis
from redis.asyncio.retry import Retry
from redis.backoff import ExponentialBackoff
from typing import Optional

logger = logging.getLogger("asemos")

# Global redis connection pool
redis_client: Optional[aioredis.Redis] = None

# Pub/Sub için ayrı bağlantı (ana pool'u tüketmemek için)
_pubsub_connection: Optional[aioredis.Redis] = None


async def connect_redis():
    """Uygulama başlarken Redis bağlantısını kurar."""
    global redis_client, _pubsub_connection

    # Default olarak localhost:6379, canlıda .env'den gelir
    from config import get_settings
    redis_url = get_settings().REDIS_URL

    # Retry stratejisi: Geçici ağ hatalarında otomatik yeniden dene
    retry = Retry(ExponentialBackoff(cap=10, base=0.5), retries=3)

    try:
        redis_client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,        # Verileri string olarak döndür (byte yerine)
            max_connections=20,            # Render free tier max 30; havuz taşmasını önle
            health_check_interval=30,      # Cloud Redis için bağlantı kopmasını engeller
            socket_keepalive=True,         # TCP seviyesinde canlı tutar
            socket_timeout=30.0,           # Soket okuma zaman aşımı
            socket_connect_timeout=10.0,   # Bağlantı kurma zaman aşımı
            retry_on_error=[               # Bu hatalarda otomatik retry yap
                aioredis.ConnectionError,
                aioredis.TimeoutError,
                OSError,
            ],
            retry=retry,
        )
        # Bağlantıyı test et
        await redis_client.ping()
        logger.info("✅ Redis bağlantısı başarılı (%s)", redis_url)

        # Pub/Sub için ayrı bağlantı oluştur (ana pool'u tüketmemek için)
        _pubsub_connection = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=3,             # Pub/Sub sadece 1-2 bağlantı kullanır
            socket_keepalive=True,
            socket_timeout=60.0,           # Pub/Sub listen uzun sürebilir
            socket_connect_timeout=10.0,
        )
        await _pubsub_connection.ping()
        logger.info("✅ Redis Pub/Sub bağlantısı hazır")

    except Exception as e:
        logger.error("❌ Redis bağlantı hatası: %s", str(e))
        redis_client = None
        _pubsub_connection = None


async def disconnect_redis():
    """Uygulama kapanırken Redis bağlantısını kapatır."""
    global redis_client, _pubsub_connection
    if _pubsub_connection:
        try:
            await _pubsub_connection.aclose()
        except Exception:
            pass
        logger.info("🛑 Redis Pub/Sub bağlantısı kapatıldı")

    if redis_client:
        try:
            await redis_client.aclose()
        except Exception:
            pass
        logger.info("🛑 Redis bağlantısı kapatıldı")


def get_redis() -> Optional[aioredis.Redis]:
    """
    Diğer modüllerden Redis instance'ını almak için kullanılır.
    Kullanım: redis = get_redis()
    """
    return redis_client


def get_pubsub_redis() -> Optional[aioredis.Redis]:
    """
    Pub/Sub listener için ayrı Redis bağlantısı döndürür.
    Ana pool'u tüketmez.
    """
    return _pubsub_connection
