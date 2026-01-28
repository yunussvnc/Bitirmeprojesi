# Implementation Guide - Location-Based Reviews

## ✅ Tamamlanan İşlemler

### 1. Favori Butonu Görünürlüğü ✅
- **Place Detail**: BlurView + shadow eklendi
- **Explore Screen**: BlurView + shadow eklendi
- Artık tüm arka planlarda görünür

### 2. Yeni Component'ler ✅
- `RatingStars.tsx` - 1-5 yıldız rating component
- `ReviewForm.tsx` - Yorum yapma formu
- `location.ts` - Konum utility (mesafe hesaplama, yakınlık kontrolü)

### 3. Place Detail Ekranı Güncellemeleri ✅
- QR kod sistemi kaldırıldı
- Konum tabanlı sistem eklendi
- Rating ve yorum formu eklendi

---

## 📦 Kurulum Gereksinimleri

### 1. expo-location Paketini Yükleyin

```bash
cd apps/mobile
npm install expo-location
```

**VEYA** `package.json`'a manuel ekledim, şimdi çalıştırın:
```bash
npm install
```

### 2. iOS İzinleri

`app.json` veya `app.config.js` dosyasına ekleyin:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Bu uygulama mekanların yakınında olup olmadığınızı kontrol etmek için konum bilgisine ihtiyaç duyar."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

---

## 🔧 Backend Güncellemeleri

### Review Endpoint'i Hazır

Backend'de `/reviews/` endpoint'i zaten var. Şu şekilde kullanılıyor:

```typescript
POST /reviews/
{
  "place_id": 1,
  "comment_text": "Harika bir mekan!",
  "rating": 5
}
```

**Not**: Backend'de `is_verified` field'ı var ama artık QR yerine konum kontrolü yapıyoruz. Backend'i güncellemek isterseniz:

```python
# backend/models.py
# is_verified yerine location_verified kullanabilirsiniz
# veya sadece konum kontrolü yapıyorsak is_verified=True yapabilirsiniz
```

---

## 🎯 Nasıl Çalışıyor?

### 1. Konum Kontrolü
- Kullanıcı place detail ekranına girdiğinde
- Otomatik olarak konum kontrolü yapılır
- Mekanın latitude/longitude'u varsa
- Kullanıcının konumu ile karşılaştırılır
- 200 metre radius içindeyse `isNearby = true`

### 2. Yorum Yapma
- Sadece `isNearby = true` iken yorum formu görünür
- 1-5 yıldız arası puan verilebilir
- Yorum yazılabilir (opsiyonel)
- Gönderildiğinde backend'e POST isteği atılır

### 3. Favori Butonu
- BlurView ile arka plan bulanıklaştırıldı
- Shadow eklendi
- Artık tüm resimlerde görünür

---

## 🐛 Sorun Giderme

### Konum İzni Verilmiyor
- iOS: Settings > Privacy > Location Services
- Android: Settings > Apps > Permissions > Location

### "Mekan yakınında değilsiniz" Hatası
- Backend'de mekanın `latitude` ve `longitude` değerleri olmalı
- Şu an mock data'da bu değerler yok olabilir
- Backend'de mekan eklerken koordinatları ekleyin

### expo-location Yüklenmedi
```bash
# Tekrar deneyin
npm install expo-location

# Veya cache temizleyin
npm cache clean --force
npm install
```

---

## 📝 Sonraki Adımlar

1. **Backend'de mekanlara koordinat ekleyin**
   ```python
   # Backend'de mekan eklerken:
   latitude = 41.0082  # İstanbul örneği
   longitude = 28.9784
   ```

2. **Test edin**
   - Place detail ekranına gidin
   - "Konumu Kontrol Et" butonuna basın
   - İzin verin
   - Yakındaysanız yorum formu görünecek

3. **İsteğe Bağlı İyileştirmeler**
   - Konum güncellemesi (periyodik kontrol)
   - Daha iyi hata mesajları
   - Konum geçmişi

---

## ✅ Test Checklist

- [ ] expo-location yüklendi mi?
- [ ] iOS/Android izinleri eklendi mi?
- [ ] Favori butonu görünüyor mu?
- [ ] Konum kontrolü çalışıyor mu?
- [ ] Yorum formu görünüyor mu? (yakındayken)
- [ ] Rating yıldızları çalışıyor mu?
- [ ] Yorum gönderiliyor mu?

---

**Hazır!** Şimdi `npm install` yapıp test edebilirsiniz.
