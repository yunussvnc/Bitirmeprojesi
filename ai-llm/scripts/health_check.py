"""
Basit RAG sağlık kontrolü — cron ile periyodik çalıştırılır.

1. Bilinen bir sorgu ("Kadıköy'de kafe") ile arama yapıp üst sonuçların
   gerçekten o semtte olduğunu doğrular — district-matching / hybrid-search
   regresyonu (2026-07'de bulunan bug sınıfı) sessizce geri gelirse yakalar.
2. Qdrant/Postgres mekan sayısını karşılaştırır — hayalet/eksik index kaydı
   birikirse (2026-07'de 632 hayalet kayıt bulunmuştu) yakalar.

Exit code 0 = sağlıklı, 1 = sorun var (cron loglarında/exit code'da görülür).
Container içinden çalıştırılır: docker exec asemos_ai_llm python scripts/health_check.py
"""
import json
import os
import smtplib
import sys
import urllib.request
from datetime import datetime, timezone
from email.mime.text import MIMEText

import psycopg2

KNOWN_QUERY = "Kadıköy'de kafe"
EXPECTED_DISTRICT = "kadıköy"
MIN_DISTRICT_MATCHES = 3  # top 5 sonuçtan en az 3'ü Kadıköy'de olmalı


def _tr_lower(s: str) -> str:
    return (s or "").replace("İ", "i").replace("I", "ı").lower()


def check_search_quality() -> tuple[bool, str]:
    body = json.dumps({"query": KNOWN_QUERY, "top_k": 5}).encode()
    req = urllib.request.Request(
        "http://localhost:8080/api/smart-search-v2",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    r = urllib.request.urlopen(req, timeout=90)
    data = json.loads(r.read())
    recs = data.get("recommendations", [])
    matches = sum(1 for p in recs if EXPECTED_DISTRICT in _tr_lower(p.get("address", "")))
    ok = matches >= MIN_DISTRICT_MATCHES
    return ok, f"'{KNOWN_QUERY}' sorgusu: {matches}/{len(recs)} sonuç Kadıköy'de (eşik: {MIN_DISTRICT_MATCHES})"


def check_index_parity() -> tuple[bool, str]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM places")
    pg_count = cur.fetchone()[0]
    conn.close()

    req = urllib.request.Request(
        "http://qdrant:6333/collections/mekan_embeddings",
        headers={"api-key": os.environ.get("QDRANT_API_KEY", "")},
    )
    r = urllib.request.urlopen(req, timeout=10)
    qdrant_count = json.loads(r.read())["result"]["points_count"]

    ok = qdrant_count == pg_count
    return ok, f"Postgres: {pg_count} mekan, Qdrant: {qdrant_count} nokta ({'eşit' if ok else 'UYUŞMUYOR'})"


def send_email(subject: str, body: str) -> None:
    """SMTP ayarları yoksa veya gönderim başarısız olursa sessizce atlar —
    email bir yan-etki, ana kontrol sonucunu (exit code) etkilememeli."""
    host = os.environ.get("SMTP_HOST")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    to_addr = os.environ.get("HEALTH_CHECK_ALERT_EMAIL")
    if not all([host, user, password, to_addr]):
        print("[email] SMTP ayarları eksik, gönderilmedi.")
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_addr

    try:
        port = int(os.environ.get("SMTP_PORT", "587"))
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [to_addr], msg.as_string())
        print(f"[email] Gönderildi: {to_addr}")
    except Exception as e:
        print(f"[email] Gönderilemedi: {e}")


def main() -> None:
    now = datetime.now(timezone.utc).isoformat()
    lines = [f"=== AI Sağlık Kontrolü — {now} ==="]
    print(lines[0])
    all_ok = True
    for check in (check_search_quality, check_index_parity):
        try:
            ok, msg = check()
        except Exception as e:
            ok, msg = False, f"KONTROL HATASI: {e}"
        line = f"[{'OK' if ok else 'SORUN'}] {msg}"
        print(line)
        lines.append(line)
        all_ok = all_ok and ok

    result_line = f"=== SONUÇ: {'SAĞLIKLI' if all_ok else 'DİKKAT GEREKİYOR'} ==="
    print(result_line)
    lines.append(result_line)

    subject = ("✅ AsEmOs AI Sağlık Kontrolü — Sağlıklı" if all_ok
               else "🚨 AsEmOs AI Sağlık Kontrolü — DİKKAT GEREKİYOR")
    send_email(subject, "\n".join(lines))

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
