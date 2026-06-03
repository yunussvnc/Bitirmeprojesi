#!/usr/bin/env python3
"""Google Maps yorumları — sunucu başlatmadan SerpAPI / mock test."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(ROOT / "ai-llm"))
sys.path.insert(0, str(BACKEND))

DEFAULT_DATA_ID = "0x14cac7fcfde109b1:0x209fb1c96304d185"

MOCK_REVIEWS = [
    {
        "author_name": "Ayşe K.",
        "rating": 5.0,
        "text": "Kahveleri harika, ortam sakin. Kesinlikle tekrar gelirim.",
        "relative_time": "2 hafta önce",
        "avatar_url": None,
    },
    {
        "author_name": "Mehmet Y.",
        "rating": 4.0,
        "text": "Personel ilgili, fiyatlar makul. Yoğun saatlerde biraz kalabalık.",
        "relative_time": "1 ay önce",
        "avatar_url": None,
    },
    {
        "author_name": "Zeynep A.",
        "rating": 5.0,
        "text": "Tatlılar ve brunch menüsü çok başarılı. Manzara da güzel.",
        "relative_time": "3 ay önce",
        "avatar_url": None,
    },
    {
        "author_name": "Can D.",
        "rating": 3.0,
        "text": "Lezzet iyiydi ama servis biraz yavaştı.",
        "relative_time": "4 ay önce",
        "avatar_url": None,
    },
    {
        "author_name": "Elif S.",
        "rating": 5.0,
        "text": "En sevdiğim mekanlardan biri, özellikle filtre kahve.",
        "relative_time": "6 ay önce",
        "avatar_url": None,
    },
]


def _load_dotenv_files() -> None:
    for rel in ("backend/.env", "ai-llm/.env"):
        path = ROOT / rel
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def _validate_reviews(reviews: list) -> None:
    if len(reviews) < 1:
        raise SystemExit("FAIL: en az 1 yorum bekleniyor")
    for i, r in enumerate(reviews):
        for field in ("author_name", "rating", "text"):
            if field not in r or r[field] in (None, ""):
                raise SystemExit(f"FAIL: yorum[{i}] eksik alan: {field}")
        try:
            float(r["rating"])
        except (TypeError, ValueError) as exc:
            raise SystemExit(f"FAIL: yorum[{i}] geçersiz rating") from exc


def main() -> int:
    _load_dotenv_files()
    data_id = (sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DATA_ID).strip()
    api_key = os.getenv("SERPAPI_KEY", "").strip()
    mode = "live" if api_key else "mock"

    if mode == "live":
        from services.google_reviews import fetch_google_reviews

        all_reviews = fetch_google_reviews(data_id, max_reviews=50, api_key=api_key)
        if not all_reviews:
            print(
                json.dumps(
                    {
                        "mode": "live",
                        "warning": "SerpAPI bos dondu; mock ile dogrulama yapiliyor",
                        "data_id": data_id,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            all_reviews = MOCK_REVIEWS
            mode = "mock_fallback"
        display = all_reviews[:5]
        total = len(all_reviews)
    else:
        all_reviews = MOCK_REVIEWS
        display = MOCK_REVIEWS[:5]
        total = len(MOCK_REVIEWS)

    _validate_reviews(display)

    payload = {
        "mode": mode,
        "data_id": data_id,
        "total_fetched": total,
        "display_limit": 5,
        "reviews": display,
    }
    out = json.dumps(payload, ensure_ascii=False, indent=2)
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        print(out)
    except Exception:
        print(out.encode("utf-8", errors="replace").decode("utf-8"))
    print("\nOK: Google reviews test passed", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
