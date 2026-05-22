# Backend - AI Service Integration Guide

Bu dokuman Backend servisi ile AI-LLM servisinin nasıl entegre edileceğini açıklar.

## 🔗 Service URLs

### Production URLs

```
Backend:  https://asemos-backend.onrender.com
AI:       https://asemos-ai.onrender.com
Database: Internal Render PostgreSQL URL
```

### Local Development URLs

```
Backend:  http://localhost:8000
AI:       http://localhost:8080
Database: localhost:5432
```

---

## 📊 Architecture Overview

```
┌──────────────┐
│  Mobile App  │
│   (React     │
│   Native)    │
└──────┬───────┘
       │ HTTP Requests
       │
       ▼
┌──────────────────────────────────────────────┐
│              Backend Service                 │
│           (Main API - FastAPI)               │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  Endpoints:                         │    │
│  │  • /api/auth/*                      │    │
│  │  • /api/venues/*                    │    │
│  │  • /api/users/*                     │    │
│  │  • /api/recommendations/*  ◄────────┼────┼─── AI Service'i çağırır
│  └─────────────────────────────────────┘    │
└──────┬───────────────────────────────────────┘
       │
       │ Internal HTTP Request
       │
       ▼
┌──────────────────────────────────────────────┐
│            AI-LLM Service                    │
│         (AI/ML - FastAPI)                    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  Endpoints:                         │    │
│  │  • /api/smart-search-v2             │    │
│  │  • /api/analyze-place-reviews       │    │
│  │  • /api/image-search                │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  External APIs:                              │
│  • Groq (LLM)                                │
│  • SerpAPI (Google Maps)                     │
└──────┬───────────────────────────────────────┘
       │
       │ Both services use same database
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│   Database   │
└──────────────┘
```

---

## 🔧 Backend Configuration

### 1. Environment Variable Ekle

Backend servisinin Render.com dashboard'ında:

**Environment** → **Add Environment Variable**

```bash
AI_SERVICE_URL=https://asemos-ai.onrender.com
```

⚠️ **Önemli**:
- URL sonunda `/` olmamalı
- `https://` prefix kullanın (production)
- Local dev için: `http://localhost:8080`

### 2. Backend Kodunu Güncelle

#### Option A: Environment Variable ile

`backend/main.py` veya ilgili dosyada:

```python
import os
import httpx
from fastapi import APIRouter, HTTPException

# Environment variable
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8080")

router = APIRouter()

@router.post("/api/recommendations/smart-search")
async def smart_search(
    query: str,
    location: str = "Istanbul",
    user_lat: float = None,
    user_lng: float = None
):
    """
    AI servisini kullanarak akıllı mekan önerisi al
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/smart-search-v2",
                json={
                    "query": query,
                    "location": location,
                    "user_lat": user_lat,
                    "user_lng": user_lng,
                    "limit": 10,
                    "max_distance_km": 10.0,
                    "analyze_reviews": True
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )
```

#### Option B: Service Client Class

Daha temiz bir yaklaşım için service client:

```python
# backend/services/ai_service.py

import os
import httpx
from typing import Dict, Optional, List
from fastapi import HTTPException


class AIService:
    """AI-LLM servisi client'ı"""
    
    def __init__(self):
        self.base_url = os.getenv(
            "AI_SERVICE_URL", 
            "http://localhost:8080"
        )
        self.timeout = 30.0
    
    async def smart_search(
        self,
        query: str,
        location: str = "Istanbul",
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        limit: int = 10,
        max_distance_km: float = 10.0,
        analyze_reviews: bool = True
    ) -> Dict:
        """
        Akıllı mekan arama
        
        Args:
            query: Kullanıcı sorgusu ("Beşiktaş'ta sakin kafe")
            location: Lokasyon (default: Istanbul)
            user_lat: Kullanıcı latitude
            user_lng: Kullanıcı longitude
            limit: Maksimum sonuç sayısı
            max_distance_km: Maksimum mesafe (km)
            analyze_reviews: Yorum analizi yap
            
        Returns:
            {
                "query": str,
                "found": int,
                "recommendations": List[Dict],
                "ai_message": str,
                "_performance": {...}
            }
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/smart-search-v2",
                    json={
                        "query": query,
                        "location": location,
                        "user_lat": user_lat,
                        "user_lng": user_lng,
                        "limit": limit,
                        "max_distance_km": max_distance_km,
                        "analyze_reviews": analyze_reviews
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"AI service unavailable: {str(e)}"
            )
    
    async def analyze_reviews(
        self,
        data_id: str,
        place_name: Optional[str] = None
    ) -> Dict:
        """
        Mekan yorumlarını AI ile analiz et
        
        Args:
            data_id: Google Maps data_id
            place_name: Mekan adı (opsiyonel)
            
        Returns:
            {
                "success": bool,
                "review_count": int,
                "sentiment_score": float,
                "analysis_text": str,
                "specialties": List[Dict]
            }
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/analyze-place-reviews",
                    json={
                        "data_id": data_id,
                        "place_name": place_name
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Review analysis failed: {str(e)}"
            )
    
    async def image_search(
        self,
        image_base64: str,
        mime_type: str = "image/jpeg",
        location: str = "Istanbul",
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        limit: int = 5
    ) -> Dict:
        """
        Görsel ile mekan ara
        
        Args:
            image_base64: Base64 encoded image
            mime_type: Image MIME type
            location: Lokasyon
            user_lat: Kullanıcı latitude
            user_lng: Kullanıcı longitude
            limit: Maksimum sonuç sayısı
            
        Returns:
            {
                "image_analysis": {...},
                "recommendations": [...]
            }
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:  # Longer timeout
                response = await client.post(
                    f"{self.base_url}/api/image-search",
                    json={
                        "image_base64": image_base64,
                        "mime_type": mime_type,
                        "location": location,
                        "user_lat": user_lat,
                        "user_lng": user_lng,
                        "limit": limit
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Image search failed: {str(e)}"
            )
    
    async def health_check(self) -> Dict:
        """AI servisi health check"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return {"status": "error", "message": "AI service unavailable"}


# Singleton instance
ai_service = AIService()
```

#### Backend Endpoint'leri Güncelle

```python
# backend/routes/recommendations.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.ai_service import ai_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


class SmartSearchRequest(BaseModel):
    query: str
    location: str = "Istanbul"
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None


class ImageSearchRequest(BaseModel):
    image_base64: str
    location: str = "Istanbul"


@router.post("/smart-search")
async def smart_search(request: SmartSearchRequest):
    """
    AI destekli akıllı mekan arama
    
    Example:
        POST /api/recommendations/smart-search
        {
            "query": "Kadıköy'de çalışmak için sessiz kafe",
            "location": "Istanbul",
            "user_lat": 40.9904,
            "user_lng": 29.0255
        }
    """
    result = await ai_service.smart_search(
        query=request.query,
        location=request.location,
        user_lat=request.user_lat,
        user_lng=request.user_lng
    )
    return result


@router.post("/image-search")
async def image_search(request: ImageSearchRequest):
    """
    Görsel ile mekan arama
    
    Example:
        POST /api/recommendations/image-search
        {
            "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
            "location": "Istanbul"
        }
    """
    result = await ai_service.image_search(
        image_base64=request.image_base64,
        location=request.location
    )
    return result


@router.get("/ai-health")
async def ai_health():
    """AI servisi health check"""
    return await ai_service.health_check()
```

---

## 🧪 Testing Integration

### 1. Local Testing

#### Start Both Services

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: AI Service
cd ai-llm
uvicorn app:app --reload --port 8080
```

#### Test Connection

```bash
# Backend'den AI'ya istek
curl http://localhost:8000/api/recommendations/smart-search \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Beşiktaş yakınında kafe",
    "location": "Istanbul"
  }'
```

### 2. Production Testing

```bash
# Backend → AI integration test
curl https://asemos-backend.onrender.com/api/recommendations/smart-search \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Kadıköy yakınında sakin kafe",
    "location": "Istanbul"
  }'
```

---

## 🔒 Security & Best Practices

### 1. Timeout Handling

```python
# Uzun süren işlemler için timeout
async with httpx.AsyncClient(timeout=30.0) as client:
    response = await client.post(...)
```

### 2. Error Handling

```python
try:
    result = await ai_service.smart_search(...)
    return result
except HTTPException as e:
    # AI servisi down - fallback logic
    return {
        "error": "AI service unavailable",
        "fallback": True,
        "recommendations": []  # Fallback data
    }
```

### 3. Health Checks

```python
# Startup'ta AI servisini kontrol et
@app.on_event("startup")
async def startup_event():
    try:
        health = await ai_service.health_check()
        if health.get("status") == "ok":
            logger.info("✅ AI service connected")
        else:
            logger.warning("⚠️ AI service unhealthy")
    except:
        logger.error("❌ AI service unreachable")
```

### 4. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/smart-search")
@limiter.limit("10/minute")  # Max 10 requests/min
async def smart_search(request: SmartSearchRequest):
    ...
```

---

## 📊 Monitoring & Logging

### Request Logging

```python
import logging
import time

logger = logging.getLogger(__name__)


async def smart_search(request: SmartSearchRequest):
    start_time = time.time()
    
    logger.info(f"Smart search request: {request.query}")
    
    try:
        result = await ai_service.smart_search(...)
        
        elapsed = time.time() - start_time
        logger.info(
            f"Smart search completed in {elapsed:.2f}s, "
            f"found {result.get('found', 0)} results"
        )
        
        return result
    except Exception as e:
        logger.error(f"Smart search failed: {str(e)}")
        raise
```

### Performance Metrics

```python
from prometheus_client import Counter, Histogram

# Metrics
ai_requests_total = Counter(
    'ai_requests_total',
    'Total AI service requests',
    ['endpoint', 'status']
)

ai_request_duration = Histogram(
    'ai_request_duration_seconds',
    'AI service request duration'
)


@ai_request_duration.time()
async def smart_search(request: SmartSearchRequest):
    try:
        result = await ai_service.smart_search(...)
        ai_requests_total.labels('smart_search', 'success').inc()
        return result
    except:
        ai_requests_total.labels('smart_search', 'error').inc()
        raise
```

---

## 🚨 Troubleshooting

### Problem: "Connection refused"

**Cause**: AI servisi down veya URL yanlış

**Solution**:
```python
# Check AI_SERVICE_URL
print(f"AI Service URL: {os.getenv('AI_SERVICE_URL')}")

# Test health endpoint
curl https://asemos-ai.onrender.com/health
```

---

### Problem: "Timeout error"

**Cause**: AI servisi cold start (15+ sn)

**Solution**:
```python
# Increase timeout
async with httpx.AsyncClient(timeout=60.0) as client:
    ...
```

---

### Problem: "502 Bad Gateway"

**Cause**: Render.com free tier sleep

**Solution**:
- İlk istek yavaş (30 sn)
- Retry mechanism:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def smart_search_with_retry(query: str):
    return await ai_service.smart_search(query=query)
```

---

## 📱 Mobile App Integration

Mobile app backend URL'ini güncelle:

### React Native

```javascript
// apps/mobile/config.ts

export const API_CONFIG = {
  BACKEND_URL: 'https://asemos-backend.onrender.com',
  // AI service directly accessible (optional)
  AI_URL: 'https://asemos-ai.onrender.com',
  TIMEOUT: 30000
};
```

### API Calls

```javascript
// apps/mobile/services/recommendations.ts

import axios from 'axios';
import { API_CONFIG } from '../config';

export const getSmartRecommendations = async (query, location) => {
  const response = await axios.post(
    `${API_CONFIG.BACKEND_URL}/api/recommendations/smart-search`,
    {
      query,
      location,
      user_lat: userLocation.lat,
      user_lng: userLocation.lng
    },
    {
      timeout: API_CONFIG.TIMEOUT
    }
  );
  
  return response.data;
};
```

---

## ✅ Integration Checklist

Backend Setup:
- [ ] `AI_SERVICE_URL` environment variable eklendi
- [ ] httpx dependency eklendi (`pip install httpx`)
- [ ] AIService client class oluşturuldu
- [ ] Recommendation endpoints güncellendi
- [ ] Error handling eklendi
- [ ] Timeout handling eklendi
- [ ] Logging eklendi

Testing:
- [ ] Local test: Backend → AI connection OK
- [ ] Production test: Public URL'ler çalışıyor
- [ ] Health check endpoint test edildi
- [ ] Smart search endpoint test edildi
- [ ] Error handling test edildi (AI down scenario)

Mobile App:
- [ ] Backend URL günceldi
- [ ] API calls test edildi
- [ ] Loading states eklendi
- [ ] Error handling eklendi

Monitoring:
- [ ] Request logging aktif
- [ ] Performance metrics toplanıyor
- [ ] Error tracking kurulu

---

## 📚 Example: Full Implementation

Komple backend integration örneği için:

```python
# backend/main.py

from fastapi import FastAPI
from routes import recommendations

app = FastAPI()

# Router'ı ekle
app.include_router(recommendations.router)

# Startup event
@app.on_event("startup")
async def startup():
    from services.ai_service import ai_service
    health = await ai_service.health_check()
    print(f"AI Service: {health.get('status', 'unknown')}")
```

---

**Son Güncelleme**: 2026-05-22  
**Backend**: asemos-backend.onrender.com  
**AI Service**: asemos-ai.onrender.com
