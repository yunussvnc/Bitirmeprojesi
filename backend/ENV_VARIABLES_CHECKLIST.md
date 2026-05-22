# 📋 Render.com Environment Variables Checklist

Bu dosya, Render.com'da ayarlanması gereken tüm environment variables'ları listeler.

## ✅ Checklist - Tüm Değişkenler

### 🔴 KRİTİK - Mutlaka Ayarlanmalı

- [ ] `DATABASE_URL` - PostgreSQL connection string (Render'dan kopyalayın)
- [ ] `JWT_SECRET_KEY` - Güçlü bir secret key (production için yeni oluşturun!)
- [ ] `GROQ_API_KEY` - LLM servisi için Groq API key
- [ ] `GOOGLE_MAPS_API_KEY` - Harita ve yer bilgileri için
- [ ] `SMTP_USER` - Email gönderimi için Gmail adresi
- [ ] `SMTP_PASS` - Gmail App Password (normal şifre DEĞİL!)
- [ ] `CLOUDINARY_CLOUD_NAME` - Görsel yükleme servisi
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret

### 🟢 STANDART - Default Değerlerle Kullanılabilir

- [ ] `JWT_ALGORITHM` = `HS256`
- [ ] `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
- [ ] `JWT_REFRESH_TOKEN_EXPIRE_DAYS` = `30`
- [ ] `ALLOWED_ORIGINS` = `*` (mobile app için OK)
- [ ] `LLM_ENABLED` = `True`
- [ ] `LLM_PROVIDER` = `groq`
- [ ] `GROQ_MODEL` = `llama-3.1-8b-instant`
- [ ] `RECOMMEND_CACHE_TTL` = `1800`
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`

---

## 📝 Detaylı Açıklamalar

### DATABASE_URL

**Nereden alınır:** Render PostgreSQL dashboard → "Internal Database URL"

**Format:**
```
postgresql://user:password@hostname:5432/dbname
```

**Örnek:**
```
postgresql://asemos_user:xyz123@dpg-abc123.frankfurt-postgres.render.com:5432/asemos
```

**UYARI:** "External Database URL" DEĞİL, "Internal Database URL" kullanın! (Daha hızlı ve ücretsiz)

---

### JWT_SECRET_KEY

**Güvenli key oluşturma:**

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Çıktı örneği:
```
8ebd03507143f3f53aaa95260598d028a3ed6dfc52e6db408c607cdf4c67c167
```

**UYARI:** Production'da development key'i ASLA kullanmayın!

---

### GROQ_API_KEY

**Nasıl alınır:**
1. [console.groq.com](https://console.groq.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. "API Keys" → "Create API Key"
4. Key'i kopyalayın (sadece bir kez gösterilir!)

**Format:** `gsk_...` ile başlar

**Kullanım Limiti (Free):** 
- 30 request/dakika
- 14,400 token/dakika

---

### GOOGLE_MAPS_API_KEY

**Nasıl alınır:**
1. [Google Cloud Console](https://console.cloud.google.com)
2. Yeni proje oluşturun
3. "APIs & Services" → "Enable APIs"
4. "Maps JavaScript API" ve "Places API" aktif edin
5. "Credentials" → "Create Credentials" → "API Key"

**Önerilen Kısıtlamalar:**
- Application restrictions: None (mobile app için)
- API restrictions: Maps JavaScript API, Places API

---

### SMTP (Gmail App Password)

**Gmail App Password Oluşturma:**

1. [Google Account](https://myaccount.google.com) → Security
2. "2-Step Verification" aktif olmalı (yoksa aktif edin)
3. "App passwords" bölümüne gidin
4. "Select app" → Mail, "Select device" → Other (Render)
5. 16 haneli şifreyi kopyalayın (boşluksuz)

**Format:** `abcdefghijklmnop` (16 karakter, boşluksuz)

**UYARI:** Normal Gmail şifrenizi kullanmayın! App password kullanın.

---

### Cloudinary

**Nasıl alınır:**
1. [cloudinary.com](https://cloudinary.com) - Ücretsiz hesap oluşturun
2. Dashboard → "Account Details"
3. Aşağıdaki bilgileri kopyalayın:
   - Cloud Name
   - API Key
   - API Secret

**Free Tier:**
- 25 GB storage
- 25 GB bandwidth/ay
- 25,000 transformation/ay

---

## 🔒 Güvenlik Notları

### ❌ YAPMAYIN

- ❌ Environment variables'ları Git'e commit etmeyin
- ❌ Discord/Slack'te paylaşmayın
- ❌ Screenshot'ta göstermeyin
- ❌ Public GitHub repo'da `.env` dosyası bırakmayın

### ✅ YAPIN

- ✅ Production için yeni JWT secret key oluşturun
- ✅ SMTP_PASS için Gmail App Password kullanın
- ✅ API key'leri düzenli olarak rotate edin
- ✅ `ALLOWED_ORIGINS` için mobile app'te `*` kullanabilirsiniz

---

## 📋 Hızlı Kopyala-Yapıştır Şablonu

Render Dashboard → Environment Variables'a yapıştırmak için:

```env
DATABASE_URL=postgresql://BURAYA_RENDER_POSTGRESQL_URL
JWT_SECRET_KEY=BURAYA_GUCLU_SECRET_KEY
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
ALLOWED_ORIGINS=*
LLM_ENABLED=True
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_BURAYA_GROQ_KEY
GROQ_MODEL=llama-3.1-8b-instant
RECOMMEND_CACHE_TTL=1800
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=BURAYA_GMAIL_ADRESI
SMTP_PASS=BURAYA_GMAIL_APP_PASSWORD
GOOGLE_MAPS_API_KEY=BURAYA_GOOGLE_MAPS_KEY
CLOUDINARY_CLOUD_NAME=BURAYA_CLOUD_NAME
CLOUDINARY_API_KEY=BURAYA_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=BURAYA_CLOUDINARY_SECRET
```

**UYARI:** Yukarıdaki şablondaki BÜYÜK HARFLE yazılmış değerleri kendi değerlerinizle değiştirin!

---

## ✅ Son Kontrol

Deploy etmeden önce:

1. [ ] Tüm 🔴 kritik değişkenler ayarlandı mı?
2. [ ] DATABASE_URL "Internal Database URL" mi?
3. [ ] JWT_SECRET_KEY production için yenisi mi?
4. [ ] SMTP_PASS Gmail App Password mu? (normal şifre değil!)
5. [ ] API key'ler çalışıyor mu? (test ettiniz mi?)

Hepsi ✅ ise "Create Web Service" butonuna basabilirsiniz! 🚀
