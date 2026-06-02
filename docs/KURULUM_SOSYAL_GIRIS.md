# Sosyal Giriş Kurulum Rehberi (Google ve Apple)

Bu rehber, **AsEmOs** mobil uygulaması ve FastAPI backend için Google Sign-In ve Sign in with Apple entegrasyonunu adım adım açıklar. Feed, mesajlaşma veya RAG servisi bu paketin kapsamı dışındadır.

> **Güvenlik:** Gerçek API anahtarları, client secret ve .env dosyalarını **asla** Git’e commit etmeyin. Yalnızca .env.example şablonları repoda tutulur.

---

## Özet

| Bileşen | Ne yapılır |
|--------|------------|
| Google Cloud | OAuth consent + Web / Android / iOS client ID |
| Apple Developer | Sign in with Apple capability + bundle id |
| Backend (ackend/.env) | Token audience doğrulama değişkenleri |
| Mobil (pps/mobile) | EXPO_PUBLIC_* client ID’ler; EAS Build ile derleme |
| Test | Cihazda Google/Apple ile giriş; /auth/google, /auth/apple |

Backend, Google ID token ve Apple identity token için imza, issuer, audience ve süre kontrolleri yapar.

---

## Gereksinimler

- Google Cloud hesabı ve proje oluşturma yetkisi
- Apple Developer Program üyeliği (Apple girişi için)
- Expo / EAS CLI (eas build) — sosyal giriş **development build** veya **preview/production** build gerektirir (Expo Go tek başına yeterli olmayabilir)
- Çalışan backend (yerel veya Render)
- PostgreSQL ve mevcut JWT akışının ayakta olması

**Sabitler (repoda):**

- iOS / Android package: com.asemos.mobile
- Apple backend audience (varsayılan): APPLE_CLIENT_ID=com.asemos.mobile

---

## Google Cloud Console

### 1. OAuth consent screen

1. [Google Cloud Console](https://console.cloud.google.com/) → projenizi seçin.
2. **APIs & Services → OAuth consent screen**
3. User type: Internal (kurumsa) veya External (genel test).
4. Uygulama adı, destek e-postası ve gerekli alanları doldurun.
5. Scopes: openid, email, profile (mobil tarafında zaten isteniyor).
6. Test kullanıcıları ekleyin (External + Testing modunda).

### 2. OAuth client’lar

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

| Client türü | Kullanım | Not |
|-------------|----------|-----|
| **Web application** | Backend token doğrulama / web client id | Client ID → EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ve/veya GOOGLE_CLIENT_ID |
| **iOS** | Native iOS | Bundle ID: com.asemos.mobile → EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID |
| **Android** | Native Android | Package: com.asemos.mobile; **SHA-1** (debug ve release) ekleyin → EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID |

Android SHA-1:

`ash
# Debug (örnek — kendi makinenizde çalıştırın)
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
`

EAS credentials kullanıyorsanız: eas credentials ile release keystore SHA-1’i alın.

---

## Apple Developer

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → App ID (com.asemos.mobile) → **Sign in with Apple** capability’yi etkinleştirin.
3. Gerekirse **Services ID** (web/backend ek audience) oluşturun; backend’de APPLE_ALLOWED_CLIENT_IDS ile virgülle listeleyin.
4. Repoda pps/mobile/app.json içinde ios.usesAppleSignIn: true ayarı vardır; **yeni iOS build** alın (eas build --platform ios).
5. Apple, ilk girişten sonra e-postayı her seferinde göndermeyebilir. Backend, e-postasız identity token’ı güvenli şekilde reddedebilir; kalıcı eşleme için ileride kullanıcı modeline Apple sub alanı eklenebilir.

---

## Backend ortam değişkenleri

Dosya: ackend/.env (şablon: ackend/.env.example)

| Değişken | Açıklama | Nereden alınır |
|----------|----------|----------------|
| GOOGLE_CLIENT_ID | Birincil Google ID token **audience** (client id) | Google Cloud → Credentials → Web veya ilgili OAuth client |
| GOOGLE_ALLOWED_CLIENT_IDS | Ek audience’lar (virgülle ayrılmış) | iOS/Android/Web client ID’leri backend’in kabul etmesi gerekiyorsa |
| APPLE_CLIENT_ID | Birincil Apple token audience (genelde bundle id) | Apple App ID: com.asemos.mobile |
| APPLE_ALLOWED_CLIENT_IDS | Ek audience (Service ID vb.) | Apple Developer → Identifiers |
| JWT_SECRET_KEY | Access/refresh token imzalama | Kendi ürettiğiniz güçlü secret (commit etmeyin) |

Diğer backend değişkenleri (veritabanı, SMTP, Groq vb.) için ackend/.env.example dosyasına bakın.

**API uçları:**

- POST /auth/google — body: Google ID token
- POST /auth/apple — body: Apple identity token

Yapılandırma eksikse backend 500 ve anlamlı Türkçe mesaj döner.

---

## Mobil / EAS ortam değişkenleri

Dosya: pps/mobile/.env.local (geliştirme) veya **EAS Secrets** / eas.json env blokları (build)

| Değişken | Açıklama | Nereden alınır |
|----------|----------|----------------|
| EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID | Web OAuth client ID | Google Cloud Credentials |
| EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID | iOS OAuth client ID | Google Cloud → iOS client |
| EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID | Android OAuth client ID | Google Cloud → Android client |
| EXPO_PUBLIC_API_URL | Production/staging API tabanı | Örn. https://api.asemos.com |
| EXPO_PUBLIC_DEV_API_HOST | Fiziksel cihaz + yerel backend | Örn. 192.168.x.x:8000 |

pps/mobile/eas.json içinde preview ve production profillerinde placeholder boş string’ler vardır; gerçek değerleri **EAS dashboard → Environment variables** veya eas secret:create ile girin, repoya yazmayın.

---

## Render deploy notu

Backend Render’da çalışıyorsa:

1. Render Dashboard → servisiniz → **Environment**
2. GOOGLE_CLIENT_ID, GOOGLE_ALLOWED_CLIENT_IDS, APPLE_CLIENT_ID, APPLE_ALLOWED_CLIENT_IDS ekleyin
3. Deploy sonrası health check ve bir test isteği (POST /auth/google geçersiz token → 400 beklenir)
4. ALLOWED_ORIGINS production domain’lerinize göre sıkılaştırın (* yerine)

Mobil taraf Render’a değil EAS build pipeline’ına bağlıdır; client ID’ler build zamanında gömülür.

---

## Test checklist

- [ ] ackend/.env sosyal giriş alanları dolduruldu (secret commit edilmedi)
- [ ] pytest backend/tests/test_auth_features.py (sosyal token mock testleri) yeşil
- [ ] Google: test kullanıcısı consent screen’de tanımlı
- [ ] Android: doğru SHA-1 Google Console’da
- [ ] iOS: Sign in with Apple capability + yeni EAS iOS build
- [ ] Cihazda Google ile giriş → JWT dönüyor → /auth/me çalışıyor
- [ ] Cihazda Apple ile giriş → aynı kontrol
- [ ] Yanlış/süresi dolmuş token → 400, yapılandırma yok → 500

---

## İlgili dosyalar

| Dosya | Amaç |
|-------|------|
| SOCIAL_LOGIN_SETUP.md | Kısa İngilizce özet |
| docs/KATKI_BRANCH_REHBERI.md | Hangi branch / PR açılacağı |
| ackend/app/routers/auth.py | Token doğrulama ve endpoint’ler |
| pps/mobile/src/config/socialAuth.ts | Client ID okuma |

---

## Destek

Kurulum sırasında yalnızca **sosyal giriş** kapsamındaki sorular için bu rehberi kullanın. RAG / i-llm servisi ayrı bir katkı paketidir (bkz. docs/KATKI_BRANCH_REHBERI.md).
