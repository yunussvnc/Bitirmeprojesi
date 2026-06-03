#!/usr/bin/env bash
# Render.com Build Script
# Bu script deployment sırasında otomatik olarak çalışır

set -o errexit  # Hata durumunda dur

echo "🔧 Python paketleri yükleniyor..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️  Veritabanı migration'ları çalıştırılıyor..."
python migrate.py

echo "✅ Build tamamlandı!"
