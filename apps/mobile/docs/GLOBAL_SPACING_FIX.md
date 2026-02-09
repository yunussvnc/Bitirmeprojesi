# Global Spacing & Safe Area Düzeltmeleri

## Sorun
Ekranlarda üst ve alt boşluklarda tutarsızlık ve "tuhaf boşluk" hissi vardı:
- Her ekran farklı margin/padding değerleri kullanıyordu
- SafeAreaView ve tab bar yüksekliği düzgün hesaplanmıyordu
- Header altı ve tab bar üstü boşluklar standardize edilmemişti
- Bazı ekranlar Screen component yerine kendi ScrollView'larını kullanıyordu

## Çözüm

### 1. Screen Component Standardizasyonu

**Dosya:** `apps/mobile/components/layout/Screen.tsx`

Yeni özellikler:
```tsx
interface ScreenProps {
  // ... mevcut props
  withTabBar?: boolean;    // Tab bar için alt boşluk ekle
  withHeader?: boolean;    // Header için üst boşluk ekle
}
```

**Spacing Kuralları:**
- **Horizontal Padding:** `spacing.screenPadding` (20px) - Tüm ekranlarda sabit
- **Bottom Padding:**
  - Tab bar ile: `spacing.base` (16px) - Tab bar'ın üstünde içerik boşluğu
  - Tab bar olmadan: `spacing.xxl` (32px) - Standart sayfa sonlandırma
- **Top Padding:** `withHeader ? spacing.sm : 0`
- **SafeAreaView:** `edges={['left', 'right']}` - Top/bottom native header/tab bar tarafından yönetiliyor

### 2. Tab Ekranlarında Uygulama

Tüm tab ekranları güncellendi:

#### Index (Ana Sayfa)
```tsx
<Screen onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
  <View style={[styles.header, { marginBottom: spacing.xl }]}>
    {/* marginTop kaldırıldı */}
```

#### Explore (Keşfet)
```tsx
<Screen 
  onRefresh={handleRefresh} 
  refreshing={refreshing} 
  withTabBar 
  contentContainerStyle={styles.screenContent}
>
```

#### Saved (Kaydedilenler)
```tsx
<Screen onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
  <View style={[styles.header, { marginBottom: spacing.xl }]}>
    {/* marginTop kaldırıldı */}
```

#### Profile (Profil)
```tsx
<Screen withTabBar contentContainerStyle={styles.screenContent}>
  {/* Kendi ScrollView'i kaldırıldı, Screen'in native scroll kullanılıyor */}
```

**Değişiklik:**
- Kendi ScrollView yerine Screen component'in scrollable özelliği kullanıldı
- `scrollContent` stili `screenContent` olarak değiştirildi
- `paddingTop` ve `paddingBottom` kaldırıldı (Screen tarafından yönetiliyor)
- `profileHeaderGradient` için negative margin'ler `marginTop: 0` olarak güncellendi

### 3. Place Detail Ekranı

**Dosya:** `apps/mobile/app/place/[id].tsx`

```tsx
<Screen scrollable contentContainerStyle={styles.screenContent}>
  {/* Kendi ScrollView kaldırıldı */}
```

**Stil Güncelleme:**
```tsx
screenContent: {
  paddingHorizontal: 0, // Full-width hero için override
}
```

İçerik bölümü zaten doğru padding kullanıyordu:
```tsx
<View style={[styles.content, { paddingHorizontal: spacingTokens.screenPadding }]}>
```

## Spacing Scale (Design Tokens)

Tüm ekranlar şu spacing scale'i kullanıyor:

| Token | Değer | Kullanım |
|-------|-------|----------|
| `xs` | 4px | Minimal boşluklar |
| `sm` | 8px | Küçük boşluklar |
| `md` | 12px | Orta boşluklar |
| `base` | 16px | En yaygın boşluk |
| `lg` | 20px | Büyük boşluklar |
| `xl` | 24px | Çok büyük boşluklar |
| `xxl` | 32px | Bölüm boşlukları |
| `xxxl` | 40px | Büyük bölüm boşlukları |
| `screenPadding` | 20px | Ekran yatay padding |
| `cardPadding` | 16px | Kart içi padding |
| `cardGap` | 12px | Kartlar arası boşluk |
| `sectionGap` | 24px | Bölümler arası boşluk |
| `elementGap` | 8px | İlişkili elemanlar arası boşluk |

## Tab Bar Yükselikleri

Screen component tab bar yüksekliğini otomatik hesaplıyor:

```tsx
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 64;
```

- **iOS:** 84px (56px bar + 28px safe area)
- **Android:** 64px (56px bar + 8px padding)

## Değişiklik Özeti

### Değiştirilen Dosyalar:
1. ✅ `components/layout/Screen.tsx` - withTabBar/withHeader props eklendi
2. ✅ `app/(tabs)/index.tsx` - withTabBar eklendi, marginTop kaldırıldı
3. ✅ `app/(tabs)/explore.tsx` - withTabBar eklendi
4. ✅ `app/(tabs)/saved.tsx` - withTabBar eklendi, marginTop kaldırıldı
5. ✅ `app/(tabs)/profile.tsx` - withTabBar eklendi, ScrollView kaldırıldı
6. ✅ `app/place/[id].tsx` - ScrollView kaldırıldı, screenContent padding override

### Tutarlılık Kazanımları:
- ✅ Tüm ekranlar aynı horizontal padding kullanıyor (20px)
- ✅ Tab bar ile ekranlarda tutarlı bottom spacing (16px)
- ✅ SafeAreaView doğru edges ile kullanılıyor
- ✅ Header-content-footer layout standardize edildi
- ✅ Gereksiz marginTop/marginBottom değerleri temizlendi
- ✅ ScrollView kullanımı merkezi hale getirildi

## Test Checklist

- [ ] Ana sayfa: Üstten başlangıç, alta scroll, tab bar üstünde 16px boşluk
- [ ] Keşfet: Hero section, filter cards, tab bar üstünde boşluk
- [ ] Kaydedilenler: Header, place cards, tab bar üstünde boşluk
- [ ] Profil: Gradient header top'tan başlıyor, settings sections, tab bar üstünde boşluk
- [ ] Place Detail: Full-width hero, content padding 20px, benzer mekanlar scroll
- [ ] iOS: SafeArea notch/home indicator ile uyumlu
- [ ] Android: Status bar ve navigation bar ile uyumlu
- [ ] Light/Dark tema: Her ikisinde de tutarlı boşluklar

## Migration Guide (Diğer Ekranlar İçin)

Eğer yeni bir ekran oluşturuyorsanız veya mevcut bir ekranı güncelliyorsanız:

```tsx
// ❌ Önce (Eski)
<SafeAreaView style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
    {/* content */}
  </ScrollView>
</SafeAreaView>

// ✅ Sonra (Yeni)
<Screen withTabBar>  {/* Tab bar varsa */}
  {/* content */}
</Screen>

// veya

<Screen>  {/* Tab bar yoksa */}
  {/* content */}
</Screen>
```

**Full-width hero/header için:**
```tsx
<Screen withTabBar contentContainerStyle={{ paddingHorizontal: 0 }}>
  <View style={styles.hero}>{/* full-width */}</View>
  <View style={{ paddingHorizontal: 20 }}>{/* padded content */}</View>
</Screen>
```
