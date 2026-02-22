# Design System

Professional, production-ready design system for the mobile application.

## 📁 Structure

```
constants/design/
├── types.ts          # TypeScript type definitions
├── colors.ts         # Color system (dark & light themes)
├── typography.ts     # Typography system
├── spacing.ts        # Spacing system (4px base unit)
├── shadows.ts        # Shadow definitions
├── animations.ts     # Animation constants
└── index.ts          # Main export
```

## 🚀 Quick Start

```tsx
import { colors, typography, spacing, shadows } from '@/constants/design';
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { colors, spacing } = useTheme();
  
  return (
    <View style={{
      backgroundColor: colors.background.primary,
      padding: spacing.base,
    }}>
      <Text style={{ color: colors.text.primary }}>
        Hello World
      </Text>
    </View>
  );
}
```

## 🎨 Usage Examples

### Colors

```tsx
import { colors } from '@/constants/design';

// Dark theme (primary)
const darkBg = colors.dark.background.primary; // '#121212'
const accent = colors.dark.accent.primary;      // '#1DB954'

// With useTheme hook (recommended)
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background.primary }} />
```

### Typography

```tsx
import { typography, createTextStyle } from '@/constants/design';

// Direct usage
<Text style={typography.scale.title}>Title</Text>

// With createTextStyle helper
const titleStyle = createTextStyle('title', colors.dark.text.primary);
<Text style={titleStyle}>Title</Text>
```

### Spacing

```tsx
import { spacing } from '@/constants/design';

<View style={{
  padding: spacing.base,        // 16px
  marginTop: spacing.sectionGap, // 24px
  gap: spacing.cardGap,          // 12px
}} />
```

### Shadows

```tsx
import { shadows } from '@/constants/design';

<View style={shadows.medium} />
```

## 📚 Components

All components use the design system automatically:

```tsx
import { Button, Chip, Card, Input } from '@/components/ui';

<Button variant="primary" onPress={handlePress}>
  Get Started
</Button>

<Chip label="Quiet" active={isActive} onPress={handleToggle} />

<Card>
  <Text>Card content</Text>
</Card>

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

## 🎯 Design Principles

1. **Dark-first**: Dark theme is primary (#121212)
2. **Single accent**: One accent color (#1DB954) used sparingly
3. **4px base unit**: All spacing multiples of 4
4. **System fonts**: Platform-specific fonts (SF Pro, Roboto)
5. **Consistent shadows**: Subtle depth with elevation
6. **Purposeful animations**: 200-300ms, smooth easing

## 📖 Full Documentation

See the main design system documentation:
- `DESIGN_SYSTEM.md` - Complete design system specification
- `SCREEN_REDESIGN.md` - Screen-by-screen redesign
- `COMPONENT_STRUCTURE.md` - Component architecture
