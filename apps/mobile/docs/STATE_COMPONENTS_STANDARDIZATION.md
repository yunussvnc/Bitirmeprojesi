# State Components Standardization

## Sorun
Ekranlar "veri yok/gelmedi" durumlarında farklı davranıyordu:
- Her ekran kendi loading/error/empty UI'ını implement ediyordu
- Tutarsız tasarım ve animasyonlar
- Kod tekrarı
- Demo'da kötü görünüm

## Çözüm

### 1. Standart State Component'leri

Üç yeni component oluşturduk:

#### LoadingState
```tsx
<LoadingState 
  message="Mekanlar yükleniyor..." 
  size="large"
  compact={false}
/>
```

**Props:**
- `message?: string` - Loading mesajı (default: "Yükleniyor...")
- `size?: 'small' | 'large'` - Spinner boyutu (default: 'large')
- `compact?: boolean` - Kompakt mod (daha az padding)

**Özellikler:**
- ActivityIndicator (native spinner)
- Fade in animasyonu
- Opsiyonel mesaj
- Compact mode için daha az padding

#### ErrorState
```tsx
<ErrorState
  title="Mekanlar Yüklenemedi"
  description="Bağlantı hatası oluştu"
  onRetry={handleRetry}
  compact={false}
/>
```

**Props:**
- `icon?: IconSymbolName` - Hata ikonu (default: 'exclamationmark.triangle.fill')
- `title?: string` - Hata başlığı (default: 'Bir Hata Oluştu')
- `description?: string` - Hata açıklaması
- `retryLabel?: string` - Retry buton metni (default: 'Tekrar Dene')
- `onRetry?: () => void` - Retry callback
- `compact?: boolean` - Kompakt mod

**Özellikler:**
- Icon container (72x72px, rounded)
- Title + description
- Optional retry button
- Fade + scale + slide animasyonları
- Error color (colors.error)

#### EmptyState (Mevcut)
```tsx
<EmptyState
  icon="bookmark"
  title="Henüz kayıt yok"
  description="Beğendiğin mekanları kaydet"
  actionLabel="Keşfet'e Git"
  onAction={handleAction}
/>
```

**Props:**
- `icon: IconSymbolName` - Empty state ikonu
- `title: string` - Başlık
- `description: string` - Açıklama
- `actionLabel?: string` - CTA buton metni
- `onAction?: () => void` - CTA callback

**Özellikler:**
- Icon container (72x72px, rounded)
- Title + description
- Optional CTA button
- Fade + scale + slide animasyonları

### 2. Component Yapısı

**LoadingState:**
```
┌────────────────────────────────────┐
│                                    │
│            ⟳ Spinner               │  ActivityIndicator
│                                    │
│        Yükleniyor...               │  Optional message
│                                    │
└────────────────────────────────────┘
```

**ErrorState:**
```
┌────────────────────────────────────┐
│                                    │
│         ┌──────────┐               │
│         │    ⚠️    │               │  Icon (72x72)
│         └──────────┘               │
│                                    │
│       Bir Hata Oluştu              │  Title (18px, 600)
│                                    │
│  Bir şeyler yanlış gitti...        │  Description (15px)
│                                    │
│     ┌──────────────┐               │
│     │ Tekrar Dene  │               │  Retry button
│     └──────────────┘               │
│                                    │
└────────────────────────────────────┘
```

**EmptyState:**
```
┌────────────────────────────────────┐
│                                    │
│         ┌──────────┐               │
│         │    📍    │               │  Icon (72x72)
│         └──────────┘               │
│                                    │
│       Henüz Mekan Yok              │  Title (heading)
│                                    │
│  Yakında yeni mekanlar...          │  Description (body)
│                                    │
│     ┌──────────────┐               │
│     │   Keşfet     │               │  CTA button
│     └──────────────┘               │
│                                    │
└────────────────────────────────────┘
```

### 3. Animasyonlar

**LoadingState:**
```tsx
// Fast fade in + slide up
opacity: 0 → 1 (200ms)
translateY: 10 → 0 (200ms)
```

**ErrorState & EmptyState:**
```tsx
// Fade + slide + scale
opacity: 0 → 1 (300ms)
translateY: 20 → 0 (300ms)
scale: 0.9 → 1 (spring, 100ms delay)
```

### 4. Compact Mode

**Normal:**
```tsx
paddingVertical: spacing.xxxl  // 48px
paddingHorizontal: spacing.xl  // 24px
```

**Compact:**
```tsx
paddingVertical: spacing.xl    // 24px
paddingHorizontal: spacing.base // 16px
```

**Kullanım:**
```tsx
// Normal (full screen empty state)
<EmptyState icon="bookmark" title="..." />

// Compact (inline error)
<ErrorState title="..." compact />
```

### 5. Ekran Entegrasyonları

#### Ana Sayfa (index.tsx)

**Önce:**
```tsx
{loading ? (
  <PlaceCardSkeleton count={6} />
) : error ? (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity onPress={loadPlaces}>
      <Text>Tekrar Dene</Text>
    </TouchableOpacity>
  </View>
) : places.length === 0 ? (
  <View style={styles.emptyContainer}>
    <Text>Henüz mekan bulunmuyor</Text>
  </View>
) : (
  // Places
)}
```

**Sonra:**
```tsx
{loading ? (
  <LoadingState message="Mekanlar yükleniyor..." />
) : error ? (
  <ErrorState
    title="Mekanlar Yüklenemedi"
    description={error}
    onRetry={loadPlaces}
  />
) : places.length === 0 ? (
  <EmptyState
    icon={hasActiveFilters ? "magnifyingglass" : "mappin.slash"}
    title={hasActiveFilters ? "Sonuç Bulunamadı" : "Henüz Mekan Yok"}
    description={hasActiveFilters ? "Filtrelerinizi değiştirip tekrar deneyin" : "Yakında yeni mekanlar eklenecek"}
    actionLabel={hasActiveFilters ? "Filtreleri Temizle" : undefined}
    onAction={hasActiveFilters ? clearFilters : undefined}
  />
) : (
  // Places
)}
```

**Kaldırılan Styles:**
```tsx
// ❌ Artık gerek yok
errorContainer: { ... }
errorText: { ... }
retryButton: { ... }
retryText: { ... }
emptyContainer: { ... }
emptyText: { ... }
```

#### Keşfet (explore.tsx)

**Önce:**
```tsx
{error ? (
  <View style={styles.errorBox}>
    <IconSymbol name="exclamationmark.triangle.fill" />
    <Text style={styles.errorText}>{error}</Text>
  </View>
) : null}

{loading && items.length === 0 ? (
  <View style={styles.loadingWrap}>
    <ActivityIndicator />
    <Text>Öneriler hazırlanıyor...</Text>
  </View>
) : items.length > 0 ? (
  // Items
) : !loading && !error ? (
  <EmptyState ... />
) : null}
```

**Sonra:**
```tsx
{error ? (
  <ErrorState
    title="Öneriler Alınamadı"
    description={error}
    onRetry={runRecommend}
    compact
  />
) : null}

{loading && items.length === 0 ? (
  <LoadingState message="Öneriler hazırlanıyor..." compact />
) : items.length > 0 ? (
  // Items
) : !loading && !error ? (
  <EmptyState ... />
) : null}
```

**Kaldırılan Styles:**
```tsx
// ❌ Artık gerek yok
errorBox: { ... }
errorText: { ... }
loadingWrap: { ... }
loadingText: { ... }
```

#### Kaydedilenler (saved.tsx)

**Zaten EmptyState kullanıyor:**
```tsx
{items.length === 0 ? (
  <EmptyState
    icon="bookmark"
    title="Henüz kayıt yok"
    description="Explore'dan beğendiğin mekanları 'Kaydet' diyerek buraya ekleyebilirsin."
    actionLabel="Keşfet'e Git"
    onAction={() => router.push('/(tabs)/explore')}
  />
) : (
  // Items
)}
```

✅ Değişiklik gerekmedi!

### 6. Karşılaştırma

| Özellik | Önce | Sonra |
|---------|------|-------|
| **Loading** | Custom per screen | `<LoadingState />` ✅ |
| **Error** | Custom per screen | `<ErrorState />` ✅ |
| **Empty** | Custom per screen | `<EmptyState />` ✅ |
| **Animasyon** | Tutarsız/yok | Standart animasyonlar ✅ |
| **Tasarım** | Farklı | Tutarlı ✅ |
| **Kod Tekrarı** | Çok | Yok ✅ |
| **Retry Action** | Bazen var | Her zaman optional ✅ |
| **CTA Button** | Bazen var | Her zaman optional ✅ |
| **Icon** | Tutarsız | Standart icon container ✅ |
| **Typography** | Farklı | Tutarlı hierarchy ✅ |
| **Spacing** | Farklı | Standart (normal/compact) ✅ |

### 7. Teknik Detaylar

#### LoadingState Styles
```tsx
container: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.xxxl,  // 48px
  paddingHorizontal: spacing.xl,   // 24px
}

containerCompact: {
  paddingVertical: spacing.xl,     // 24px
  paddingHorizontal: spacing.base, // 16px
}

spinner: {
  marginBottom: spacing.base,      // 16px
}

message: {
  textAlign: 'center',
  fontSize: 15,
  fontWeight: '500',
}
```

#### ErrorState Styles
```tsx
container: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.xxxl,  // 48px
  paddingHorizontal: spacing.xl,   // 24px
}

containerCompact: {
  paddingVertical: spacing.xl,     // 24px
  paddingHorizontal: spacing.base, // 16px
}

iconContainer: {
  width: 72,
  height: 72,
  borderRadius: radius.xxl,        // 24px
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.surface.default,
  marginBottom: spacing.base,      // 16px
}

title: {
  textAlign: 'center',
  fontSize: 18,
  fontWeight: '600',
  marginBottom: spacing.sm,        // 8px
}

description: {
  textAlign: 'center',
  lineHeight: 22,
  fontSize: 15,
  marginBottom: spacing.xl,        // 24px
}
```

#### EmptyState Styles (Mevcut)
```tsx
// Same as ErrorState, but:
// - Icon color: colors.text.tertiary (not error)
// - Button variant: 'primary' (not 'secondary')
```

### 8. Icon Kullanımı

**LoadingState:**
- ActivityIndicator (native)
- Color: `colors.accent.primary`

**ErrorState:**
```tsx
// Default
icon="exclamationmark.triangle.fill"
color={colors.error}

// Custom
icon="wifi.slash"
color={colors.error}
```

**EmptyState:**
```tsx
// Bookmarks
icon="bookmark"

// Search
icon="magnifyingglass"

// Location
icon="mappin.slash"

// Generic
icon="tray"
```

### 9. Message/Description Best Practices

**LoadingState:**
```tsx
// ✅ Good
message="Mekanlar yükleniyor..."
message="Öneriler hazırlanıyor..."
message="Veriler getiriliyor..."

// ❌ Bad
message="Loading..."  // English
message="Lütfen bekleyin, veriler yükleniyor ve işleniyor..."  // Too long
```

**ErrorState:**
```tsx
// ✅ Good
title="Mekanlar Yüklenemedi"
description="Bağlantı hatası oluştu. Lütfen tekrar deneyin."

title="Öneriler Alınamadı"
description="Sunucu yanıt vermiyor"

// ❌ Bad
title="Error"  // English
description="An error occurred while fetching data from the server. Please check your internet connection and try again."  // Too long
```

**EmptyState:**
```tsx
// ✅ Good
title="Henüz Mekan Yok"
description="Yakında yeni mekanlar eklenecek"

title="Sonuç Bulunamadı"
description="Filtrelerinizi değiştirip tekrar deneyin"

// ❌ Bad
title="No results"  // English
description="There are no places matching your search criteria. Please try different filters or search terms."  // Too long
```

### 10. Responsive Behavior

**Small Screens:**
```tsx
// Use compact mode
<LoadingState message="..." compact />
<ErrorState title="..." compact />

// EmptyState automatically adapts
```

**Large Screens:**
```tsx
// Use normal mode
<LoadingState message="..." />
<ErrorState title="..." />
<EmptyState icon="..." title="..." />
```

### 11. Accessibility

**LoadingState:**
```tsx
<ActivityIndicator
  accessibilityLabel="Yükleniyor"
  accessibilityRole="progressbar"
/>
```

**ErrorState:**
```tsx
<View accessibilityRole="alert">
  <Text accessibilityLabel={title}>...</Text>
  <Button accessibilityLabel={retryLabel}>...</Button>
</View>
```

**EmptyState:**
```tsx
<View accessibilityRole="status">
  <Text accessibilityLabel={title}>...</Text>
  <Button accessibilityLabel={actionLabel}>...</Button>
</View>
```

### 12. Test Checklist

#### LoadingState
- [ ] Spinner görünüyor
- [ ] Message doğru
- [ ] Animasyon smooth
- [ ] Compact mode çalışıyor
- [ ] Color: accent.primary

#### ErrorState
- [ ] Icon görünüyor (error color)
- [ ] Title doğru
- [ ] Description doğru
- [ ] Retry button çalışıyor
- [ ] Animasyon smooth
- [ ] Compact mode çalışıyor

#### EmptyState
- [ ] Icon görünüyor
- [ ] Title doğru
- [ ] Description doğru
- [ ] CTA button çalışıyor
- [ ] Animasyon smooth
- [ ] Icon color: text.tertiary

#### Integration
- [ ] Ana sayfa: loading/error/empty
- [ ] Keşfet: loading/error/empty (compact)
- [ ] Kaydedilenler: empty
- [ ] Tüm ekranlar tutarlı
- [ ] Kod tekrarı yok

### 13. Gelecek İyileştirmeler

1. **Skeleton Loading:**
   ```tsx
   <LoadingState skeleton="placeCard" count={3} />
   ```

2. **Error Types:**
   ```tsx
   <ErrorState type="network" />  // Specific icon/message
   <ErrorState type="server" />
   <ErrorState type="notFound" />
   ```

3. **Empty State Variants:**
   ```tsx
   <EmptyState variant="search" />     // Magnifying glass
   <EmptyState variant="bookmark" />   // Bookmark
   <EmptyState variant="location" />   // Map pin
   ```

4. **Loading Progress:**
   ```tsx
   <LoadingState progress={0.75} message="75% tamamlandı" />
   ```

5. **Retry with Backoff:**
   ```tsx
   <ErrorState
     onRetry={handleRetry}
     retryCount={3}
     nextRetryIn={5}
   />
   ```

### 14. Export

**components/ui/index.ts:**
```tsx
export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

export { ErrorState } from './ErrorState';
export type { ErrorStateProps } from './ErrorState';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
```

**Usage:**
```tsx
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';

// Loading
<LoadingState message="Yükleniyor..." />

// Error
<ErrorState
  title="Hata"
  description="Bir şeyler yanlış gitti"
  onRetry={handleRetry}
/>

// Empty
<EmptyState
  icon="bookmark"
  title="Boş"
  description="Henüz içerik yok"
  actionLabel="Ekle"
  onAction={handleAdd}
/>
```

## Özet

**Önce:**
- Her ekran kendi state UI'ını implement ediyordu
- Tutarsız tasarım ve animasyonlar
- Kod tekrarı
- Demo'da kötü görünüm

**Sonra:**
- ✅ 3 standart component (LoadingState, ErrorState, EmptyState)
- ✅ Tutarlı tasarım ve animasyonlar
- ✅ Kod tekrarı yok
- ✅ Professional görünüm
- ✅ Compact mode support
- ✅ Optional retry/CTA actions
- ✅ Consistent icon containers
- ✅ Proper typography hierarchy

**Kazanımlar:**
- Consistent UX across all screens
- Less code duplication
- Easier maintenance
- Professional appearance
- Better animations
- Flexible (normal/compact modes)
- Accessible
- Type-safe

**Son Güncelleme:** Şubat 2026
