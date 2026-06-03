"""SerpAPI Google Maps reviews — fetch up to 50, cache per data_id."""

from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

SERPAPI_BASE = "https://serpapi.com/search.json"
_CACHE: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}
_CACHE_TTL_SEC = 3600
_MAX_FETCH = 50


def _parse_review(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    text = (raw.get("snippet") or raw.get("extract") or "").strip()
    if not text:
        return None

    user = raw.get("user") or {}
    author = (user.get("name") or user.get("display_name") or "Google kullanıcısı").strip()
    thumbnail = user.get("thumbnail") or user.get("image")

    rating = raw.get("rating")
    if rating is None:
        rating = 0
    try:
        rating = float(rating)
    except (TypeError, ValueError):
        rating = 0.0

    relative_time = (
        raw.get("date")
        or raw.get("iso_date_of_last_edit")
        or raw.get("iso_date")
        or ""
    )
    if isinstance(relative_time, str):
        relative_time = relative_time.strip()
    else:
        relative_time = str(relative_time) if relative_time else ""

    return {
        "author_name": author,
        "rating": rating,
        "text": text,
        "relative_time": relative_time or None,
        "avatar_url": thumbnail if isinstance(thumbnail, str) else None,
    }


def fetch_google_reviews(
    data_id: str,
    *,
    max_reviews: int = _MAX_FETCH,
    api_key: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch structured Google Maps reviews via SerpAPI (newest first)."""
    data_id = (data_id or "").strip()
    if not data_id:
        return []

    key = api_key or os.getenv("SERPAPI_KEY", "").strip()
    if not key:
        return []

    now = time.time()
    cached = _CACHE.get(data_id)
    if cached and (now - cached[0]) < _CACHE_TTL_SEC:
        return cached[1][:max_reviews]

    reviews: List[Dict[str, Any]] = []
    next_page: Optional[str] = None
    max_pages = (max_reviews // 10) + 1
    page_count = 0

    while page_count < max_pages and len(reviews) < max_reviews:
        params: Dict[str, Any] = {
            "engine": "google_maps_reviews",
            "data_id": data_id,
            "sort_by": "newestFirst",
            "hl": "tr",
            "gl": "tr",
            "api_key": key,
        }
        if next_page:
            params["next_page_token"] = next_page

        try:
            res = requests.get(SERPAPI_BASE, params=params, timeout=20)
            res.raise_for_status()
            data = res.json()
        except Exception:
            break

        for raw in data.get("reviews") or []:
            parsed = _parse_review(raw)
            if parsed:
                reviews.append(parsed)
            if len(reviews) >= max_reviews:
                break

        pagination = data.get("serpapi_pagination") or {}
        next_page = pagination.get("next_page_token")
        if not next_page:
            break
        page_count += 1

    reviews = reviews[:max_reviews]
    _CACHE[data_id] = (now, reviews)
    return reviews
