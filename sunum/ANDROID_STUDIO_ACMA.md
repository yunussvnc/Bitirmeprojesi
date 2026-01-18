# Android Studio Nasıl Açılır?

## Yöntem 1: Başlat Menüsünden (En Kolay)

1. **Windows Başlat Menüsü**'nü açın (Windows tuşu)
2. **"Android Studio"** yazın
3. **Android Studio** uygulamasına tıklayın

## Yöntem 2: Dosya Gezgini'nden

Android Studio genellikle şu konumlarda kurulur:

### Standart Konum:
```
C:\Program Files\Android\Android Studio\bin\studio64.exe
```

### Alternatif Konumlar:
```
C:\Users\<KullanıcıAdı>\AppData\Local\Android\Android Studio\bin\studio64.exe
C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe
```

**Adımlar:**
1. Dosya Gezgini'ni açın
2. Yukarıdaki konumlardan birine gidin
3. `studio64.exe` dosyasına çift tıklayın

## Yöntem 3: PowerShell/CMD ile

### Komut Satırından:
```powershell
# Standart konum
& "C:\Program Files\Android\Android Studio\bin\studio64.exe"

# Veya kısayol varsa
Start-Process "Android Studio"
```

### Kısayol Oluşturma:
```powershell
# Masaüstüne kısayol oluştur
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Android Studio.lnk")
$Shortcut.TargetPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
$Shortcut.Save()
```

## Yöntem 4: Android Studio'yu Bulma

Eğer Android Studio kurulu ama nerede olduğunu bilmiyorsanız:

### PowerShell ile Arama:
```powershell
# Tüm sürücülerde arama (yavaş olabilir)
Get-ChildItem -Path C:\ -Filter "studio64.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName

# Sadece Program Files'da arama (daha hızlı)
Get-ChildItem -Path "C:\Program Files" -Filter "studio64.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
```

### Windows Arama ile:
1. Windows tuşu + S
2. "studio64.exe" yazın
3. Sonuçlardan Android Studio'yu bulun

## Yöntem 5: Android Studio Kurulu Değilse

Eğer Android Studio kurulu değilse:

### Kurulum Adımları:
1. **Android Studio İndir:**
   - https://developer.android.com/studio adresine gidin
   - "Download Android Studio" butonuna tıklayın

2. **Kurulum:**
   - İndirilen `.exe` dosyasını çalıştırın
   - Kurulum sihirbazını takip edin
   - Android SDK'yı da kurun

3. **İlk Açılış:**
   - Android Studio'yu açın
   - SDK'yı yapılandırın
   - Emulator kurulumunu yapın

## Android Studio Açıldıktan Sonra

### Expo Projesini Android Studio'da Açmak:

Android Studio'yu Expo projesi için kullanmak istiyorsanız:

1. **Android Studio'yu açın**
2. **"Open"** seçeneğini tıklayın
3. Şu klasöre gidin:
   ```
   D:\BitirmeProjesi\apps\mobile
   ```
4. Klasörü seçin ve açın

**Not:** Expo projeleri genellikle Android Studio'ya ihtiyaç duymaz. Expo Go ile test edebilirsiniz.

### Android Emulator Kullanmak İçin:

1. Android Studio'yu açın
2. **Tools > Device Manager** menüsüne gidin
3. **Create Device** butonuna tıklayın
4. Bir cihaz seçin (örn: Pixel 5)
5. Sistem görüntüsü seçin (API 33+ önerilir)
6. **Finish** ile emulator'ü oluşturun
7. Emulator'ü başlatın

### Expo ile Android Emulator Kullanımı:

Emulator çalıştıktan sonra:

```bash
cd apps/mobile
npm run android
```

Bu komut Expo'yu otomatik olarak emulator'de açar.

## Hızlı Komutlar

### Android Studio'yu Hızlı Açmak İçin:

**PowerShell'de:**
```powershell
# Standart konum
Start-Process "C:\Program Files\Android\Android Studio\bin\studio64.exe"

# Veya kısayol varsa
android-studio
```

**CMD'de:**
```cmd
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe"
```

## Sorun Giderme

### Android Studio Bulunamıyor:

1. **Kurulu mu kontrol edin:**
   - Ayarlar > Uygulamalar > Android Studio

2. **Yeniden kurun:**
   - Eski sürümü kaldırın
   - Yeni sürümü indirip kurun

3. **Kısayol oluşturun:**
   - `studio64.exe` dosyasını bulun
   - Sağ tık > "Send to > Desktop (create shortcut)"

### Android Studio Açılmıyor:

1. **Yönetici olarak çalıştırın**
2. **Java JDK kontrolü:**
   - Android Studio Java JDK gerektirir
   - JDK kurulu olmalı

3. **Log dosyalarını kontrol edin:**
   ```
   C:\Users\<KullanıcıAdı>\.AndroidStudio\system\log\
   ```

## Expo İçin Android Studio Gerekli mi?

**Hayır!** Expo projeleri için Android Studio zorunlu değildir:

- ✅ **Expo Go** ile gerçek cihazda test edebilirsiniz
- ✅ **Web** üzerinde test edebilirsiniz (`npm run web`)
- ⚠️ **Android Studio** sadece native modüller için gereklidir

### Ne Zaman Android Studio Gerekir?

- Custom native modüller kullanıyorsanız
- Development build oluşturuyorsanız
- Android emulator kullanmak istiyorsanız

---

**Not:** Expo projeniz için şu an Android Studio'ya ihtiyacınız yok. Expo Go ile test edebilirsiniz!
