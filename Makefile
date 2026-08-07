SHELL := /bin/bash

.PHONY: run db ai-db stop-db install stop clean

# Ana komut: Kullanıcıya iki ayrı terminal açmasını söyler.
run: clean db ai-db
	@echo "================================================================="
	@echo "✅ Veritabanları ve servisler başarıyla temizlendi ve başlatıldı!"
	@echo ""
	@echo "Lütfen VS Code'da İKİ AYRI TERMINAL (sekme) açın:"
	@echo "1. Terminale şunu yazın: make run-services  (Backend ve AI loglarını renkli gösterir)"
	@echo "2. Terminale şunu yazın: make run-mobile    (QR kodunun bozulmaması için ayrı çalışmalıdır)"
	@echo "================================================================="

# Backend ve AI-LLM'i aynı terminalde birleştirir (Mobile hariç)
run-services:
	npx concurrently -n "BACKEND,AI-LLM" -c "bgBlue.bold,bgMagenta.bold" \
		"make run-backend" \
		"make run-ai"

# İstersen VS Code içinde ayrı sekmelerde kendin çalıştırmak için:
run-backend: db
	cd backend && source venv/bin/activate && python migrate.py && python seed_db.py && uvicorn main:app --reload --host 0.0.0.0 --port 8000

run-ai: ai-db
	cd ai-llm && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8001

run-mobile:
	cd apps/mobile && npm start

# PostgreSQL'i Docker üzerinden ayağa kaldırır
db:
	@echo "PostgreSQL veritabanı başlatılıyor..."
	docker compose up -d

# Redis ve Qdrant'ı Docker üzerinden ayağa kaldırır
ai-db:
	@echo "Qdrant ve Redis başlatılıyor..."
	cd ai-llm && docker compose up -d

# Tüm veritabanlarını ve konteynerleri durdurur
stop-db:
	@echo "Tüm veritabanı konteynerleri kapatılıyor..."
	docker compose down
	cd ai-llm && docker compose down

# Tüm projelerin bağımlılıklarını sıfırdan kurmak için
install:
	@echo "Backend gereksinimleri kuruluyor..."
	cd backend && python3.12 -m venv venv && source venv/bin/activate && uv pip install -r requirements.txt
	@echo "AI-LLM gereksinimleri kuruluyor..."
	cd ai-llm && python3.12 -m venv venv && source venv/bin/activate && uv pip install -r requirements.txt
	@echo "Mobile gereksinimleri kuruluyor..."
	cd apps/mobile && npm install
	@echo "Kurulum tamamlandı!"

# Arka planda takılı kalan portları temizlemek için yardımcı komut
stop:
	@echo "Açık olan Uvicorn ve Expo servisleri zorla durduruluyor..."
	-pkill -f "uvicorn main:app"
	-pkill -f "uvicorn src.main:app"
	-pkill -f "expo start"

# Her şeyi sıfırlamak için (Veritabanları, arka plan servisleri ve kalıntılar)
clean: stop
	@echo "Önceki veritabanı kalıntıları (volumeler) temizleniyor..."
	-docker compose down -v
	-cd ai-llm && docker compose down -v
