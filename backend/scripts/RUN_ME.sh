#!/bin/bash
# Gerçek zincir mekanları eklemek için script
# Backend'in çalıştığından emin olun!

echo "🚀 İstanbul mekanları ekleniyor..."
echo "⚠️  Backend'in çalıştığından emin olun (uvicorn main:app --reload --host 0.0.0.0 --port 8000)"
echo ""

cd "$(dirname "$0")"
python3 add_istanbul_places.py
