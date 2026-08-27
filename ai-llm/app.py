"""AI service composition root and backward-compatible public facade."""

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import sys
import uuid
import pathlib as _pl
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

_ai_llm_root = os.path.dirname(os.path.abspath(__file__))
if _ai_llm_root not in sys.path:
    sys.path.insert(0, _ai_llm_root)
_env_path = _pl.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

from src.config import settings
from app_state import logger, runtime
from app_infrastructure import lifespan

_docs_enabled = settings.ENVIRONMENT != "production"

app = FastAPI(
    title="AI-LLM Demo Backend (FAZ 2)",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_correlation_middleware(request: Request, call_next):
    """
    Backend'deki RequestLoggingMiddleware'in ai-llm karşılığı — inbound
    X-Request-ID'yi (backend'den veya nginx'ten) kullanır, yoksa üretir,
    response'a echo eder. Uçtan uca korelasyon zinciri için gerekli.
    """
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

from app_router_core import router as app_router_core_router, get_info, get_stats, health, serve_ui
from app_router_search import router as app_router_search_router, log_to_backend_bg, smart_search_v2
from app_router_rag import router as app_router_rag_router, rag_search
from app_router_media import router as app_router_media_router, analyze_place_reviews, transcribe_audio
from app_router_admin import router as app_router_admin_router, admin_bulk_index_venues, admin_index_venue

app.include_router(app_router_core_router)
app.include_router(app_router_search_router)
app.include_router(app_router_rag_router)
app.include_router(app_router_media_router)
app.include_router(app_router_admin_router)
from app_language import _get_llm, build_review_analysis_text, detect_language_from_query, generate_llm_response, lang_name, localize_review_insights, localized, normalize_language, reason_label, resolve_response_language, translate_specialty_label
from app_infrastructure import _bootstrap_rag_index_sync, _count_places_in_json, _get_rag_pipeline, _rag_status_for_health, _resolve_rag_data_path, ensure_rag_ready, execute_query, get_db_connection, get_db_reviews, get_places_from_db, lifespan
from app_models import AnalyzeReviewRequest, ImageSearchRequest, IndexVenueRequest, PlaceData, SmartSearchRequest
from app_search import _build_rag_context, _fetch_rag_results, _is_complete_recommendation, _merge_recommendations, _normalize_place_name, _rag_oneri_to_recommendation, _sanitize_recommendations, _score_rag_recommendations, analyze_image_with_llama, calculate_distance, hybrid_score, is_place_open, parse_natural_query, rerank_places, strict_category_match
from app_review import _enrich_with_review_insights, generate_review_analysis_llm

model_manager = runtime.model_manager

def __getattr__(name: str):
    if name in {"cache_manager", "rag_pipeline", "rag_bootstrap_status", "rag_bootstrap_lock"}:
        return getattr(runtime, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
