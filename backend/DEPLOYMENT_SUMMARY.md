# 🚀 Render.com Deployment - Hızlı Özet

## ✅ Hazırlanan Dosyalar

1. **`runtime.txt`** - Python 3.11.11 versiyonu
2. **`build.sh`** - Deployment script (pip install + python migrate.py)
3. **`render.yaml`** - Infrastructure as Code (opsiyonel)
4. **`.env.production`** - Environment variables şablonu (GIT'e eklenmedi)
5. **`RENDER_DEPLOYMENT.md`** - Detaylı deployment rehberi (Türkçe)
6. **`ENV_VARIABLES_CHECKLIST.md`** - Environment variables checklist

## 🎯 Hızlı Başlangıç (5 Adımda)

### 1️⃣ GitHub'a Push Edin

```bash
git add backend/runtime.txt backend/build.sh backend/render.yaml backend/RENDER_DEPLOYMENT.md backend/ENV_VARIABLES_CHECKLIST.md
git commit -m "Add Render.com deployment configuration"
git push origin main
```

### 2️⃣ Render.com'da PostgreSQL Oluşturun

- Dashboard → New → PostgreSQL
- Name: `asemos-db`
- Region: Frankfurt
- Plan: Free
- **Internal Database URL'i kopyalayın!**

### 3️⃣ Web Service Oluşturun

- Dashboard → New → Web Service
- Repository: `BitirmeProjesi`
- Root Directory: `backend`
- Build Command: `chmod +x build.sh && ./build.sh`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4️⃣ Environment Variables Ekleyin

**Kritik olanlar (değiştirin!):**
- `DATABASE_URL` ← Adım 2'den kopyalayın
- `JWT_SECRET_KEY` ← Yeni güçlü key oluşturun
- `GROQ_API_KEY` ← Mevcut .env'den kopyalayın
- `GOOGLE_MAPS_API_KEY` ← Mevcut .env'den kopyalayın
- `SMTP_USER` ve `SMTP_PASS` ← Gmail App Password
- Cloudinary bilgileri

**Standart olanlar (değişmeden ekleyin):**
- `JWT_ALGORITHM=HS256`
- `ALLOWED_ORIGINS=*`
- `LLM_ENABLED=True`
- `LLM_PROVIDER=groq`
- `GROQ_MODEL=openai/gpt-oss-20b`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`

Tam liste için: `ENV_VARIABLES_CHECKLIST.md`

### 5️⃣ Deploy!

"Create Web Service" → Logs'u izleyin → Deploy tamamlandığında API URL'i alın

---

## 🧪 Test

```bash
# Health check
curl https://asemos-backend.onrender.com/health

# API docs
https://asemos-backend.onrender.com/docs
```

---

## 📱 Mobile App Bağlantısı

Mobile app'inizde backend URL'ini güncelleyin:

```typescript
// apps/mobile/src/config/api.ts
const API_URL = "https://asemos-backend.onrender.com";
```

Sonra APK oluşturun:

```bash
cd apps/mobile
eas build --platform android --profile preview
```

---

## 📚 Detaylı Dokümantasyon

- **Tam rehber:** `RENDER_DEPLOYMENT.md` (Türkçe, detaylı)
- **Environment variables:** `ENV_VARIABLES_CHECKLIST.md`
- **Render docs:** https://render.com/docs

---

## 🚨 Önemli Notlar

### ⚠️ Güvenlik

- ❌ `.env` dosyasını Git'e eklemeyin!
- ✅ Production için yeni JWT_SECRET_KEY oluşturun
- ✅ Gmail App Password kullanın (normal şifre değil!)

### ⏱️ Free Tier

- 15 dakika inaktivite sonrası uyur (spin down)
- İlk istek 30-60 saniye sürebilir
- PostgreSQL 90 gün sonra silinir

### 🐛 Sorun mu var?

1. Render Dashboard → Logs kontrol edin
2. `RENDER_DEPLOYMENT.md` → Troubleshooting bölümü
3. Health check endpoint'ini test edin

---

## ✅ Checklist

Deploy etmeden önce:

- [ ] GitHub'a push yaptınız mı?
- [ ] PostgreSQL database oluşturdunuz mu?
- [ ] DATABASE_URL'i kopyaladınız mı?
- [ ] Tüm environment variables'ları eklediniz mi?
- [ ] JWT_SECRET_KEY production için yenisi mi?
- [ ] SMTP_PASS Gmail App Password mu?

Hepsi ✅ ise **hazırsınız!** 🎉

---

**API URL:** `https://asemos-backend.onrender.com`

Profesörünüze APK ile birlikte bu URL'i paylaşabilirsiniz! 🚀
