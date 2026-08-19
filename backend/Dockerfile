# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: builder — derleme bağımlılıklarıyla (gcc, libpq-dev) izole bir
# virtualenv kurar. Bu araçlar final image'e taşınmaz.
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# psycopg2 (libpq-dev) ve C-extension derlemesi (build-essential) için gerekli.
# --no-install-recommends: gereksiz öneri paketlerini indirmez, katman küçülür.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları izole bir venv'e kurar — final stage'e sadece bu klasör
# kopyalanacağı için apt build araçları image'e sızmaz.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# requirements.txt önce kopyalanır: kaynak kod değiştiğinde bu katman
# cache'ten okunur, pip install tekrar tetiklenmez.
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip \
    && pip install -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: runtime — sadece çalışma zamanı için gerekenler.
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# libpq5: psycopg2'nin runtime'da ihtiyaç duyduğu paylaşımlı kütüphane
# ffmpeg: upload doğrulamasında ffprobe ile gerçek video stream/format/süre kontrolü.
# (libpq-dev'in derleme başlıkları değil, sadece .so dosyaları).
# curl YOK: HEALTHCHECK Python stdlib (urllib) ile yapılıyor, ekstra paket gerekmiyor.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /bin/false --no-create-home appuser

WORKDIR /app

# Derlenmiş venv'i builder'dan al — build araçları burada yok.
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Uygulama kodu — non-root kullanıcıya ait olarak kopyalanır.
COPY --chown=appuser:appuser . .

# uploads/ fallback yazma yeri (docker-compose'da named volume ile mount
# edilecek) için dizin sahipliği önceden ayarlanır.
RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads

USER appuser

EXPOSE 8000

# curl yerine Python stdlib (urllib) — ekstra sistem paketi gerekmez, image küçülür.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health', timeout=3).status == 200 else 1)"

# NOT: Migration burada ÇALIŞTIRILMAZ (backend/main.py'deki otomatik
# migrate.run_migrations çağrısı kaldırılmalı — ayrı "migrate" servisi
# sorumlu). Worker sayısı env ile parametrize edilebilir olsun diye
# shell-form yerine exec-form + sabit değer yerine varsayılan kullanılıyor;
# gerekirse compose'da command override edilir.
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["--workers", "4"]
