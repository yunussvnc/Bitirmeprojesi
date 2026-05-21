# 🚀 AsEmOs Bulut Taşıma Rehberi

## Proje Durumu
- ✅ Docker yapılandırması hazır
- ✅ Backend API çalışıyor (FastAPI)
- ✅ AI Servisi hazır (Qdrant + LLM)
- ✅ Mobil uygulama hazır (React Native + Expo)
- ⚠️ Icon/splash screen düzeltilmeli
- ⚠️ Production URL'leri yapılandırılmalı

---

## 🎯 ÖNERİLEN ÇÖZÜM: Render.com (Başlangıç için en iyisi)

### Neden Render?
- ✅ Ücretsiz başlangıç planı
- ✅ Docker desteği (docker-compose.yml'i kullanır)
- ✅ Otomatik SSL sertifikası
- ✅ Kolay GitHub entegrasyonu
- ✅ PostgreSQL, Redis dahili
- ✅ Environment variables yönetimi

### Maliyet (Aylık)
- **Backend:** $0-7 (ücretsiz veya starter)
- **AI Servisi:** $7-25 (daha fazla RAM gerekli)
- **PostgreSQL:** $0-7
- **Redis:** $0-10
- **Qdrant:** $0 (Qdrant Cloud ücretsiz tier)
- **TOPLAM:** ~$0-50/ay

---

## 📝 ADIM ADIM TAŞIMA PLANI

### 1️⃣ HAZIRLIK (Local)

```bash
# 1. GitHub'a push et (tüm kod bulutta olmalı)
git add .
git commit -m "Bulut deploy için hazırlık"
git push origin main

# 2. .env dosyalarını kaydet (buluta manuel girilecek)
# - GROQ_API_KEY
# - JWT_SECRET_KEY
# - SMTP bilgileri
```

### 2️⃣ VERITABANI KURULUMU

#### Seçenek A: Supabase (ÖNERİLEN - Ücretsiz)
1. [supabase.com](https://supabase.com) → Yeni proje
2. Database → Connection String'i kopyala
3. PostgreSQL URL: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

#### Seçenek B: Neon (Alternatif - Ücretsiz)
1. [neon.tech](https://neon.tech) → Yeni proje
2. Connection String'i kopyala

#### Seçenek C: Render PostgreSQL
1. Render Dashboard → New → PostgreSQL
2. Internal/External URL'i al

**Veritabanı Taşıma:**
```bash
# Local veritabanını export et
cd backend
python -c "from database import engine; from models import Base; Base.metadata.create_all(engine)"

# Veya pg_dump ile:
pg_dump -h localhost -U postgres -d ai_mekan_oneri_db > backup.sql

# Bulut veritabanına import et
psql [CLOUD_DATABASE_URL] < backup.sql
```

### 3️⃣ REDIS KURULUMU

#### Upstash Redis (ÖNERİLEN - Ücretsiz)
1. [upstash.com](https://upstash.com) → Create Database
2. Redis URL'i kopyala: `redis://default:[PASSWORD]@[HOST]:6379`

### 4️⃣ QDRANT KURULUMU

#### Qdrant Cloud (Ücretsiz tier)
1. [cloud.qdrant.io](https://cloud.qdrant.io) → Create Cluster
2. API Key ve URL'i al
3. `ai-llm/scripts/load_data.py` ile veri yükle:
```bash
cd ai-llm
# .env dosyasını güncelle:
QDRANT_URL=https://xxx-xxx.gcp-xxx.qdrant.io
QDRANT_API_KEY=xxx

python scripts/load_data.py --source serpapi --limit 200
```

### 5️⃣ BACKEND DEPLOY (Render)

1. **Render Dashboard → New → Web Service**
2. GitHub repo'yu bağla
3. Ayarlar:
   - **Name:** `asemos-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Plan:** Free veya Starter ($7)

4. **Environment Variables ekle:**
```env
DATABASE_URL=postgresql://... (Supabase URL)
JWT_SECRET_KEY=8ebd03507143f3f53aaa95260598d028a3ed6dfc52e6db408c607cdf4c67c167
GROQ_API_KEY=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
GROQ_MODEL=llama-3.1-8b-instant
ALLOWED_ORIGINS=*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ulascandemirtas@gmail.com
SMTP_PASS=gegdlbxoggdexhno
```

5. **Deploy** butonuna tıkla
6. URL'i not et: `https://asemos-backend.onrender.com`

### 6️⃣ AI SERVİSİ DEPLOY (Render)

1. **Render Dashboard → New → Web Service**
2. Ayarlar:
   - **Name:** `asemos-ai-llm`
   - **Root Directory:** `ai-llm`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `ai-llm/Dockerfile`
   - **Plan:** Starter ($7) veya Standard ($25) - AI için daha fazla RAM

3. **Environment Variables:**
```env
GROQ_API_KEY=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
GROQ_MODEL=llama-3.1-8b-instant
QDRANT_URL=https://xxx.gcp-xxx.qdrant.io
QDRANT_API_KEY=xxx
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
BACKEND_API_URL=https://asemos-backend.onrender.com
SERPAPI_KEY=(opsiyonel)
```

4. Deploy ve URL'i not et: `https://asemos-ai-llm.onrender.com`

### 7️⃣ MOBİL UYGULAMA GÜNCELLEMESİ

#### A. Icon ve Splash Screen Düzelt

```bash
cd apps/mobile

# Icon'ları değiştir (1024x1024 PNG):
# - assets/images/icon.png
# - assets/images/splash-icon.png
# - assets/images/android-icon-foreground.png
# - assets/images/android-icon-background.png
```

#### B. app.json Güncelle

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://asemos-backend.onrender.com",
      "aiServiceUrl": "https://asemos-ai-llm.onrender.com"
    }
  }
}
```

#### C. API URL'lerini kod içinde güncelle

`apps/mobile/src/services/` klasöründeki tüm API çağrılarını bulut URL'leri ile değiştir.

### 8️⃣ APK OLUŞTURMA

#### EAS Build Kurulumu

```bash
cd apps/mobile

# EAS CLI kurulumu
npm install -g eas-cli

# Expo hesabına giriş
eas login

# Proje yapılandırması
eas build:configure

# Android build profili ekle (eas.json)
```

**eas.json güncellemesi:**

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://asemos-backend.onrender.com",
        "EXPO_PUBLIC_AI_URL": "https://asemos-ai-llm.onrender.com"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://asemos-backend.onrender.com",
        "EXPO_PUBLIC_AI_URL": "https://asemos-ai-llm.onrender.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### APK Oluştur

```bash
# Preview APK (test için)
eas build --platform android --profile preview

# Production AAB (Google Play için)
eas build --platform android --profile production
```

Build tamamlandığında Expo sitesinden APK'yı indirebilirsiniz.

---

## 🔍 TEST ETME

### 1. Backend Test
```bash
curl https://asemos-backend.onrender.com/health
# Beklenen: {"status": "ok"}
```

### 2. AI Servisi Test
```bash
curl https://asemos-ai-llm.onrender.com/health
# Beklenen: {"status": "healthy"}
```

### 3. Mobil Uygulama Test
- APK'yı Android cihaza yükle
- Login/Register test et
- Mekan arama test et
- AI öneri test et

---

## 🔐 GÜVENLİK ÖNEMLİ!

### Production için mutlaka değiştir:

1. **JWT Secret Key:** 
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

2. **ALLOWED_ORIGINS:** `*` yerine sadece mobil app domain'i

3. **API Keys:** `.env` dosyalarını asla Git'e commit etme!

4. **Veritabanı Şifresi:** Güçlü şifre kullan

---

## 💰 MALİYET OPTİMİZASYONU

### Tamamen Ücretsiz Başlangıç:
- **Render Free Tier:** Backend için (750 saat/ay)
- **Supabase Free:** PostgreSQL
- **Upstash Free:** Redis
- **Qdrant Cloud Free:** 1GB vektör depolama
- **AI Servisi:** Render Free (sınırlı RAM, yavaş olabilir)

### Önerilen Başlangıç (~$7-15/ay):
- **Render Starter:** Backend ($7)
- **Render Starter/Standard:** AI Servisi ($7-25)
- **Supabase Free:** PostgreSQL
- **Upstash Free:** Redis
- **Qdrant Cloud Free:** Vektör DB

---

## 🐛 SORUN GİDERME

### Backend Başlamıyor
```bash
# Render logs:
# Dashboard → Service → Logs

# Kontrol edilecekler:
# - DATABASE_URL doğru mu?
# - Environment variables tanımlı mı?
# - Alembic migration çalıştı mı?
```

### AI Servisi Yavaş
- Redis cache çalışıyor mu kontrol et
- Qdrant'a veri yüklendi mi kontrol et
- Render plan'ı yükselt (daha fazla RAM)

### Mobil Uygulama Bağlanamıyor
- API URL'leri doğru mu?
- CORS ayarları açık mı? (`ALLOWED_ORIGINS=*`)
- SSL sertifikası çalışıyor mu?

---

## 📊 İZLEME VE LOGlama

### Render Dashboard:
- Metrics → CPU, RAM, Network
- Logs → Canlı log izleme
- Environment → Variables güncelleme

### Öneri:
- [Sentry.io](https://sentry.io) → Hata izleme (ücretsiz)
- [LogTail](https://logtail.com) → Log yönetimi
- [UptimeRobot](https://uptimerobot.com) → Uptime monitoring (ücretsiz)

---

## ✅ KONTROL LİSTESİ

- [ ] GitHub repo hazır ve güncel
- [ ] PostgreSQL bulutta kurulu ve erişilebilir
- [ ] Redis bulutta kurulu
- [ ] Qdrant kurulu ve veriler yüklendi
- [ ] Backend deploy edildi ve çalışıyor
- [ ] AI servisi deploy edildi ve çalışıyor
- [ ] Mobil app'te API URL'leri güncellendi
- [ ] Icon ve splash screen düzeltildi
- [ ] APK oluşturuldu ve test edildi
- [ ] Production environment variables ayarlandı
- [ ] Güvenlik kontrolleri yapıldı

---

## 📞 SONRAKI ADIMLAR

1. **Hangi bulut servisini kullanacağınızı seçin** (Render öneriyorum)
2. **Veritabanı kurulumunu yapın** (Supabase en kolay)
3. **Backend'i deploy edin**
4. **AI servisini deploy edin**
5. **Mobil uygulamayı güncelleyip APK çıkarın**
6. **Test edin ve kullanıma açın!**

---

**Sorularınız için hazırım! Hangi adımdan başlamak istersiniz?**
