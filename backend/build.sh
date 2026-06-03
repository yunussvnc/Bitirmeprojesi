#!/usr/bin/env bash
# Render.com Build Script
# Bu script deployment sırasında otomatik olarak çalışır

set -o errexit  # Hata durumunda dur

echo "🔧 Python paketleri yükleniyor..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️  Veritabanı migration'ları çalıştırılıyor..."
python migrate.py

echo "📍 Mekan snapshot kopyalaniyor (Explore harita pinleri)..."
mkdir -p data
if [ ! -f data/loaded_places.json ]; then
  if [ -f ../ai-llm/data/loaded_places.json ]; then
    cp ../ai-llm/data/loaded_places.json data/loaded_places.json
    echo "   ai-llm/data/loaded_places.json -> data/loaded_places.json"
  else
    echo "   UYARI: loaded_places.json bulunamadi — deploy sonrasi manuel sync gerekebilir"
  fi
else
  echo "   data/loaded_places.json mevcut"
fi

echo "✅ Build tamamlandı!"
