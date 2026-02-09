# Brand Image Mapping Sistemi

## Sorun
Köfteci Yusuf, Burger King, McDonald's gibi tanınmış markaların kendine has görseli yoktu:
- Rastgele/uyumsuz görseller güveni düşürüyordu
- Marka tanınırlığı sağlanamıyordu
- Her mekan için aynı generic görsel kullanılıyordu
- Kullanıcı deneyimi tutarsızdı

## Çözüm: 3-Tier Image Fallback System

### Öncelik Sırası

```
1. API photo_url (varsa)
   ↓
2. Brand Detection (name matching)
   ↓
3. Category Placeholder
   ↓
4. Default Image
```

### 1. API photo_url (En Yüksek Öncelik)

```tsx
if (place.photo_url) {
  return { uri: place.photo_url };
}
```

**Ne zaman kullanılır:**
- Backend'den `photo_url` geliyorsa
- Gerçek mekan fotoğrafı varsa
- Admin tarafından özel görsel yüklenmişse

### 2. Brand Detection (Marka Tespiti)

**Anahtar Kelime Eşleştirme (Case-Insensitive):**
```tsx
function detectBrandImage(placeName: string): string | null {
  const lowerName = placeName.toLowerCase().trim();
  
  for (const [keyword, imageUrl] of Object.entries(BRAND_IMAGE_MAP)) {
    if (lowerName.includes(keyword)) {
      return imageUrl;
    }
  }
  
  return null;
}
```

**Örnek Eşleştirmeler:**
```
"Köfteci Yusuf - Beşiktaş" → "köfteci yusuf" → ✅ Kebap görseli
"Starbucks Nişantaşı" → "starbucks" → ✅ Starbucks görseli
"McDonald's Taksim" → "mcdonald" → ✅ McDonald's görseli
"Burger King Kadıköy" → "burger king" → ✅ Burger King görseli
```

### 3. Category Placeholder

```tsx
function getCategoryPlaceholder(category?: string): string | null {
  if (!category) return null;
  
  const lowerCategory = category.toLowerCase().trim();
  return CATEGORY_PLACEHOLDER_MAP[lowerCategory] || null;
}
```

**Kategori Eşleştirmeleri:**
```
category: "cafe" → ☕ Cafe görseli
category: "restoran" → 🍽️ Restaurant görseli
category: "bar" → 🍺 Bar görseli
category: "gece kulübü" → 🎵 Nightclub görseli
```

### 4. Default Image

```tsx
const DEFAULT_PLACE_IMAGE_URI = 
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";
```

**Ne zaman kullanılır:**
- Hiçbir eşleşme yoksa
- Fallback of fallback

## Brand Image Map

### Fast Food Chains
```tsx
"burger king": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800",
"mcdonald": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
"kfc": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
"popeyes": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
"subway": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
```

### Turkish Restaurants
```tsx
"köfteci yusuf": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",
"ciğerci": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",
"ocakbaşı": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
"kebap": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",
"pide": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
"lahmacun": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
```

### Coffee Chains
```tsx
"starbucks": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
"kahve dünyası": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
"espresso lab": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
"caribou": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
"gloria": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
"nero": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
```

### Turkish Chains
```tsx
"mado": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
"simit sarayı": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
"günaydın": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
"nusr-et": "https://images.unsplash.com/photo-1558030006-450675393462?w=800",
"çiya": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
"sütiş": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
"muhallebici": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
```

### International Chains
```tsx
"pizza hut": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
"domino": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
"papa john": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
"sbarro": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
```

### Bars & Clubs
```tsx
"360": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
"reina": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
"sortie": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
"anjelique": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
"ruby": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
"mikla": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
"sunset": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
```

## Category Placeholder Map

```tsx
const CATEGORY_PLACEHOLDER_MAP = {
  // Cafe
  "cafe": "☕ Cafe image",
  "kafe": "☕ Cafe image",
  "coffee": "☕ Cafe image",
  
  // Restaurant
  "restaurant": "🍽️ Restaurant image",
  "restoran": "🍽️ Restaurant image",
  
  // Bar
  "bar": "🍺 Bar image",
  "pub": "🍺 Bar image",
  
  // Club
  "club": "🎵 Nightclub image",
  "nightclub": "🎵 Nightclub image",
  "gece kulübü": "🎵 Nightclub image",
  
  // Fast Food
  "fast food": "🍔 Fast food image",
  "fastfood": "🍔 Fast food image",
};
```

## Kullanım

### Otomatik (Mevcut Kod)
```tsx
import { getPlaceImageSource } from '@/src/utils/placeImages';

// PlaceCard, PlaceDetail, vb. tüm yerlerde otomatik çalışır
const imageSource = getPlaceImageSource(place);

<Image source={imageSource} />
```

### Örnek Senaryolar

**Senaryo 1: API'den photo_url var**
```tsx
place = {
  name: "Köfteci Yusuf",
  photo_url: "https://example.com/real-photo.jpg",
  category: "Restoran"
}

Result: "https://example.com/real-photo.jpg" ✅
```

**Senaryo 2: Marka eşleşmesi**
```tsx
place = {
  name: "Köfteci Yusuf - Beşiktaş",
  photo_url: null,
  category: "Restoran"
}

Result: Kebap görseli (brand match) ✅
```

**Senaryo 3: Kategori fallback**
```tsx
place = {
  name: "Yeni Açılan Kafe",
  photo_url: null,
  category: "Cafe"
}

Result: Cafe placeholder ✅
```

**Senaryo 4: Default fallback**
```tsx
place = {
  name: "Bilinmeyen Mekan",
  photo_url: null,
  category: null
}

Result: Default restaurant image ✅
```

## Yeni Marka Ekleme

### 1. Brand Map'e Ekle
```tsx
const BRAND_IMAGE_MAP = {
  // ... existing brands
  "yeni marka": "https://images.unsplash.com/photo-xxxxx?w=800",
};
```

### 2. Anahtar Kelime Seçimi
- **Küçük harf kullan:** "burger king" ✅ not "Burger King" ❌
- **Kısa ve benzersiz:** "starbucks" ✅ not "starbucks coffee" ❌
- **Yaygın varyasyonları düşün:** "mcdonald" (McDonald's, McDonalds, McDonald)

### 3. Görsel Seçimi
- **Unsplash kullan:** Yüksek kalite, ücretsiz
- **800px width:** Performans için optimize
- **Markayı temsil eden:** Generic değil, spesifik
- **Consistent style:** Diğer görsellerle uyumlu

### 4. Test
```tsx
// Test different variations
"Köfteci Yusuf" → ✅
"köfteci yusuf - beşiktaş" → ✅
"KÖFTECI YUSUF TAKSIM" → ✅
```

## Yeni Kategori Ekleme

```tsx
const CATEGORY_PLACEHOLDER_MAP = {
  // ... existing categories
  "bakery": "https://images.unsplash.com/photo-xxxxx?w=800",
  "fırın": "https://images.unsplash.com/photo-xxxxx?w=800",
};
```

## Avantajlar

### 1. Marka Tanınırlığı
- Kullanıcı "Starbucks" görünce tanıdık görsel görür
- Güven artar
- Profesyonel görünüm

### 2. Tutarlılık
- Aynı marka her yerde aynı görsel
- Kategori bazlı fallback tutarlı
- Hiç "boş görsel" yok

### 3. Performans
- Tek helper function
- Efficient string matching
- CDN'den optimize görseller (Unsplash)

### 4. Bakım Kolaylığı
- Tek dosyada tüm mapping
- Yeni marka eklemek kolay
- Clear structure

### 5. Fallback Chain
- 4 seviyeli güvenlik
- Hiçbir durumda hata yok
- Her zaman bir görsel var

## Limitasyonlar ve Çözümler

### Limitasyon 1: Yanlış Eşleşme
**Problem:** "Burger King" içeren başka bir mekan
```
"Burger King Taksim" → ✅ Doğru
"The Burger Kingdom" → ❌ Yanlış eşleşme
```

**Çözüm:** Daha spesifik keywords veya exact match
```tsx
// Option 1: Exact match
if (lowerName === keyword) { ... }

// Option 2: Word boundary
if (lowerName.match(new RegExp(`\\b${keyword}\\b`))) { ... }
```

### Limitasyon 2: Çok Fazla Marka
**Problem:** 1000+ marka olursa performans

**Çözüm:** 
- Trie data structure
- Lazy loading
- Backend'de brand detection

### Limitasyon 3: Görsel Güncelliği
**Problem:** Unsplash linkleri değişebilir

**Çözüm:**
- Local assets kullan
- CDN'e kendi görsellerini yükle
- Fallback URL'ler

## Test Checklist

### Brand Detection
- [ ] "Köfteci Yusuf" → Kebap görseli
- [ ] "KÖFTECI YUSUF" → Kebap görseli (case-insensitive)
- [ ] "Köfteci Yusuf - Beşiktaş" → Kebap görseli (contains)
- [ ] "Starbucks" → Starbucks görseli
- [ ] "Burger King" → Burger King görseli
- [ ] "McDonald's" → McDonald's görseli

### Category Fallback
- [ ] category: "cafe" → Cafe görseli
- [ ] category: "Cafe" → Cafe görseli (case-insensitive)
- [ ] category: "restoran" → Restaurant görseli
- [ ] category: "bar" → Bar görseli
- [ ] category: "unknown" → Default görsel

### Priority Order
- [ ] photo_url varsa → photo_url kullanılır
- [ ] photo_url yoksa + brand match → brand görseli
- [ ] photo_url yoksa + brand match yoksa + category → category görseli
- [ ] Hiçbiri yoksa → default görsel

### Edge Cases
- [ ] Empty name → Default
- [ ] Null category → Brand veya default
- [ ] Special characters in name → Still matches
- [ ] Very long name → Still matches

## Gelecek İyileştirmeler

### 1. Backend Integration
```tsx
// Backend'de brand detection
GET /api/places/123
{
  "name": "Köfteci Yusuf",
  "photo_url": null,
  "brand_id": "kofteci-yusuf", // ✅ Backend'den
  "brand_image_url": "..."      // ✅ Backend'den
}
```

### 2. Machine Learning
- Image recognition ile otomatik brand detection
- User feedback ile iyileştirme
- Similar image suggestions

### 3. Local Assets
```tsx
// Local assets for offline support
const BRAND_IMAGE_MAP = {
  "starbucks": require('@/assets/brands/starbucks.jpg'),
  "burger king": require('@/assets/brands/burger-king.jpg'),
};
```

### 4. Admin Panel
- Brand mapping yönetimi
- Görsel upload
- Preview ve test

### 5. Analytics
- Hangi brand'ler en çok kullanılıyor
- Hangi görseller en çok tıklanıyor
- Conversion tracking

## Migration Guide

**Mevcut kod değişikliği gerekmiyor!** ✅

`getPlaceImageSource()` API'si aynı kaldı:
```tsx
// Önce
const imageSource = getPlaceImageSource(place);

// Sonra (aynı!)
const imageSource = getPlaceImageSource(place);
```

**Otomatik çalışan yerler:**
- ✅ PlaceCard component
- ✅ Place Detail screen
- ✅ Explore screen
- ✅ Index screen
- ✅ Saved screen
- ✅ Tüm place listelerinde

## Özet

**Önce:**
```
Tüm mekanlar → Aynı generic görsel 😞
```

**Sonra:**
```
API photo_url → Gerçek görsel ✅
  ↓
Brand match → Marka görseli ✅
  ↓
Category → Kategori görseli ✅
  ↓
Default → Generic görsel ✅
```

**Sonuç:**
- ✅ Marka tanınırlığı
- ✅ Tutarlı görünüm
- ✅ Güven artışı
- ✅ Profesyonel UX
- ✅ Kolay bakım
