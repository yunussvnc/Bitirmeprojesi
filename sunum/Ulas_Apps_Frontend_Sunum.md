# Mobil Uygulama ve Frontend Sunumu
**Sunan:** Ulaş Can Demirtaş  
**Bölüm:** Mobile App & Frontend  
**Süre:** 5-7 dakika

---

## 1. Giriş ve Proje Hakkında

Merhaba, ben Ulaş Can Demirtaş. Projemizin mobil uygulama ve frontend geliştirmesinden sorumluyum.

**Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu** projesinde, kullanıcıların mobil cihazlardan erişebileceği, modern ve kullanıcı dostu arayüzü geliştirdim.

---

## 2. Teknoloji Stack

Mobil uygulamamızda kullandığımız teknolojiler:

- **React Native**: Cross-platform mobil uygulama framework'ü
- **TypeScript**: Tip güvenli JavaScript
- **Expo**: React Native geliştirme platformu
- **React Navigation**: Navigasyon kütüphanesi
- **Expo Router**: File-based routing
- **Axios**: HTTP client
- **AsyncStorage**: Local storage

---

## 3. Proje Yapısı

Mobil uygulamamız şu yapıda organize edildi:

```
apps/mobile/
├── app/                    # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigasyon
│   │   ├── index.tsx      # Home ekranı
│   │   ├── explore.tsx    # Keşfet ekranı
│   │   └── saved.tsx      # Kaydedilenler
│   ├── login.tsx          # Giriş ekranı
│   ├── place/[id].tsx     # Mekan detay
│   └── scan.tsx           # QR kod tarama
├── src/
│   ├── screens/           # Ekran bileşenleri
│   ├── components/        # Yeniden kullanılabilir bileşenler
│   ├── navigation/        # Navigasyon yapılandırması
│   ├── services/          # API servisleri
│   ├── context/           # Context providers
│   ├── hooks/             # Custom hooks
│   └── utils/             # Yardımcı fonksiyonlar
└── package.json
```

---

## 4. Ekranlar ve Özellikler

### 4.1. Giriş Ekranı (Login)

**Özellikler:**
- Modern ve kullanıcı dostu tasarım
- E-posta ve şifre girişi
- Kayıt ol linki
- Güvenli authentication

**Tasarım:**
- Gradient arka plan
- Yuvarlatılmış input alanları
- Büyük, tıklanabilir butonlar

### 4.2. Ana Sayfa (Home)

**Özellikler:**
- Önerilen mekanlar listesi
- Hızlı erişim kartları
- Kategori filtreleme
- Arama özelliği

**Tasarım:**
- Parallax scroll view
- Kart tabanlı mekan gösterimi
- İkon tabanlı navigasyon

### 4.3. Keşfet Ekranı (Explore)

**Özellikler:**
- Doğal dil ile mekan arama
- AI destekli öneriler
- Konum bazlı filtreleme
- Kategori bazlı arama

**Örnek Sorgular:**
- "Sakin bir kafe arıyorum"
- "Romantik restoran"
- "Deniz manzaralı mekan"

### 4.4. Kaydedilenler (Saved)

**Özellikler:**
- Kullanıcının kaydettiği mekanlar
- Favori listesi
- Geçmiş ziyaretler
- Özel notlar

### 4.5. Mekan Detay Sayfası

**Özellikler:**
- Mekan bilgileri (ad, açıklama, kategori)
- Konum haritası
- Yorumlar ve değerlendirmeler
- Fotoğraf galerisi
- QR kod tarama butonu
- Navigasyon başlatma

**Tasarım:**
- Hero image
- Scrollable content
- Sticky header
- Action buttons

### 4.6. QR Kod Tarama (Scan)

**Özellikler:**
- Kamera ile QR kod okuma
- Öğrenci doğrulama
- İndirim uygulama
- Yorum yapma yetkisi

**Kullanım Senaryosu:**
1. Kullanıcı mekana gider
2. QR kodu tarar
3. Öğrenci ise indirim uygulanır
4. Yorum yapma yetkisi kazanır

---

## 5. Navigasyon Yapısı

### 5.1. Tab Navigation

Ana navigasyon yapısı:

- **Home**: Ana sayfa
- **Explore**: Keşfet
- **Saved**: Kaydedilenler

### 5.2. Stack Navigation

Detay sayfaları için:

- Login → Tabs
- Tabs → Place Detail
- Tabs → Scan

### 5.3. File-based Routing

Expo Router ile:
- Otomatik route oluşturma
- Type-safe navigation
- Deep linking desteği

---

## 6. API Entegrasyonu

### 6.1. API Service

`src/services/api.ts` dosyasında:

- **Base URL**: Backend API URL'i
- **Axios Instance**: HTTP client
- **Error Handling**: Hata yönetimi
- **Request Interceptors**: Token ekleme

### 6.2. Mekan Servisi

`src/services/mekanService.ts` dosyasında:

- `getPlaces()`: Mekanları listeleme
- `getPlaceById()`: Mekan detayı
- `searchPlaces()`: Mekan arama
- `getRecommendations()`: AI önerileri

### 6.3. Authentication Service

- `login()`: Kullanıcı girişi
- `register()`: Kullanıcı kaydı
- `logout()`: Çıkış
- Token yönetimi

---

## 7. State Management

### 7.1. Context API

`src/context/AuthContext.tsx`:
- Kullanıcı authentication durumu
- Global state yönetimi
- Token saklama

### 7.2. Local Storage

AsyncStorage ile:
- Kullanıcı bilgileri
- Favori mekanlar
- Geçmiş aramalar

---

## 8. UI/UX Tasarım

### 8.1. Tasarım Prensipleri

✅ **Modern ve Minimal**
- Temiz arayüz
- Bol beyaz alan
- Okunabilir tipografi

✅ **Kullanıcı Dostu**
- Büyük tıklanabilir alanlar
- Anlaşılır ikonlar
- Hızlı erişim

✅ **Responsive**
- Farklı ekran boyutlarına uyum
- Tablet desteği
- Landscape/Portrait mod

### 8.2. Renk Paleti

- **Primary**: Mor gradient (#667eea → #764ba2)
- **Secondary**: Turuncu (#ff6000)
- **Background**: Beyaz/Gri
- **Text**: Koyu gri (#333)

### 8.3. Bileşenler

**Themed Components:**
- `ThemedText`: Tema destekli metin
- `ThemedView`: Tema destekli görünüm
- `ParallaxScrollView`: Parallax scroll efekti

**UI Components:**
- Butonlar
- Input alanları
- Kartlar
- Listeler

---

## 9. Özellikler ve Yetenekler

### 9.1. AI Destekli Arama

✅ **Doğal Dil Sorgusu**
- Kullanıcı doğal dil ile arama yapabilir
- "Sakin bir kafe" gibi sorgular

✅ **Kişiselleştirilmiş Öneriler**
- Kullanıcı tercihlerine göre öneriler
- Konum bazlı sıralama

### 9.2. Konum Özellikleri

✅ **GPS Entegrasyonu**
- Kullanıcı konumu tespiti
- Yakın mekanlar bulma
- Mesafe hesaplama

✅ **Harita Görünümü**
- Google Maps entegrasyonu (planlanan)
- Marker'lar ile mekan gösterimi
- Navigasyon başlatma

### 9.3. QR Kod Sistemi

✅ **QR Kod Tarama**
- Kamera ile QR kod okuma
- Öğrenci doğrulama
- İndirim uygulama

✅ **Doğrulanmış Yorumlar**
- QR kod ile doğrulanmış yorumlar
- Güvenilir içerik

---

## 10. Zorluklar ve Çözümler

### 10.1. Cross-Platform Uyumluluk

**Zorluk**: iOS ve Android farklılıkları

**Çözüm**: React Native ile native bileşenler kullanıldı

### 10.2. Navigasyon

**Zorluk**: Karmaşık navigasyon yapısı

**Çözüm**: Expo Router ile file-based routing

### 10.3. State Management

**Zorluk**: Global state yönetimi

**Çözüm**: Context API ve AsyncStorage kombinasyonu

### 10.4. API Entegrasyonu

**Zorluk**: Backend API ile senkronizasyon

**Çözüm**: Axios ile merkezi API servisi

---

## 11. Gelecek Geliştirmeler

### 11.1. Özellik Geliştirmeleri

- **Push Notifications**: Yeni öneriler, kampanyalar
- **Offline Mode**: İnternet olmadan çalışma
- **Dark Mode**: Karanlık tema desteği
- **Çoklu Dil**: İngilizce, Türkçe

### 11.2. UI/UX İyileştirmeleri

- **Animasyonlar**: Smooth geçişler
- **Skeleton Loading**: Yükleme animasyonları
- **Pull to Refresh**: Yenileme özelliği
- **Infinite Scroll**: Sonsuz scroll

### 11.3. Performans

- **Image Optimization**: Görsel optimizasyonu
- **Code Splitting**: Kod bölme
- **Lazy Loading**: Geç yükleme
- **Caching**: API response caching

### 11.4. Testing

- **Unit Tests**: Bileşen testleri
- **Integration Tests**: Entegrasyon testleri
- **E2E Tests**: End-to-end testler

---

## 12. Sonuç

Mobil uygulama ve frontend, projemizin kullanıcı arayüzünü oluşturuyor:

✅ Modern ve kullanıcı dostu tasarım
✅ Cross-platform uyumluluk
✅ AI destekli özellikler
✅ QR kod entegrasyonu
✅ Konum bazlı özellikler

**Teşekkürler!**

---

## Sorular ve Cevaplar

*Sunum sonrası sorular için hazır olun*
