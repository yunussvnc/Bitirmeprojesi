# AsEmOs Android APK Build Rehberi

## Mevcut Durum ✅
- ✅ `eas.json` yapılandırıldı
- ✅ `app.json` Android ayarları tamamlandı
- ✅ `.env` production URL'leri ile güncellendi
- ✅ Backend: https://asemos-backend.onrender.com
- ✅ AI Servisi: https://asemos-ai.onrender.com

## Adım Adım APK Oluşturma Rehberi

### 1. EAS CLI Kurulumu

Terminal'i açın ve aşağıdaki komutu çalıştırın:

```bash
npm install -g eas-cli
```

Kurulumu doğrulamak için:

```bash
eas --version
```

### 2. Expo Hesabına Giriş

```bash
eas login
```

**Not:** Expo hesabınız yoksa, https://expo.dev adresinden ücretsiz hesap oluşturabilirsiniz.

### 3. Proje Klasörüne Gidin

```bash
cd D:\BitirmeProjesi\apps\mobile
```

### 4. Build Başlatın

**Önce önizleme build'i deneyin:**

```bash
eas build --platform android --profile preview
```

**Veya production build:**

```bash
eas build --platform android --profile production
```

### 5. Build Süreci

Build başlatıldığında:

1. **İlk seferinde:** Expo sizden Android Keystore oluşturmayı soracak
   - "Would you like to generate a Keystore?" → `Y` (Evet) seçin
   - Expo otomatik olarak keystore oluşturacak ve saklayacak

2. **Build süreci:**
   - Build Expo sunucularında başlayacak
   - Yaklaşık 10-20 dakika sürer
   - Terminal'de build durumunu görebilirsiniz

3. **Build tamamlandığında:**
   - Terminal'de bir link görünecek
   - Expo dashboard'da (https://expo.dev) build detaylarını görebilirsiniz

### 6. APK İndirme

Build tamamlandıktan sonra:

1. Terminal'deki linke tıklayın veya
2. https://expo.dev adresine gidin
3. Projenize girin
4. "Builds" sekmesinden APK dosyasını indirin

### 7. APK Paylaşımı

APK'yı hocanzla paylaşmak için:

**Seçenek 1: Direkt Link**
- Expo build sayfasındaki linki paylaşın
- Herkes bu linkten APK'yı indirebilir

**Seçenek 2: QR Kod**
- Expo dashboard'da QR kod oluşturabilirsiniz
- Hoca QR kod'u okutarak APK'yı indirebilir

**Seçenek 3: Dosya Transferi**
- APK'yı bilgisayarınıza indirin
- Google Drive, OneDrive veya e-posta ile paylaşın

## Build Profilleri

### Preview Profili
- Test ve demo için ideal
- Internal distribution (Google Play dışı)
- Hızlı build süreci
- APK formatı (direkt yüklenebilir)

### Production Profili
- Son kullanıcı sürümü için
- Google Play Store'a yüklenebilir
- APK veya AAB formatı

## Önemli Notlar

### APK Boyutu
- İlk build yaklaşık 50-100 MB olabilir
- Native modüller dahil edilir

### Güvenlik İzinleri
Uygulama şu izinleri kullanır:
- 📍 Konum (mekan yakınlığı kontrolü)
- 📷 Kamera (fotoğraf çekme)
- 🖼️ Galeri (fotoğraf ekleme)

### Android Versiyonu
- Minimum: Android 6.0 (API 23)
- Hedef: En son Android versiyonu

### Build Takibi

Build durumunu takip etmek için:

```bash
eas build:list
```

Belirli bir build'i görüntülemek için:

```bash
eas build:view [BUILD_ID]
```

## Sorun Giderme

### EAS CLI Bulunamadı Hatası
```bash
npm install -g eas-cli --force
```

### Giriş Sorunu
```bash
eas logout
eas login
```

### Build Başarısız Olursa
1. Hata mesajını okuyun
2. `eas build:list` ile detayları görün
3. Gerekirse `eas build --platform android --profile preview --clear-cache` ile cache'i temizleyerek tekrar deneyin

### Android Package Adı
- Package: `com.asemos.mobile`
- Bu değişmemeli (Google Play için gerekli)

## Build Sonrası

### APK Testi
1. Android telefonunuza indirin
2. "Bilinmeyen kaynaklar"dan yüklemeye izin verin
3. APK'yı açın ve yükleyin
4. Tüm özellikleri test edin:
   - Giriş yapma
   - Mekan arama
   - Konum izinleri
   - Fotoğraf yükleme
   - AI önerileri

### Versiyon Güncelleme

Yeni versiyon yayınlamak için:

1. `app.json` içinde version'ı artırın:
```json
"version": "1.0.1",
"android": {
  "versionCode": 2
}
```

2. Yeni build başlatın:
```bash
eas build --platform android --profile production
```

## Hızlı Komutlar

```bash
# EAS CLI kur
npm install -g eas-cli

# Giriş yap
eas login

# Preview build (test için)
eas build --platform android --profile preview

# Production build (final versiyon)
eas build --platform android --profile production

# Build listesi
eas build:list

# Build durumu
eas build:view [BUILD_ID]
```

## Yardım

Daha fazla bilgi için:
- Expo EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Dashboard: https://expo.dev
- EAS Build Fiyatlandırma: https://expo.dev/pricing (Ücretsiz plan mevcut)

## İletişim

Sorularınız için:
- Expo Community: https://forums.expo.dev
- Expo Discord: https://chat.expo.dev

---

**Başarılar! 🚀**

APK oluşturma işlemi başarılı olduğunda, hocanzla paylaşmaya hazır olacaksınız!
