# Android Emulator "Offline" Hatası Çözümü

## 🔴 Sorun: `adb.exe: device offline`

Emulator görünüyor ama "offline" durumunda. Bu, emulator'ün tamamen açılmamış olduğu anlamına gelir.

---

## ✅ Çözüm Adımları

### 1️⃣ Emulator'ü Tamamen Kapatın

**Android Studio'da:**
1. Device Manager'ı açın (Tools > Device Manager)
2. Çalışan emulator'ün yanındaki **⏹️ Stop** butonuna tıklayın
3. Emulator'ün tamamen kapanmasını bekleyin (30-60 saniye)

**VEYA PowerShell'de:**
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" emu kill
```

### 2️⃣ ADB Server'ı Yeniden Başlatın

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" kill-server
Start-Sleep -Seconds 2
& "$env:ANDROID_HOME\platform-tools\adb.exe" start-server
```

### 3️⃣ Emulator'ü Android Studio'dan Yeniden Başlatın

**Android Studio'da:**
1. **Tools > Device Manager**
2. Emulator'ünüzün yanındaki **▶️ Play** butonuna tıklayın
3. **Emulator'ün tamamen açılmasını bekleyin** ⏳
   - Android boot animasyonu görünmeli
   - Ana ekran görünene kadar bekleyin (2-5 dakika sürebilir)
   - Emulator'ün hazır olduğundan emin olun

### 4️⃣ Emulator Hazır Olduğunda Kontrol Edin

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

**Beklenen Çıktı:**
```
List of devices attached
emulator-5554    device    ← "device" görünmeli, "offline" değil!
```

### 5️⃣ Expo'yu Çalıştırın

Emulator hazır olduktan sonra:

```powershell
cd apps/mobile
npm run android
```

---

## 🔧 Alternatif Çözümler

### Çözüm A: Emulator'ü Komut Satırından Başlatın

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"

# Mevcut emulator'leri listeleyin
& $emulatorPath -list-avds

# Emulator'ü başlatın (AVD adını değiştirin)
& $emulatorPath -avd Pixel_5_API_33
```

### Çözüm B: Emulator'ü Cold Boot ile Başlatın

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"

# Cold boot (tam yeniden başlatma)
& $emulatorPath -avd Pixel_5_API_33 -wipe-data
```

**⚠️ Dikkat:** `-wipe-data` emulator'ü sıfırlar, tüm veriler silinir!

### Çözüm C: Expo Go ile Test Edin (Önerilen)

Android Studio emulator'ü sorunluysa, **Expo Go** kullanın:

```powershell
cd apps/mobile
npm start
```

Sonra telefonunuzda Expo Go uygulamasıyla QR kodu tarayın.

---

## 🎯 Adım Adım: Şimdi Ne Yapmalısınız?

### Hızlı Çözüm:

1. **Android Studio'yu açın**
2. **Tools > Device Manager**
3. Çalışan emulator varsa **⏹️ Stop** butonuna tıklayın
4. **▶️ Play** butonuna tıklayarak yeniden başlatın
5. **Emulator'ün tamamen açılmasını bekleyin** (Ana ekran görünene kadar)
6. **PowerShell'de:**
   ```powershell
   cd apps/mobile
   npm run android
   ```

### Emulator Açılmıyorsa:

**Android Studio'da:**
1. **Tools > SDK Manager**
2. **SDK Tools** sekmesine gidin
3. Şunların kurulu olduğundan emin olun:
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Build-Tools
4. **Apply** ve **OK** ile kurun

---

## 📋 Kontrol Listesi

- [ ] Emulator tamamen kapatıldı mı?
- [ ] ADB server yeniden başlatıldı mı?
- [ ] Emulator Android Studio'dan yeniden başlatıldı mı?
- [ ] Emulator'ün ana ekranı görünüyor mu?
- [ ] `adb devices` komutu "device" gösteriyor mu?
- [ ] Expo çalıştırıldı mı?

---

## 🚨 Hala Çalışmıyorsa

### 1. Emulator Loglarını Kontrol Edin

Android Studio'da:
- **View > Tool Windows > Logcat**
- Hataları kontrol edin

### 2. Hyper-V Kontrolü (Windows)

```powershell
# Hyper-V aktif mi?
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
```

### 3. Emulator'ü Yeniden Oluşturun

Android Studio'da:
1. **Tools > Device Manager**
2. Emulator'ü silin (Delete)
3. Yeni emulator oluşturun (Create Device)
4. API Level 33 veya 34 seçin

### 4. Android Studio'yu Yeniden Başlatın

Bazen Android Studio'nun kendisini yeniden başlatmak sorunu çözer.

---

## 💡 İpucu: Expo Go Kullanın

Android emulator sorunluysa, **Expo Go** kullanmak daha hızlı ve kolaydır:

```powershell
cd apps/mobile
npm start
```

Telefonunuzda Expo Go uygulamasıyla QR kodu tarayın. Emulator'e göre çok daha hızlı çalışır!

---

## 📞 Son Çare

Eğer hiçbir şey işe yaramazsa:

1. **Android Studio'yu kapatın**
2. **Bilgisayarı yeniden başlatın**
3. **Android Studio'yu açın**
4. **Emulator'ü başlatın ve tamamen açılmasını bekleyin**
5. **Expo'yu çalıştırın**

---

**Not:** Emulator'ün tamamen açılması 2-5 dakika sürebilir. Sabırlı olun! 🕐
