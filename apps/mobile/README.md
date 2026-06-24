# AsEmOs — Mobil Uygulama (Expo SDK 54)

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) mobil istemci uygulamasıdır. React Native ve Expo SDK 54 kullanılarak modern, performans odaklı ve çapraz platform (Cross-platform) standartlarına uygun şekilde geliştirilmiştir.

---

## 📱 Teknolojik Mimari ve Bağımlılıklar

*   **Çatı (Framework):** React Native (Expo SDK 54, Expo Router v6).
*   **Programlama Dili:** TypeScript.
*   **Yönlendirme (Routing):** Dosya sistemi tabanlı **Expo Router** (Tab ve Stack yapısı bir arada).
*   **Durum Yönetimi (State):** **Zustand** (Hafif, modüler ve yüksek performanslı global state yönetimi).
*   **Harita Motoru:** **WebView + Leaflet JS** (Harici yerel modül gerektirmeyen, yüksek performanslı ve özelleştirilebilir interaktif harita altyapısı).
*   **Yerelleştirme (Localization):** `i18next` & `react-i18next` (Türkçe ve İngilizce çoklu dil desteği).
*   **Donanım Entegrasyonları:** `expo-camera` ve `expo-image-picker` (Profil resmi, sosyal gönderi ve hikaye medya paylaşımları için yerel kamera erişimi).
*   **Arayüz Tasarımı:** Modüler Vanilla CSS & Stylesheets, `expo-linear-gradient` ve `lucide-react-native` ikon seti (modern cam morfolojisi - glassmorphism ve degrade geçişler).

---

## 📂 Dizin Yapısı

```text
mobile/
├── app/                      # Expo Router Sayfaları ve Yönlendirme (Routes)
│   ├── (tabs)/               # Normal Kullanıcı Sekmeleri (Explore, Feed, Match, Messages, Saved, Profile)
│   ├── (venue-tabs)/         # İşletme/Mekan Kullanıcı Sekmeleri
│   ├── settings/             # Ayarlar, Engellenenler, Bildirim ve Gizlilik Ekranları
│   ├── _layout.tsx           # Global Layout, JWT expire kontrolü ve Context Provider'lar
│   ├── login.tsx             # Giriş Ekranı (Sosyal + Normal Giriş)
│   ├── register.tsx          # Kayıt Ekranı
│   ├── first-time-setup.tsx  # İlk Kayıt Sonrası Detay Belirleme Sihirbazı
│   └── verify-email.tsx      # E-posta Doğrulama Ekranı
│
├── src/
│   ├── components/           # UI ve Domain Bileşenleri
│   │   ├── domain/           # Sektörel/Domain bazlı ekran tasarımları (explore, feed, match, chat)
│   │   └── ui/               # Yeniden kullanılabilir atomik arayüz bileşenleri (Button, Input, Card vb.)
│   ├── context/              # Tema (Karanlık/Aydınlık) Context'i
│   ├── hooks/                # WebSocket bildirim ve ağ izleme hook'ları
│   ├── locales/              # i18n Dil JSON dosyaları (tr.json, en.json)
│   ├── providers/            # Push bildirim ve kütüphane sağlayıcıları
│   ├── services/             # API ve AI servis bağlantı katmanı (Axios istemcileri)
│   ├── store/                # Zustand Global Mağazaları (Zustand Stores)
│   └── utils/                # JWT Interceptor'lar ve yardımcı konumsal fonksiyonlar
├── app.json                  # Expo Konfigürasyon Dosyası
├── package.json              # Uygulama Bağımlılıkları
└── tsconfig.json             # TypeScript Konfigürasyonu
```

---

## ✨ Öne Çıkan Arayüz Özellikleri ve Çözülen Kritik Sorunlar

### 1. WebView Tabanlı Gelişmiş Harita (Leaflet JS) Entegrasyonu
Eski yerel `react-native-maps` kütüphanesinin simülatörlerde ve Expo Go üzerinde yarattığı bağımlılık sorunlarını aşmak amacıyla tamamen WebView tabanlı asenkron bir Leaflet harita motoru entegre edilmiştir:
*   **Marker Drift (Pin Kayması) Çözümü:** Leaflet marker'larının flexbox stilleriyle çakışarak harita kaydırıldığında koordinatlardan sapması engellenmiştir. Leaflet wrapper sınıfı boş (`className: ''`) bırakılıp, stiller doğrudan alt `.custom-marker-inner` div yapısına aktarılarak pin kaymaları tamamen çözülmüştür.
*   **Harita Kontrast ve Etiketleri (Dark Mode):** Harita karanlık modda iken sokak isimlerinin ve caddelerin görünürlüğünü kaybetmemesi amacıyla CartoDB'nin `dark_all` tile sunucuları entegre edilmiştir. Aydınlık modda ise `light_all` tile'ları kullanılır.
*   **Zoom Duyarlı Etiketler:** Pinlerin altında yer alan mekan isim etiketlerinin yarattığı görsel karmaşayı önlemek için, isimler yalnızca harita zoom seviyesi **`>= 14`** olduğunda görünecek şekilde optimize edilmiştir.
*   **Maksimum Harita Performansı:** Pin çizimleri `requestAnimationFrame` (`addBatch`) ile asenkron gruplandırılarak WebView'a aktarılan payload küçültülmüş ve harita hareket ederken pin güncellemeleri **120ms debounce** ile filtrelenerek donmalar engellenmiştir.

### 2. Android BlurView Kırpılma (Clipping) Sorunu Giderimi
Giriş (`LoginScreen`) ve Kayıt (`RegisterScreen`) ekranlarında kullanılan estetik buzlu cam (`BlurView`) kartlarının Android işletim sisteminde köşe yuvarlama (`borderRadius`) ve kenarlık kesilmesi sorunları çözülmüştür:
*   `BlurView` bileşeninin doğrudan stillendirilmesi yerine standart bir parent `View` içerisine absolute yerleşim yapılmış, `overflow: 'hidden'` katmanı dış kapsayıcıya verilerek her iki platformda da kusursuz pürüzsüz köşeler elde edilmiştir.

### 3. Şifre Giriş Alanı İyileştirmeleri
Şifre giriş bileşenindeki (`Input.tsx`) göz ikonunun tıklama zorlukları ve metin kesilme hataları giderilmiştir:
*   İkon boyutu `22`ye çıkarılmış, dikey metin kesilmelerini engellemek için dikey padding oranları dengelenmiştir.
*   Kullanıcıların ikona dokunma hassasiyetini artırmak amacıyla göz ikonuna **`hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}`** alanı tanımlanarak tıklama alanı genişletilmiştir.

### 4. Optimize Edilmiş Medya Yükleme Hattı (`useUploadPipelineStore`)
*   Kullanıcıların profil resmi, post veya hikaye yüklerken yaşadığı belirsizlikleri ortadan kaldırmak için, arka plan yüklemelerini takip eden ve ekranın üstünde yer alan dinamik bir **UploadProgressBanner** geliştirilmiştir.
*   Yüklemeler esnasında sunucuda üretilen **Blurhash** kodları sayesinde, resimlerin aslı yüklenene kadar arayüzde estetik bir bulanık placeholder render edilir.

### 5. Çevrimdışı (Offline) Önbellek Sistemi (`useOfflineCache`)
*   Uygulamanın internet bağlantısı kesildiğinde, Zustand store'larındaki son güncel veriler (Mekan listeleri, profil bilgileri, geçmiş mesajlar) yerel önbellek (AsyncStorage) üzerinden okunarak uygulamanın kesintisiz hizmet sunması sağlanır.

---

## ⚙️ Yerel Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleme
Mobil dizine geçerek gerekli npm paketlerini yükleyin:
```bash
cd apps/mobile
npm install
```

### 2. Çevre Değişkenleri Yapılandırması
`apps/mobile/` dizini altında bir `.env.local` dosyası oluşturun ve backend/AI servislerinizin adreslerini tanımlayın:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_AI_URL=http://localhost:8080
```
*Not: Fiziksel cihazlarda test ederken `localhost` yerine bilgisayarınızın yerel ağ IP adresini (örneğin: `http://192.168.1.50:8000`) girmelisiniz.*

### 3. Expo Geliştirme Sunucusunu Başlatma
```bash
npx expo start
```
Terminalde karşınıza çıkan menüden:
*   **Android için:** `a` tuşuna basın (emülatör yüklüyse) veya fiziksel cihazınızdan Expo Go uygulamasını açıp QR kodu okutun.
*   **iOS için:** `i` tuşuna basın (Xcode Simulator yüklüyse) veya kameranızdan QR kodu okutun.
*   **Metro Cache Temizleme:** Eğer paketleme esnasında sorun yaşarsanız `npx expo start -c` komutuyla cache temizleyerek başlatın.
