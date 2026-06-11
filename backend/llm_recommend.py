import json
import math
import time
import hashlib
from typing import Any, Dict, List, Optional, Tuple

from config import get_settings
from llm_client import llm_generate, build_recommend_prompt

settings = get_settings()

DISTRICTS = [
    "adalar", "arnavutkoy", "atasehir", "avcilar", "bagcilar", "bahcelievler", "bakirkoy",
    "basaksehir", "bayrampasa", "besiktas", "beykoz", "beylikduzu", "beyoglu", "buyukcekmece",
    "catalca", "cekmekoy", "esenler", "esenyurt", "eyupsultan", "fatih", "gaziosmanpasa",
    "gungoren", "kadikoy", "kagithane", "kartal", "kucukcekmece", "maltepe", "pendik",
    "sancaktepe", "sariyer", "silivri", "sile", "sisli", "sultanbeyli", "sultangazi",
    "tuzla", "umraniye", "uskudar", "zeytinburnu"
]

def normalize_tr(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    replacements = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'ch': 'c', 'sh': 's', 'â': 'a', 'î': 'i', 'û': 'u'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

# ---------------------------------------------------------------------------
# In-memory cache  {key: (timestamp, response_dict)}
# ---------------------------------------------------------------------------
_cache: Dict[str, Tuple[float, dict]] = {}


def _cache_key(vibe: str, purpose: str, budget: str, lat: float, lng: float, category: str, query: str, user_id: Optional[int] = None) -> str:
    grid_lat = round(lat, 2)
    grid_lng = round(lng, 2)
    raw = f"{vibe}|{purpose}|{budget}|{grid_lat}|{grid_lng}|{category}|{query}|{user_id}"
    return hashlib.md5(raw.encode()).hexdigest()


def _cache_get(key: str) -> Optional[dict]:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < settings.RECOMMEND_CACHE_TTL:
            return data
        del _cache[key]
    return None


def _cache_set(key: str, data: dict):
    if len(_cache) > 500:
        oldest = min(_cache, key=lambda k: _cache[k][0])
        del _cache[oldest]
    _cache[key] = (time.time(), data)


# ---------------------------------------------------------------------------
# Haversine distance (metres)
# ---------------------------------------------------------------------------
def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Preference normalisation (TR → EN)
# ---------------------------------------------------------------------------
_VIBE_MAP = {
    "sessiz": "quiet", "sakin": "quiet", "quiet": "quiet",
    "canlı": "lively", "enerjik": "lively", "lively": "lively",
}
_PURPOSE_MAP = {
    "çalışma": "work", "work": "work", "iş": "work",
    "arkadaş": "friends", "friends": "friends", "arkadaşlar": "friends",
    "buluşma": "date", "date": "date", "randevu": "date",
}
_BUDGET_MAP = {
    "düşük": "low", "ucuz": "low", "low": "low",
    "orta": "mid", "mid": "mid", "medium": "mid",
    "yüksek": "high", "pahalı": "high", "high": "high",
}


def _norm(val: Optional[str], mapping: dict, default: str) -> str:
    if not val:
        return default
    return mapping.get(val.strip().lower(), default)


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------
def _split_features(features: Optional[str]) -> set:
    if not features:
        return set()
    return {f.strip().lower() for f in features.replace(",", " ").split() if f.strip()}


def _budget_from_price(price_range: Optional[int]) -> str:
    if price_range is None:
        return "mid"
    if price_range <= 1:
        return "low"
    if price_range <= 2:
        return "mid"
    return "high"


def _vibe_from_features(features: set, category: str) -> str:
    if "quiet" in features or "sessiz" in features:
        return "quiet"
    if "lively" in features or "canlı" in features:
        return "lively"
    if category in ("bar", "club", "gece kulübü"):
        return "lively"
    return "quiet"


def _purpose_from_features(features: set, category: str) -> str:
    if features & {"work", "wifi", "laptop_friendly", "çalışma"}:
        return "work"
    if features & {"friends", "music", "arkadaş", "müzik"}:
        return "friends"
    if features & {"date", "romantic", "romantik"}:
        return "date"
    if category in ("kafe", "cafe"):
        return "work"
    if category in ("bar", "pub"):
        return "friends"
    return "work"


# ---------------------------------------------------------------------------
# Core scoring  → returns (score, distance_m, tags)
# ---------------------------------------------------------------------------
def score_place(
    place,
    vibe: str,
    purpose: str,
    budget: str,
    query: str,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    explicit_district: Optional[str] = None,
    interaction_score: float = 0.0,
) -> Tuple[float, Optional[int], List[str]]:
    features = _split_features(getattr(place, "features", None))
    category = (getattr(place, "category", "") or "").lower()
    p_budget = _budget_from_price(getattr(place, "price_range", None))
    p_vibe = _vibe_from_features(features, category)
    p_purpose = _purpose_from_features(features, category)

    tags = [p_vibe, p_purpose, p_budget]
    if category:
        tags.append(category)

    score = 0.0

    # Preference match
    score += 2.0 if p_vibe == vibe else -0.5
    score += 2.0 if p_purpose == purpose else -0.5
    score += 2.0 if p_budget == budget else -0.5

    # Rating bonus
    rating = getattr(place, "average_rating", 0) or 0
    score += min(rating / 5.0 * 2, 2.0)

    # Query text match
    q = query.strip().lower()
    if q:
        p_name = normalize_tr(getattr(place, "name", "") or "")
        p_cat = normalize_tr(getattr(place, "category", "") or "")
        p_desc = normalize_tr(getattr(place, "description", "") or "")
        p_addr = normalize_tr(getattr(place, "address", "") or "")
        p_feat = " ".join(normalize_tr(f) for f in features)
        
        p_haystack = f"{p_name} {p_cat} {p_desc} {p_addr} {p_feat}"
        
        norm_q = normalize_tr(q)
        if norm_q in p_haystack:
            score += 10.0
        else:
            q_words = [w for w in norm_q.split() if len(w) > 2]
            STOP_WORDS = {"bana", "bir", "icin", "en", "uygun", "mekan", "oner", "oneri", "onerir", "misin", "musun", "miyim", "yiyecek", "icilecek", "gidecek", "bulunan", "yeri"}
            keywords = [w for w in q_words if w not in STOP_WORDS]
            
            for word in keywords:
                if word in DISTRICTS:
                    if word in p_addr or word in p_name:
                        score += 15.0  # Massive bonus for requested district
                elif word in p_cat or word in p_name:
                    score += 8.0
                elif word in p_desc or word in p_feat or word in p_addr:
                    score += 4.0

        # Special query matches (e.g., burger/hamburger)
        if ("burger" in norm_q or "hamburger" in norm_q) and ("burger" in p_name or "burger" in p_cat or "burger" in p_feat or "hamburger" in p_name or "hamburger" in p_cat or "hamburger" in p_feat):
            score += 10.0

    # Distance
    distance_m: Optional[int] = None
    p_lat = getattr(place, "latitude", None)
    p_lng = getattr(place, "longitude", None)
    if user_lat and user_lng and p_lat and p_lng:
        dist = haversine(user_lat, user_lng, p_lat, p_lng)
        distance_m = int(dist)
        if dist < 500:
            score += 2.0
        elif dist < 1500:
            score += 1.0
        elif dist < 3000:
            score += 0.5

    # Interaction history bonus
    if interaction_score > 0:
        score += min(interaction_score * 0.5, 5.0)

    return score, distance_m, tags


# ---------------------------------------------------------------------------
# LLM JSON parser
# ---------------------------------------------------------------------------
def _safe_json(text: str) -> dict:
    text = (text or "").strip()
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except Exception:
            pass
    return {}


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def recommend_pipeline(
    places: list,
    query: str,
    vibe: str,
    purpose: str,
    budget: str,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    radius_m: int = 3000,
    category: Optional[str] = None,
    selected_district: Optional[str] = None,
    db: Any = None,
    user_id: Optional[int] = None,
) -> dict:
    """
    Full recommend pipeline:
    1) Filter by distance (or explicit district matching)
    2) Filter by category (if provided)
    3) Score all candidates
    4) Pick top 30, send top to LLM
    5) Return merged result

    Returns: {"items": [...], "summary": "...", "cached": bool}
    """

    vibe = _norm(vibe, _VIBE_MAP, "quiet")
    purpose = _norm(purpose, _PURPOSE_MAP, "work")
    budget = _norm(budget, _BUDGET_MAP, "mid")
    cat_filter = (category or "").strip().lower()
    if cat_filter in ("cafe", "café", "kafe"):
        cat_filter = "kafe"
    elif cat_filter in ("restaurant", "restoran"):
        cat_filter = "restoran"
    elif cat_filter in ("bar", "pub"):
        cat_filter = "bar"

    # Detect explicit district in query (e.g. "Beşiktaş'ta")
    norm_query = normalize_tr(query)
    explicit_district = None
    for d in DISTRICTS:
        if d in norm_query:
            explicit_district = d
            break

    # Smart priority: query'deki ilçe > dropdown ilçe > GPS mesafe
    # Eğer kullanıcı mesajında ilçe belirtmemişse, dropdown seçimini kullan
    effective_district = explicit_district
    if not effective_district and selected_district:
        effective_district = normalize_tr(selected_district)

    # --- Cache check ---
    c_lat = user_lat or 41.0082
    c_lng = user_lng or 28.9784
    ck = _cache_key(vibe, purpose, budget, c_lat, c_lng, cat_filter, query + (effective_district or ""), user_id)
    cached = _cache_get(ck)
    if cached:
        cached["cached"] = True
        return cached

    # Batch fetch place interactions for this user and places
    interactions_map = {}
    if db and user_id and places:
        try:
            import models
            place_ids = [p.id for p in places]
            interactions = db.query(models.PlaceInteraction.place_id, models.PlaceInteraction.score).filter(
                models.PlaceInteraction.user_id == user_id,
                models.PlaceInteraction.place_id.in_(place_ids)
            ).all()
            interactions_map = {item.place_id: item.score for item in interactions}
        except Exception as e:
            pass

    # --- 1. Distance & District filter ---
    filtered = []
    for p in places:
        p_lat = getattr(p, "latitude", None)
        p_lng = getattr(p, "longitude", None)
        
        # If district is determined (from query OR dropdown), filter by district
        if effective_district:
            p_addr = normalize_tr(getattr(p, "address", "") or "")
            p_name = normalize_tr(getattr(p, "name", "") or "")
            if effective_district not in p_addr and effective_district not in p_name:
                continue
        # Otherwise filter by distance from user coordinates
        elif user_lat and user_lng and p_lat and p_lng:
            dist = haversine(user_lat, user_lng, p_lat, p_lng)
            if dist > radius_m:
                continue
                
        if cat_filter:
            p_cat = (getattr(p, "category", "") or "").lower()
            if cat_filter not in p_cat and p_cat not in cat_filter:
                continue
        filtered.append(p)

    # Fallback if district filter yielded too few results
    if effective_district and len(filtered) < 3:
        filtered = []
        for p in places:
            p_lat = getattr(p, "latitude", None)
            p_lng = getattr(p, "longitude", None)
            if user_lat and user_lng and p_lat and p_lng:
                dist = haversine(user_lat, user_lng, p_lat, p_lng)
                if dist > 15000:  # Relax distance up to 15km
                    continue
            if cat_filter:
                p_cat = (getattr(p, "category", "") or "").lower()
                if cat_filter not in p_cat and p_cat not in cat_filter:
                    continue
            filtered.append(p)

    # Auto-expand radius if too few results (only if not searching by district)
    if not effective_district and len(filtered) < 5 and user_lat and user_lng:
        for mult in [2, 4]:
            expanded = []
            expanded_radius = radius_m * mult
            for p in places:
                p_lat = getattr(p, "latitude", None)
                p_lng = getattr(p, "longitude", None)
                if p_lat and p_lng:
                    dist = haversine(user_lat, user_lng, p_lat, p_lng)
                    if dist > expanded_radius:
                        continue
                if cat_filter:
                    p_cat = (getattr(p, "category", "") or "").lower()
                    if cat_filter not in p_cat and p_cat not in cat_filter:
                        continue
                expanded.append(p)
            if len(expanded) >= 5:
                filtered = expanded
                break

    if not filtered:
        filtered = places

    # --- 2. Score ---
    scored = []
    for p in filtered:
        interaction_score = interactions_map.get(p.id, 0.0)
        sc, dist, tags = score_place(
            p, vibe, purpose, budget, query, user_lat, user_lng,
            explicit_district, interaction_score=interaction_score
        )
        scored.append((sc, dist, tags, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_candidates = scored[:30]

    # --- 3. Build scoring-based items (fallback) ---
    def _make_item(sc, dist, tags, p, explanation=None):
        review_count = getattr(p, "review_count", None) or getattr(p, "user_ratings_total", None)
        return {
            "id": p.id,
            "name": p.name,
            "category": getattr(p, "category", None),
            "distance_m": dist,
            "score": round(sc, 1),
            "photo_url": getattr(p, "photo_url", None),
            "explanation": explanation,
            "tags": tags,
            "opening_time": getattr(p, "opening_time", None),
            "closing_time": getattr(p, "closing_time", None),
            "average_rating": getattr(p, "average_rating", None),
            "review_count": review_count,
            "price_range": getattr(p, "price_range", None),
            "address": getattr(p, "address", None),
        }

    fallback_items = [_make_item(sc, dist, tags, p) for sc, dist, tags, p in top_candidates[:10]]
    fallback_summary = "Tercihlerine göre en uygun mekanları puanlayıp sıraladım."

    # --- 4. LLM rerank (if enabled) ---
    if not settings.LLM_ENABLED:
        result = {"items": fallback_items, "summary": fallback_summary, "cached": False}
        _cache_set(ck, result)
        return result

    # Build candidate text for LLM
    cand_lines = []
    price_symbols = {1: "₺", 2: "₺₺", 3: "₺₺₺", 4: "₺₺₺₺"}
    for sc, dist, tags, p in top_candidates[:15]:
        pr = getattr(p, "price_range", None)
        price_str = price_symbols.get(pr, "?")
        rating = getattr(p, "average_rating", 0) or 0
        dist_str = f"{dist}m" if dist else "?"
        feat = getattr(p, "features", "") or ""
        cand_lines.append(
            f"- id:{p.id} | {p.name} | {getattr(p, 'category', '?')} | {dist_str} | ★{rating:.1f} | {price_str} | {feat[:60]}"
        )

    loc_line = ""
    if user_lat and user_lng:
        loc_line = f"Konum: {user_lat:.4f},{user_lng:.4f} (yarıçap: {radius_m}m)"

    prompt = build_recommend_prompt(
        query=query or "mekan öner",
        vibe=vibe,
        purpose=purpose,
        budget=budget,
        candidates_text="\n".join(cand_lines),
        location_line=loc_line,
    )

    try:
        raw = llm_generate(prompt)
        llm_data = _safe_json(raw)
    except Exception:
        llm_data = {}

    ranked_ids = llm_data.get("ranked_ids", [])
    explanations = llm_data.get("explanations", {})
    summary = (llm_data.get("summary") or fallback_summary).strip()

    if not ranked_ids:
        result = {"items": fallback_items, "summary": summary or fallback_summary, "cached": False}
        _cache_set(ck, result)
        return result

    # --- 5. Merge LLM output with scored items ---
    id_to_data = {}
    for sc, dist, tags, p in top_candidates:
        id_to_data[p.id] = (sc, dist, tags, p)

    final_items = []
    for rid in ranked_ids:
        rid_int = int(rid) if str(rid).isdigit() else None
        if rid_int and rid_int in id_to_data:
            sc, dist, tags, p = id_to_data.pop(rid_int)
            expl = explanations.get(str(rid_int)) or explanations.get(str(rid))
            final_items.append(_make_item(sc, dist, tags, p, explanation=expl))

    # Add remaining scored items LLM missed
    for pid, (sc, dist, tags, p) in list(id_to_data.items()):
        if len(final_items) >= 10:
            break
        final_items.append(_make_item(sc, dist, tags, p))

    result = {"items": final_items[:10], "summary": summary, "cached": False}
    _cache_set(ck, result)
    return result
