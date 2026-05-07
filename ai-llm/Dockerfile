FROM python:3.11-slim

WORKDIR /app

# Sistem bağımlılıkları (torch CPU build için)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

# Önce requirements (cache katmanı için)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodu kopyala
COPY . .

# Uvicorn ile başlat — app.py içindeki FastAPI instance'ı
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
