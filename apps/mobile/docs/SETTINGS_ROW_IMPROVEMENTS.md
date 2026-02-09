# SettingsRow Component İyileştirmeleri

## Sorun
Profil ekranındaki ayar satırlarında tutarsızlıklar vardı:
- Divider'lar eksikti
- Padding ve spacing tutarsızdı
- Icon boyutları değişkendi
- Chevron boyutu çok büyüktü
- Value ve chevron hizası belirsizdi
- Haptic feedback yoktu

## Çözüm

### 1. SettingsRow Component Standardizasyonu

**Component Yapısı:**
```
┌────────────────────────────────────┐
│ [Icon] Label          Value  ›    │  52px min
│  22px   15px          14px   18px │
│                                    │
│  ← 12px → ← flex 1 → ← gap 6 →    │
└────────────────────────────────────┘
```

**Layout:**
- **Sol:** Icon (22px) + Label (flex: 1)
- **Sağ:** Value (optional) + Chevron (optional)
- **Height:** minHeight 52px
- **Padding:** 16px horizontal, 12px vertical

### 2. Özellikler

**Props:**
```tsx
interface SettingsRowProps {
  label: string;              // Required
  value?: string;             // Optional (right side)
  onPress?: () => void;       // Makes it interactive
  showArrow?: boolean;        // Show chevron
  icon?: IconSymbolName;      // Left icon
  showDivider?: boolean;      // Bottom divider
  style?: ViewStyle;          // Custom style
}
```

**Usage:**
```tsx
// Simple row
<SettingsRow
  label="Bildirimler"
  value="Açık"
  icon="bell.fill"
  showArrow
  onPress={handleNotifications}
/>

// With divider
<SettingsRow
  label="Tema"
  value="Koyu"
  icon="moon.fill"
  showArrow
  showDivider
  onPress={handleTheme}
/>

// No value
<SettingsRow
  label="Yardım & Destek"
  icon="questionmark.circle.fill"
  showArrow
  onPress={handleHelp}
/>

// Non-interactive
<SettingsRow
  label="Uygulama Versiyonu"
  value="1.0.0"
  icon="info.circle.fill"
/>
```

### 3. Teknik Detaylar

**Styles:**
```tsx
container: {
  borderRadius: 12,
  marginBottom: spacing.sm,      // 8px
  overflow: 'hidden',
  backgroundColor: colors.surface.elevated,
  borderWidth: 1,
  borderColor: colors.surface.border,
}

row: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.base,  // 16px
  paddingVertical: spacing.md,      // 12px
  minHeight: 52,
}

iconContainer: {
  marginRight: spacing.md,  // 12px
  width: 28,                // Fixed width for alignment
  alignItems: 'center',
}

label: {
  flex: 1,
  minWidth: 0,
  fontSize: 15,
  fontWeight: '500',
  letterSpacing: 0.1,
}

right: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,                   // Tight gap
  flexShrink: 0,
  maxWidth: '50%',          // Prevent overflow
}

value: {
  fontSize: 14,
  fontWeight: '500',
}

arrow: {
  marginLeft: 2,
}

divider: {
  height: StyleSheet.hairlineWidth,
  marginLeft: spacing.base + 28 + spacing.md, // Align with label
}
```

### 4. Karşılaştırma

| Özellik | Önce | Sonra |
|---------|------|-------|
| Min Height | 56px | 52px ✅ |
| Padding Horizontal | 20px (lg) | 16px (base) ✅ |
| Padding Vertical | 12px (md) | 12px (same) |
| Icon Size | 24px | 22px ✅ |
| Icon Container Width | - | 28px (fixed) ✅ |
| Label Font | Theme body | 15px explicit ✅ |
| Label Weight | Theme | 500 ✅ |
| Value Font | Theme bodySmall | 14px explicit ✅ |
| Value Weight | Theme | 500 ✅ |
| Chevron Size | 20px | 18px ✅ |
| Right Gap | 4px (xs) | 6px ✅ |
| Max Width (right) | 55% | 50% ✅ |
| Divider | ❌ | ✅ Optional |
| Haptic Feedback | ❌ | ✅ |
| Shadow | ✅ | ❌ (cleaner) |

### 5. Icon Alignment

**Önce (Tutarsız):**
```
┌────────────────────────────────────┐
│ 🔔 Bildirimler        Açık  ›     │
│  24px                              │
│                                    │
│ 🌍 Dil                Türkçe  ›    │
│  24px                              │
└────────────────────────────────────┘
```
❌ Icon'lar hizasız (marginRight variable)

**Sonra (Hizalı):**
```
┌────────────────────────────────────┐
│ 🔔  Bildirimler       Açık  ›     │
│ 22px                               │
│                                    │
│ 🌍  Dil               Türkçe  ›    │
│ 22px                               │
└────────────────────────────────────┘
```
✅ Icon'lar hizalı (fixed width container: 28px)

### 6. Divider Kullanımı

**Opsiyonel Divider:**
```tsx
<SettingsRow
  label="Bildirimler"
  value="Açık"
  showDivider  // ✅ Divider ekler
  onPress={handleNotifications}
/>
<SettingsRow
  label="Konum"
  value="Açık"
  onPress={handleLocation}
/>
```

**Görünüm:**
```
┌────────────────────────────────────┐
│ 🔔  Bildirimler       Açık  ›     │
├────────────────────────────────────┤ ← Divider (hairline)
│ 📍  Konum             Açık  ›     │
└────────────────────────────────────┘
```

**Divider Alignment:**
```tsx
divider: {
  marginLeft: spacing.base + 28 + spacing.md,
  // 16px (padding) + 28px (icon) + 12px (margin) = 56px
  // Divider label ile hizalı başlar
}
```

### 7. Haptic Feedback

**Önce:**
```tsx
<TouchableOpacity onPress={onPress}>
  {/* No haptic */}
</TouchableOpacity>
```

**Sonra:**
```tsx
const handlePress = () => {
  if (onPress) {
    lightImpact();  // ✅ Haptic feedback
    onPress();
  }
};

<TouchableOpacity onPress={handlePress}>
  {/* With haptic */}
</TouchableOpacity>
```

### 8. Typography Hierarchy

**Clear Progression:**
```
Label: 15px, weight 500, letterSpacing 0.1  ← Primary
  ↓
Value: 14px, weight 500                     ← Secondary
  ↓
Chevron: 18px                               ← Tertiary
```

### 9. Responsive Behavior

**Value Truncation:**
```tsx
right: {
  maxWidth: '50%',  // Prevents overflow
  flexShrink: 0,    // Doesn't shrink
}

value: {
  // numberOfLines={1} in JSX
}
```

**Long Labels:**
```tsx
label: {
  flex: 1,
  minWidth: 0,  // Allows truncation
}
```

### 10. Section Grouping

**Best Practice:**
```tsx
<Section title="Tercihler">
  <SettingsRow label="Bildirimler" showDivider />
  <SettingsRow label="Konum" showDivider />
  <SettingsRow label="Tema" showDivider />
  <SettingsRow label="Dil" />  {/* No divider on last */}
</Section>

<Section title="Uygulama Ayarları">
  <SettingsRow label="Veri Tasarrufu" showDivider />
  <SettingsRow label="Otomatik Oynatma" showDivider />
  <SettingsRow label="Önbellek" />
</Section>
```

### 11. Avantajlar

#### Consistency
1. **Fixed Dimensions:**
   - minHeight: 52px (all rows)
   - Icon: 22px (all icons)
   - Chevron: 18px (all chevrons)
   - Padding: 16/12px (all rows)

2. **Aligned Layout:**
   - Icon container: 28px fixed width
   - Divider: aligned with label
   - Value + chevron: right-aligned

3. **Typography:**
   - Label: 15px, weight 500
   - Value: 14px, weight 500
   - Clear hierarchy

#### UX
1. **Touch Target:**
   - minHeight: 52px (>44px) ✅
   - Full row clickable
   - Proper spacing

2. **Haptic Feedback:**
   - Every interaction
   - Tactile response
   - Better feel

3. **Visual Feedback:**
   - activeOpacity: 0.7
   - Smooth transition
   - Clear state

#### Visual
1. **Clean Design:**
   - No shadow (cleaner)
   - Subtle border
   - Consistent spacing

2. **Optional Divider:**
   - Hairline width
   - Aligned with label
   - Subtle separation

3. **Icon Alignment:**
   - Fixed width container
   - All icons aligned
   - Professional look

### 12. Test Checklist

#### Dimensions
- [ ] minHeight: 52px
- [ ] Padding: 16px horizontal, 12px vertical
- [ ] Icon: 22px
- [ ] Icon container: 28px width
- [ ] Chevron: 18px
- [ ] marginBottom: 8px

#### Layout
- [ ] Icon container: fixed 28px width
- [ ] Label: flex 1, truncates
- [ ] Right: maxWidth 50%
- [ ] Value + chevron: gap 6px
- [ ] Divider: aligned with label

#### Typography
- [ ] Label: 15px, weight 500
- [ ] Value: 14px, weight 500
- [ ] letterSpacing: 0.1

#### Colors
- [ ] Background: surface.elevated
- [ ] Border: surface.border
- [ ] Icon: text.secondary
- [ ] Label: text.primary
- [ ] Value: text.secondary
- [ ] Chevron: text.tertiary
- [ ] Divider: surface.border

#### Interaction
- [ ] Touch target: 52px (>44px)
- [ ] Haptic feedback on press
- [ ] activeOpacity: 0.7
- [ ] Full row clickable

#### Divider
- [ ] Optional (showDivider prop)
- [ ] Hairline width
- [ ] Aligned with label (56px left)
- [ ] Subtle color

#### Responsive
- [ ] Small screens: readable
- [ ] Large screens: scales
- [ ] Text truncation works
- [ ] Value doesn't overflow

#### Themes
- [ ] Light: correct colors
- [ ] Dark: correct colors
- [ ] All states adapt

### 13. Migration Guide

**Already Using SettingsRow:** ✅ No changes needed

**API Same:**
```tsx
<SettingsRow
  label="Bildirimler"
  value="Açık"
  icon="bell.fill"
  showArrow
  onPress={handleNotifications}
/>
```

**New Features:**
```tsx
// Optional divider
<SettingsRow
  label="Bildirimler"
  showDivider  // ✅ New prop
  onPress={handleNotifications}
/>

// Haptic feedback (automatic)
// Icon alignment (automatic)
// Typography (automatic)
```

### 14. Best Practices

**Section Grouping:**
```tsx
<Section title="Tercihler">
  <SettingsRow label="A" showDivider />
  <SettingsRow label="B" showDivider />
  <SettingsRow label="C" />  {/* No divider on last */}
</Section>
```

**Icon Usage:**
```tsx
// Always use icons for better scannability
<SettingsRow
  label="Bildirimler"
  icon="bell.fill"  // ✅ Good
/>

<SettingsRow
  label="Bildirimler"
  // No icon  // ❌ Less scannable
/>
```

**Value Formatting:**
```tsx
// Short, clear values
value="Açık"        // ✅ Good
value="Kapalı"      // ✅ Good
value="Türkçe"      // ✅ Good
value="1.0.0"       // ✅ Good

// Too long
value="Çok uzun bir açıklama metni"  // ❌ Bad
```

### 15. Gelecek İyileştirmeler

1. **Switch Component:**
   ```tsx
   <SettingsRow
     label="Bildirimler"
     rightComponent={<Switch value={enabled} />}
   />
   ```

2. **Badge:**
   ```tsx
   <SettingsRow
     label="Yeni Özellikler"
     badge="3"
     showArrow
   />
   ```

3. **Subtitle:**
   ```tsx
   <SettingsRow
     label="Bildirimler"
     subtitle="Mekan önerileri ve güncellemeler"
     showArrow
   />
   ```

4. **Custom Right Component:**
   ```tsx
   <SettingsRow
     label="Tema"
     rightComponent={<ThemePicker />}
   />
   ```

5. **Section Dividers:**
   ```tsx
   <Section title="Tercihler" showDividers>
     <SettingsRow label="A" />
     <SettingsRow label="B" />
     <SettingsRow label="C" />
   </Section>
   ```

## Özet

**Önce:**
- Tutarsız padding/spacing
- Icon boyutları değişken
- Chevron çok büyük (20px)
- Divider yok
- Haptic feedback yok
- Shadow var (ağır)

**Sonra:**
- ✅ Tutarlı padding (16/12px)
- ✅ Icon: 22px (sabit)
- ✅ Chevron: 18px (kompakt)
- ✅ Optional divider
- ✅ Haptic feedback
- ✅ No shadow (clean)

**Kazanımlar:**
- Consistent design
- Fixed icon alignment (28px container)
- Better hierarchy (15/14/18px)
- Haptic feedback
- Optional dividers
- Professional, iOS-style
- Touch target: 52px (>44px)

**Son Güncelleme:** Şubat 2026
