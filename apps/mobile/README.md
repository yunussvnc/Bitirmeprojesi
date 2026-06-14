# AsEmOs - Mobil Uygulama (Expo SDK 54)

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) mobil istemci uygulamasıdır. React Native ve Expo SDK 54 kullanılarak geliştirilmiştir.

---

## 📱 Teknolojik Mimari ve Bağımlılıklar

*   **Çatı (Framework):** React Native (Expo SDK 54, Expo Router v6).
*   **Programlama Dili:** TypeScript.
*   **Yönlendirme (Routing):** Dosya sistemi tabanlı **Expo Router** (App Router yapısı).
*   **Durum Yönetimi (State):** **Zustand** (Hafif, modüler ve yüksek performanslı global state yönetimi).
*   **Harita Entegrasyonu:** `react-native-maps` (Keşfet haritası ve özel marker tasarımları).
*   **Yerelleştirme (Localization):** `i18next` & `react-i18next` (Türkçe ve İngilizce çoklu dil desteği).
*   **Yerel Donanım:** `expo-camera` ve `expo-image-picker` (Profil resmi, post ve hikaye görsel yüklemeleri için).
*   **Tasarım & İkonlar:** `lucide-react-native`, `tabler-icons-react-native` ve `expo-linear-gradient` (modern cam morfolojisi ve degrade renkler).

---

## 📂 Mobil Uygulama Dizin Yapısı

```text
mobile/
├── app/                      # Expo Router Sayfaları ve Yönlendirme (Routes)
│   ├── (tabs)/               # Normal Kullanıcı Sekmeleri (Explore, Feed, Match, Messages, Saved, Profile)
│   ├── (venue-tabs)/         # İşletme/Mekan Kullanıcı Sekmeleri
│   ├── settings/             # Ayarlar, Engellenenler, Bildirim ve Gizlilik Ekranları
│   ├── _layout.tsx           # Global Layout, JWT expire kontrolü ve Provider'lar
│   ├── login.tsx             # Giriş Ekranı (Sosyal + Normal Giriş)
│   ├── register.tsx          # Kayıt Ekranı
│   ├── first-time-setup.tsx  # İlk Kayıt Sonrası Detay Belirleme Sihirbazı
│   └── verify-email.tsx      # E-posta Doğrulama Ekranı
│
├── src/
│   ├── components/           # UI ve Domain Bileşenleri
│   │   ├── domain/           # Domain bazlı ekran tasarımları (explore, feed, match, chat)
│   │   └── ui/               # Yeniden kullanılabilir atomik arayüz bileşenleri
│   ├── context/              # Tema (Karanlık/Aydınlık) Context'i
│   ├── hooks/                # WebSocket bildirim ve ağ izleme hook'ları
│   ├── locales/              # i18n Dil JSON dosyaları (tr.json, en.json)
│   ├── providers/            # Push bildirim ve kütüphane sağlayıcıları
│   ├── services/             # API ve AI servis bağlantı katmanı (Axios istemcileri)
│   ├── store/                # Zustand Global Mağazaları (Zustand Stores)
│   └── utils/                # JWT Interceptor'lar ve yardımcı fonksiyonlar
├── app.json                  # Expo Konfigürasyon Dosyası
├── package.json              # Uygulama Bağımlılıkları
└── tsconfig.json             # TypeScript Konfigürasyonu
```

---

## ✨ Öne Çıkan Arayüz Özellikleri ve Zustand Stores

### 1. Keşfet Ekranı ve İlçe Filtresi (`ExploreScreen`)
*   Harita üzerinde İstanbul'un ilçelerine göre filtreleme imkanı sunar.
*   Kullanıcı konumu alındığında harita otomatik olarak o noktaya odaklanır.
*   Mekan detay parametreleri sayfalar arası taşınarak anında (instant) render edilir.

### 2. Hikaye (Stories) Paylaşımı ve Gösterimi (`feedService` & `storyService`)
*   Instagram stili üst hikaye halkaları (story ring) tasarımı.
*   Kamera veya galeriden görsel seçerek açıklama ekleme ve hikaye olarak paylaşma ekranı.
*   Arka planda hikayeler 24 saat sonra silinir.

### 3. Gelişmiş Medya Yükleme Hattı (`useUploadPipelineStore`)
*   Büyük dosyaların yüklenmesi esnasında ekranda **UploadProgressBanner** gösterilerek kullanıcının yükleme yüzdesi ve durumu gerçek zamanlı olarak takip etmesi sağlanır.
*   Yüklemeler esnasında **Blurhash** kodları üretilerek yavaş ağlarda görseller yüklenene kadar güzel bir arka plan placeholder'ı gösterilir.

### 4. Çevrimdışı Önbellek Sistemi (`useOfflineCache`)
*   Uygulamanın internet bağlantısı kesildiğinde, önceden yüklenmiş olan mekan listesi, kullanıcı profili ve geçmiş mesajlar çevrimdışı önbellekten okunarak uygulamanın kesintisiz çalışması sağlanır.

### 5. Kısıtlı Hesaplar ve Engelleme/Raporlama (`useSettingsStore`)
*   Ayarlar ekranı üzerinden engellenen kullanıcılar, kısıtlanan hesaplar ve raporlanan içerikler dinamik olarak yönetilebilir.
*   Engellenen kullanıcıların postları sosyal akıştan ve mesaj listelerinden otomatik olarak gizlenir.

---

## 🛠️ Yerel Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleme
Mobil dizine geçerek gerekli paketleri yükleyin:
```bash
cd apps/mobile
npm install
```

### 2. Çevre Değişkenleri Konfigürasyonu
`apps/mobile/.env.local` dosyasını oluşturun:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_AI_URL=http://localhost:8080
```
*Not: Gerçek cihazlarda test ederken `localhost` yerine bilgisayarınızın yerel IP adresini (örn: `http://192.168.1.X:8000`) yazmalısınız.*

### 3. Expo Geliştirme Sunucusunu Başlatma
```bash
# Expo'yu başlatın
npx expo start
```
*   **Android için:** Konsolda `a` tuşuna basın veya fiziksel cihazınızdan QR kodu okutun.
*   **iOS için:** Konsolda `i` tuşuna basın veya kameranızdan QR kodu okutun.
*   **Web için:** `npm run web` komutu ile tarayıcıda çalıştırın.
*   **Metro Cache Temizleme:** Eğer paketleme esnasında sorun yaşarsanız `npx expo start -c` ile cache temizleyerek başlatın.
