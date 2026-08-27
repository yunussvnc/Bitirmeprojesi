"""Cohesive module extracted from the original AI FastAPI application."""

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

class IndexVenueRequest(BaseModel):
    venue_id: int


class PlaceData(BaseModel):
    """Mekan verisi modeli"""
    name: str
    address: str
    latitude: float
    longitude: float
    rating: float = 0.0
    price_level: int = 2
    category: str = "Kafe"
    description: str = ""
    photo_url: Optional[str] = None
    review_count: int = 0
    user_review: Optional[str] = None


class ImageSearchRequest(BaseModel):
    """Görselden mekan arama isteği"""
    image_base64: str          # base64 encoded image (data:image/jpeg;base64,... veya salt base64)
    mime_type: str = "image/jpeg"
    location: str = "Istanbul"
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    limit: int = 5
    max_distance_km: float = 10.0
    language: Optional[str] = None
    locale: Optional[str] = None


class SmartSearchRequest(BaseModel):
    """Akıllı arama isteği"""
    query: str
    location: str = "Istanbul"
    limit: int = 10
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    max_distance_km: float = 10.0
    analyze_reviews: bool = False  # Yorum analizi (varsayılan kapalı — daha hızlı yanıt)
    language: Optional[str] = None
    locale: Optional[str] = None
    user_id: Optional[int] = None


class AnalyzeReviewRequest(BaseModel):
    """İsteğe bağlı yorum çekme ve analiz isteği"""
    data_id: str
    place_name: Optional[str] = None
    language: Optional[str] = None
    locale: Optional[str] = None
