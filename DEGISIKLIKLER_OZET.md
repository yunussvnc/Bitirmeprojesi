# AsEmOs — Değişiklikler Özeti

**Tarih:** Mayıs 2026  
**Kapsam:** AI/RAG, mobil uygulama, backend auth, bulut deploy ve demo stabilizasyonu  
**Kaynak:** Git geçmişi, çalışma alanı diff’i ve oturum boyunca yapılan düzeltmeler

---

## 1. AI Arama ve RAG

- **465 İstanbul mekanı** SerpAPI + Google Maps verisiyle toplandı (`ai-llm/collect_400_places.py`, `RAG_400_MEKAN_RAPORU.md`).
- Toplanan mekanlar `data/loaded_places.json` dosyasına kaydedildi; her kayıtta isim, adres, puan, yorum sayısı, fiyat seviyesi, kategori, açıklama, koordinat ve `google_place_id` bulunuyor.
- **8 bölge** tarandı: Kadıköy, Beşiktaş, Beyoğlu, Fatih, Şişli, Üsküdar, Sarıyer, Bakırköy.
- **50+ kategori** kapsandı; en yoğun kategoriler kahve dükkanı, restoran, kafe ve Türk/İtalyan restoranları.
- Mekan metinleri **384 boyutlu çok dilli embedding** ile vektörleştirildi (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`).
- Vektörler **Qdrant** koleksiyonuna (`mekan_embeddings`) yüklendi; `QDRANT_URL` boşsa in-memory Qdrant fallback devreye girer.
- **RAG pipeline** (`src/rag/pipeline.py`) sorgu → vektör arama → LLM yanıt akışını yönetir.
- **`POST /api/smart-search-v2`** endpoint’i SerpAPI + RAG hibrit arama sunar:
  - Birincil kaynak: SerpAPI (canlı Google Maps sonuçları).
  - SerpAPI boş/hata durumunda: **RAG birincil fallback** (commit: `fix(ai-llm): smart-search-v2 uses RAG when SerpAPI is empty`).
  - SerpAPI sonuç verdiğinde: RAG eksikleri tamamlar ve isim bazlı dedupe uygular.
- RAG bootstrap ayarları eklendi: `RAG_AUTO_INDEX`, `RAG_INDEX_ON_STARTUP`, `RAG_FORCE_REINDEX`, `RAG_DATA_PATH`.
- **`RecommendationEngine`** RAG pipeline’ı lazy-load ile başlatır; `language` parametresi destekler.
- **`POST /api/recommend`** (ve `/recommendation/recommend`) isteğe `language` / `locale` alanı eklendi.
- Mobil **`aiService.ts`**: `smartSearch()` → `/api/smart-search-v2`; AI servisi düşerse backend `/recommend` fallback’i devreye girer.
- Production AI URL: `https://asemos-ai.onrender.com` (Render deploy, commit: `Deploy RAG search endpoint`).
- Render deploy düzeltmeleri: Python 3.11 (`.python-version`), PyTorch sürüm uyumu, pydantic-core build fix.
- Test scriptleri eklendi: `test_rag_system.py`, `test_rag_custom.py`, `demo_rag_complete.py`.
- AI servisi katmanlı LLM yapısı: Groq birincil, local model fallback.

---

## 2. Çok Dilli AI ve Telefon Dili

- Yeni **`apps/mobile/src/utils/locale.ts`** helper modülü:
  - Desteklenen diller: `tr`, `en`, `de`, `fr`, `es`, `ar`, `ru`.
  - `getSystemAppLanguage()` — telefon sistem dilini okur (`expo-localization`).
  - `getSystemLanguagePayload()` — AI isteklerine gönderilecek `{ language, locale }` üretir.
  - `normalizeAppLanguageCode()` — `tr-TR` → `tr` normalizasyonu.
  - `getLanguageDisplayName()` — ayar ekranında yerel dil adları.
- **`i18n.ts`** güncellendi: async language detector artık sistem dilini otomatik algılar; fallback `en`.
- Henüz çevrilmemiş diller (`de`, `fr`, `es`, `ar`, `ru`) geçici olarak İngilizce kaynak metinle eşleştirildi.
- **`aiService.ts`**: her AI isteğine otomatik `language` ve `locale` eklenir (`withCurrentAILanguage`).
- **`useSettingsStore`**: dil tercihi backend `PUT /auth/me/preferences` ile senkronize edilir.
- **`app/settings/language.tsx`**: 7 dil seçeneği, sistem dili bilgisi, safe area uyumlu header.
- **`tr.json` / `en.json`**: auth, AI arama ve dil ekranı metinleri güncellendi.
- AI servisi prompt/yanıt dili istemci diline göre yönlendirilir (`language.split("-")[0]`).

---

## 3. Google / Apple Sosyal Giriş

### Backend
- **`backend/app/routers/auth.py`** genişletildi:
  - Google ID token doğrulama (`google.oauth2.id_token.verify_oauth2_token`).
  - Apple identity token doğrulama (Apple JWKS, RS256, issuer/audience/exp kontrolleri).
  - `_social_user_token()`: e-posta ile kullanıcı bul/oluştur, JWT access + refresh token üret.
  - Yeni endpoint’ler: Google ve Apple login route’ları.
- **`backend/config.py`**: sosyal giriş env alanları eklendi.
- **`backend/tests/test_auth_features.py`**: auth akış testleri genişletildi (710+ satır).

### Mobil
- Yeni **`apps/mobile/src/config/socialAuth.ts`**: platform bazlı Google client ID kontrolü.
- **`LoginScreen.tsx`** ve **`RegisterScreen.tsx`**: Google (`expo-auth-session`) ve Apple (`expo-apple-authentication`) butonları.
- iOS’ta Apple Sign In kullanılabilirlik kontrolü (`isAppleAvailable`).
- Google token alınamazsa kullanıcıya yapılandırma uyarısı gösterilir.

### Yapılandırma
- **`app.json`**: `ios.usesAppleSignIn: true`, `bundleIdentifier: com.asemos.mobile`.
- **`eas.json`**: preview/production profillerinde Render URL’leri ve Google client ID env’leri.
- **`SOCIAL_LOGIN_SETUP.md`**: Google Cloud Console ve Apple Developer kurulum checklist’i.
- **`.env.example`** (root, backend, mobile): sosyal giriş env isimleri dokümante edildi.

### Gerekli env değişkenleri (değer yazılmaz)
| Servis | Değişken |
|--------|----------|
| Backend | `GOOGLE_CLIENT_ID`, `GOOGLE_ALLOWED_CLIENT_IDS` |
| Backend | `APPLE_CLIENT_ID`, `APPLE_ALLOWED_CLIENT_IDS` |
| Mobil (EAS) | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| Mobil (EAS) | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Mobil (EAS) | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |

---

## 4. Auth Akışı Düzeltmeleri

- **`app/index.tsx`** (kök yönlendirme) yeniden yazıldı:
  - Store hydration beklenir.
  - Mevcut token `getMe()` ile doğrulanır; geçersizse logout + `/login`.
  - Rol bazlı yönlendirme: `venue` → `/(venue-tabs)`.
  - E-posta doğrulanmamış → `/verify-email`.
  - İlk kurulum eksik (`username` veya `birth_date`) → `/first-time-setup`.
  - Geçerli kullanıcı → `/(tabs)`.
- **`EmailVerificationScreen.tsx`**: URL parametresinden e-posta decode, 60 sn yeniden gönderme cooldown, shake animasyonu.
- **`RegisterScreen.tsx`**: kullanıcı/mekan (`roleType`) seçimi, venue adı alanı, sosyal giriş entegrasyonu.
- **`LoginScreen.tsx`**: rol seçimi (user/venue), çift gönderim koruması (`isSubmittingRef`), sosyal giriş.
- **`ForgotPasswordScreen.tsx`**: safe area / layout uyumu.
- Backend auth router: rate limiting, e-posta doğrulama, şifre sıfırlama, refresh token akışları korundu/güçlendirildi.
- **`INSTRUCTIONS_LOGIN_FIX.md`**, **`KULLANICI_DOGRULAMA_TALIMATI.md`**, **`VERIFICATION_SOLUTION_SUMMARY.md`**: login/doğrulama sorun giderme notları.

---

## 5. Mobil UI / Layout Düzeltmeleri

- **`Screen.tsx`**: `withTabBar`, `withHeader`, safe area inset desteği; tab bar alt boşluğu standartlaştırıldı.
- **`app/(tabs)/_layout.tsx`**: `useSafeAreaInsets()` ile dinamik tab bar yüksekliği (`56 + bottomInset`); iOS min 24px, Android min 16px alt boşluk.
- **`app/(venue-tabs)/_layout.tsx`**: venue tab navigator’da aynı safe area yaklaşımı.
- **`app.json`**: Android `edgeToEdgeEnabled: true`, `predictiveBackGestureEnabled: false`.
- Safe area düzeltmeleri şu ekranlara uygulandı:
  - Login, Register, ForgotPassword
  - Settings alt ekranları (about, account-status, language, restricted)
  - Venue tabs (edit, settings)
  - Messages (Chat, Archived, Messages list)
  - Match, EditProfile, Profile, Saved
  - RecentlyDeleted, PlaceholderSettings
- **`AnimatedTabBar`**: absolute konumlu tab bar; `TabBarVisibilityProvider` ile scroll’da gizleme korundu.
- Alt menünün sistem navigation bar ile çakışması (basılmama sorunu) safe area inset ile giderildi.

---

## 6. Hata Düzeltmeleri

### 404 / Not Found
- **`errorHandler.ts`**: `isNotFoundError()` helper eklendi; 404 → `NOT_FOUND` kodu.
- **`messageService.ts`**: konuşma bulunamazsa boş mesaj geçmişi döner (crash yerine graceful fallback).
- **`mekanService.getPlaceById()`**: 404’te `null` döner, `logger.warn` ile loglanır (kırmızı error spam engellendi).
- **`PlaceDetailScreen.tsx`**: null place durumu güvenli işlenir.

### Logger
- **`logger.ts`**: beklenen API hataları (400, 401, 403, 404, 500, network, timeout) development modunda `console.warn` olarak yazılır; gerçek hatalar `console.error` kalır.

### Production URL
- **`constants/api.ts`**: production backend URL `https://asemos-backend.onrender.com` olarak düzeltildi (eski `api.asemos.com` kaldırıldı).
- **`aiService.ts`**: production AI URL `https://asemos-ai.onrender.com`; `EXPO_PUBLIC_AI_URL` override desteği.

### Diğer
- **`api.ts`**: tunnel URL’leri (`exp.direct`, `ngrok`) dev modunda atlanır.
- AI arama backend fallback: AI servis timeout/hata durumunda `/recommend` endpoint’ine düşer.

---

## 7. Demo Stabilizasyon

- **Route düzeltmeleri**: kök `index.tsx` auth state machine; venue/user ayrımı netleştirildi.
- **`PlaceCard.tsx`**: büyük genişletme (~366 satır) — zengin mekan kartı, rating, mesafe, fotoğraf, etiketler.
- **`PlaceDetailScreen.tsx`**: `getPlaceById` + fallback `getAllPlaces`, AI öneri entegrasyonu iyileştirmeleri.
- **`ReviewForm.tsx`**: i18n entegrasyonu, haptic feedback.
- **`CreateBottomSheet.tsx`**: safe area inset ile alt sheet konumlandırması.
- **`FilterBottomSheet.tsx`**: layout düzeltmeleri.
- **`HomeScreen.tsx`**: minor layout eklemeleri.
- **`explore/index.ts`**: gereksiz export kaldırıldı (lint/TS).
- **`SavedScreen.tsx`**: kullanılmayan import temizliği.
- **`AISearchScreen.tsx`**: AI health check, örnek sorgular, lokasyon seçimi, image search hook’ları.
- Demo tanı raporları: `DIAGNOSIS_REPORT.md`, `FINAL_TANI_RAPORU.md`, `ai_search_diagnostic.md`.

---

## 8. TypeScript / Lint Düzeltmeleri

- **`app/(tabs)/_layout.tsx`**: `@ts-expect-error` — expo-router `listeners` tip eksikliği.
- **`types/ai.ts`**: SmartSearch request/response alanları genişletildi (`language`, `locale`, cache metadata).
- **`types/recommend.ts`**: fallback response tipleri eklendi.
- **`useSettingsStore.ts`**: backend prefs tip tanımları (`BackendPrefs`).
- **`backend/tests/test_auth_features.py`**: pyright suppress direktifleri (test ortamı uyumu).
- **`explore/index.ts`**, **`SavedScreen.tsx`**: dead export/import temizliği.
- Genel: 56 dosyada ~1333 ekleme, ~336 silme (commit edilmemiş working tree).

---

## 9. Render / Qdrant / Google Cloud Kurulum Notları

### Canlı servisler (Render.com)
| Servis | URL |
|--------|-----|
| Backend API | `https://asemos-backend.onrender.com` |
| AI-LLM | `https://asemos-ai.onrender.com` |

### Backend env değişkenleri
```
DATABASE_URL
JWT_SECRET_KEY
JWT_ALGORITHM
JWT_ACCESS_TOKEN_EXPIRE_MINUTES
JWT_REFRESH_TOKEN_EXPIRE_DAYS
ALLOWED_ORIGINS
LLM_ENABLED
LLM_PROVIDER
GROQ_API_KEY
GROQ_MODEL
RECOMMEND_CACHE_TTL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
GOOGLE_MAPS_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_ALLOWED_CLIENT_IDS
APPLE_CLIENT_ID
APPLE_ALLOWED_CLIENT_IDS
```

### AI-LLM env değişkenleri
```
GROQ_API_KEY
GROQ_MODEL
SERPAPI_KEY
QDRANT_URL
QDRANT_API_KEY
QDRANT_COLLECTION_NAME
EMBEDDING_MODEL
EMBEDDING_DEVICE
RAG_DATA_PATH
RAG_AUTO_INDEX
RAG_INDEX_ON_STARTUP
RAG_FORCE_REINDEX
RAG_USE_LLM_GENERATOR
TOP_K_RESULTS
SIMILARITY_THRESHOLD
BACKEND_API_URL
DATABASE_URL
GOOGLE_MAPS_API_KEY
REDIS_URL          # opsiyonel — yoksa in-memory cache
CORS_ORIGINS
LLM_PROVIDER
HUGGINGFACE_MODEL
```

### Mobil EAS build env değişkenleri
```
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_AI_URL
EXPO_PUBLIC_DEV_API_HOST
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
```

### Deploy adımları (özet)

1. **GitHub’a push** — tüm servis kodları remote’ta olmalı.
2. **Render Backend** — root: `backend`, start: uvicorn; PostgreSQL addon bağla; env’leri gir.
3. **Render AI-LLM** — root: `ai-llm`, build: `build.sh`, start: `uvicorn app:app --host 0.0.0.0 --port $PORT`.
4. **Qdrant Cloud** (opsiyonel) — ücretsiz tier; `QDRANT_URL` + `QDRANT_API_KEY` AI servisine eklenir. Boş bırakılırsa in-memory mod çalışır (restart’ta veri kaybı riski).
5. **Google Cloud Console** — OAuth consent screen, Web/iOS/Android client’lar; SHA-1 fingerprint (Android).
6. **Apple Developer** — Sign in with Apple capability; bundle ID: `com.asemos.mobile`.
7. **EAS Build** — `eas build --platform android --profile production --clear-cache`.
8. **Doğrulama** — health endpoint’leri, login, AI arama, sosyal giriş cihaz testi.

### İlgili dokümantasyon
- `BULUT_TAŞIMA_REHBERİ.md`
- `ai-llm/DEPLOYMENT_SUMMARY.md`
- `RENDER_ENV_KONTROL.md`
- `SOCIAL_LOGIN_SETUP.md`
- `APK_BUILD_GUIDE.md`, `APK_YENIDEN_BUILD.md`

---

## 10. Bilinen Kalan Riskler / Yapılması Gerekenler

### Yüksek öncelik
- [ ] **Yeni APK build gerekli** — kodda URL’ler düzeltilmiş olsa bile mevcut cihazdaki APK eski bundle/cache ile build edilmiş olabilir; EAS production build + `--clear-cache` şart.
- [ ] **SerpAPI kota limiti** — ücretsiz/düşük planda aylık arama sınırı; kota dolunca smart-search yalnızca RAG fallback’e düşer, canlı Google sonuçları gelmez.
- [ ] **Sosyal giriş cihaz testi** — Google/Apple console ayarları + yeni native build olmadan production’da çalışmaz.

### Orta öncelik
- [ ] **Health endpoint tutarsızlığı**:
  - Backend `/health`: DB, cloud storage, LLM, WebSocket durumu (kapsamlı JSON).
  - AI `/health`: `{ status, version: "2.1.0", cache, model_loaded, rag: {...} }`.
  - Mobil `mekanService.checkHealth()` yalnızca `status === "ok"` kontrol eder; AI health ayrı `checkAIHealth()` ile çağrılır — iki servis farklı şema döner.
- [ ] **Qdrant in-memory fallback** — Render free tier restart sonrası vektör index sıfırlanabilir; production için Qdrant Cloud veya persistent volume önerilir.
- [ ] **Redis opsiyonel** — `REDIS_URL` yoksa cache devre dışı; performans etkilenir ama servis çalışır.
- [ ] **Apple e-posta tekrar göndermez** — ikinci Apple girişinde email claim gelmeyebilir; backend email zorunlu tutuyor, kalıcı `sub` eşlemesi için model genişletmesi gerekebilir.

### Düşük öncelik / iyileştirme
- [ ] **`de/fr/es/ar/ru` tam çeviri** — şu an İngilizce fallback kullanılıyor.
- [ ] **Production error tracking** — `logger.ts` içinde Sentry vb. TODO açık.
- [ ] **Gallery photo proxy** — `google_photo_ref:` galeri URL’leri backend’de henüz tam desteklenmiyor.
- [ ] **Render cold start** — free/starter planda ilk istek 30–60 sn gecikebilir.
- [ ] **Commit edilmemiş değişiklikler** — working tree’de 56 dosya modified/untracked; production’a almadan önce review + commit gerekir.

---

## Değişen Dosyalar (Özet)

| Alan | Başlıca dosyalar |
|------|------------------|
| AI / RAG | `ai-llm/app.py`, `ai-llm/src/recommendation/engine.py`, `ai-llm/src/api/recommendation.py`, `ai-llm/src/config.py`, `ai-llm/collect_400_places.py` |
| Backend auth | `backend/app/routers/auth.py`, `backend/config.py`, `backend/tests/test_auth_features.py`, `backend/.env.example` |
| Mobil core | `apps/mobile/app/index.tsx`, `apps/mobile/src/constants/api.ts`, `apps/mobile/src/services/aiService.ts`, `apps/mobile/src/services/mekanService.ts`, `apps/mobile/src/services/messageService.ts` |
| Mobil UI | `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/src/components/layout/Screen.tsx`, `apps/mobile/src/components/domain/place/PlaceCard.tsx` |
| i18n / locale | `apps/mobile/src/utils/locale.ts`, `apps/mobile/src/i18n.ts`, `apps/mobile/src/locales/tr.json`, `apps/mobile/src/locales/en.json` |
| Sosyal giriş | `apps/mobile/src/config/socialAuth.ts`, `LoginScreen.tsx`, `RegisterScreen.tsx`, `app.json`, `eas.json` |
| Config | `.env.example`, `apps/mobile/.env.example` |

---

## Son Git Commit’leri (referans)

```
ee09710 fix(ai-llm): smart-search-v2 uses RAG when SerpAPI is empty
33f6de3 Deploy RAG search endpoint
5481896 Fix pydantic-core build error in ai-llm
5818332 Fix PyTorch version for Render deployment
546fb22 Add Render.com deployment configuration for backend
940c6de feat: AI search with location filters and fallback mechanism
45bef6c feat: add ai-llm module, backend updates, mobile AI search
ed5e53c feat: implement data ingestion pipeline for Qdrant vector database
```

---

*Bu dosya Mayıs 2026 oturumu kapsamında oluşturulmuştur. Secret/API key değerleri kasıtlı olarak dahil edilmemiştir.*
