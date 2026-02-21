# AsEmOs — Master Yol Haritası

> Kullanıcı tercihlerine göre mekan öneren, LLM ile kişisel açıklamalar üreten,
> sosyal akış ile mekan deneyimlerinin paylaşıldığı mobil uygulama.

---

## Mimari Hedef (Son Hali)

```
┌─────────────────────────────────────────────────────┐
│                    MOBİL (Expo)                      │
│                                                      │
│  [Ana Sayfa]  [Keşfet]  [Akış]  [Profil]           │
│   AI öneri     Harita    Sosyal   İstatistik         │
│   + filtre     + pin     feed     + tercih           │
│   + kartlar    + strip   + reel   + gönderiler       │
│                          + like   + takipçiler       │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (FastAPI)                    │
│                                                      │
│  Auth ─── Places ─── Recommend ─── Feed ─── Social   │
│  JWT       CRUD       LLM+Cache    Posts    Follow   │
│            Search     Scoring      Media    Notif    │
│            Nearby     Explain      Likes             │
└──────┬───────────┬───────────┬──────────────────────┘
       │           │           │
  PostgreSQL    Cloudinary   LLM (Ollama / OpenAI)
```

---

## Mevcut Durum Özeti

### Ne çalışıyor
- 4 tab: Ana Sayfa, Keşfet (harita), Kaydedilenler, Profil
- Ana Sayfa: arama + filtre + AI öneri + mekan listesi
- Keşfet: WebView + Leaflet harita, mekan pinleri
- Kaydedilenler: Zustand + AsyncStorage, swipe-to-delete
- Mekan Detay: review sistemi, geofence doğrulama, benzer mekanlar
- Backend: FastAPI + SQLite, Places CRUD, Reviews, Recommend (scoring + opsiyonel Ollama)

### Kritik sorunlar
- `getPlaces()` her yerde limit=500 ile tüm mekanları çekiyor
- `GET /places/:id` endpoint'i yok — her ekran tüm DB'yi indiriyor
- Auth tamamen mock (MOCK_TOKEN), JWT yok
- Bazı mekanların koordinatları yanlış, bazı mekanlar gerçekte yok
- Mekan görselleri Wikimedia/Unsplash URL'leri — cloud storage yok
- Duplicate state: useAppStore + useSavedPlaces aynı işi yapıyor
- RecommendRequest'te konum/radius yok
- SQLite + migration sistemi yok

---

## KADEME 0 — ZEMİN ✅ TAMAMLANDI

**Süre:** 1–2 hafta
**Amaç:** Her şeyin dayandığı sağlam temel.

### Backend

- [ ] `GET /health` endpoint'i ekle
  - Response: `{ "status": "ok", "db": true, "timestamp": "..." }`
  - Mobile açılışında bağlantı kontrolü için kullanılacak

- [ ] `GET /places/:id` endpoint'i ekle
  - Tek mekan çekme (PlaceDetail, benzer mekanlar vs. için kritik)
  - Response: `schemas.Place` objesi
  - 404 dön eğer mekan yoksa

- [ ] `GET /places` pagination düzelt
  - `page` ve `page_size` parametreleri (default: page=1, page_size=20)
  - Response formatı:
    ```json
    {
      "items": [...],
      "total": 245,
      "page": 1,
      "page_size": 20
    }
    ```
  - Mobile artık 500 mekan çekmek zorunda kalmayacak

- [ ] `.env` dosyası + pydantic-settings ile config
  - `DATABASE_URL`
  - `ALLOWED_ORIGINS`
  - `LLM_ENABLED` (true/false)
  - `LLM_PROVIDER` (ollama/openai/groq)
  - `CLOUDINARY_URL` (sonraki kademe için hazırlık)
  - `JWT_SECRET_KEY`
  - `JWT_ALGORITHM`

- [ ] Alembic migration sistemi kur
  - `alembic init alembic`
  - İlk migration: mevcut tabloları kaydet
  - Bundan sonra her model değişikliği migration ile olacak

### Mobile

- [ ] `mekanService.ts` refactor
  - `getPlaces(page, pageSize)` — paginated liste
  - `getPlaceById(id)` — tek mekan
  - `searchPlaces(query)` — mekan arama (sonraki kademe hazırlık)

- [ ] `API_BASE_URL` env-based yap
  - `expo-constants` ile dev/prod ayrımı
  - `app.config.ts` veya `constants/api.ts` içinde temiz yönetim

- [ ] State birleştir
  - `useAppStore` + `useSavedPlaces` → tek Zustand store
  - `savedPlaceIds`, `savedPlacesById`, `recentPrompts` tek yerde

- [ ] PlaceDetail'da `getPlaceById(id)` kullan
  - Artık 500 mekan çekip `find()` ile arama yok
  - Benzer mekanlar için ayrı API çağrısı (veya kategori bazlı endpoint)

- [ ] Health check
  - App açılırken `GET /health` çağır
  - Başarısızsa kullanıcıya uyarı göster

### Kademe 0 tamamlandığında
- Backend'e güvenle istek atılabiliyor
- Pagination çalışıyor
- Tek mekan çekilebiliyor
- State yönetimi temiz

---

## KADEME 1 — MEKAN VERİSİ TEMİZLİĞİ + CLOUD STORAGE ✅ TAMAMLANDI

**Süre:** 1–2 hafta
**Amaç:** Veritabanındaki mekanları gerçek, doğru ve görselli hale getir.

### 1A — Mekan Audit ve Temizlik

- [ ] Mevcut tüm mekanları listele ve audit et
  - Script yaz: her mekanın `name`, `lat`, `lng`, `address`, `photo_url` bilgisini CSV/JSON çıkar
  - Google Maps ile koordinatları doğrula

- [ ] Yanlış koordinatlı mekanları düzelt
  - Google Maps / OpenStreetMap'ten doğru lat/lng al
  - Script veya migration ile güncelle

- [ ] Gerçekte olmayan / kapanmış mekanları sil
  - Google Maps'te arayarak doğrula
  - `DELETE` script'i ile DB'den kaldır

- [ ] Duplicate mekanları temizle
  - Aynı isimde birden fazla kayıt olanları bul
  - Doğru olanı bırak, diğerlerini sil

- [ ] Hedef: 60–80 kaliteli, doğru İstanbul mekanı
  - Her mekanın doğru koordinatı var
  - Her mekanın açıklaması var
  - Her mekanın kategorisi var (Kafe, Bar, Restoran vb.)
  - Her mekanın fiyat aralığı var (1–4)
  - Her mekanın features'ı var (wifi, sessiz, canlı vb.)

### 1B — Cloudinary Entegrasyonu

- [ ] Cloudinary hesabı aç (ücretsiz plan yeterli)
  - 25 kredi/ay, 25.000 transformasyon
  - Fotoğraf + video upload desteği

- [ ] Backend'e Cloudinary SDK ekle
  - `pip install cloudinary`
  - `.env`'ye `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

- [ ] `POST /upload/image` endpoint'i
  - Multipart file upload → Cloudinary → URL dön
  - Response: `{ "url": "https://res.cloudinary.com/...", "public_id": "..." }`
  - Max boyut: 10MB
  - Otomatik optimize (quality, format, resize)

- [ ] `POST /upload/video` endpoint'i
  - Video upload → Cloudinary → URL + thumbnail URL dön
  - Max boyut: 100MB
  - Otomatik thumbnail generation

### 1C — Mekan Görsellerini Buluta Taşı

- [ ] Migration script yaz: `scripts/migrate_images_to_cloud.py`
  - Mevcut photo_url'leri (Wikimedia/Unsplash) indir
  - Cloudinary'ye yükle
  - DB'deki photo_url'leri yeni Cloudinary URL'leri ile güncelle
  - Log tut: hangi mekan güncellendi, hangisi başarısız

- [ ] Görseli olmayan mekanlar için stok görseller ekle
  - Kategori bazlı varsayılan görseller (kafe, bar, restoran vb.)
  - Cloudinary'ye yükle, mekan kaydına ata

- [ ] Mobile'da image caching policy ekle
  - `expo-image` zaten var, cache policy ayarla
  - Memory + disk cache
  - Placeholder görseller (skeleton)

### 1D — Seed Script Güncelle

- [ ] `scripts/seed_places.py` yeniden yaz
  - Temizlenmiş 60–80 mekan verisi
  - Doğru koordinatlar
  - Cloudinary URL'leri
  - Tutarlı kategori/features/price_range

### Kademe 1 tamamlandığında
- Veritabanında 60–80 doğru, gerçek İstanbul mekanı
- Her mekanın Cloudinary'de görseli var
- Upload altyapısı hazır (sosyal akış için gerekecek)
- Mobile'da görseller hızlı yükleniyor (cache)

---

## KADEME 2 — KİMLİK (JWT Auth) ✅

**Süre:** 1–2 hafta
**Amaç:** Gerçek kullanıcı tanıma. Sosyal akış, profil, kişiselleştirme hepsi buna bağlı.

### Backend

- [x] `python-jose[cryptography]` ekle requirements.txt'ye

- [x] JWT token sistemi (`backend/auth.py`)
  - Access token: 15 dakika ömür
  - Refresh token: 7 gün ömür
  - Secret key: `.env`'den

- [x] `POST /auth/register` güncelle → Token pair + user dönüyor
- [x] `POST /auth/login` güncelle → Gerçek JWT pair dönüyor (MOCK_TOKEN kaldırıldı)
- [x] `POST /auth/refresh` yeni endpoint
- [x] `GET /auth/me` yeni endpoint
- [x] `PUT /auth/me` yeni endpoint (profil güncelleme)

- [x] Auth middleware: `get_current_user` + `get_optional_user` dependency
  - Review'larda artık opsiyonel auth ile gerçek `user_id` kullanılıyor

- [x] User modeline yeni alanlar + Alembic migration
  - `username` (unique, indexed)
  - `avatar_url` (Cloudinary)
  - `bio`

### Mobile

- [x] Auth store (`src/store/useAuthStore.ts`) — Zustand + persist
  - `accessToken`, `refreshToken`, `user`, `hydrated`
  - `setTokens()`, `setUser()`, `logout()`

- [x] Auth service (`src/services/authService.ts`)
  - `loginUser()`, `registerUser()`, `refreshTokens()`, `getMe()`, `updateMe()`

- [x] Login ekranı → gerçek API ile entegre
- [x] Register ekranı → gerçek API ile entegre

- [x] API client'a auth header eklendi (`setAuthInterceptors`)
  - `Authorization: Bearer <token>` her istekte otomatik
  - 401 gelince `onUnauthorized` → logout

- [x] Auth guard (`app/_layout.tsx` — `useProtectedRoute`)
  - Token varsa → `/(tabs)`
  - Token yoksa → `/login`

- [x] `app/index.tsx` → auth durumuna göre redirect

### Kademe 2 tamamlandığında
- Gerçek kullanıcı girişi/kaydı
- JWT token yönetimi (access + refresh)
- Her API çağrısında kullanıcı tanınıyor
- Review'lar gerçek user_id ile kaydediliyor
- Profil bilgileri düzenlenebiliyor

---

## KADEME 3 — AKILLI ÖNERİ (LLM) ✅

**Süre:** 2–3 hafta
**Amaç:** Projenin ana değer önerisi. LLM = karar + verbalize katmanı.

### Backend — Recommend Pipeline

- [x] `RecommendRequest` güncelle (location, radius_m, category eklendi)
- [x] Mesafe bazlı ön filtreleme (Haversine + auto-expand radius)
- [x] Scoring sistemi (mesafe + vibe/purpose/budget + rating + query match)
- [x] LLM'e aday özeti gönder (id, name, category, mesafe, rating, fiyat, özellikler)
- [x] LLM response: `ranked_ids` + per-item `explanations` + `summary`
- [x] Prompt template (`llm_client.py` — RECOMMEND_PROMPT)
- [x] Cache layer (MD5 hash key, 30 dakika TTL, in-memory)
- [x] Fallback sistemi (LLM kapalı/hata → scoring-based sonuç)
- [x] Provider switch: `ollama` (local), `openai` (prod), `groq` (hızlı)

### Mobile

- [x] `RecommendRequest`/`RecommendItem`/`RecommendResponse` type güncelle
- [x] Home ekranında `expo-location` ile konum al + request'e ekle
- [x] PlaceCard'a `explanation`, `distance_m`, `isRecommended` prop'ları
- [x] "Senin için önerildi" badge (sparkles icon)
- [x] Mesafe gösterimi (450m / 1.2km)
- [x] Summary banner (kapatılabilir, LLM genel açıklaması)
- [x] AI loading state ("AI düşünüyor..." shimmer)

### Kademe 3 tamamlandığında
- Kullanıcı tercih seçiyor + konum gönderiliyor
- Backend filtreliyor + LLM sıralıyor + açıklama üretiyor
- Kartlarda kişisel "neden önerildi" açıklaması
- Cache ile hızlı tekrar sorgular
- Fallback ile her zaman sonuç dönüyor

---

## KADEME 4 — SOSYAL AKIŞ MVP ✅

**Süre:** 2–3 hafta
**Amaç:** Kaydedilenler tab'ını sosyal akışa dönüştür. Mekan odaklı içerik paylaşımı.

### Backend — Post Sistemi

- [x] `Post` modeli (Post, PostMedia, PostLike, PostComment)
  ```python
  class Post(Base):
      id: int (PK)
      user_id: int (FK → users)
      place_id: int (FK → places, nullable)
      caption: str
      post_type: str  # "photo", "reel", "review_highlight"
      like_count: int (default=0)
      comment_count: int (default=0)
      created_at: datetime
  ```

- [x] PostMedia, PostLike, PostComment modelleri + migration
- [x] Endpoint'ler: POST/GET /posts, GET /feed, DELETE /posts/:id, POST /posts/:id/like, GET/POST /posts/:id/comments, GET /users/:id/posts, GET /places/:id/posts
- [x] Feed: joinedload (User, Place, Media), pagination, is_liked_by_me

### Mobile — Akış Ekranı

- [x] Tab: "Kaydedilenler" → "Akış" (feed.tsx), Kayıtlı mekanlar → Keşfet altı strip
- [x] FeedScreen: FlatList, paginated, pull-to-refresh, boş state
- [x] FeedCard: Avatar, @username, timeAgo, place tag, media, like/comment, caption (expandable)
- [x] CreatePostScreen: expo-image-picker, caption, place (opsiyonel), Cloudinary upload → POST /posts
- [x] Like: buton toggle, optimistic update
- [x] Comment bottom sheet (MVP: endpoint hazır, UI tamamlandı)
- [x] Kayıtlı mekanlar mini strip (Keşfet haritası altında)

### Kademe 4 tamamlandığında
- Kullanıcılar fotoğraf/video ile mekan deneyimi paylaşıyor
- Feed akışı var (paginated, pull-to-refresh)
- Beğeni + yorum sistemi çalışıyor
- Gönderiler mekanlara bağlanabiliyor
- Eski "Kaydedilenler" tab'ı sosyal akışa dönüştü

---

## KADEME 5 — TAKİP + REELS + BİLDİRİM

**Süre:** 2–3 hafta
**Amaç:** Sosyal katmanı derinleştir. Instagram + TikTok melez deneyim.

### Backend — Follow Sistemi

- [x] `Follow` modeli
  ```python
  class Follow(Base):
      id: int (PK)
      follower_id: int (FK → users)
      following_id: int (FK → users)
      created_at: datetime
      # unique constraint: (follower_id, following_id)
  ```

- [x] `Notification` modeli
  ```python
  class Notification(Base):
      id: int (PK)
      user_id: int (FK → users)       # bildirim kime gidiyor
      type: str                         # "like", "comment", "follow", "mention"
      actor_id: int (FK → users)       # aksiyonu yapan
      post_id: int (FK → posts, nullable)
      is_read: bool (default=False)
      created_at: datetime
  ```

- [x] Follow endpoint'leri
  ```
  POST   /users/:id/follow       → Takip et (toggle)
  GET    /users/:id/followers     → Takipçiler (paginated)
  GET    /users/:id/following     → Takip edilenler (paginated)
  GET    /users/:id              → Kullanıcı profili (follower/following count dahil)
  ```

- [x] Feed v2: takip edilenler filtresi
  ```
  GET /feed?filter=all           → Herkesin gönderileri
  GET /feed?filter=following     → Sadece takip edilenler
  ```

- [x] Bildirim endpoint'leri
  ```
  GET    /notifications           → Bildirimler (paginated)
  PATCH  /notifications/read-all  → Tümünü okundu yap
  GET    /notifications/unread-count → Okunmamış sayısı (badge için)
  ```

- [x] Bildirim trigger'ları
  - Birisi seni takip etti → notification
  - Gönderine beğeni geldi → notification
  - Gönderine yorum geldi → notification

### Mobile — Reels

- [x] `ReelsView` bileşeni
  ```
  ┌────────────────────────┐
  │                        │
  │                        │
  │    🎬 Full Screen      │
  │       Video            │
  │       (auto-play)      │
  │                        │
  │                        │
  │         [❤️] 45        │  ← Sağ action column
  │         [💬] 12        │
  │         [📤]           │
  │         [📍]           │  ← Mekana git
  │                        │
  │  @username             │  ← Alt overlay
  │  📍 Ops Karaköy        │
  │  Cuma akşamı atmosferi │
  └────────────────────────┘
  ```
  - TikTok tarzı dikey FlatList, full-screen, snap scroll (pagingEnabled)
  - expo-av ile video playback
  - Viewability-based auto-play/pause (görünür → oynat, kaybolduysa durdur)

- [x] Feed tab'ında segment
  - Üst kısımda: `[Gönderi]  [Reels]` segment control
  - Veya swipe ile geçiş

- [x] Feed filtresi
  - "Herkes" / "Takip ettiklerim" toggle
  - Default: Herkes (daha fazla içerik)

- [x] Kullanıcı profil ekranı
  - Başka kullanıcıya tıkla → profili gör
  - Avatar, username, bio, follower/following sayıları
  - Gönderileri grid olarak
  - Follow/Unfollow butonu

- [x] Follow butonu
  - Animasyonlu takip/bırak
  - Optimistic update

- [x] Bildirimler
  - Profil ekranında veya ayrı sayfada
  - Tab bar'da bell icon + unread badge (Feed header)
  - Bildirim listesi: "X seni takip etti", "Y gönderini beğendi"

### Kademe 5 tamamlandığında
- Takipleşme sistemi çalışıyor
- Feed takip edilenlere filtrelenebiliyor
- Reels (kısa video) deneyimi var
- Bildirimler geliyor
- Tam sosyal medya deneyimi

---

## KADEME 6 — PROFİL ZENGİNLEŞTİRME + UI POLISH

**Süre:** 1–2 hafta
**Amaç:** Her şeyi cilalanmış, premium hisli hale getir.

### Profil Ekranı

```
┌────────────────────────────────────────┐
│                                        │
│          [📷 Avatar]                   │
│        @ulascandemirtas                │
│     "Kahve tutkunu, Kadıköy gezgini"  │
│                                        │
│   ┌─────┐  ┌─────┐  ┌─────┐          │
│   │  15 │  │  42 │  │  8  │          │
│   │Post │  │Takip│  │Takip│          │
│   │     │  │  çi │  │     │          │
│   └─────┘  └─────┘  └─────┘          │
│                                        │
│   [Profili Düzenle]                    │
│                                        │
│   ── Tercihlerim ─────────────────     │
│   [☕ Kafe] [🤫 Sessiz] [💰 Orta]     │
│                                        │
│   ── Gönderilerim ────────────────     │
│   [📷][📷][🎬]                        │
│   [📷][🎬][📷]                        │
│                                        │
│   ── Ziyaret İstatistikleri ──────     │
│   En çok: Kafe (%62) Bar (%20)        │
│   Bu ay: 8 ziyaret, 3 yorum           │
│   Favori bölge: Kadıköy               │
│                                        │
│   ── Son Yorumlarım ─────────────     │
│   ⭐⭐⭐⭐⭐ Kronotrop • 2g önce       │
│   "Harika kahve, WiFi hızlı..."       │
│                                        │
│   [⚙️ Ayarlar]  [🚪 Çıkış]           │
└────────────────────────────────────────┘
```

- [x] Profil istatistikleri backend endpoint'i
  - `GET /users/:id/stats` → ziyaret sayısı, yorum sayısı, favori kategori, favori bölge

- [x] Gönderi grid view (Instagram tarzı 3-column)

- [x] Profil düzenleme ekranı
  - Avatar değiştir (image picker → Cloudinary upload)
  - Username, bio düzenle

### UI/UX Polish

- [x] Her ekranda tutarlı skeleton/loading state (Ana sayfa PlaceCardSkeleton)
- [x] Shared element transitions (Place Detail FadeIn fallback animasyonu)
- [x] Pull-to-refresh her ekranda (index, saved, profile, feed; Keşfet'te refresh butonu)
- [x] Haptic feedback genişlet (like, save, follow, post, tab switch)
- [x] Error boundary + graceful degradation
- [x] Image caching (expo-image: memory + disk)
- [x] FlatList optimizasyonu (getItemLayout, maxToRenderPerBatch, windowSize)
- [x] Dark/Light tema polish
- [x] App icon ve splash screen finalize (placeholder asset'ler)
- [x] Micro-animasyonlar (Reanimated: FeedCard like scale, AnimatedPlaceCard FadeInDown)
- [x] Empty state görselleri (her ekran için)

### Kademe 6 tamamlandığında
- Profil zengin ve görsel
- Tüm ekranlar cilalanmış, premium his
- Tutarlı loading/error/empty state'ler
- Performans optimize

---

## KADEME 7 — SUNUM + DEMO READY ✅ TAMAMLANDI

**Süre:** 1 hafta
**Amaç:** Bitirme tezi için demo hazır ürün.

- [x] 60–80 gerçek İstanbul mekanı (doğru koordinat + Cloudinary görsel)
- [x] 5–10 demo kullanıcı hesabı
- [x] Her kullanıcıdan 3–5 örnek gönderi (fotoğraf + caption + mekan tag)
- [x] Örnek yorumlar ve puanlar
- [x] Takip ilişkileri (demo kullanıcılar arası)

- [x] 3 demo senaryo hazırla:
  1. "Kadıköy'de sessiz çalışma yeri" → LLM önerisi → PlaceDetail → Yorum
  2. "Arkadaşlarla bar" → LLM önerisi → Kaydet → Sosyal akışta paylaş
  3. "Keşfet haritasından mekan bul → git → geofence review bırak"

- [x] LLM her senaryoda tutarlı, anlamlı explanation üretiyor
- [x] Geofence review demo (gerçek konum ile)
- [x] Sosyal akış demo (gönderi paylaş → beğeni → yorum → takip)

- [x] Sunum materyalleri
  - Mimari diyagram
  - Ekran görüntüleri (her ekran, her state)
  - Kısa demo videosu (screen recording)
  - Teknik detay sunumu (LLM pipeline, geofence, auth akışı)

---

## TAKVİM ÖZETİ

```
Hafta     Kademe   Çıktı
─────     ──────   ──────────────────────────────────────────
1–2       K0       Temiz altyapı, pagination, tek mekan API
3–4       K1       Mekan temizliği + Cloudinary + görseller
5–6       K2       JWT Auth, login/register, auth guard
7–9       K3       LLM pipeline, kişisel öneriler, explanation
10–12     K4       Sosyal akış MVP (feed, post, like, comment)
13–14     K5       Takip + Reels + bildirimler
15–16     K6       Profil zengin, UI polish, animasyonlar
17        K7       Demo-ready, sunum hazırlığı
```

---

## HER KADEME SONRASI KONTROLLİST

- [ ] Yeni eklenen her endpoint Postman/curl ile test edildi mi?
- [ ] Mobile'da happy path çalışıyor mu?
- [ ] Error state'ler handle ediliyor mu?
- [ ] Bir önceki kademenin hiçbir özelliği kırılmadı mı?
- [ ] Linter hatası yok mu?
- [ ] Alembic migration'lar clean mi?

---

## TEKNİK NOTLAR

### Backend Dependency Eklentileri (tüm kademeler)
```
# Kademe 0
alembic

# Kademe 1
cloudinary

# Kademe 2
python-jose[cryptography]

# Kademe 3
redis (opsiyonel, cache için)
openai (opsiyonel, LLM provider)
groq (opsiyonel, LLM provider)
```

### Mobile Dependency Eklentileri (tüm kademeler)
```
# Kademe 5
expo-av (video playback, reels için)
```

### Dosya Yapısı Hedefi (Backend)
```
backend/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── crud.py
├── auth.py              ← JWT yardımcıları (Kademe 2)
├── cloud_storage.py     ← Cloudinary wrapper (Kademe 1)
├── llm_client.py
├── llm_recommend.py
├── config.py            ← pydantic-settings (Kademe 0)
├── .env
├── requirements.txt
├── alembic/             ← Migration'lar (Kademe 0)
│   ├── versions/
│   └── env.py
└── scripts/
    ├── seed_places.py   ← Temiz mekan verisi (Kademe 1)
    └── migrate_images_to_cloud.py  ← Görsel taşıma (Kademe 1)
```

### Dosya Yapısı Hedefi (Mobile - Yeni/Değişen)
```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      ← Tab düzeni güncelle (Kademe 4: Akış tab)
│   │   ├── index.tsx        ← Home (LLM kartları: Kademe 3)
│   │   ├── explore.tsx      ← Keşfet + kayıtlı strip (Kademe 4)
│   │   ├── feed.tsx         ← Sosyal akış (Kademe 4, eski saved.tsx)
│   │   └── profile.tsx      ← Profil zengin (Kademe 6)
│   ├── post/
│   │   └── [id].tsx         ← Gönderi detay (Kademe 4)
│   ├── user/
│   │   └── [id].tsx         ← Kullanıcı profil (Kademe 5)
│   ├── create-post.tsx      ← Gönderi oluştur (Kademe 4)
│   └── notifications.tsx    ← Bildirimler (Kademe 5)
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx     ← Gönderi kartı (Kademe 4)
│   │   ├── ReelsView.tsx    ← TikTok reels (Kademe 5)
│   │   ├── CommentSheet.tsx ← Yorum bottom sheet (Kademe 4)
│   │   └── LikeButton.tsx   ← Animasyonlu beğeni (Kademe 4)
│   ├── create/
│   │   ├── MediaPicker.tsx  ← Fotoğraf/video seçici (Kademe 4)
│   │   └── PlaceTagPicker.tsx ← Mekan etiketi (Kademe 4)
│   └── profile/
│       ├── ProfileHeader.tsx ← Profil üst kısım (Kademe 6)
│       ├── ProfileGrid.tsx   ← Instagram grid (Kademe 6)
│       └── FollowButton.tsx  ← Takip butonu (Kademe 5)
├── src/
│   ├── store/
│   │   └── useAppStore.ts   ← Birleşik store (Kademe 0)
│   ├── services/
│   │   ├── mekanService.ts  ← Refactored (Kademe 0)
│   │   ├── api.ts           ← Recommend (Kademe 3)
│   │   ├── authService.ts   ← Auth (Kademe 2)
│   │   ├── feedService.ts   ← Feed/Post (Kademe 4)
│   │   ├── socialService.ts ← Follow/Notif (Kademe 5)
│   │   └── uploadService.ts ← Cloudinary upload (Kademe 1)
│   └── types/
│       ├── place.ts
│       ├── recommend.ts     ← Güncelle (Kademe 3)
│       ├── auth.ts          ← Yeni (Kademe 2)
│       ├── post.ts          ← Yeni (Kademe 4)
│       └── social.ts        ← Yeni (Kademe 5)
```
