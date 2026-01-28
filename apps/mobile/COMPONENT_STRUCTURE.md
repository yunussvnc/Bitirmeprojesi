# Component Structure & Implementation Guide

**Version:** 1.0  
**Date:** January 2025  
**Purpose:** Practical implementation guide for the redesigned UI

---

## 📁 Recommended File Structure

```
/apps/mobile/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx            # Home (Discover)
│   │   ├── explore.tsx          # AI Recommendations
│   │   ├── saved.tsx            # Saved Places
│   │   └── profile.tsx          # Profile & Settings
│   ├── login.tsx
│   ├── register.tsx
│   ├── onboarding.tsx
│   └── place/
│       └── [id].tsx             # Place Detail
│
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx           # Primary, Secondary, Text buttons
│   │   ├── Card.tsx             # Base card component
│   │   ├── Chip.tsx             # Filter chips, tags
│   │   ├── Input.tsx            # Text input, search input
│   │   ├── Avatar.tsx           # User avatars
│   │   ├── Rating.tsx           # Star ratings
│   │   ├── Badge.tsx            # Status badges
│   │   ├── Skeleton.tsx         # Loading skeletons
│   │   ├── EmptyState.tsx       # Empty states
│   │   ├── ErrorState.tsx       # Error states
│   │   ├── Modal.tsx            # Modals
│   │   ├── BottomSheet.tsx      # Bottom sheets
│   │   └── Divider.tsx          # Dividers
│   │
│   ├── place/                    # Place-specific components
│   │   ├── PlaceCard.tsx        # Large place card
│   │   ├── PlaceCardCompact.tsx # Compact place card
│   │   ├── PlaceHero.tsx        # Place detail hero image
│   │   └── PlaceMetadata.tsx    # Place info (rating, distance)
│   │
│   ├── review/                   # Review components
│   │   ├── ReviewCard.tsx       # Single review card
│   │   ├── ReviewList.tsx       # Review list
│   │   ├── RatingBreakdown.tsx # Rating distribution
│   │   └── VerifiedBadge.tsx   # Verified review badge
│   │
│   ├── filter/                   # Filter components
│   │   ├── FilterCard.tsx       # Filter container
│   │   ├── FilterSection.tsx    # Filter group
│   │   └── FilterChip.tsx       # Filter chip (reuse Chip)
│   │
│   ├── navigation/               # Navigation components
│   │   ├── TabBar.tsx           # Custom tab bar
│   │   ├── Header.tsx           # Screen header
│   │   └── BackButton.tsx       # Back button
│   │
│   └── layout/                   # Layout components
│       ├── Screen.tsx           # Base screen wrapper
│       ├── Section.tsx          # Section container
│       └── Container.tsx        # Content container
│
├── constants/
│   └── design/                   # Design system tokens
│       ├── colors.ts            # Color system
│       ├── typography.ts        # Typography system
│       ├── spacing.ts           # Spacing system
│       ├── shadows.ts           # Shadow definitions
│       ├── animations.ts        # Animation constants
│       └── index.ts             # Export all
│
├── hooks/                        # Custom hooks
│   ├── useTheme.ts              # Theme hook
│   ├── useAnimation.ts          # Animation utilities
│   └── useHaptics.ts            # Haptic feedback
│
└── utils/                        # Utilities
    ├── formatters.ts            # Text formatters
    └── validators.ts           # Form validators
```

---

## 🧩 Component Implementation Examples

### 1. Design System Constants

#### `constants/design/colors.ts`

```typescript
export const colors = {
  dark: {
    background: {
      primary: '#121212',
      secondary: '#181818',
      tertiary: '#1A1A1A',
      elevated: '#242424',
    },
    surface: {
      default: 'rgba(255, 255, 255, 0.05)',
      hover: 'rgba(255, 255, 255, 0.08)',
      pressed: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
    accent: {
      primary: '#1DB954',
      primaryHover: '#1ED760',
      primaryPressed: '#1AA34A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      tertiary: '#727272',
      inverse: '#121212',
    },
    semantic: {
      success: '#1DB954',
      warning: '#FFA500',
      error: '#E22134',
      info: '#1DB954',
    },
    overlay: {
      light: 'rgba(0, 0, 0, 0.3)',
      medium: 'rgba(0, 0, 0, 0.5)',
      dark: 'rgba(0, 0, 0, 0.7)',
    },
  },
  // Light theme (optional)
  light: {
    // ... similar structure
  },
};

export type ColorTheme = typeof colors.dark;
```

#### `constants/design/spacing.ts`

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  
  // Semantic
  screenPadding: 20,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  elementGap: 8,
} as const;

export type Spacing = typeof spacing;
```

#### `constants/design/typography.ts`

```typescript
export const typography = {
  fontFamily: {
    ios: 'SF Pro Display',
    android: 'Roboto',
    web: 'Inter, system-ui',
    default: 'system-ui',
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  scale: {
    display: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    heading: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
  },
} as const;
```

---

### 2. Base UI Components

#### `components/ui/Button.tsx`

```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/constants/design';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.button, styles[size], style, isDisabled && styles.disabled]}
      >
        <LinearGradient
          colors={
            isDisabled
              ? [colors.dark.surface.default, colors.dark.surface.default]
              : [colors.dark.accent.primary, colors.dark.accent.primaryHover]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.dark.text.inverse} />
          ) : (
            <Text style={[styles.text, styles.primaryText]}>{children}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles.secondary,
          styles[size],
          style,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.dark.text.primary} />
        ) : (
          <Text style={[styles.text, styles.secondaryText]}>{children}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Text button
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[styles.textButton, style, isDisabled && styles.disabled]}
    >
      <Text style={[styles.text, styles.textButtonText]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    minHeight: 36,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  medium: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.dark.surface.default,
    borderWidth: 1,
    borderColor: colors.dark.surface.border,
  },
  textButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  text: {
    ...typography.scale.label,
    fontWeight: typography.weight.semibold,
  },
  primaryText: {
    color: colors.dark.text.inverse,
  },
  secondaryText: {
    color: colors.dark.text.primary,
  },
  textButtonText: {
    color: colors.dark.accent.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

#### `components/ui/Chip.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/constants/design';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.chip, style]}
      >
        {active ? (
          <LinearGradient
            colors={[colors.dark.accent.primary, colors.dark.accent.primaryHover]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chipGradient}
          >
            <Text style={[styles.chipText, styles.chipTextActive]}>{label}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.chipText}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Non-interactive chip (tag)
  return (
    <TouchableOpacity style={[styles.chip, styles.chipTag, style]} disabled>
      <Text style={[styles.chipText, styles.chipTextTag]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  chipTag: {
    backgroundColor: colors.dark.surface.hover,
  },
  chipGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    ...typography.scale.label,
    color: colors.dark.text.secondary,
  },
  chipTextActive: {
    color: colors.dark.text.inverse,
  },
  chipTextTag: {
    ...typography.scale.caption,
    color: colors.dark.text.secondary,
  },
});
```

#### `components/ui/PlaceCard.tsx`

```typescript
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/constants/design';
import { Rating } from './Rating';
import { Chip } from './Chip';

interface PlaceCardProps {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  rating?: number;
  tags?: string[];
  onPress: () => void;
}

export function PlaceCard({
  image,
  title,
  subtitle,
  rating,
  tags,
  onPress,
}: PlaceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.card}
    >
      <Image source={image} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          {rating !== undefined && (
            <View style={styles.rating}>
              <Rating rating={rating} size={14} />
            </View>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {tags && tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} label={tag} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
    backgroundColor: colors.dark.surface.default,
    borderWidth: 1,
    borderColor: colors.dark.surface.border,
  },
  image: {
    width: '100%',
    height: 200,
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  content: {
    padding: spacing.cardPadding,
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  rating: {
    backgroundColor: colors.dark.surface.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  title: {
    ...typography.scale.heading,
    color: colors.dark.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.scale.bodySmall,
    color: colors.dark.text.secondary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
```

---

### 3. Layout Components

#### `components/layout/Screen.tsx`

```typescript
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '@/constants/design';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scrollable = true, style }: ScreenProps) {
  const content = (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
});
```

#### `components/layout/Section.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/constants/design';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sectionGap,
  },
  title: {
    ...typography.scale.heading,
    color: colors.dark.text.primary,
    marginBottom: spacing.base,
  },
});
```

---

### 4. Hooks

#### `hooks/useTheme.ts`

```typescript
import { useColorScheme } from 'react-native';
import { colors } from '@/constants/design';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    colors: isDark ? colors.dark : colors.light,
    isDark,
  };
}
```

---

## 🚀 Implementation Steps

### Step 1: Set Up Design System
1. Create `constants/design/` directory
2. Implement `colors.ts`, `spacing.ts`, `typography.ts`
3. Export from `index.ts`

### Step 2: Create Base Components
1. Implement `Button.tsx`
2. Implement `Chip.tsx`
3. Implement `Input.tsx`
4. Test components in isolation

### Step 3: Create Layout Components
1. Implement `Screen.tsx`
2. Implement `Section.tsx`
3. Update existing screens to use new components

### Step 4: Create Feature Components
1. Implement `PlaceCard.tsx`
2. Implement `ReviewCard.tsx`
3. Implement `EmptyState.tsx`

### Step 5: Refactor Screens
1. Start with Home screen
2. Update Explore screen
3. Update Place Detail screen
4. Update Saved screen

### Step 6: Polish
1. Add animations
2. Add loading states
3. Add error states
4. Test accessibility

---

## 📋 Component Checklist

Before considering a component complete:
- [ ] Uses design system tokens (colors, spacing, typography)
- [ ] Supports dark theme (primary)
- [ ] Has proper TypeScript types
- [ ] Handles loading/error states
- [ ] Has accessibility labels
- [ ] Tested on iOS and Android
- [ ] Follows naming conventions
- [ ] Documented with JSDoc comments

---

## 🎯 Best Practices

1. **Always use design tokens** - Never hardcode colors, spacing, or typography
2. **Component composition** - Build complex components from simple ones
3. **Type safety** - Use TypeScript for all components
4. **Accessibility first** - Add labels, test with screen readers
5. **Performance** - Use `React.memo` for expensive components
6. **Consistency** - Follow the same patterns across all components

---

**End of Component Structure Guide**
