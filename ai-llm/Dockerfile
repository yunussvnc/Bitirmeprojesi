# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: builder — torch/transformers gibi ağır paketler için derleme
# araçlarıyla izole bir venv kurar. Bu stage final image'e taşınmaz.
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        git \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# requirements.txt önce kopyalanır — kod değişse de bu katman cache'ten gelir.
# BuildKit pip cache mount: yeniden build'lerde torch gibi büyük wheel'ler
# tekrar internetten inmez, yerel cache'ten kurulur.
COPY requirements.txt .
# --extra-index-url: PyPI'daki torch varsayılan olarak CUDA'lı wheel çeker
# (~2.5GB). Servis zaten CPU-only çalışıyor (EMBEDDING_DEVICE=cpu, CUDA yok) —
# PyTorch'un resmi CPU-only index'i eklenerek pip torch için bu index'i tercih
# eder, final image yüzlerce MB küçülür.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip \
    && pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: runtime
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# Runtime stage'de apt paketi gerekmiyor artık: curl kaldırıldı, HEALTHCHECK
# Python stdlib (urllib) kullanıyor. groupadd/useradd base image'de zaten var.
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /bin/false --no-create-home appuser

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # CLAUDE.md'de belgelenen OOM önlemi: tek-thread BLAS/OMP, 2GB sınırlı
    # ortamlarda torch'un CPU thread patlamasını engeller. Env ile de
    # override edilebilir (compose'dan gelen değer bunu ezer).
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    # appuser'ın $HOME'u yok (--no-create-home) — sentence-transformers/
    # huggingface_hub varsayılan olarak ~/.cache/huggingface'e model indirmeye
    # çalışıyor, bu da "Permission denied: '/home/appuser'" ile patlıyordu
    # (gerçek doğrulamada tespit edildi — embedding modeli hiç yüklenemiyordu).
    # Cache'i appuser'ın zaten sahip olduğu /app altına yönlendiriyoruz.
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    SENTENCE_TRANSFORMERS_HOME=/app/.cache/huggingface

RUN mkdir -p /app/.cache/huggingface && chown -R appuser:appuser /app/.cache

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/health', timeout=5).status == 200 else 1)"

# --workers 1 bilinçli: model singleton bellekte tek kopya tutulmalı,
# birden fazla worker RAM'i katlar (CLAUDE.md OOM notu).
ENTRYPOINT ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
CMD ["--workers", "1"]
