# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps
# ---------------------------------------------------------------------------
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------------------------------------------------------------------------
# Stage 2: builder — statik production build (tsc + vite build).
# ---------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 (final): artifact-only image. Bu servis Nginx tarafından servis
# edileceği için (talep gereği Nginx bu image'e dahil DEĞİL, ayrı bir servis)
# burada bir Node/HTTP sunucu process'i çalıştırmıyoruz — kendi sunucumuzu
# ayağa kaldırıp sonra nginx'in önüne koymak gereksiz bir katman olurdu.
# "FROM scratch" ile final image sadece derlenmiş statik dosyaları taşır;
# docker-compose/nginx image build'i bu dosyaları
# `COPY --from=frontend:<tag> /dist ./usr/share/nginx/html` ile alır.
# Bu yüzden HEALTHCHECK / ENTRYPOINT yok — image çalıştırılabilir bir servis
# değil, bir build artifact'idir.
# ---------------------------------------------------------------------------
FROM scratch AS runtime

COPY --from=builder /app/dist /dist
