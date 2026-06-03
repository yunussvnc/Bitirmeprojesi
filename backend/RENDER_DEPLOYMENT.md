# 🚀 AsEmOs Backend - Render.com Deployment Rehberi

Bu rehber, AsEmOs FastAPI backend'ini Render.com'a deploy etmek için adım adım talimatlar içerir.

---

## Render Dashboard: Build Command Override (kritik)

Blueprint (
ender.yaml) doğru olsa bile, serviste **Settings → Build Command** alanında eski bir değer kayıtlıysa Render onu kullanır ve deploy başarısız olur.

**Yanlış (Alembic — artık yok):** python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r requirements.txt && python3.11 -m alembic upgrade head

**Doğru seçenekler:** [RENDER_BUILD_COMMAND.md](./RENDER_BUILD_COMMAND.md)

- Tercih: chmod +x build.sh && ./build.sh
- Alternatif: python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r requirements.txt && python3.11 migrate.py

## 📋 Ön Hazırlık

### ✅ Tamamlanan Hazırlıklar
- ✅ `requirements.txt` - Tüm Python dependencies (psycopg2-binary dahil)
- ✅ `runtime.txt` - Python 3.11.11 versiyonu belirtildi
- ✅ `build.sh` - Deployment script (migrations çalıştırır)
- ✅ `render.yaml` - Infrastructure as Code (opsiyonel)
- ✅ `.env.production` - Production environment variables şablonu
- ✅ Database konfigürasyonu - PostgreSQL ve SQLite desteği mevcut

### 📦 Backend Özellikleri
- Framework: FastAPI + Uvicorn
- Database: SQLite (local) → PostgreSQL (production)
- Migrations: migrate.py \(SQLAlchemy create_all\)
- Features: JWT Auth, WebSocket, File Upload (Cloudinary), LLM (Groq), SMTP

---

## 🎯 Deployment Adımları

### Adım 1: Render.com Hesabı Oluşturun

1. [render.com](https://render.com) adresine gidin
2. "Get Started for Free" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (veya email ile kayıt olun)

### Adım 2: GitHub Repository'sini Hazırlayın

1. Kod değişikliklerini commit edin:
```bash
git add backend/runtime.txt backend/build.sh backend/render.yaml
git commit -m "Add Render.com deployment configuration"
git push origin main
```

2. **UYARI:** `.env` dosyasının GitHub'a **ASLA** yüklenmediğinden emin olun!
   - `backend/.gitignore` dosyasında `.env` zaten var olmalı

### Adım 3: PostgreSQL Database Oluşturun

1. Render Dashboard → "New" → "PostgreSQL"
2. Ayarlar:
   - **Name:** `asemos-db` (veya istediğiniz isim)
   - **Database:** `asemos`
   - **User:** (otomatik)
   - **Region:** Frankfurt (veya size en yakın)
   - **Plan:** Free (256 MB RAM, 90 gün)
3. "Create Database" tıklayın
4. **ÖNEMLI:** Database connection string'ini not alın (Internal Database URL)

### Adım 4: Web Service Oluşturun

1. Render Dashboard → "New" → "Web Service"
2. GitHub repository'nizi seçin (`BitirmeProjesi`)
3. Ayarlar:

#### Genel Ayarlar
- **Name:** `asemos-backend` (veya istediğiniz isim)
- **Region:** Frankfurt (database ile aynı olmalı!)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** Python 3

#### Build & Deploy Ayarları
- **Build Command:** 
  ```bash
  chmod +x build.sh && ./build.sh
  ```
- **Start Command:**
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

#### Plan
- **Instance Type:** Free (0.1 CPU, 512 MB RAM)

### Adım 5: Environment Variables Ekleyin

"Environment" sekmesinden aşağıdaki tüm değişkenleri ekleyin:

#### 🔴 Kritik - Mutlaka Değiştirin!

```env
# Database (PostgreSQL - Render'dan kopyalayın)
DATABASE_URL=<Adım_3'teki_Internal_Database_URL>

# JWT Secret (güçlü bir key oluşturun!)
# Oluşturmak için: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=<GUCLU_BIR_SECRET_KEY_OLUSTURUN>

# API Keys - Mevcut .env dosyanızdan kopyalayın
GROQ_API_KEY=gsk_...
GOOGLE_MAPS_API_KEY=AIzaSy...
SMTP_USER=email@gmail.com
SMTP_PASS=<Gmail_App_Password>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

#### 🟢 Standart Ayarlar

```env
# JWT
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS (mobile app için * bırakılabilir)
ALLOWED_ORIGINS=*

# LLM
LLM_ENABLED=True
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.1-8b-instant
RECOMMEND_CACHE_TTL=1800

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

#### 📝 Environment Variables Hakkında Notlar

1. **DATABASE_URL:** 
   - Render PostgreSQL dashboard'unuzdan "Internal Database URL"i kopyalayın
   - Format: `postgresql://user:pass@hostname:5432/dbname`

2. **JWT_SECRET_KEY:**
   - Production'da güçlü bir key kullanın!
   - Oluşturmak için local'de çalıştırın:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```

3. **SMTP_PASS (Gmail):**
   - Normal Gmail şifrenizi DEĞİL, "App Password" kullanın!
   - Oluşturmak için: Google Account → Security → 2-Step Verification → App Passwords

4. **ALLOWED_ORIGINS:**
   - Mobile app için `*` bırakabilirsiniz
   - Web app varsa spesifik domain'ler ekleyin:
     ```
     https://yourdomain.com,https://app.yourdomain.com
     ```

### Adım 6: Deploy Edin!

1. "Create Web Service" butonuna tıklayın
2. Build ve deploy süreci başlayacak (5-10 dakika sürebilir)
3. Logs'u takip edin:
   - Dependencies yükleniyor...
   - migrate.py çalışıyor...
   - Uvicorn başlatılıyor...

4. Deploy tamamlandığında size bir URL verilecek:
   ```
   https://asemos-backend.onrender.com
   ```

### Adım 7: Deployment'ı Test Edin

1. Health check endpoint'ini test edin:
   ```bash
   curl https://asemos-backend.onrender.com/health
   ```

2. Beklenen yanıt:
   ```json
   {
     "status": "ok",
     "version": "2.0.0",
     "services": {
       "database": {"status": "ok"},
       "cloud_storage": {"status": "ok"},
       "llm": {"status": "active", "provider": "groq"},
       "websocket": {"online_users": 0}
     }
   }
   ```

3. API documentation'a göz atın:
   ```
   https://asemos-backend.onrender.com/docs
   ```

---

## 🔧 Deploy Sonrası İşlemler

### 1. Test Kullanıcısı Oluşturun (Opsiyonel)

Render dashboard'da "Shell" sekmesinden:

```bash
python create_user.py
```

### 2. Mobile App'i Backend URL'e Bağlayın

Mobile app'inizin backend URL'ini güncelleyin:

```typescript
// apps/mobile/src/config/api.ts (veya benzeri)
const API_URL = "https://asemos-backend.onrender.com";
```

### 3. APK Oluşturun

```bash
cd apps/mobile
eas build --platform android --profile preview
```

---

## 📊 Monitoring & Logs

### Logs Görüntüleme

Render Dashboard → Your Service → "Logs" tab

### Yaygın Log Mesajları

```
✅ İYİ:
🚀 AsEmOs API v2.0 başlatılıyor...
📊 Veritabanı: postgresql://...
✅ API hazır!

⚠️ UYARI (Kritik Değil):
⚠️ ALLOWED_ORIGINS=* — Production'da spesifik origin'ler belirleyin!

🔴 HATA:
sqlalchemy.exc.OperationalError: could not connect to server
→ DATABASE_URL yanlış veya database çalışmıyor
```

### Health Check

Render otomatik olarak `/health` endpoint'ini kontrol eder. 
API yanıt vermezse otomatik restart yapar.

---

## ⚙️ İleri Seviye Konfigürasyon

### Auto-Deploy Ayarlama

Render Dashboard → Service → Settings → "Auto-Deploy"
- ✅ Aktif ise, her `git push` otomatik deploy başlatır
- ⚠️ Geliştirme aşamasında kapatabilirsiniz

### Custom Domain (Opsiyonel)

1. Settings → "Custom Domains"
2. Kendi domain'inizi ekleyin (örn: `api.asemos.com`)
3. DNS kayıtlarını yapılandırın
4. SSL otomatik olarak sağlanır

### Environment Variables Güncelleme

Bir environment variable değiştirdiğinizde:
1. Dashboard'dan güncelleyin
2. Service otomatik restart olacak
3. Yeni değer hemen aktif olacak

---

## 🚨 Troubleshooting

### Problem: Build Başarısız

**Hata:** `ModuleNotFoundError: No module named 'X'`

**Çözüm:** `requirements.txt`'de eksik paket var. Ekleyin ve push edin.

---

### Problem: Database Connection Error

**Hata:** `sqlalchemy.exc.OperationalError: could not connect to server`

**Çözüm:**
1. DATABASE_URL doğru mu kontrol edin
2. Database ve Web Service aynı region'da mı?
3. Database çalışıyor mu? (Render Dashboard → PostgreSQL)

---

### Problem: Migration Hatası

**Hata:** `alembic.util.exc.CommandError: Can't locate revision identified by 'xxx'`

**Çözüm:**
1. Render Shell'e bağlanın
2. Migration'ı manual çalıştırın:
   ```bash
   python migrate.py
   ```
3. Service'i restart edin

---

### Problem: 502 Bad Gateway

**Olası Sebepler:**
- Uvicorn başlatılamadı
- PORT environment variable yanlış
- Application crash oldu

**Çözüm:**
1. Logs'u kontrol edin
2. Start command'i doğru mu?
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

---

### Problem: Free Tier Spinning Down

Render Free tier'da servis 15 dakika inaktif kalırsa uyur (spin down).
İlk istek 30-60 saniye sürebilir.

**Çözüm:**
- Upgrade to paid plan ($7/month)
- Veya cron job ile her 10 dakikada bir health check
  ```bash
  curl https://asemos-backend.onrender.com/health
  ```

---

## 💰 Maliyet Tahmini

### Free Tier Limitleri
- **Web Service:** 750 saat/ay (tek service için yeterli)
- **PostgreSQL:** 90 gün sonra silinir, 256 MB RAM
- **Bandwidth:** 100 GB/ay
- **Spinning down:** 15 dakika inaktivite sonrası

### Paid Plans (Opsiyonel)
- **Starter:** $7/ay - No spinning down
- **PostgreSQL:** $7/ay - Kalıcı database, 256 MB → 1 GB

**Öneri:** Geliştirme ve test için Free tier yeterli!

---

## 📚 Ek Kaynaklar

- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

## 🎉 Tebrikler!

Backend'iniz artık production'da! 🚀

API URL'inizi projenize not edin ve mobile app'inizde kullanın.

**API URL:** `https://asemos-backend.onrender.com`

---

## 📞 Yardım

Sorun yaşarsanız:
1. Render logs'u kontrol edin
2. Bu dokümandaki Troubleshooting bölümüne bakın
3. GitHub Issues'da sorun açın
