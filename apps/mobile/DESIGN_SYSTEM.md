# Design System & UI/UX Redesign
## Spotify-Inspired Design Language

**Version:** 1.0  
**Date:** January 2025  
**Status:** Complete Redesign Specification

---

## 🎨 Design Philosophy

### Core Principles
1. **Dark-first, premium feel** - Near-black backgrounds, not pure black (#121212 range)
2. **Visual hierarchy through contrast** - Subtle gradients, soft shadows, depth
3. **Minimal cognitive load** - One focus per screen, clear actions
4. **Smooth, purposeful animations** - Never decorative-only
5. **Consistent spacing rhythm** - 4px base unit system
6. **Calm, confident UI** - Non-aggressive, trustworthy

### Spotify Design DNA (What We Extract)
- ✅ Color harmony & limited palette
- ✅ Spacing & typography consistency
- ✅ Navigation clarity
- ✅ Premium, smooth UX
- ❌ NOT: Music-specific features, branding, layouts

---

## 🎨 Color System

### Primary Palette

```typescript
// Dark Theme (Primary)
const colors = {
  // Backgrounds
  background: {
    primary: '#121212',      // Main app background (near-black, not pure)
    secondary: '#181818',     // Card backgrounds
    tertiary: '#1A1A1A',      // Elevated surfaces
    elevated: '#242424',      // Modals, bottom sheets
  },
  
  // Surface Colors
  surface: {
    default: 'rgba(255, 255, 255, 0.05)',    // Subtle cards
    hover: 'rgba(255, 255, 255, 0.08)',      // Interactive states
    pressed: 'rgba(255, 255, 255, 0.12)',    // Pressed states
    border: 'rgba(255, 255, 255, 0.1)',      // Subtle borders
  },
  
  // Primary Accent (Single color, used sparingly)
  accent: {
    primary: '#1DB954',       // Spotify green equivalent - our primary action color
    primaryHover: '#1ED760',  // Lighter on hover
    primaryPressed: '#1AA34A', // Darker on press
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',        // Main text
    secondary: '#B3B3B3',      // Secondary text (metadata)
    tertiary: '#727272',       // Tertiary text (hints, disabled)
    inverse: '#121212',        // Text on light backgrounds
  },
  
  // Semantic Colors
  semantic: {
    success: '#1DB954',
    warning: '#FFA500',
    error: '#E22134',
    info: '#1DB954',
  },
  
  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',    // Image overlays
    medium: 'rgba(0, 0, 0, 0.5)',   // Modal backdrops
    dark: 'rgba(0, 0, 0, 0.7)',     // Heavy overlays
    gradient: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
  },
};
```

### Light Theme (Optional, Secondary)

```typescript
const colorsLight = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F8F8',
    tertiary: '#F0F0F0',
    elevated: '#FFFFFF',
  },
  surface: {
    default: 'rgba(0, 0, 0, 0.05)',
    hover: 'rgba(0, 0, 0, 0.08)',
    pressed: 'rgba(0, 0, 0, 0.12)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
  accent: {
    primary: '#1DB954',
    primaryHover: '#1ED760',
    primaryPressed: '#1AA34A',
  },
  text: {
    primary: '#121212',
    secondary: '#4A4A4A',
    tertiary: '#727272',
    inverse: '#FFFFFF',
  },
};
```

### Color Usage Rules
- **Primary accent (#1DB954)** used ONLY for:
  - Primary action buttons
  - Active states (selected chips, active tabs)
  - Success indicators
  - Progress indicators
- **Never use** multiple accent colors on same screen
- **Gradients** are subtle, never harsh
- **Borders** are minimal, use opacity for depth

---

## ✍️ Typography

### Font Stack

```typescript
const typography = {
  // Primary font (System default, optimized per platform)
  fontFamily: {
    ios: 'SF Pro Display',      // iOS system font
    android: 'Roboto',           // Android system font
    web: 'Inter, system-ui',     // Web fallback
    default: 'system-ui',        // Fallback
  },
  
  // Font Weights
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  
  // Type Scale
  scale: {
    // Display (Hero titles)
    display: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    
    // Title (Screen titles, card titles)
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    
    // Heading (Section headers)
    heading: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    
    // Body (Main content)
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    },
    
    // Body Small
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0,
    },
    
    // Caption (Metadata, hints)
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    
    // Label (Button text, labels)
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
  },
};
```

### Typography Usage

| Element | Type | Weight | Color |
|---------|------|--------|-------|
| Screen Title | `title` | Bold (700) | `text.primary` |
| Card Title | `heading` | Semibold (600) | `text.primary` |
| Body Text | `body` | Regular (400) | `text.secondary` |
| Button Text | `label` | Semibold (600) | `text.inverse` (on accent) |
| Metadata | `caption` | Regular (400) | `text.tertiary` |
| Section Header | `heading` | Semibold (600) | `text.primary` |

### Line Height Rules
- **Titles**: Tight line height (1.25x font size)
- **Body**: Comfortable (1.5x font size)
- **Captions**: Compact (1.33x font size)

---

## 📏 Spacing System

### Base Unit: 4px

```typescript
const spacing = {
  // Base units (4px increments)
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  base: 16,   // 16px (most common)
  lg: 20,     // 20px
  xl: 24,     // 24px
  xxl: 32,    // 32px
  xxxl: 40,   // 40px
  
  // Semantic spacing
  screenPadding: 20,        // Screen horizontal padding
  cardPadding: 16,         // Card internal padding
  cardGap: 12,             // Gap between cards
  sectionGap: 24,          // Gap between sections
  elementGap: 8,           // Gap between related elements
};
```

### Spacing Usage Rules
- **Screen edges**: 20px horizontal padding
- **Cards**: 16px internal padding
- **Card spacing**: 12px vertical gap
- **Section spacing**: 24px between major sections
- **Related elements**: 8px gap (e.g., icon + text)
- **Touch targets**: Minimum 44x44px (iOS), 48x48px (Android)

---

## 🧩 Component System

### 1. Buttons

#### Primary Button
```typescript
// Usage: Main actions (Get Recommendations, Save, etc.)
<PrimaryButton onPress={handleAction}>
  Get Recommendations
</PrimaryButton>

// Styling:
- Background: accent.primary (#1DB954)
- Text: text.inverse (white)
- Padding: 16px vertical, 24px horizontal
- Border radius: 8px
- Height: 48px minimum
- Font: label (14px, semibold)
- Shadow: Subtle elevation (2-4px)
```

#### Secondary Button
```typescript
// Usage: Secondary actions, cancel, etc.
<SecondaryButton onPress={handleAction}>
  Cancel
</SecondaryButton>

// Styling:
- Background: surface.default (transparent with subtle fill)
- Border: surface.border (1px, subtle)
- Text: text.primary
- Same padding/height as primary
- No shadow
```

#### Icon Button
```typescript
// Usage: Save, share, back, etc.
<IconButton icon="heart" onPress={handleAction} />

// Styling:
- Size: 44x44px (touch target)
- Background: surface.default on press
- Icon: 24px, text.secondary
- Circular or rounded (8px radius)
```

#### Text Button
```typescript
// Usage: Links, subtle actions
<TextButton onPress={handleAction}>
  View All
</TextButton>

// Styling:
- No background
- Text: accent.primary
- Font: label
- Underline on press (optional)
```

### 2. Cards

#### Place Card (Large)
```typescript
// Usage: Main place listings, hero cards
<PlaceCard
  image={place.image}
  title={place.name}
  subtitle={place.subtitle}
  rating={place.rating}
  tags={place.tags}
  onPress={handlePress}
/>

// Styling:
- Height: 200px (flexible)
- Border radius: 12px
- Background: surface.default
- Image: Cover, with gradient overlay bottom
- Shadow: Subtle (elevation 2)
- Padding: 16px
```

#### Place Card (Compact)
```typescript
// Usage: Lists, saved places
<PlaceCardCompact
  image={place.image}
  title={place.name}
  subtitle={place.subtitle}
  onPress={handlePress}
/>

// Styling:
- Height: 80px
- Horizontal layout (image left, content right)
- Border radius: 12px
- Background: surface.default
```

#### Review Card
```typescript
// Usage: User reviews
<ReviewCard
  avatar={review.avatar}
  name={review.name}
  rating={review.rating}
  text={review.text}
  verified={review.verified}
  date={review.date}
/>

// Styling:
- Background: surface.default
- Border radius: 12px
- Padding: 16px
- Avatar: 40px circular
- Verified badge: accent.primary, small
```

### 3. Chips / Tags

#### Filter Chip
```typescript
// Usage: Filters (Vibe, Purpose, Budget)
<FilterChip
  label="Quiet"
  active={isActive}
  onPress={handleToggle}
/>

// Styling:
- Active: accent.primary background, white text
- Inactive: surface.default background, text.secondary
- Padding: 8px vertical, 16px horizontal
- Border radius: 20px (pill shape)
- Font: label (14px, semibold)
```

#### Tag Chip
```typescript
// Usage: Place tags (categories)
<TagChip label="Café" />

// Styling:
- Background: surface.hover
- Text: text.secondary
- Padding: 6px vertical, 12px horizontal
- Border radius: 16px
- Font: caption (12px)
```

### 4. Inputs

#### Search Input
```typescript
// Usage: Main search bar
<SearchInput
  placeholder="What are you looking for?"
  value={query}
  onChangeText={setQuery}
/>

// Styling:
- Background: surface.default
- Border: surface.border (1px)
- Border radius: 12px
- Padding: 14px horizontal, 12px vertical
- Height: 48px
- Icon: 20px, text.tertiary (left side)
- Text: body (16px), text.primary
```

#### Text Input
```typescript
// Usage: Forms, login, etc.
<TextInput
  label="Email"
  placeholder="Enter your email"
  value={value}
  onChangeText={setValue}
/>

// Styling:
- Background: surface.default
- Border: surface.border (1px)
- Border radius: 8px
- Padding: 12px
- Height: 48px
- Label: caption, text.secondary (above input)
```

### 5. Navigation

#### Bottom Tab Bar
```typescript
// Styling:
- Background: background.secondary (#181818)
- Height: 60px (iOS), 64px (Android)
- Active tab: accent.primary color
- Inactive tab: text.tertiary
- Icon size: 24px
- Label: caption (12px)
- Border top: surface.border (subtle)
```

#### Header
```typescript
// Styling:
- Background: background.primary (transparent with blur)
- Height: 44px (iOS), 56px (Android)
- Title: heading (18px, semibold)
- Back button: Icon button, 44x44px
- Actions: Right side, icon buttons
```

### 6. Feedback Components

#### Skeleton Loader
```typescript
// Usage: Loading states
<SkeletonLoader type="card" />

// Styling:
- Background: surface.default
- Animated shimmer effect
- Matches content shape
```

#### Empty State
```typescript
// Usage: No results, no saved places
<EmptyState
  icon="bookmark"
  title="No saved places"
  description="Start saving places you like"
  actionLabel="Explore"
  onAction={handleAction}
/>

// Styling:
- Centered layout
- Icon: 64px, text.tertiary
- Title: heading (18px, semibold)
- Description: body (16px), text.secondary
- Action: Primary button
```

#### Error State
```typescript
// Usage: Errors, failures
<ErrorState
  title="Something went wrong"
  description="Please try again"
  actionLabel="Retry"
  onAction={handleRetry}
/>

// Styling:
- Similar to empty state
- Icon: Error icon, semantic.error color
- Calm, helpful tone
```

### 7. Modals & Sheets

#### Bottom Sheet
```typescript
// Usage: Filters, actions, details
<BottomSheet visible={visible} onClose={handleClose}>
  {content}
</BottomSheet>

// Styling:
- Background: background.elevated (#242424)
- Border radius: 20px top corners
- Handle: 4px height, 40px width, text.tertiary
- Backdrop: overlay.medium
- Animation: Smooth slide up
```

#### Modal
```typescript
// Usage: Confirmations, important actions
<Modal visible={visible} onClose={handleClose}>
  {content}
</Modal>

// Styling:
- Background: background.elevated
- Border radius: 16px
- Padding: 24px
- Backdrop: overlay.medium
- Centered on screen
```

---

## 🎭 Animation & Interaction

### Animation Principles
1. **Purposeful only** - Every animation has a reason
2. **Subtle & smooth** - Never jarring
3. **Fast enough** - 200-300ms for most interactions
4. **Easing**: `ease-out` for entrances, `ease-in` for exits

### Standard Animations

```typescript
const animations = {
  // Timing
  fast: 150,      // Quick feedback (button press)
  normal: 250,    // Standard transitions
  slow: 400,      // Complex animations
  
  // Easing
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Standard transitions
  fadeIn: {
    opacity: { from: 0, to: 1 },
    duration: 250,
  },
  slideUp: {
    translateY: { from: 20, to: 0 },
    opacity: { from: 0, to: 1 },
    duration: 300,
  },
  scale: {
    scale: { from: 0.95, to: 1 },
    duration: 200,
  },
};
```

### Interaction Patterns
- **Button press**: Scale down (0.95), 150ms
- **Card press**: Scale down (0.98), 200ms
- **List item**: Subtle background change, 150ms
- **Modal open**: Fade in + slide up, 300ms
- **Tab switch**: Fade transition, 200ms

---

## 📱 Screen Specifications

### Screen Structure Template

```typescript
<Screen>
  {/* Header (if needed) */}
  <Header title="Screen Title" />
  
  {/* Content */}
  <ScrollView
    contentContainerStyle={{
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.base,
      paddingBottom: spacing.xxl, // Account for tab bar
    }}
  >
    {/* Section 1 */}
    <Section>
      <SectionHeader title="Section Title" />
      <Content />
    </Section>
    
    {/* Section 2 */}
    <Section>
      <SectionHeader title="Section Title" />
      <Content />
    </Section>
  </ScrollView>
  
  {/* Bottom Tab Bar (if applicable) */}
  <TabBar />
</Screen>
```

---

## ✅ Accessibility

### Requirements
- **Touch targets**: Minimum 44x44px (iOS), 48x48px (Android)
- **Text contrast**: WCAG AA minimum (4.5:1 for body text)
- **Focus indicators**: Clear focus states for keyboard navigation
- **Screen reader**: Proper labels for all interactive elements
- **Color independence**: Don't rely solely on color for information

### Implementation
- Use `accessibilityLabel` for all buttons/icons
- Use `accessibilityRole` appropriately
- Test with screen readers
- Ensure sufficient color contrast

---

## 🎯 Design Tokens (Implementation)

### Recommended File Structure

```
/constants
  /design
    colors.ts          // Color system
    typography.ts      // Typography system
    spacing.ts        // Spacing system
    shadows.ts        // Shadow definitions
    animations.ts     // Animation constants
    index.ts          // Export all
```

### Example Implementation

```typescript
// constants/design/colors.ts
export const colors = {
  dark: {
    background: {
      primary: '#121212',
      secondary: '#181818',
      // ...
    },
    // ...
  },
  light: {
    // ...
  },
};

// constants/design/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  // ...
};

// Usage in components
import { colors, spacing } from '@/constants/design';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface.default,
    padding: spacing.base,
    borderRadius: 12,
  },
});
```

---

## 📋 Design Checklist

Before implementing any screen:
- [ ] Colors follow the palette (single accent color)
- [ ] Typography uses the scale
- [ ] Spacing follows 4px base unit
- [ ] Touch targets are minimum 44px
- [ ] Animations are purposeful
- [ ] Empty/error states are designed
- [ ] Loading states use skeletons
- [ ] Accessibility labels are added
- [ ] Dark mode is primary, light mode optional

---

**Next:** See screen-by-screen redesign specifications in the following sections.
