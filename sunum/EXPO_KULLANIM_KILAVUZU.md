# Expo Kullanım Kılavuzu
**Proje:** Yapay Zeka Destekli Mekan Öneri Platformu - Mobile App

---

## 1. Expo Nedir?

**Expo**, React Native uygulamaları geliştirmek için kullanılan bir platform ve araç setidir. Native kod yazmadan cross-platform (iOS, Android, Web) uygulamalar geliştirmenizi sağlar.

### Expo'nun Avantajları

✅ **Kolay Kurulum**: Native SDK kurulumu gerekmez
✅ **Hızlı Geliştirme**: Hot reload ve fast refresh
✅ **Cross-Platform**: Tek kod ile iOS, Android, Web
✅ **Zengin API'ler**: Kamera, konum, bildirimler vb.
✅ **Expo Go**: Gerçek cihazda test etme

---

## 2. Projede Expo Kullanımı

### 2.1. Proje Yapısı

Projemizde **Expo Router** kullanılıyor. Bu, file-based routing sistemidir:

```
apps/mobile/
├── app/                    # Expo Router sayfaları
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Ana sayfa (/)
│   ├── login.tsx          # Login sayfası (/login)
│   ├── (tabs)/            # Tab navigasyon grubu
│   │   ├── _layout.tsx    # Tab layout
│   │   ├── index.tsx      # Home tab (/)
│   │   ├── explore.tsx    # Explore tab (/explore)
│   │   └── saved.tsx      # Saved tab (/saved)
│   └── place/
│       └── [id].tsx       # Dynamic route (/place/123)
├── app.json               # Expo konfigürasyonu
└── package.json          # Bağımlılıklar
```

### 2.2. File-Based Routing

Expo Router, dosya sistemini kullanarak otomatik route oluşturur:

| Dosya Yolu | URL |
|------------|-----|
| `app/index.tsx` | `/` |
| `app/login.tsx` | `/login` |
| `app/(tabs)/index.tsx` | `/` (tab) |
| `app/(tabs)/explore.tsx` | `/explore` |
| `app/place/[id].tsx` | `/place/123` (dynamic) |

---

## 3. Kurulum ve Başlatma

### 3.1. Gereksinimler

- **Node.js** 18+ yüklü olmalı
- **npm** veya **yarn** paket yöneticisi
- **Expo CLI** (otomatik yüklenir)

### 3.2. Kurulum Adımları

```bash
# 1. Proje klasörüne git
cd apps/mobile

# 2. Bağımlılıkları yükle
npm install
# veya
yarn install

# 3. Expo CLI'yi global yükle (opsiyonel)
npm install -g expo-cli
```

### 3.3. Uygulamayı Başlatma

```bash
# Development server'ı başlat
npm start
# veya
expo start
```

Bu komut çalıştığında:
- Metro bundler başlar
- QR kod gösterilir
- Terminal'de seçenekler görünür

---

## 4. Geliştirme Modları

### 4.1. Expo Go ile Test (Önerilen - Hızlı)

**Expo Go**, gerçek cihazda uygulamayı test etmek için kullanılır:

1. **Expo Go uygulamasını indir:**
   - iOS: App Store'dan "Expo Go"
   - Android: Play Store'dan "Expo Go"

2. **QR kodu tara:**
   ```bash
   npm start
   # Terminal'de QR kod görünür
   # Expo Go uygulaması ile tara
   ```

3. **Otomatik yenileme:**
   - Kod değişikliklerinde otomatik yenilenir
   - Hot reload aktif

**Avantajlar:**
- ✅ Hızlı test
- ✅ Gerçek cihazda çalışır
- ✅ Native API'ler çalışır

**Sınırlamalar:**
- ❌ Custom native modüller çalışmaz
- ❌ Bazı özel native kodlar gerekebilir

### 4.2. Development Build (Gelişmiş)

Custom native modüller için:

```bash
# Development build oluştur
npx expo run:android
# veya
npx expo run:ios
```

**Avantajlar:**
- ✅ Tüm native modüller çalışır
- ✅ Production'a yakın deneyim

**Sınırlamalar:**
- ❌ İlk build zaman alır
- ❌ Her değişiklikte rebuild gerekebilir

### 4.3. Web'de Çalıştırma

```bash
# Web'de başlat
npm run web
# veya
expo start --web
```

Tarayıcıda `http://localhost:8081` adresinde açılır.

---

## 5. Expo Router Kullanımı

### 5.1. Sayfa Oluşturma

Yeni bir sayfa oluşturmak için `app/` klasörüne dosya ekleyin:

```typescript
// app/about.tsx
import { View, Text } from 'react-native';

export default function AboutScreen() {
  return (
    <View>
      <Text>Hakkımızda</Text>
    </View>
  );
}
```

Bu dosya otomatik olarak `/about` route'unu oluşturur.

### 5.2. Navigasyon

Expo Router'da navigasyon için `expo-router` kullanılır:

```typescript
import { Link, router } from 'expo-router';

// Link ile navigasyon
<Link href="/login">Giriş Yap</Link>

// Programatik navigasyon
router.push('/login');
router.replace('/home');
router.back();
```

### 5.3. Dynamic Routes

Parametreli route'lar için köşeli parantez kullanın:

```typescript
// app/place/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  
  return <Text>Place ID: {id}</Text>;
}
```

Kullanım: `/place/123` → `id = "123"`

### 5.4. Layout Dosyaları

Layout dosyaları (`_layout.tsx`) sayfa grupları için ortak layout sağlar:

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    </Tabs>
  );
}
```

---

## 6. Projede Kullanılan Expo Özellikleri

### 6.1. Expo Router

✅ **File-based routing**: Otomatik route oluşturma
✅ **Type-safe navigation**: TypeScript desteği
✅ **Deep linking**: URL ile sayfa açma

### 6.2. Expo Constants

```typescript
import Constants from 'expo-constants';

// Uygulama bilgileri
Constants.expoConfig?.name;
Constants.manifest?.version;
```

### 6.3. Expo Font

```typescript
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'CustomFont': require('./assets/fonts/CustomFont.ttf'),
});
```

### 6.4. Expo Image

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
/>
```

### 6.5. Expo Haptics

```typescript
import * as Haptics from 'expo-haptics';

// Titreşim efekti
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

---

## 7. app.json Konfigürasyonu

`app.json` dosyası Expo uygulamasının konfigürasyonunu içerir:

```json
{
  "expo": {
    "name": "mobile",
    "slug": "mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png"
      }
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### Önemli Ayarlar

- **name**: Uygulama adı
- **slug**: Expo proje slug'ı
- **icon**: Uygulama ikonu
- **plugins**: Expo plugin'leri
- **orientation**: Ekran yönü (portrait/landscape)

---

## 8. Komutlar

### 8.1. Geliştirme Komutları

```bash
# Development server başlat
npm start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır (Mac gerekli)
npm run ios

# Web'de çalıştır
npm run web
```

### 8.2. Build Komutları

```bash
# Android APK oluştur
npx expo build:android

# iOS IPA oluştur (Mac + Apple Developer gerekli)
npx expo build:ios

# EAS Build (önerilen)
eas build --platform android
eas build --platform ios
```

### 8.3. Diğer Komutlar

```bash
# Lint çalıştır
npm run lint

# Type check
npx tsc --noEmit

# Cache temizle
expo start --clear
```

---

## 9. Debugging

### 9.1. React Native Debugger

```bash
# Chrome DevTools
# Metro bundler çalışırken 'j' tuşuna bas
# veya
# http://localhost:8081/debugger-ui
```

### 9.2. Console Logs

```typescript
console.log('Debug mesajı');
console.warn('Uyarı');
console.error('Hata');
```

### 9.3. Expo DevTools

Expo Go uygulamasında:
- Shake cihazı (fiziksel cihaz)
- Veya `Cmd+D` (iOS Simulator)
- Veya `Cmd+M` (Android Emulator)

---

## 10. Yaygın Sorunlar ve Çözümler

### 10.1. Metro Bundler Hatası

```bash
# Cache temizle
expo start --clear
# veya
rm -rf node_modules
npm install
```

### 10.2. Port Zaten Kullanılıyor

```bash
# Farklı port kullan
expo start --port 8082
```

### 10.3. Expo Go Bağlanamıyor

- Aynı WiFi ağında olduğunuzdan emin olun
- Firewall ayarlarını kontrol edin
- Tunnel modunu deneyin: `expo start --tunnel`

### 10.4. TypeScript Hataları

```bash
# Type check
npx tsc --noEmit

# Cache temizle
rm -rf .expo
expo start --clear
```

---

## 11. Projede Kullanılan Expo Paketleri

### 11.1. Core Paketler

- `expo`: Expo SDK
- `expo-router`: File-based routing
- `expo-constants`: Uygulama sabitleri
- `expo-font`: Font yönetimi
- `expo-image`: Görsel optimizasyonu

### 11.2. UI Paketleri

- `expo-haptics`: Titreşim efektleri
- `expo-splash-screen`: Splash screen
- `expo-status-bar`: Status bar kontrolü

### 11.3. Navigation

- `@react-navigation/native`: Navigasyon
- `@react-navigation/bottom-tabs`: Tab navigasyon
- `@react-navigation/native-stack`: Stack navigasyon

---

## 12. Best Practices

### 12.1. Dosya Organizasyonu

```
app/
├── (tabs)/          # Tab grupları
├── (auth)/          # Auth sayfaları
└── _layout.tsx      # Root layout
```

### 12.2. Component Yapısı

```typescript
// app/components/Button.tsx
import { TouchableOpacity, Text } from 'react-native';

export function Button({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

### 12.3. State Management

```typescript
// Context API kullanımı
import { createContext, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## 13. Production'a Hazırlık

### 13.1. Environment Variables

```typescript
// .env dosyası
EXPO_PUBLIC_API_URL=http://api.example.com

// Kullanım
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### 13.2. App Icons ve Splash Screen

- `assets/images/icon.png`: 1024x1024
- `assets/images/splash-icon.png`: Splash screen
- `app.json`'da konfigüre edilir

### 13.3. Build Konfigürasyonu

```json
{
  "expo": {
    "build": {
      "production": {
        "env": {
          "EXPO_PUBLIC_API_URL": "https://api.production.com"
        }
      }
    }
  }
}
```

---

## 14. Kaynaklar

### 14.1. Dokümantasyon

- **Expo Docs**: https://docs.expo.dev
- **Expo Router**: https://docs.expo.dev/router/introduction
- **React Native**: https://reactnative.dev

### 14.2. Topluluk

- **Expo Discord**: https://chat.expo.dev
- **GitHub**: https://github.com/expo/expo
- **Stack Overflow**: `expo` tag'i

---

## 15. Özet

Expo kullanımı projemizde:

✅ **File-based routing** ile kolay navigasyon
✅ **Hot reload** ile hızlı geliştirme
✅ **Cross-platform** desteği
✅ **Zengin API'ler** ile native özellikler
✅ **Expo Go** ile kolay test

**Komutlar:**
- `npm start`: Development server
- `npm run android`: Android'de çalıştır
- `npm run ios`: iOS'ta çalıştır
- `npm run web`: Web'de çalıştır

---

**Sorularınız için hazırız!**
