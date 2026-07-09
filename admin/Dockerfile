# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps — sadece bağımlılıkları kurar. package*.json değişmediği
# sürece bu katman cache'ten gelir, kaynak kod değişikliği bunu tetiklemez.
# ---------------------------------------------------------------------------
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
# npm ci: lock dosyasına birebir uyar, deterministik kurulum (npm install'dan
# farklı olarak package.json'u güncellemez). BuildKit cache mount ile npm
# cache diskte tutulur, sonraki build'lerde paketler tekrar indirilmez.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------------------------------------------------------------------------
# Stage 2: builder — production build (standalone output).
# ---------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: runtime — next.config.ts'teki output:"standalone" sayesinde
# sadece gerekli server.js + minimal node_modules kopyalanır; tüm devDependencies
# ve build-time araçları (webpack, typescript vs.) final image'e girmez.
# ---------------------------------------------------------------------------
FROM node:22-slim AS runtime

RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /bin/false --no-create-home appuser

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone çıktısı: minimal node_modules + server.js kendi içinde gelir.
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
# Statik dosyalar standalone paketin dışında tutulur, elle kopyalanmalı.
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appuser /app/public ./public

USER appuser

EXPOSE 3000

# wget standalone image'de yok; node ile basit bir TCP/HTTP kontrolü yeterli
# (curl/wget kurmak ekstra apt katmanı demek, bundan kaçınılıyor).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["node", "server.js"]
