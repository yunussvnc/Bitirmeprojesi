"""
Shared SerpAPI / loaded_places.json → Postgres field normalization.
Supports both English (collect_400_places) and Turkish (load_data) keys.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

ISTANBUL_DISTRICTS = [
    "Kadikoy", "Kadıköy", "Besiktas", "Beşiktaş", "Beyoglu", "Beyoğlu",
    "Sisli", "Şişli", "Fatih", "Uskudar", "Üsküdar", "Bakirkoy", "Bakırköy",
    "Maltepe", "Kartal", "Pendik", "Umraniye", "Ümraniye", "Sariyer", "Sarıyer",
    "Kagithane", "Kağıthane", "Eyup", "Eyüp", "Atasehir", "Ataşehir",
    "Karakoy", "Karaköy", "Taksim", "Galata", "Ortakoy", "Ortaköy", "Bebek",
    "Etiler", "Nisantasi", "Nişantaşı", "Cihangir", "Balat", "Fener", "Moda",
    "Kuzguncuk", "Eminonu", "Eminönü", "Sultanahmet", "Bogazici", "Boğaziçi",
]

KATEGORI_FIYAT = {
    "kafe": 1, "kahve": 1, "kahvalti": 1, "kahvaltı": 1, "fastfood": 1,
    "fast food": 1, "sokak": 1, "restoran": 2, "bar": 2, "pub": 2,
    "canli": 2, "canlı": 2, "deniz": 3, "balik": 3, "balık": 3,
    "steakhouse": 3, "japon": 3, "fine dining": 4, "roof": 3, "rooftop": 3,
    "lüks": 4, "luks": 4,
}

KATEGORI_OZELLIKLER = {
    "kafe": ["wifi", "oturma_alani", "icecek"],
    "kahve": ["wifi", "oturma_alani", "icecek"],
    "bar": ["alkol", "canli_muzik", "gece_hayati"],
    "pub": ["alkol", "canli_muzik", "gece_hayati"],
    "restoran": ["yemek", "rezervasyon", "aile_dostu"],
    "kahvalti": ["sabah_acik", "kahvalti", "aile_dostu"],
    "kahvaltı": ["sabah_acik", "kahvalti", "aile_dostu"],
    "default": ["mekan"],
}


def _first(*values: Any) -> Any:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        return value
    return None


def normalize_loaded_place(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Map SerpAPI / legacy Turkish keys to a canonical English record."""
    name = str(_first(raw.get("name"), raw.get("ad"), raw.get("title")) or "").strip()
    address = str(_first(raw.get("address"), raw.get("adres")) or "").strip()
    category = str(_first(raw.get("category"), raw.get("kategori"), raw.get("type")) or "Diğer").strip()
    description = str(
        _first(raw.get("description"), raw.get("aciklama"), raw.get("açıklama")) or ""
    ).strip()
    user_review = str(_first(raw.get("user_review"), raw.get("kullanici_yorumu")) or "").strip()

    rating = _first(raw.get("rating"), raw.get("puan"), raw.get("average_rating"))
    review_count = _first(
        raw.get("review_count"),
        raw.get("yorum_sayisi"),
        raw.get("reviews"),
        raw.get("user_ratings_total"),
    )
    price_level = _first(raw.get("price_level"), raw.get("price_range"))
    photo_url = _first(raw.get("photo_url"), raw.get("foto"), raw.get("thumbnail"))
    data_id = str(_first(raw.get("data_id"), raw.get("vector_id"), raw.get("id")) or "").strip()

    lat = _first(raw.get("latitude"), raw.get("enlem"))
    lng = _first(raw.get("longitude"), raw.get("boylam"))

    hours_raw = _first(
        raw.get("hours"),
        raw.get("opening_hours"),
        raw.get("open_state"),
        raw.get("operating_hours"),
    )

    return {
        "name": name,
        "address": address,
        "category": category,
        "description": description,
        "user_review": user_review,
        "rating": float(rating or 0.0),
        "review_count": int(review_count or 0),
        "price_level": price_level,
        "photo_url": photo_url,
        "data_id": data_id,
        "latitude": float(lat or 0.0),
        "longitude": float(lng or 0.0),
        "hours_raw": hours_raw,
    }


def parse_city(address: str) -> str:
    if not address:
        return "Istanbul"
    upper = address.upper()
    for district in ISTANBUL_DISTRICTS:
        if district.upper() in upper:
            return district
    if "ISTANBUL" in upper or "İSTANBUL" in upper:
        return "Istanbul"
    return "Istanbul"


def normalize_price_range(
    price_level: Any,
    category: str = "",
    rating: float = 0.0,
) -> int:
    if isinstance(price_level, (int, float)) and not isinstance(price_level, bool):
        value = int(price_level)
        # Google/SerpAPI $ count is typically 1-4; larger values are noisy metadata.
        if 1 <= value <= 4:
            return value

    cat = (category or "").lower()
    for key, val in KATEGORI_FIYAT.items():
        if key in cat:
            return val
    if rating >= 4.7:
        return 3
    if rating >= 4.3:
        return 2
    return 1


def build_description(record: Dict[str, Any]) -> str:
    base = (record.get("description") or "").strip()
    review = (record.get("user_review") or "").strip()
    if base and review:
        return f"{base}\n\nÖne çıkan yorum: {review}"
    return base or review or f"{record.get('name', 'Mekan')} - {record.get('address', '')}"


def get_features(record: Dict[str, Any]) -> List[str]:
    category = (record.get("category") or "").lower()
    description = (
        (record.get("description") or "")
        + " "
        + (record.get("user_review") or "")
    ).lower()
    features: List[str] = []

    for key, vals in KATEGORI_OZELLIKLER.items():
        if key != "default" and key in category:
            features.extend(vals)
            break
    else:
        features.extend(KATEGORI_OZELLIKLER["default"])

    keyword_map = {
        "wifi": "wifi",
        "wi-fi": "wifi",
        "manzara": "manzarali",
        "teras": "teras",
        "bahce": "bahce",
        "bahçe": "bahce",
        "rezervasyon": "rezervasyon",
        "vegan": "vegan",
        "canli muzik": "canli_muzik",
        "canlı müzik": "canli_muzik",
        "deniz": "deniz_manzarasi",
        "bogaz": "bogaz_manzarasi",
        "boğaz": "bogaz_manzarasi",
        "romantik": "romantik",
    }
    for keyword, tag in keyword_map.items():
        if keyword in description and tag not in features:
            features.append(tag)

    rating = float(record.get("rating") or 0)
    if rating >= 4.7:
        features.append("cok_populer")
    elif rating >= 4.4:
        features.append("populer")

    return list(dict.fromkeys(features))


def _format_hhmm(hour: int, minute: int) -> str:
    return f"{hour:02d}:{minute:02d}"


def parse_opening_hours(
    record: Dict[str, Any],
) -> Tuple[str, str, Optional[str]]:
    """
    Parse SerpAPI hours when present; otherwise use category defaults.
    Returns (opening_time, closing_time, opening_hours_json_text_or_none).
    """
    hours_raw = record.get("hours_raw")
    category = (record.get("category") or "").lower()

    if hours_raw:
        hours_str = str(hours_raw)
        match = re.search(
            r"(\d{1,2})[:\.]?(\d{2})\s*[-–]\s*(\d{1,2})[:\.]?(\d{2})",
            hours_str,
            re.IGNORECASE,
        )
        if match:
            open_h, open_m = int(match.group(1)), int(match.group(2))
            close_h, close_m = int(match.group(3)), int(match.group(4))
            return (
                _format_hhmm(open_h, open_m),
                _format_hhmm(close_h, close_m),
                json.dumps({"source": "serpapi", "raw": hours_str}, ensure_ascii=False),
            )

    if any(x in category for x in ["bar", "pub", "canli", "canlı", "gece", "kulup", "kulüp"]):
        return "18:00", "02:00", None
    if any(x in category for x in ["kahvalti", "kahvaltı", "kahve", "kafe"]):
        return "07:00", "22:00", None
    if any(x in category for x in ["restoran", "deniz", "balik", "balık"]):
        return "11:00", "23:00", None
    return "09:00", "22:00", None


def place_to_postgres_row(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    record = normalize_loaded_place(raw)
    if not record["name"]:
        return None

    opening_time, closing_time, opening_hours_json = parse_opening_hours(record)
    price_range = normalize_price_range(
        record.get("price_level"),
        record.get("category", ""),
        record.get("rating", 0.0),
    )

    vector_id = record["data_id"] or None
    return {
        "name": record["name"],
        "description": build_description(record),
        "category": record["category"],
        "address": record["address"] or "İstanbul",
        "city": parse_city(record["address"]),
        "latitude": record["latitude"],
        "longitude": record["longitude"],
        "average_rating": record["rating"],
        "user_ratings_total": record["review_count"],
        "features": json.dumps(get_features(record), ensure_ascii=False),
        "photo_url": record.get("photo_url"),
        "price_range": price_range,
        "opening_time": opening_time,
        "closing_time": closing_time,
        "opening_hours_json": opening_hours_json,
        "vector_id": vector_id,
        "google_place_id": vector_id,
    }
