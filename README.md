# Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu

TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Desteği Programı kapsamında geliştirilen proje.

## Proje Hakkında

Bu proje, kullanıcıların doğal dilde ifade ettikleri ihtiyaç, duygu ve tercihlere göre konum bazlı kişiselleştirilmiş mekan önerileri sunabilen LLM tabanlı bir mobil uygulama geliştirmeyi amaçlamaktadır.

### Özellikler

- 🤖 **RAG (Retrieval-Augmented Generation)** mimarisi ile akıllı öneri sistemi
- 📱 **Cross-platform** mobil uygulama (React Native)
- 🔐 **JWT tabanlı** kimlik doğrulama
- 🗺️ **Konum bazlı** mekan önerileri
- 🇹🇷 **Türkçe doğal dil** anlayışı
- 🔍 **Vektör arama** ile semantik benzerlik

## Proje Yapısı

Proje 3 ayrı repository'den oluşmaktadır:

### 1. Backend API (`backend/`)
- FastAPI tabanlı REST API
- PostgreSQL veritabanı
- JWT authentication
- Mekan CRUD işlemleri

### 2. Mobile App (`frontend/`)
- React Native uygulaması
- TypeScript
- Konum bazlı arama
- Kişiselleştirilmiş öneri arayüzü

### 3. AI/LLM Service (`ai-llm/`)
- RAG mimarisi
- Qdrant vektör veritabanı
- LangChain entegrasyonu
- OpenAI API veya açık kaynak LLM

## Hızlı Başlangıç

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
docker-compose up -d  # PostgreSQL
cp .env.example .env  # Düzenleyin
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp env.example .env  # API URL'ini ayarlayın
npm start
```

### AI/LLM Service

```bash
cd ai-llm
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
docker-compose up -d  # Qdrant
cp env.example .env  # API key'lerini ayarlayın
uvicorn src.main:app --reload --port 8001
```

## Teknolojiler

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT
- Alembic

### Frontend
- React Native
- TypeScript
- React Navigation
- Axios
- Expo

### AI/LLM
- PyTorch
- LangChain
- Qdrant
- Sentence Transformers
- OpenAI API

## Takım

- **Ulaş Can Demirtaş** - Frontend UI/UX, Backend veri işleme, Sprint yönetimi
- **Yunusemre Sevinç** - LLM/RAG mimarisi, Öneri algoritmaları
- **Utku Gülrek** - Backend API, JWT auth, Frontend API entegrasyonu

**Danışman:** Dr. Öğretim Üyesi Azer Çelikten

## Lisans

MIT

## Daha Fazla Bilgi

Her repository için detaylı dokümantasyon:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [AI/LLM README](ai-llm/README.md)

