#!/usr/bin/env python3
"""
auto_start.py
==============
1. ngrok'un guncel adresini localhost:4040'tan okur
2. ai-llm/.env ve backend/.env dosyalarini gunceller
3. Backend (8000) ve AI-LLM (8081) servislerini baslatir

Kullanim:
    python auto_start.py

NOT: Once ngrok'u baslattin, SONRA bunu calistir.
"""

import os, sys, re, subprocess, time, json
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
AI_ENV     = os.path.join(ROOT, "ai-llm", ".env")
BACKEND_ENV = os.path.join(ROOT, "backend", ".env")

DB_NAME = "ai_mekan_oneri_db"
DB_USER = "postgres"
DB_PASS = "123"

VENV_PYTHON   = os.path.join(ROOT, ".venv", "Scripts", "python.exe")
BACKEND_VENV  = os.path.join(ROOT, "backend", ".venv", "Scripts", "uvicorn.exe")

def get_ngrok_url() -> str | None:
    """ngrok yerel API'sinden PostgreSQL tunelini bul"""
    try:
        with urllib.request.urlopen("http://localhost:4040/api/tunnels", timeout=5) as r:
            data = json.loads(r.read())
        for t in data.get("tunnels", []):
            # TCP tunnel'i bul
            if t.get("proto") == "tcp":
                public_url = t["public_url"]  # tcp://4.tcp.eu.ngrok.io:14028
                host_port  = public_url.replace("tcp://", "")
                return host_port  # "4.tcp.eu.ngrok.io:14028"
    except Exception as e:
        print(f"  ngrok API hatasi: {e}")
    return None


def update_env(filepath: str, host_port: str):
    """DATABASE_URL satirini guncelle"""
    new_url = f"postgresql://{DB_USER}:{DB_PASS}@{host_port}/{DB_NAME}"

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(
        r"DATABASE_URL=postgresql://[^\r\n]+",
        f"DATABASE_URL={new_url}",
        content
    )

    if new_content == content:
        print(f"  {os.path.basename(filepath)}: degisiklik gerekmedi")
    else:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  {os.path.basename(filepath)}: GUNCELLENDI -> {new_url}")


def start_service(name: str, cwd: str, cmd: list):
    """Servisi yeni PowerShell penceresinde baslat"""
    cmd_str = " ".join(f'"{c}"' if " " in c else c for c in cmd)
    ps_cmd = f'cd \'{cwd}\'; {cmd_str}'
    subprocess.Popen(
        ["powershell", "-NoExit", "-Command", ps_cmd],
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    print(f"  {name} baslatildi (yeni pencere)")


def wait_for_service(url: str, name: str, timeout: int = 30) -> bool:
    """Servis hazir olana kadar bekle"""
    import urllib.error
    for i in range(timeout):
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    print(f"  {name} HAZIR ({i+1} sn)")
                    return True
        except Exception:
            pass
        time.sleep(1)
        sys.stdout.write(f"\r  {name} bekleniyor... {i+1}/{timeout}s")
        sys.stdout.flush()
    print(f"\n  {name} ZAMAN ASIMI!")
    return False


# ── ANA AKIS ────────────────────────────────────────────────────

print("=" * 55)
print("  ASEMOS - OTOMATIK BASLANGIC")
print("=" * 55)

# 1. ngrok URL al
print("\n[1] ngrok adresi aliniyor...")
host_port = get_ngrok_url()

if host_port:
    print(f"  ngrok adresi: {host_port}")
    # .env guncelle
    print("\n[2] .env dosyalari guncelleniyor...")
    update_env(AI_ENV, host_port)
    update_env(BACKEND_ENV, host_port)
else:
    print("  UYARI: ngrok bulunamadi veya calismiyor!")
    print("  Mevcut DATABASE_URL korunuyor.")
    print("  ngrok'u once baslatip tekrar deneyin.")

# 2. Backend baslat
print("\n[3] Backend (:8000) baslatiliyor...")
start_service(
    "Backend",
    os.path.join(ROOT, "backend"),
    [BACKEND_VENV, "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
)

# 3. AI-LLM baslat
print("\n[4] AI-LLM (:8081) baslatiliyor...")
start_service(
    "AI-LLM",
    ROOT + "\\ai-llm",
    [os.path.join(ROOT, ".venv", "Scripts", "uvicorn.exe"),
     "app:app", "--host", "0.0.0.0", "--port", "8081", "--reload"]
)

# 4. Hazir ol bekle
print("\n[5] Servisler hazir olana kadar bekleniyor...")
time.sleep(5)
b_ok  = wait_for_service("http://localhost:8000/health", "Backend", timeout=60)
print()
ai_ok = wait_for_service("http://localhost:8081/health", "AI-LLM", timeout=60)
print()

# 5. Ozet
print("\n" + "=" * 55)
print("  SONUC")
print("=" * 55)
print(f"  ngrok    : {host_port or 'BULUNAMADI'}")
print(f"  Backend  : {'OK :8000' if b_ok else 'HATA'}")
print(f"  AI-LLM   : {'OK :8081' if ai_ok else 'HATA'}")
if host_port:
    print(f"  DB URL   : postgresql://{DB_USER}:***@{host_port}/{DB_NAME}")
print("=" * 55)
