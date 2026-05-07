# Mobile — AsEmOs Uygulaması

React Native / Expo tabanlı mobil uygulama. iOS ve Android'i destekler.

> **Son değişiklik:** Backend IP artık Expo'nun `hostUri`'sinden otomatik çözümlüyor — manuel IP güncellemesi gerekmiyor.

## Teknoloji Stack

```
React Native + Expo (SDK 52+)
├── Expo Router          → Dosya tabanlı navigasyon
├── TypeScript           → Tip güvenliği
├── Zustand              → Global state yönetimi
└── Servisler
    ├── API (port 8000)  → Ana backend (auth, feed, mekan, match)
    └── AI  (port 8080)  → AI arama servisi (mekan önerisi)
```

## Klasör Yapısı

```
apps/mobile/
├── app/                         ← Expo Router sayfa dosyaları
│   ├── _layout.tsx              ← Root layout (auth guard)
│   ├── index.tsx                ← Giriş yönlendirmesi
│   ├── login.tsx                ← Giriş ekranı
│   ├── register.tsx             ← Kayıt ekranı
│   ├── first-time-setup.tsx     ← İlk kurulum (profil, tercihler)
│   ├── (tabs)/                  ← Ana tab navigasyonu
│   │   ├── index.tsx            → Feed (ana akış)
│   │   ├── explore.tsx          → Mekan keşfet
│   │   ├── match.tsx            → Eşleşme
│   │   ├── messages.tsx         → Mesajlar
│   │   └── profile.tsx          → Profil
│   ├── (venue-tabs)/            ← Mekan detayı tab'ları
│   ├── place/                   ← Mekan detay sayfaları
│   ├── profile/                 ← Kullanıcı profil sayfaları
│   ├── chat/                    ← Mesajlaşma ekranları
│   └── settings/                ← Ayarlar
│
├── src/
│   ├── services/
│   │   ├── api.ts               ← Ana backend (port 8000) istekleri
│   │   └── aiService.ts         ← AI servis (port 8080) istekleri
│   ├── constants/
│   │   └── api.ts               ← API URL çözünürlüğü (dev/prod)
│   ├── components/              ← Paylaşılan UI bileşenleri
│   ├── hooks/                   ← Custom React hook'ları
│   ├── store/                   ← Zustand store (auth, feed, match)
│   ├── context/                 ← React Context'ler
│   ├── types/                   ← TypeScript tip tanımlamaları
│   │   └── ai.ts                ← AI servis tipleri
│   └── utils/                   ← Yardımcı fonksiyonlar
│
├── components/                  ← Global bileşenler
├── assets/                      ← Görseller, fontlar, ikonlar
├── app.json                     ← Expo konfigürasyonu
├── eas.json                     ← EAS Build konfigürasyonu
└── tsconfig.json                ← TypeScript konfigürasyonu
```

## Geliştirme Ortamı

```bash
cd apps/mobile

# Bağımlılıkları kur
npm install

# Expo geliştirme sunucusu başlat
npx expo start

# Platform seçenekleri
npx expo start --ios      # iOS Simulator
npx expo start --android  # Android Emulator
npx expo start --web      # Tarayıcı
```

## API Bağlantı Ayarları

`src/services/aiService.ts` ve `src/constants/api.ts` artık **Expo'nun kendi host'unu otomatik kullanıyor.**

```
Expo sunucusu
  ↓ hostUri → PC'nin Wi-Fi IP'ı otomatik alınır
API Base    : http://<expoHost>:8000
AI Service  : http://<expoHost>:8080
```

Telefon ve PC aynı Wi-Fi'deyse hiçbir ayar gerekmez. Override için `.env.local`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000
EXPO_PUBLIC_AI_URL=http://192.168.1.X:8080
```

## Ekranlar ve Özellikler

| Ekran | Açıklama |
|---|---|
| **Feed** | Arkadaş gönderileri ve story'ler |
| **Explore** | AI destekli mekan keşfi (doğal dil arama) |
| **Match** | Profil beğenme / eşleşme sistemi |
| **Messages** | Gerçek zamanlı chat (WebSocket) |
| **Profile** | Kullanıcı profili, takip, mekan geçmişi |
| **Place** | Mekan detayı, yorumlar, fotoğraflar |
| **Settings** | Hesap, bildirim, gizlilik ayarları |

## EAS Build (Production)

```bash
# Preview build (APK/IPA)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all
```
