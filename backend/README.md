# Mekan Öneri Platformu - Backend API

Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun backend API servisi.

## Teknolojiler

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - İlişkisel veritabanı
- **SQLAlchemy** - ORM
- **JWT** - Authentication
- **Alembic** - Database migrations
- **Pydantic** - Veri validasyonu

## Kurulum

### Gereksinimler

- Python 3.9+
- PostgreSQL 12+
- pip

### Adımlar

1. Repository'yi klonlayın:
```bash
git clone <repository-url>
cd backend
```

2. Virtual environment oluşturun:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

4. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

5. PostgreSQL veritabanını başlatın (Docker kullanarak):
```bash
docker-compose up -d
```

6. Veritabanı migration'larını çalıştırın:
```bash
alembic upgrade head
```

7. Uygulamayı başlatın:
```bash
uvicorn app.main:app --reload
```

API dokümantasyonuna http://localhost:8000/docs adresinden erişebilirsiniz.

## Proje Yapısı

```
backend/
├── app/
│   ├── api/          # API endpoint'leri
│   ├── core/         # Çekirdek işlevler (security, config)
│   ├── models/       # SQLAlchemy modelleri
│   ├── schemas/      # Pydantic şemaları
│   ├── services/     # İş mantığı
│   ├── database.py   # DB bağlantı yönetimi
│   └── main.py       # FastAPI uygulaması
├── alembic/          # Database migrations
├── tests/            # Test dosyaları
└── requirements.txt  # Python bağımlılıkları
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Kullanıcı kaydı
- `POST /api/v1/auth/login` - Kullanıcı girişi

### Mekanlar
- `GET /api/v1/mekanlar` - Mekan listesi
- `GET /api/v1/mekanlar/{id}` - Mekan detayı
- `POST /api/v1/mekanlar` - Yeni mekan oluştur
- `PUT /api/v1/mekanlar/{id}` - Mekan güncelle
- `DELETE /api/v1/mekanlar/{id}` - Mekan sil

### Öneriler
- `POST /api/v1/oneriler` - Kişiselleştirilmiş mekan önerileri al

## Geliştirme

### Test Çalıştırma
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Linting
```bash
flake8 .
mypy .
```

## Ortam Değişkenleri

`.env` dosyasında şu değişkenler bulunmalı:

- `DATABASE_URL` - PostgreSQL bağlantı string'i
- `SECRET_KEY` - JWT secret key
- `AI_SERVICE_URL` - AI servisi URL'i
- `CORS_ORIGINS` - İzin verilen CORS origin'leri

## Lisans

MIT

## Katkıda Bulunanlar

- **Utku Gülrek** - Backend geliştirme, JWT auth, API endpoints

