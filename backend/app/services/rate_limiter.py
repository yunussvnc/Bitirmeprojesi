# app/dependencies/rate_limiter.py
import time
from collections import defaultdict
from fastapi import HTTPException, Request

class RateLimiter:
    """
    Basit In-Memory Rate Limiter (Dummygram Spam Koruması).
    Kullanıcı bazlı istekleri sayar ve belirli bir süre içinde limiti aşarsa 429 döndürür.
    İleride Redis'e taşınabilir.
    """
    def __init__(self, requests: int = 5, window: int = 10):
        self.requests = requests
        self.window = window
        # dict: user_id -> list of timestamps
        self.history: dict[int, list[float]] = defaultdict(list)

    async def __call__(self, request: Request):
        # Kullanıcı ID'si auth middleware'inden gelecek (request.state.user)
        user = getattr(request.state, "user", None)
        if not user:
            return

        user_id = user.id
        now = time.time()

        # Süresi dolmuş istekleri temizle
        self.history[user_id] = [t for t in self.history[user_id] if now - t < self.window]

        if len(self.history[user_id]) >= self.requests:
            raise HTTPException(status_code=429, detail="Too Many Requests")

        self.history[user_id].append(now)

# Global instances for specific endpoints
follow_rate_limiter = RateLimiter(requests=3, window=5) # 5 saniyede maks 3 istek
