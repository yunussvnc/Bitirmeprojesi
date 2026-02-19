#!/usr/bin/env bash
# Backend'i mobil uygulama (telefon) ile kullanmak için --host 0.0.0.0 gerekli.
# Aksi halde sadece 127.0.0.1'de dinler ve telefondan "Network request failed" alırsınız.
cd "$(dirname "$0")"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
