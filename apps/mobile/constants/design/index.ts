/**
 * Design System - Main Export
 * 
 * Central export point for all design system tokens.
 * 
 * Usage:
 * ```tsx
 * import { colors, typography, spacing, shadows, animations } from '@/constants/design';
 * ```
 */

// Core systems
export { colors, getColors, darkColors, lightColors } from './colors';
export { typography, getFontFamily, createTextStyle } from './typography';
export { spacing, getSpacing, createSpacing } from './spacing';
export { shadows, createShadow } from './shadows';
export { animations, animationTiming, animationEasing, easing, getAnimationTiming } from './animations';

// Types
export type {
  ColorTheme,
  TypographyScale,
  TypographySystem,
  SpacingSystem,
  ShadowDefinition,
  AnimationTiming,
  AnimationEasing,
  DesignSystem,
} from './types';

/**
 * Complete design system object
 * 
 * Use this for type-safe access to all design tokens
 */
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { animationTiming, animationEasing } from './animations';
import type { DesignSystem } from './types';

export const designSystem: DesignSystem = {
  colors,
  typography,
  spacing,
  shadows: {
    small: shadows.small,
    medium: shadows.medium,
    large: shadows.large,
  },
  animations: {
    timing: animationTiming,
    easing: animationEasing,
  },
} as const;
