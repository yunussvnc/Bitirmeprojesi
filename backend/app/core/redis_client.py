# core/redis_client.py — Redis Connection Manager

import os
import logging
from redis import asyncio as aioredis
from typing import Optional

logger = logging.getLogger("asemos")

# Global redis connection pool
redis_client: Optional[aioredis.Redis] = None


async def connect_redis():
    """Uygulama başlarken Redis bağlantısını kurar."""
    global redis_client
    
    # Default olarak localhost:6379, canlıda .env'den gelir
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    try:
        redis_client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True, # Verileri string olarak döndür (byte yerine)
            max_connections=50,    # Bağlantı havuzu
        )
        # Bağlantıyı test et
        await redis_client.ping()
        logger.info("✅ Redis bağlantısı başarılı (%s)", redis_url)
    except Exception as e:
        logger.error("❌ Redis bağlantı hatası: %s", str(e))
        redis_client = None


async def disconnect_redis():
    """Uygulama kapanırken Redis bağlantısını kapatır."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("🛑 Redis bağlantısı kapatıldı")


def get_redis() -> Optional[aioredis.Redis]:
    """
    Diğer modüllerden Redis instance'ını almak için kullanılır.
    Kullanım: redis = get_redis()
    """
    return redis_client
