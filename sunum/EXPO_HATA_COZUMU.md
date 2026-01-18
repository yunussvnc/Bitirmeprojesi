# Expo Timeout Hatası Çözüm Kılavuzu

## Hata Mesajı
```
There was a problem running the requested app.
Unknown error: The request timed out.
exp://192.168.1.41:8081
```

## Sorunun Nedenleri

Bu hata genellikle şu durumlardan kaynaklanır:
1. Metro bundler çalışmıyor
2. Cihaz ve bilgisayar aynı WiFi ağında değil
3. Firewall port 8081'i engelliyor
4. Port 8081 başka bir uygulama tarafından kullanılıyor

## Çözüm Adımları

### 1. Metro Bundler'ı Başlatın

```bash
cd apps/mobile
npm start
```

veya

```bash
cd apps/mobile
expo start
```

**Beklenen Çıktı:**
```
› Metro waiting on exp://192.168.1.41:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### 2. WiFi Bağlantısını Kontrol Edin

**Önemli:** Telefon ve bilgisayar aynı WiFi ağında olmalı!

**Kontrol:**
- Telefon WiFi ayarlarından ağ adını kontrol edin
- Bilgisayar WiFi ayarlarından ağ adını kontrol edin
- İkisi de aynı ağda olmalı

### 3. Tunnel Modunu Deneyin

Eğer WiFi sorunu varsa, tunnel modunu kullanın:

```bash
cd apps/mobile
expo start --tunnel
```

**Not:** Tunnel modu daha yavaş olabilir ama farklı ağlarda çalışır.

### 4. Firewall Ayarlarını Kontrol Edin

Windows Firewall port 8081'i engelliyor olabilir:

**Windows Firewall Kontrolü:**
1. Windows Güvenlik Duvarı'nı açın
2. "Gelen Kuralları" kontrol edin
3. Port 8081 için izin verin

**Hızlı Çözüm:**
```powershell
# PowerShell'i yönetici olarak çalıştırın
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

### 5. Port Kontrolü

Port 8081 kullanımda mı kontrol edin:

```powershell
netstat -ano | findstr :8081
```

Eğer port kullanımda ise:
- O process'i sonlandırın
- Veya farklı port kullanın: `expo start --port 8082`

### 6. Cache Temizleme

Cache sorunları için:

```bash
cd apps/mobile
expo start --clear
```

### 7. Expo Go Uygulamasını Yeniden Başlatın

- Expo Go uygulamasını kapatın
- Tekrar açın
- QR kodu tekrar tarayın

### 8. Manuel Bağlantı

QR kod çalışmıyorsa manuel bağlanın:

1. Expo Go'yu açın
2. "Enter URL manually" seçeneğini seçin
3. `exp://192.168.1.41:8081` yazın
4. Bağlan'a basın

## Alternatif Çözümler

### Web'de Çalıştırma

Eğer mobil cihazda sorun devam ediyorsa, web'de test edin:

```bash
cd apps/mobile
npm run web
```

Tarayıcıda `http://localhost:8081` açılacaktır.

### Android Emulator Kullanma

Android Studio emulator kullanabilirsiniz:

```bash
cd apps/mobile
npm run android
```

### iOS Simulator Kullanma (Mac)

```bash
cd apps/mobile
npm run ios
```

## Yaygın Hatalar ve Çözümleri

### Hata: "Unable to resolve module"

**Çözüm:**
```bash
cd apps/mobile
rm -rf node_modules
npm install
expo start --clear
```

### Hata: "Network request failed"

**Çözüm:**
- WiFi bağlantısını kontrol edin
- Tunnel modunu deneyin: `expo start --tunnel`
- Firewall ayarlarını kontrol edin

### Hata: "Port already in use"

**Çözüm:**
```bash
# Port'u kullanan process'i bulun
netstat -ano | findstr :8081

# Process'i sonlandırın (PID ile)
taskkill /PID <PID> /F

# Veya farklı port kullanın
expo start --port 8082
```

## Debugging İpuçları

### 1. Verbose Mode

Detaylı log için:
```bash
expo start --verbose
```

### 2. Metro Bundler Logları

Metro bundler loglarını kontrol edin:
- Terminal'de hata mesajları görünecektir
- Kırmızı hata mesajlarına dikkat edin

### 3. Expo DevTools

Expo Go uygulamasında:
- Cihazı sallayın (shake)
- "Debug Remote JS" seçeneğini açın
- Chrome DevTools açılacaktır

## Başarılı Bağlantı Kontrolü

Bağlantı başarılı olduğunda:
- ✅ Terminal'de "Metro waiting on..." mesajı görünür
- ✅ QR kod görünür
- ✅ Expo Go'da uygulama yüklenir
- ✅ "Building JavaScript bundle" mesajı görünür

## Hala Çalışmıyorsa

1. **Expo CLI'yi güncelleyin:**
   ```bash
   npm install -g expo-cli@latest
   ```

2. **Node.js versiyonunu kontrol edin:**
   ```bash
   node --version
   # Node.js 18+ olmalı
   ```

3. **Projeyi sıfırlayın:**
   ```bash
   cd apps/mobile
   npm run reset-project
   ```

4. **Expo Go uygulamasını güncelleyin:**
   - App Store / Play Store'dan güncelleyin

## İletişim ve Destek

Sorun devam ediyorsa:
- Expo dokümantasyonu: https://docs.expo.dev/
- Expo Discord: https://chat.expo.dev/
- GitHub Issues: https://github.com/expo/expo/issues

---

**Son Güncelleme:** 15 Ocak 2026
