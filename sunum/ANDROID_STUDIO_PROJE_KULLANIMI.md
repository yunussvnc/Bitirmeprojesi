# Android Studio'da Expo Projesi Kullanım Kılavuzu

## 📱 Android Studio'da Ne Yapmalısınız?

### ⚠️ ÖNEMLİ NOT:
Expo projeleri **managed workflow** kullanıyorsa, Android Studio'da doğrudan bir şey yapmanıza gerek **YOKTUR**. Ancak Android Studio'yu şu amaçlarla kullanabilirsiniz:

1. **Android Emulator Kurmak/Başlatmak** (Önerilen)
2. **Development Build Oluşturmak** (İleri seviye)
3. **Native Modüller Geliştirmek** (İleri seviye)

---

## 🎯 Senaryo 1: Android Emulator Kullanmak (Önerilen)

### Adım 1: Android Emulator Kurmak

1. **Android Studio'da:**
   - Üst menüden **Tools > Device Manager** seçin
   - **Create Device** butonuna tıklayın

2. **Cihaz Seçimi:**
   - Önerilen: **Pixel 5** veya **Pixel 6**
   - **Next** butonuna tıklayın

3. **Sistem Görüntüsü Seçimi:**
   - **API Level 33** veya **API Level 34** seçin (Android 13/14)
   - **Download** butonuna tıklayarak indirin (ilk kez)
   - **Next** butonuna tıklayın

4. **Emulator Ayarları:**
   - Emulator adını verin (örn: "Pixel_5_API_33")
   - **Finish** butonuna tıklayın

### Adım 2: Emulator'ü Başlatmak

1. **Device Manager'da:**
   - Oluşturduğunuz emulator'ün yanındaki **▶️ Play** butonuna tıklayın
   - Emulator açılmasını bekleyin (ilk açılışta biraz zaman alabilir)

2. **Emulator Hazır Olduğunda:**
   - Android ekranı görünür olmalı
   - Emulator çalışıyor demektir ✅

### Adım 3: Expo'yu Emulator'de Çalıştırmak

**Terminal'de (Android Studio'nun Terminal sekmesi veya PowerShell):**

```bash
cd apps/mobile
npm run android
```

Bu komut:
- Expo development server'ı başlatır
- Otomatik olarak emulator'de uygulamayı açar
- Hot reload aktif olur

---

## 🎯 Senaryo 2: Android Studio'da Projeyi İncelemek

### Android Studio'da Proje Yapısı:

Android Studio Expo projesini açtığınızda şu klasörleri görebilirsiniz:

```
apps/mobile/
├── app/                    # Expo Router sayfaları
├── src/                    # Kaynak kodlar
├── assets/                 # Görseller, ikonlar
├── components/             # React bileşenleri
├── node_modules/           # Bağımlılıklar
├── package.json            # Proje ayarları
└── app.json                # Expo yapılandırması
```

### Android Studio Özellikleri:

1. **Kod Editörü:**
   - TypeScript/React Native kodlarını düzenleyebilirsiniz
   - Syntax highlighting ve autocomplete aktif

2. **Git Entegrasyonu:**
   - VCS menüsünden Git işlemlerini yapabilirsiniz
   - Commit, push, pull işlemleri

3. **Terminal:**
   - Alt kısımdaki Terminal sekmesinden komut çalıştırabilirsiniz

---

## 🎯 Senaryo 3: Development Build Oluşturmak (İleri Seviye)

### Ne Zaman Gerekir?

- Custom native modüller kullanıyorsanız
- Expo Go'nun desteklemediği özellikler varsa
- Production build oluşturmak istiyorsanız

### Adımlar:

1. **EAS CLI Kurulumu:**
   ```bash
   npm install -g eas-cli
   ```

2. **EAS Login:**
   ```bash
   eas login
   ```

3. **Build Yapılandırması:**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

4. **Android Build:**
   ```bash
   eas build --platform android
   ```

**Not:** Bu işlem için Expo hesabı gereklidir.

---

## 🎯 Senaryo 4: Native Android Klasörünü Açmak

### Ne Zaman Gerekir?

- Native modül geliştiriyorsanız
- AndroidManifest.xml düzenlemek istiyorsanız
- Gradle ayarlarını değiştirmek istiyorsanız

### Adımlar:

1. **Prebuild Çalıştırın:**
   ```bash
   cd apps/mobile
   npx expo prebuild
   ```

2. **Android Klasörü Oluşur:**
   ```
   apps/mobile/
   ├── android/          # ← Bu klasör oluşur
   │   ├── app/
   │   ├── build.gradle
   │   └── ...
   ```

3. **Android Studio'da Açın:**
   - Android Studio'da **File > Open**
   - `apps/mobile/android` klasörünü seçin
   - **OK** butonuna tıklayın

4. **Gradle Sync:**
   - Android Studio otomatik olarak Gradle sync yapar
   - Sync tamamlandığında proje hazırdır

---

## 🚀 Hızlı Başlangıç: Şimdi Ne Yapmalısınız?

### Önerilen İşlem Akışı:

#### 1️⃣ Android Emulator Kurun (5-10 dakika)

```
Android Studio → Tools → Device Manager → Create Device
```

#### 2️⃣ Emulator'ü Başlatın

```
Device Manager → Emulator'ün yanındaki ▶️ Play butonu
```

#### 3️⃣ Expo'yu Emulator'de Çalıştırın

**Android Studio Terminal'inde:**
```bash
cd apps/mobile
npm run android
```

#### 4️⃣ Uygulama Açılır! 🎉

- Emulator'de uygulamanız görünür
- Kod değişiklikleriniz otomatik yenilenir (Hot Reload)

---

## 🔧 Sorun Giderme

### Emulator Açılmıyor:

1. **HAXM/Hyper-V Kontrolü:**
   - Windows'ta Hyper-V aktif olmalı
   - BIOS'ta Virtualization aktif olmalı

2. **SDK Kontrolü:**
   - Android Studio → Tools → SDK Manager
   - Android SDK Platform-Tools kurulu olmalı

### "npm run android" Çalışmıyor:

1. **Expo CLI Kontrolü:**
   ```bash
   npm install -g expo-cli
   ```

2. **Port Kontrolü:**
   ```bash
   # Port 8081 kullanımda mı?
   netstat -ano | findstr :8081
   ```

3. **Cache Temizleme:**
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```

### Android Studio Projeyi Tanımıyor:

- Android Studio Expo projelerini doğrudan açmak için tasarlanmamıştır
- Kod editörü olarak kullanabilirsiniz
- Build için Terminal'den `npm run android` kullanın

---

## 📝 Özet: Android Studio'da Yapılacaklar

| Görev | Gerekli mi? | Nasıl Yapılır? |
|-------|------------|----------------|
| **Android Emulator Kurmak** | ✅ Önerilen | Tools → Device Manager → Create Device |
| **Emulator Başlatmak** | ✅ Önerilen | Device Manager → Play butonu |
| **Kod Düzenlemek** | ✅ Yapılabilir | Android Studio editörü |
| **Git İşlemleri** | ✅ Yapılabilir | VCS menüsü |
| **Terminal Kullanmak** | ✅ Yapılabilir | Alt kısım Terminal sekmesi |
| **Development Build** | ⚠️ İleri seviye | EAS CLI ile |
| **Native Modül Geliştirme** | ⚠️ İleri seviye | `expo prebuild` sonrası |

---

## 🎓 Sonuç

**Android Studio'da şu an yapmanız gerekenler:**

1. ✅ **Android Emulator kurun ve başlatın**
2. ✅ **Terminal'den `npm run android` çalıştırın**
3. ✅ **Uygulamanızı emulator'de test edin**

**Android Studio'yu kod editörü olarak kullanabilirsiniz, ancak Expo projeleri için zorunlu değildir.**

---

**İpucu:** Expo Go ile gerçek cihazda test etmek daha hızlı ve kolaydır! Android Studio emulator'ü sadece native özellikler test ederken gereklidir.
