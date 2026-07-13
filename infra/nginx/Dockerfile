# syntax=docker/dockerfile:1

# =============================================================================
# infra/nginx/Dockerfile — AsEmOs prod nginx image'i.
#
# 3 stage:
#   1. frontend-build : Vite statik build (frontend/ kaynağından, self-contained —
#      ayrı bir frontend image'ine cross-image bağımlılık YOK, çünkü compose'da
#      frontend'in çalışan bir servisi yok, sadece bu build çıktısı gerekiyor).
#   2. brotli-builder  : nginx:1.27-alpine'ın KENDİ nginx binary'siyle aynı
#      configure argümanlarını kullanıp ngx_brotli dinamik modüllerini derler.
#   3. final           : nginx:1.27-alpine + brotli .so'ları + frontend statik
#      dosyaları + infra/nginx/{nginx.conf,conf.d/*.conf}.
#
# Build context ROOT olmalı (docker-compose.prod.yml'de context: .) — hem
# frontend/ hem infra/nginx/ aynı context'ten erişilebilsin diye.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: frontend-build
# -----------------------------------------------------------------------------
FROM node:22-slim AS frontend-build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY frontend/ .
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: brotli-builder
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS brotli-builder

RUN apk add --no-cache \
        build-base \
        pcre2-dev \
        zlib-dev \
        openssl-dev \
        linux-headers \
        git

WORKDIR /usr/src

# ngx_brotli + Google brotli alt-modülü (submodule) — ngx_brotli'nin build
# betiği bu alt modül olmadan derlenemez.
RUN git clone --depth=1 --recurse-submodules https://github.com/google/ngx_brotli.git

# Base image'daki nginx binary'sinin TAM configure argümanlarını çıkarıp
# aynısıyla (+ --add-dynamic-module) yeniden derliyoruz — argüman uyuşmazlığı
# modülün runtime'da yüklenmemesine (symbol mismatch) yol açar.
RUN NGINX_VERSION=$(nginx -v 2>&1 | sed 's/^.*nginx\///') && \
    wget -q "http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" -O nginx.tar.gz && \
    tar -zxf nginx.tar.gz && \
    CONFIG_ARGS=$(nginx -V 2>&1 | grep 'configure arguments:' | sed 's/configure arguments://') && \
    cd "nginx-${NGINX_VERSION}" && \
    eval "./configure --with-compat ${CONFIG_ARGS} --add-dynamic-module=../ngx_brotli" && \
    make modules

# Modüllerin nihai stage'e kopyalanacağı hedef klasör — nginx -V'nin
# raporladığı --modules-path burada sabitleniyor (alpine image'de standart yol).
RUN mkdir -p /brotli-modules && \
    cp /usr/src/nginx-*/objs/ngx_http_brotli_filter_module.so /brotli-modules/ && \
    cp /usr/src/nginx-*/objs/ngx_http_brotli_static_module.so /brotli-modules/

# -----------------------------------------------------------------------------
# Stage 3: final
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS final

# Brotli dinamik modülleri — nginx.conf'taki `load_module modules/...` satırları
# bu path'i (image'in varsayılan modules-path'i) bekliyor.
COPY --from=brotli-builder /brotli-modules/ngx_http_brotli_filter_module.so /usr/lib/nginx/modules/
COPY --from=brotli-builder /brotli-modules/ngx_http_brotli_static_module.so /usr/lib/nginx/modules/

# Frontend statik build çıktısı.
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Konfigürasyon dosyaları.
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/conf.d/ /etc/nginx/conf.d/

# nginx:alpine image'i zaten non-root çalışabilecek şekilde `nginx` kullanıcısı/
# grubuyla geliyor; worker process'ler bu kullanıcıyla çalışır (nginx.conf'ta
# `user nginx;`), master process root olarak başlar (port 80/443 bind etmek
# için gerekli, bu image'in standart davranışı — read_only + tmpfs zaten
# docker-compose.prod.yml'de tanımlı).

EXPOSE 80 443

# HEALTHCHECK docker-compose.prod.yml'de tanımlı (busybox wget) — burada
# tekrar yazılmıyor, aynı desen backend/ai-llm'de de kullanıldı.
