# backend/llm_client.py
import json
import os
import urllib.request
import urllib.error


def ollama_generate(prompt: str) -> str:
    """
    Ollama HTTP API ile modelden çıktı alır.
    Varsayılan: http://127.0.0.1:11434, model: gemma2
    """
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "gemma2")

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }

    req = urllib.request.Request(
        url=f"{base_url}/api/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            # Ollama response: {"response": "..."}
            return (data.get("response") or "").strip()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return ""