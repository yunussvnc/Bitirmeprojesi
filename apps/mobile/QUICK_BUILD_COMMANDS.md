# AsEmOs APK Build - Hızlı Başlangıç

## Tüm Komutları Sırayla Çalıştırın

### 1. EAS CLI Kurulumu
npm install -g eas-cli

### 2. Giriş
eas login

### 3. Klasöre Git
cd D:\BitirmeProjesi\apps\mobile

### 4. Build Başlat (Test için - Öneri)
eas build --platform android --profile preview

### 5. Build Başlat (Production - Final Versiyon)
eas build --platform android --profile production

## Notlar
- İlk build'de keystore oluşturması sorulacak → Y yazın
- Build 10-20 dakika sürer
- Terminal'de çıkan linke tıklayarak APK'yı indirin
- APK'yı hocanzla paylaşın (link, QR kod veya dosya olarak)

## Yardım
Detaylı rehber için: APK_BUILD_GUIDE.md
