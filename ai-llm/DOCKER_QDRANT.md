# Qdrant Docker Kurulumu

## Hızlı Başlangıç

### En Basit Yöntem (Test İçin)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Bu komut:
- Qdrant'ı başlatır
- Port 6333'ü host'a yönlendirir
- **Veri kalıcı değildir** (container durdurulunca veriler kaybolur)

### Kalıcı Veri İle (Önerilen)

#### Linux/Mac:
```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

#### Windows PowerShell:
```powershell
docker run -d `
  --name qdrant `
  -p 6333:6333 `
  -p 6334:6334 `
  -v ${PWD}\qdrant_storage:/qdrant/storage `
  qdrant/qdrant
```

#### Windows CMD:
```cmd
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v %CD%\qdrant_storage:/qdrant/storage qdrant/qdrant
```

### Docker Compose (En İyi Yöntem)

```bash
docker-compose up -d
```

Bu yöntem:
- ✅ Kalıcı veri saklar
- ✅ Health check içerir
- ✅ Kolay yönetim
- ✅ Volume yönetimi otomatik

## Port Açıklamaları

- **6333**: HTTP/REST API portu
- **6334**: gRPC portu (performans için)

## Kontrol

### Qdrant'ın çalıştığını kontrol et:

```bash
# Health check
curl http://localhost:6333/health

# Tarayıcıda dashboard
http://localhost:6333/dashboard
```

### Container durumunu kontrol et:

```bash
docker ps | grep qdrant
```

### Logları görüntüle:

```bash
docker logs qdrant
# veya
docker-compose logs qdrant
```

### Container'ı durdur:

```bash
docker stop qdrant
# veya
docker-compose down
```

### Container'ı yeniden başlat:

```bash
docker start qdrant
# veya
docker-compose restart
```

## Sorun Giderme

### Port zaten kullanılıyor hatası

```bash
# Port'u kullanan process'i bul
netstat -ano | findstr :6333  # Windows
lsof -i :6333                  # Linux/Mac

# Farklı port kullan
docker run -p 6335:6333 qdrant/qdrant
```

### Veri kaybı

Volume kullanmıyorsanız veriler container durdurulunca kaybolur. 
Kalıcı veri için mutlaka `-v` parametresi kullanın veya `docker-compose` kullanın.

### Memory hatası

Qdrant varsayılan olarak 2GB RAM kullanır. Daha az bellek için:

```bash
docker run -p 6333:6333 -e QDRANT__STORAGE__OPTIMIZATION__MAX_OPTIMIZATION_THREADS=1 qdrant/qdrant
```

## Temizlik

### Container ve verileri sil:

```bash
docker stop qdrant
docker rm qdrant
rm -rf qdrant_storage  # Linux/Mac
rmdir /s qdrant_storage  # Windows
```

### Docker Compose ile:

```bash
docker-compose down -v  # Volume'ları da siler
```

## Production İçin

Production ortamında şu ek ayarları yapın:

1. **Volume**: Mutlaka kalıcı volume kullanın
2. **Resource Limits**: Memory ve CPU limitleri koyun
3. **Health Checks**: Health check yapılandırın
4. **Backup**: Düzenli backup alın
5. **Network**: Özel Docker network kullanın

Örnek production yapılandırması:

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant_prod
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__LOG_LEVEL=INFO
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  qdrant_data:
```

