"""Shared mutable runtime state and manager classes."""

import os
import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, UploadFile, File, Form  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import math
import asyncio
import hashlib
import json
import re
import httpx  # type: ignore[import]
from datetime import datetime
import redis  # type: ignore[import]
import sqlite3
from dotenv import load_dotenv  # type: ignore[import]
import pathlib as _pl
import logging
from review_analyzer import fast_extract_insights  # type: ignore[import]
import sys, os as _os
from src.models.llm.llm_wrapper import LayeredLLMWrapper  # type: ignore[import]
from src.config import settings  # type: ignore[import]
from scripts.prepare_vector_db import (  # type: ignore[import]
    get_mekanlar_from_json,
    create_embedding_text,
)
from qdrant_client.models import PointStruct  # type: ignore[import]
from src.rag.pipeline import RAGPipeline  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

class RedisCacheManager:
    """Redis cache manager (TTL destekli)"""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        self.redis_url = redis_url
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
        self.client: redis.Redis = redis.Redis.from_url(redis_url, decode_responses=True, max_connections=5)
        self.is_connected = False
        self._connect()

    def _connect(self) -> None:
        try:
            self.client.ping()
            self.is_connected = True
        except Exception as exc:
            self.is_connected = False
            raise RuntimeError(f"Redis baglantisi kurulamadi: {exc}")

    def generate_key(self, query: str, location: str, **kwargs) -> str:
        """Sorgu parametrelerine gore unique cache key olustur"""
        key_str = f"{query}|{location}|{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Dict]:
        """Redis'ten veri al"""
        try:
            raw = self.client.get(key)
            if raw is None:
                self.misses += 1
                return None

            self.hits += 1
            return json.loads(raw)
        except Exception:
            self.misses += 1
            return None

    def set(self, key: str, data: Dict, ex: Optional[int] = None) -> None:
        """Redis'e veri yaz (TTL ile) - hata olursa sessizce atla"""
        try:
            payload = json.dumps(data, ensure_ascii=False)
            ttl = ex if ex is not None else self.ttl
            self.client.setex(key, ttl, payload)
        except Exception as e:
            print(f"[Cache] set hata (atlanıyor): {e}")

    def clear(self) -> None:
        """Redis DB temizle"""
        try:
            self.client.flushdb()
        except Exception:
            pass

    def get_stats(self) -> Dict:
        """Cache istatistikleri"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        try:
            total_items = self.client.dbsize()
        except Exception:
            total_items = 0

        return {
            "backend": "redis",
            "redis_url": self.redis_url,
            "total_items": total_items,
            "ttl_seconds": self.ttl,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "last_updated": datetime.now().isoformat()
        }


class ModelManager:
    """Model preloading ve management"""
    
    def __init__(self):
        self.embedding_model = None
        self.llm_model = None
        self.tokenizer = None
        self.device: Optional[str] = None
        self.is_loaded = False
    
    async def preload_models(self) -> Dict:
        """Startup'ta modelleri yükle"""
        try:
            import torch  # type: ignore[import]
            
            # Device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[Model] Device: {self.device}")
            
            # Embedding model (Singleton Wrapper ile yükle)
            print("[Model] Embedding model yükleniyor...")
            from src.models.embeddings.embedding_model import EmbeddingModel
            wrapper = EmbeddingModel()
            self.embedding_model = wrapper.model
            
            self.is_loaded = True
            print("[Model] OK Modeller yüklendi!")
            
            return {
                "status": "success",
                "embedding_model": "loaded",
                "device": self.device,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"[Model] Preload hatası: {e}")
            return {"status": "error", "error": str(e)}

    def analyze_review_sentiment(self, reviews: Union[str, List[str]]) -> float:
        """Kısa yorum veya yorum listesi üzerinden kabaca pozitif/negatif duygu analizi skorlaması (-0.2 ile +0.2)"""
        if not reviews or not self.embedding_model:
            return 0.0
            
        try:
            import torch  # type: ignore[import]
            positive_refs = ["Harika bir mekan", "Çok lezzetli", "Kesinlikle tavsiye ederim", "Çok güzel", "Mükemmel", "Bayıldım", "Güler yüzlü", "good", "great", "excellent", "amazing", "delicious", "perfect"]
            negative_refs = ["Çok kötü", "Berbat", "Berbat bir yer", "Tavsiye etmem", "Pahalı", "Kötü hizmet", "Lezzetsiz", "bad", "terrible", "worst", "awful", "expensive"]
            
            # Eğer tek bir string geldiyse liste yap
            if isinstance(reviews, str):
                reviews = [reviews]
                
            # Embeddings hesapla (Batch Inference - Hızlı çalışır)
            review_embs = self.embedding_model.encode(reviews, convert_to_tensor=True)  # type: ignore[union-attr]
            pos_embs = self.embedding_model.encode(positive_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            neg_embs = self.embedding_model.encode(negative_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            
            from torch.nn.functional import cosine_similarity  # type: ignore[import]
            total_bonus = 0.0
            
            # Her bir yorumu analiz edip ortalamasını alıyoruz
            for review_emb in review_embs:
                pos_scores = cosine_similarity(review_emb.unsqueeze(0), pos_embs)
                neg_scores = cosine_similarity(review_emb.unsqueeze(0), neg_embs)
                
                max_pos = pos_scores.max().item()
                max_neg = neg_scores.max().item()
                
                sentiment_diff = max_pos - max_neg
                # Eskiden 0.4 ile çarpıp +-0.20'ye sınırlandırıyorduk.
                # Kullanıcı etkinin artmasını istediği için çarpanı 0.8 yapıp sınırı +-0.40 yapıyoruz.
                bonus = min(max(sentiment_diff * 0.8, -0.40), 0.40)
                total_bonus += bonus
                
            avg_bonus = total_bonus / len(reviews)
            print(f"[YorumAnalizi] {len(reviews)} adet yorum Analizi Ortalama Bonus: {avg_bonus:.3f}")
            return avg_bonus
            
        except Exception as e:
            print(f"[Model] Yorum analizi başarısız: {e}")
            return 0.0

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_ttl = int(os.getenv("REDIS_TTL_SECONDS", "3600"))

class RuntimeState:
    def __init__(self) -> None:
        self.cache_manager: Optional[RedisCacheManager] = None
        self.model_manager = ModelManager()
        self.rag_pipeline: Optional[RAGPipeline] = None
        self.rag_bootstrap_lock = asyncio.Lock()
        self.rag_bootstrap_status: Dict[str, Union[str, int, bool, None]] = {
            "ready": False, "indexed_count": 0, "source_count": 0,
            "storage_mode": None, "data_path": None, "last_error": None,
        }

runtime = RuntimeState()
logger = logging.getLogger("app")
