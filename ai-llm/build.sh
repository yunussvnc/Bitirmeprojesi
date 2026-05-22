#!/usr/bin/env bash
# Render.com Build Script for AI-LLM Service
# Bu script deployment sırasında otomatik olarak çalışır

set -o errexit  # Hata durumunda dur

echo "🔧 Python paketleri yükleniyor..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build tamamlandı!"
