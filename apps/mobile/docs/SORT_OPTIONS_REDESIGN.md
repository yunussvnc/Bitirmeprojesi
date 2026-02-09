# Sort Options Redesign - Dropdown Row Style

## Sorun
Sıralama seçenekleri aşırı dikkat çekiyordu:
- "Varsayılan" yeşil dev buton ekranı domine ediyordu
- Primary button style her seçenek için kullanılıyordu
- Visual hierarchy bozuktu (sıralama > primary action)
- Çok fazla görsel ağırlık
- FilterCard component sıralama için uygun değildi

## Çözüm: Dropdown Row Style

### 1. Yeni Tasarım

**Önce (Dev Butonlar):**
```
┌─────────────────────────────────────┐
│ Sıralama                            │
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║ 🎚️ Varsayılan              ✓ ║  │ ← Yeşil gradient
│ ╚═══════════════════════════════╝  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ ↕️ İsme Göre (A-Z)            │  │ ← Gri border
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Sonra (Dropdown Rows):**
```
┌─────────────────────────────────────┐
│ Sıralama                            │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ 🎚️ Varsayılan              ✓ │  │ ← Accent border + check
│ └───────────────────────────────┘  │
│ ┌───────────────────────────────┐  │
│ │ ↕️ İsme Göre (A-Z)            │  │ ← Light border
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Component Yapısı

**JSX:**
```tsx
<View style={styles.sortOptionsContainer}>
  {/* Varsayılan */}
  <TouchableOpacity
    onPress={() => handleSortSelect('default')}
    style={[
      styles.sortOption,
      {
        backgroundColor: colors.surface.elevated,
        borderColor: sortBy === 'default' 
          ? colors.accent.primary 
          : colors.surface.border,
      },
    ]}
  >
    <View style={styles.sortOptionLeft}>
      <IconSymbol
        name="slider.horizontal.3"
        size={20}
        color={sortBy === 'default' 
          ? colors.accent.primary 
          : colors.text.secondary}
      />
      <Text style={[
        styles.sortOptionText,
        {
          color: sortBy === 'default' 
            ? colors.accent.primary 
            : colors.text.primary,
        },
      ]}>
        Varsayılan
      </Text>
    </View>
    {sortBy === 'default' && (
      <IconSymbol 
        name="checkmark.circle.fill" 
        size={20} 
        color={colors.accent.primary} 
      />
    )}
  </TouchableOpacity>

  {/* İsme Göre */}
  {/* Same structure... */}
</View>
```

**Styles:**
```tsx
sortOptionsContainer: {
  gap: 8,
}

sortOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 10,
  borderWidth: 1.5,
}

sortOptionLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  flex: 1,
}

sortOptionText: {
  fontSize: 15,
  fontWeight: '600',
  letterSpacing: 0.1,
}
```

### 3. State Gösterimi

**Inactive (Seçili Değil):**
```tsx
backgroundColor: colors.surface.elevated
borderColor: colors.surface.border
iconColor: colors.text.secondary
textColor: colors.text.primary
checkmark: hidden
```

**Active (Seçili):**
```tsx
backgroundColor: colors.surface.elevated (same)
borderColor: colors.accent.primary (1.5px)
iconColor: colors.accent.primary
textColor: colors.accent.primary
checkmark: visible (checkmark.circle.fill)
```

### 4. Layout

```
┌────────────────────────────────────┐
│ [Icon] Text              [Check]  │
│  20px   15px, 600         20px    │
│                                    │
│  ← 10px gap →  ← flex 1 →         │
│                                    │
│  14px padding (horizontal)         │
│  12px padding (vertical)           │
└────────────────────────────────────┘
```

### 5. Karşılaştırma

| Özellik | Önce (FilterCard) | Sonra (Dropdown Row) |
|---------|-------------------|----------------------|
| Component | FilterCard | TouchableOpacity |
| Height | 60px | ~48px (12px padding × 2 + content) |
| Active Style | Gradient + checkmark | Border + check icon |
| Visual Weight | Heavy (gradient) | Light (border) |
| Icon Size | 22px | 20px |
| Text Size | 15px | 15px (same) |
| Padding | 12px (md) | 14px horizontal, 12px vertical |
| Border Width | 1.5px | 1.5px (same) |
| Border Radius | 12px | 10px |
| Gap | 12px | 8px |
| Check Icon | ❌ | ✅ checkmark.circle.fill |
| Background | Elevated | Elevated (same) |

### 6. Visual Hierarchy

**Önce (Bozuk):**
```
Sıralama Butonları (Gradient, Heavy)
  ↓
Primary Action (Gradient, Heavy)
  ↓
Content
```
❌ Sıralama ve Primary Action aynı ağırlıkta

**Sonra (Doğru):**
```
Primary Action (Gradient, Heavy)
  ↓
Sıralama (Border, Light)
  ↓
Content
```
✅ Clear hierarchy

### 7. Button Style Guide

**Primary Button (Gradient):**
- ✅ "Öneri Getir" (Explore screen)
- ✅ "Kaydet" (Save action)
- ✅ "Gönder" (Submit form)
- ✅ Main CTA (Call-to-action)

**Dropdown Row (Border + Check):**
- ✅ Sıralama seçenekleri
- ✅ Filtre seçenekleri (non-primary)
- ✅ Settings options
- ✅ Selection lists

**FilterCard (ListItem):**
- ✅ Kategori seçimi
- ✅ Konum seçimi
- ✅ Navigable items (with chevron)

### 8. Avantajlar

#### Visual Hierarchy
1. **Primary Action Belirgin:**
   - Yeşil gradient sadece main CTA'da
   - Kullanıcı ne yapacağını biliyor
   - Clear focus

2. **Subtle Sort Options:**
   - Light border, no gradient
   - Daha az dikkat çekiyor
   - Appropriate weight

3. **Better Balance:**
   - Primary > Secondary > Tertiary
   - Clear progression
   - Professional look

#### UX
1. **Check Icon:**
   - Seçili durum net
   - Visual feedback
   - iOS/Android pattern

2. **Compact:**
   - 8px gap (was 12px)
   - ~48px height (was 60px)
   - Daha az alan

3. **Touch Target:**
   - Full row clickable
   - 48px+ height
   - Accessible

#### Consistency
1. **Design System:**
   - Border width: 1.5px
   - Border radius: 10px
   - Padding: 14/12px
   - Gap: 8px

2. **Color Usage:**
   - Accent: Active state
   - Surface: Background
   - Text: Labels
   - Secondary: Icons

### 9. Code Comparison

**Önce (FilterCard):**
```tsx
<FilterCard
  label="Varsayılan"
  active={sortBy === 'default'}
  icon="slider.horizontal.3"
  onPress={() => handleSortSelect('default')}
/>
```
- Heavy component
- Gradient on active
- Icon container (40x40px)
- Chevron right

**Sonra (Dropdown Row):**
```tsx
<TouchableOpacity
  onPress={() => handleSortSelect('default')}
  style={[styles.sortOption, { 
    borderColor: sortBy === 'default' 
      ? colors.accent.primary 
      : colors.surface.border 
  }]}
>
  <View style={styles.sortOptionLeft}>
    <IconSymbol name="slider.horizontal.3" size={20} />
    <Text>Varsayılan</Text>
  </View>
  {sortBy === 'default' && (
    <IconSymbol name="checkmark.circle.fill" size={20} />
  )}
</TouchableOpacity>
```
- Lightweight
- Border on active
- Direct icon (20px)
- Check icon

### 10. Responsive Behavior

**Small Screens:**
```tsx
sortOptionLeft: {
  flex: 1,  // Text truncates if needed
}

sortOptionText: {
  // numberOfLines not set → wraps if needed
}
```

**Large Screens:**
```tsx
// Same layout, scales naturally
// No max width needed
```

### 11. Dark/Light Theme

**Light Theme:**
```
Inactive:
  background: surface.elevated (#F5F5F7)
  border: surface.border (light gray)
  text: text.primary (dark)
  icon: text.secondary (gray)

Active:
  background: surface.elevated (same)
  border: accent.primary (blue/green)
  text: accent.primary
  icon: accent.primary
  check: accent.primary
```

**Dark Theme:**
```
Inactive:
  background: surface.elevated (#1C1C1E)
  border: surface.border (dark gray)
  text: text.primary (white)
  icon: text.secondary (light gray)

Active:
  background: surface.elevated (same)
  border: accent.primary (blue/green)
  text: accent.primary
  icon: accent.primary
  check: accent.primary
```

### 12. Animation (Optional)

**Current:** None (instant)

**Future Enhancement:**
```tsx
// Animated border color
const borderAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(borderAnim, {
    toValue: sortBy === 'default' ? 1 : 0,
    duration: 200,
    useNativeDriver: false,
  }).start();
}, [sortBy]);

const borderColor = borderAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [colors.surface.border, colors.accent.primary],
});
```

### 13. Accessibility

**TouchableOpacity:**
```tsx
<TouchableOpacity
  accessibilityRole="radio"
  accessibilityState={{ selected: sortBy === 'default' }}
  accessibilityLabel="Varsayılan sıralama"
  accessibilityHint="Mekanları varsayılan sıraya göre sıralar"
>
```

**Check Icon:**
```tsx
{sortBy === 'default' && (
  <IconSymbol 
    name="checkmark.circle.fill"
    accessibilityLabel="Seçili"
  />
)}
```

### 14. Test Checklist

#### Visual
- [ ] Border width: 1.5px
- [ ] Border radius: 10px
- [ ] Padding: 14px horizontal, 12px vertical
- [ ] Gap between options: 8px
- [ ] Icon size: 20px
- [ ] Text size: 15px, weight 600
- [ ] Check icon: 20px, circle.fill

#### Inactive State
- [ ] Background: surface.elevated
- [ ] Border: surface.border
- [ ] Icon: text.secondary
- [ ] Text: text.primary
- [ ] Check: hidden

#### Active State
- [ ] Background: surface.elevated (same)
- [ ] Border: accent.primary (1.5px)
- [ ] Icon: accent.primary
- [ ] Text: accent.primary
- [ ] Check: visible, accent.primary

#### Interaction
- [ ] Touch feedback (opacity 0.7)
- [ ] Full row clickable
- [ ] Immediate state change
- [ ] Check icon appears/disappears

#### Responsive
- [ ] Small screens: text readable
- [ ] Large screens: layout scales
- [ ] Text wraps if very long

#### Themes
- [ ] Light theme: correct colors
- [ ] Dark theme: correct colors
- [ ] Accent color adapts

### 15. Migration Guide

**Automatic:** ❌ Manual update needed

**Steps:**
1. Replace `<FilterCard>` with custom `TouchableOpacity`
2. Add check icon for active state
3. Update styles (border, padding, gap)
4. Test all states

**Before:**
```tsx
<FilterCard
  label="Varsayılan"
  active={sortBy === 'default'}
  icon="slider.horizontal.3"
  onPress={() => handleSortSelect('default')}
/>
```

**After:**
```tsx
<TouchableOpacity
  onPress={() => handleSortSelect('default')}
  style={[styles.sortOption, { 
    borderColor: sortBy === 'default' 
      ? colors.accent.primary 
      : colors.surface.border 
  }]}
>
  <View style={styles.sortOptionLeft}>
    <IconSymbol name="slider.horizontal.3" size={20} />
    <Text>Varsayılan</Text>
  </View>
  {sortBy === 'default' && (
    <IconSymbol name="checkmark.circle.fill" size={20} />
  )}
</TouchableOpacity>
```

### 16. Gelecek İyileştirmeler

1. **Reusable Component:**
   ```tsx
   <SortOption
     label="Varsayılan"
     icon="slider.horizontal.3"
     active={sortBy === 'default'}
     onPress={() => handleSortSelect('default')}
   />
   ```

2. **More Options:**
   - Rating (Yüksek → Düşük)
   - Distance (Yakın → Uzak)
   - Popularity (Popüler)

3. **Dropdown Menu:**
   - Collapse to single button
   - Expand on press
   - Save space

4. **Animations:**
   - Border color transition
   - Check icon scale
   - Smooth state changes

## Özet

**Önce:**
- ❌ Yeşil gradient her seçenekte
- ❌ Visual hierarchy bozuk
- ❌ Primary action kaybolmuş
- ❌ Çok fazla görsel ağırlık

**Sonra:**
- ✅ Border + check icon
- ✅ Clear hierarchy (primary > sort)
- ✅ Primary action belirgin
- ✅ Subtle, appropriate weight

**Kazanımlar:**
- Better visual hierarchy
- Primary button reserved for CTA
- Check icon for selection
- Compact layout (8px gap)
- Professional, iOS/Android-style
- Clear active state

**Son Güncelleme:** Şubat 2026
