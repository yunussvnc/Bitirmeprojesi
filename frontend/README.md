# Mekan Öneri Platformu - Mobile App

Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun mobil uygulaması.

## Teknolojiler

- **React Native** - Cross-platform mobil uygulama framework'ü
- **TypeScript** - Tip güvenli JavaScript
- **React Navigation** - Navigasyon kütüphanesi
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **Expo** - React Native geliştirme platformu

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)

### Adımlar

1. Repository'yi klonlayın:
```bash
git clone <repository-url>
cd frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin ve API URL'ini ayarlayın
```

4. Uygulamayı başlatın:
```bash
npm start
# veya
yarn start
```

5. Mobil cihazda çalıştırmak için:
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## Proje Yapısı

```
frontend/
├── src/
│   ├── components/    # Yeniden kullanılabilir bileşenler
│   ├── screens/       # Ekran bileşenleri
│   ├── navigation/    # Navigasyon yapılandırması
│   ├── services/      # API servisleri
│   ├── context/       # Context providers
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Yardımcı fonksiyonlar
│   ├── types/         # TypeScript tip tanımları
│   └── App.tsx        # Ana uygulama bileşeni
├── android/           # Android native kodları
├── ios/               # iOS native kodları
└── package.json       # Bağımlılıklar
```

## Özellikler

### Authentication
- Kullanıcı girişi (JWT tabanlı)
- Kullanıcı kaydı
- Oturum yönetimi

### Mekanlar
- Mekan listesi
- Mekan detay sayfası
- Kategori bazlı filtreleme
- Konum bazlı sıralama

### Öneriler (RAG Interface)
- Doğal dil ile mekan arama
- Kişiselleştirilmiş öneriler
- Konum bazlı öneriler
- Öneri gerekçeleri

## Geliştirme

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
# Android
npm run android

# iOS
npm run ios
```

## Ortam Değişkenleri

`.env` dosyasında şu değişkenler bulunmalı:

- `EXPO_PUBLIC_API_URL` - Backend API URL'i (örn: http://localhost:8000)

## Konfigürasyon

`app.json` dosyasında uygulama ayarları bulunur:
- Uygulama adı
- Bundle identifier
- İzinler (konum erişimi vb.)

## Lisans

MIT

## Katkıda Bulunanlar

- **Ulaş Can Demirtaş** - UI/UX tasarımı, navigasyon, ekranlar
- **Utku Gülrek** - API entegrasyonu, frontend API servisleri

