import json
import urllib.request
import urllib.error
from config import get_settings

settings = get_settings()

RECOMMEND_PROMPT = """Sen bir mekan öneri asistanısın. İstanbul'daki mekanları iyi tanıyorsun.
Kullanıcının tercihlerine göre en uygun mekanları seç, sırala ve her biri için kısa kişisel açıklama üret.

Kullanıcı: "{query}"
Tercihler: vibe={vibe}, amaç={purpose}, bütçe={budget}
{location_line}

Aday mekanlar:
{candidates}

KURALLAR:
- En uygun 5-10 mekanı sırala (en iyi ilk)
- Her mekan için 1-2 cümlelik TÜRKÇE açıklama yaz (neden önerildi, kullanıcının tercihiyle eşleşme)
- Genel 1-2 cümlelik özet paragraf yaz
- SADECE JSON formatında cevap ver, başka metin ekleme

JSON formatı:
{{
  "ranked_ids": [12, 35, ...],
  "explanations": {{
    "12": "Sessiz bir çalışma ortamı arıyorsun ve burası tam sana göre...",
    "35": "Arkadaşlarla buluşmak istersen bu da iyi bir alternatif..."
  }},
  "summary": "Bugün senin için en uygun plan..."
}}"""


def _http_post_json(url: str, payload: dict, headers: dict, timeout: int = 15) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return {}


def ollama_generate(prompt: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    base_url = settings.OLLAMA_BASE_URL.rstrip("/")
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": temperature},
    }
    data = _http_post_json(
        f"{base_url}/api/generate",
        payload,
        {"Content-Type": "application/json"},
        timeout=45,
    )
    return (data.get("response") or "").strip()


def openai_generate(prompt: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    if not settings.OPENAI_API_KEY:
        return ""
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    data = _http_post_json(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        },
        timeout=45,
    )
    choices = data.get("choices", [])
    if choices:
        return (choices[0].get("message", {}).get("content") or "").strip()
    return ""


def groq_generate(prompt: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    if not settings.GROQ_API_KEY:
        return ""
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    data = _http_post_json(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        },
        timeout=45,
    )
    choices = data.get("choices", [])
    if choices:
        return (choices[0].get("message", {}).get("content") or "").strip()
    return ""


def llm_generate(prompt: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    if not settings.LLM_ENABLED:
        return ""
    provider = settings.LLM_PROVIDER.lower()
    if provider == "openai":
        return openai_generate(prompt, max_tokens=max_tokens, temperature=temperature)
    if provider == "groq":
        return groq_generate(prompt, max_tokens=max_tokens, temperature=temperature)
    return ollama_generate(prompt, max_tokens=max_tokens, temperature=temperature)


def build_recommend_prompt(
    query: str,
    vibe: str,
    purpose: str,
    budget: str,
    candidates_text: str,
    location_line: str = "",
) -> str:
    return RECOMMEND_PROMPT.format(
        query=query,
        vibe=vibe,
        purpose=purpose,
        budget=budget,
        candidates=candidates_text,
        location_line=location_line,
    )
