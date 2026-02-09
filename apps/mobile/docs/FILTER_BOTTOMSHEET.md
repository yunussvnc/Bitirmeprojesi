# Filtre BottomSheet Implementasyonu

## Sorun
Keşfet ekranındaki filtre paneli açıldığında ekranın çoğunu kaplıyordu:
- Filtreler açıldığında ekranın büyük kısmını kaplıyordu
- Kullanıcı için "overwhelming" bir deneyim
- Spotify/Instagram gibi modern uygulamalardaki kompakt tasarımdan uzak
- Kapalı durumdayken seçili filtreler görünmüyordu

## Çözüm: BottomSheet Modal

### 1. Yeni Mimari

**Kapalı Durum (Collapsed):**
```tsx
┌─────────────────────────────────┐
│ 🎚️ Filtreler        (2) 🔽     │
├─────────────────────────────────┤
│ [Sessiz] [Çalışma]              │  ← Seçili chip'ler
└─────────────────────────────────┘
```

**Açık Durum (Modal BottomSheet):**
```tsx
┌─────────────────────────────────┐
│                                 │
│      [Karartılmış Overlay]     │
│                                 │
│  ╭─────────────────────────╮   │
│  │      ══ Handle Bar ══   │   │
│  ├─────────────────────────┤   │
│  │ 🎚️ Filtreler  [Temizle]│   │
│  ├─────────────────────────┤   │
│  │                         │   │
│  │ ORTAM                   │   │
│  │ [Sessiz] [Canlı]        │   │
│  │                         │   │
│  │ AMAÇ                    │   │
│  │ [Çalışma] [Arkadaş] ... │   │
│  │                         │   │
│  │ BÜTÇE                   │   │
│  │ [Düşük] [Orta] [Yüksek] │   │
│  │                         │   │
│  ├─────────────────────────┤   │
│  │    [Uygula Button]      │   │
│  ╰─────────────────────────╯   │
└─────────────────────────────────┘
```

### 2. Teknik Detaylar

**Maksimum Yükseklik:**
```tsx
const SCREEN_HEIGHT = Dimensions.get('window').height;

bottomSheet: {
  maxHeight: SCREEN_HEIGHT * 0.55, // %55 of screen
  // ...
}
```

**Modal Yapısı:**
```tsx
<Modal
  visible={showFilters}
  transparent
  animationType="slide"
  onRequestClose={() => setShowFilters(false)}
>
  <Pressable style={styles.modalOverlay} onPress={closeSheet}>
    <Pressable style={styles.bottomSheet} onPress={stopPropagation}>
      {/* Content */}
    </Pressable>
  </Pressable>
</Modal>
```

### 3. UX İyileştirmeleri

#### Kapalı Durum
- Icon + "Filtreler" label
- Seçili filtre sayısı badge (örn: `(2)`)
- Seçili filtreler küçük chip'ler olarak görünür
- Chevron down icon → açmak için

#### Açık Durum (BottomSheet)
- **Handle Bar:** Sürükleyerek kapatma hissi veren UI element
- **Header:** Icon, başlık, "Temizle" button
- **Scrollable Content:** İçerik scroll edilebilir
- **Chip Groups:** Horizontal wrap layout, küçük ve kompakt
- **Footer:** "Uygula" button ile modal'ı kapat
- **Overlay:** Dışarı tıklayınca kapat

#### Chip Size
```tsx
<Chip 
  label="Sessiz" 
  size="small"  // Kapalı durumdaki chip'ler
  active={false}
/>

<Chip 
  label="Sessiz" 
  size="medium"  // BottomSheet içindeki chip'ler (default)
  active={prefs.vibe === 'quiet'}
  onPress={handlePress}
/>
```

### 4. Değişiklik Özeti

#### Dosyalar:

**1. `app/(tabs)/explore.tsx`**
- ✅ Modal BottomSheet implementasyonu
- ✅ Kapalı durumdaki filter toggle UI
- ✅ Seçili filtreler için küçük chip'ler
- ✅ Maksimum yükseklik: %55
- ✅ Handle bar, header, scrollable content, footer
- ✅ Haptic feedback tüm interaksiyonlarda

**2. `components/ui/Chip.tsx`**
- ✅ `size` prop eklendi: `'small' | 'medium'`
- ✅ Small chips: 13px font, 6px padding, 32px min height
- ✅ Medium chips: 15px font, 10px padding, 44px min height

### 5. Stil Kuralları

**Filter Toggle (Collapsed):**
```tsx
filterToggle: {
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 12,
  borderWidth: 1,
}
```

**BottomSheet:**
```tsx
bottomSheet: {
  maxHeight: SCREEN_HEIGHT * 0.55,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 20,
}
```

**Chip Groups:**
```tsx
chipGroup: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
}
```

**Filter Sections:**
```tsx
filterSection: {
  marginBottom: spacing.lg, // 20px
}

filterSectionLabel: {
  fontSize: 13,
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 10,
}
```

### 6. Karşılaştırma

| Özellik | Önce | Sonra |
|---------|------|-------|
| Filtre Panel Yükseklik | ~70% ekran | Max %55 (Modal) |
| Kapalı Durumda Göster | Sadece toggle button | Toggle + seçili chip'ler |
| Açma/Kapatma | Inline expand/collapse | Modal slide animation |
| Chip Boyutu | Hep büyük (44px) | Small (32px) / Medium (44px) |
| Dışarı Tıklayınca | - | Modal kapanır |
| Handle Bar | ❌ | ✅ |
| Scroll | Tüm sayfa | Sadece filtre içeriği |
| Spacing | Tutarsız | Tutarlı (spacing tokens) |

### 7. Avantajlar

1. **Daha Az Ekran Kaplar:** Max %55 yükseklik, geri kalan ekran görünür
2. **Native Hissi:** BottomSheet iOS/Android'de yaygın pattern
3. **Kompakt Design:** Chip'ler küçük ve wrap yapıyor
4. **Clear Hierarchy:** Header, content, footer bölümlemesi
5. **Better UX:** 
   - Overlay tıkla → kapat
   - Handle bar görsel ipucu
   - Seçili filtreler her zaman görünür
   - Smooth slide animation
6. **Accessibility:** Touch target'lar korundu (44px minimum)

### 8. Test Checklist

#### Kapalı Durum
- [ ] Filter toggle button görünür
- [ ] Icon + "Filtreler" label doğru
- [ ] Seçili filtre sayısı badge doğru (örn: 2 filtre → `(2)`)
- [ ] Seçili chip'ler küçük boyutta görünür
- [ ] Chevron down icon görünür

#### Açık Durum (Modal)
- [ ] Modal slide animation smooth
- [ ] Overlay yarı saydam ve blur
- [ ] BottomSheet max %55 yükseklikte
- [ ] Handle bar görünür ve centered
- [ ] Header: icon, başlık, "Temizle" button
- [ ] Content scroll edilebilir
- [ ] Chip groups horizontal wrap
- [ ] Seçili chip'ler gradient + beyaz text
- [ ] Footer "Uygula" button çalışıyor
- [ ] Overlay'e tıklayınca kapanıyor
- [ ] Back button (Android) ile kapanıyor

#### Interaktif
- [ ] Chip seçince haptic feedback
- [ ] Seçim hemen API'ye istek atıyor
- [ ] "Temizle" button tüm filtreleri sıfırlıyor
- [ ] "Uygula" button modal'ı kapatıyor
- [ ] Modal kapatınca seçili chip'ler collapsed durumda görünür

#### Responsive
- [ ] Küçük ekranlarda (%55 hala uygun)
- [ ] Büyük ekranlarda (iPad'de BottomSheet max width ile sınırlı olabilir)
- [ ] Landscape mode'da test et

## Migration Guide

Eğer başka ekranlarda da benzer filtre paneli varsa:

```tsx
// 1. Import Modal, Pressable, Dimensions
import { Modal, Pressable, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// 2. State
const [showFilters, setShowFilters] = useState(false);

// 3. Collapsed Toggle
<TouchableOpacity onPress={() => setShowFilters(true)}>
  <Text>Filtreler</Text>
  {selectedCount > 0 && <Badge>{selectedCount}</Badge>}
</TouchableOpacity>

{!showFilters && selectedChips.length > 0 && (
  <View>
    {selectedChips.map(chip => (
      <Chip key={chip} label={chip} size="small" />
    ))}
  </View>
)}

// 4. Modal BottomSheet
<Modal visible={showFilters} transparent animationType="slide">
  <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
    <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
      {/* Handle bar */}
      <View style={styles.handle}>
        <View style={styles.handleBar} />
      </View>
      
      {/* Header */}
      <View style={styles.header}>...</View>
      
      {/* Scrollable content */}
      <ScrollView style={styles.content}>...</ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={() => setShowFilters(false)}>Uygula</Button>
      </View>
    </Pressable>
  </Pressable>
</Modal>
```

## Gelecek İyileştirmeler (Opsiyonel)

1. **Gesture Handler:** React Native Gesture Handler ile swipe-to-close
2. **Spring Animation:** React Native Reanimated ile daha smooth animation
3. **Backdrop Blur:** iOS'ta backdrop blur effect (zaten BlurView kullanılabilir)
4. **Keyboard Aware:** Eğer input field'lar eklenirse, keyboard aware scroll
5. **Persistent State:** Filtre durumunu AsyncStorage'da sakla
6. **Advanced Filters:** Daha fazla filtre kategorisi için scroll + section headers
