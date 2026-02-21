# AsEmOs Sunum Materyalleri

Bitirme tezi sunumu için teknik dokümantasyon.

---

## Mimari Diyagram

```
┌─────────────────────────────────────────────────────┐
│                    MOBİL (Expo)                      │
│                                                      │
│  [Ana Sayfa]  [Keşfet]  [Akış]  [Profil]           │
│   AI öneri     Harita    Feed     İstatistik         │
│   + filtre     + pin     + Reels  + tercih           │
│   + kartlar    + strip   + like   + gönderiler       │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (FastAPI)                    │
│                                                      │
│  Auth ─── Places ─── Recommend ─── Feed ─── Social   │
│  JWT       CRUD       LLM+Cache    Posts    Follow   │
│            Search     Scoring      Media    Notif    │
└──────┬───────────┬───────────┬──────────────────────┘
       │           │           │
  PostgreSQL   Cloudinary   LLM (Ollama / OpenAI)
```

---

## Ekran Görüntüsü Listesi

| Ekran | State | Açıklama |
|-------|-------|----------|
| Ana Sayfa | Normal | AI öneri, filtre, mekan kartları |
| Ana Sayfa | AI loading | "AI düşünüyor..." shimmer |
| Ana Sayfa | Empty | Sonuç bulunamadı |
| Keşfet | Harita | Pinler, strip, tema (açık/koyu) |
| Akış | Gönderi | Feed listesi, like, comment |
| Akış | Reels | Dikey video, viewability play |
| Akış | Empty | Henüz gönderi yok |
| Mekan Detay | Normal | Hero, review, benzer mekanlar |
| Create Post | Normal | Fotoğraf/Reel seçimi |
| Profil | Normal | Stats, grid, tema ayarı |
| Login / Register | - | Auth ekranları |

---

## Teknik Sunum Konuları

### LLM Pipeline
- RecommendRequest: query, location, radius, preferences
- Önce mesafe/havuz filtreleme, sonra scoring
- LLM'e aday özeti, ranked_ids + explanations döner
- Cache (MD5, 30 dk TTL)
- Fallback: LLM kapalıysa scoring-based sıralama

### Geofence Review
- Kullanıcı konumu (lat, lng) + mekan konumu
- Haversine mesafe < 150m → is_verified
- Backend doğrulama (client'a güvenilmez)

### Auth Akışı
- JWT (access + refresh)
- 401 → logout, /login'e yönlendirme
- Protected routes: tabs sadece token varsa

---

## Demo Video Önerisi

1. Giriş yap (demo1@asemos.app)
2. Senaryo 1: "Kadıköy sessiz çalışma" → AI öneri → Detay → Yorum
3. Senaryo 2: Mekan kaydet → Akış → Paylaş
4. Senaryo 3: Keşfet → Harita pin → Detay (opsiyonel geofence)

Süre: ~2-3 dakika
