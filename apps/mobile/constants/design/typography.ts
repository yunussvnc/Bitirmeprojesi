/**
 * Typography System
 * 
 * Complete typography scale with platform-specific font families.
 * Ensures consistent text rendering across iOS, Android, and Web.
 * 
 * Usage:
 * ```tsx
 * import { typography } from '@/constants/design';
 * 
 * <Text style={typography.scale.title}>Title</Text>
 * ```
 */

import { Platform } from 'react-native';
import type { TypographySystem } from './types';

/**
 * Platform-specific font families
 */
const fontFamily = Platform.select({
  ios: {
    default: 'SF Pro Display',
    fallback: 'system-ui',
  },
  android: {
    default: 'Roboto',
    fallback: 'sans-serif',
  },
  default: {
    default: 'Inter',
    fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

/**
 * Typography system configuration
 */
export const typography: TypographySystem = {
  fontFamily: {
    ios: fontFamily?.default || 'SF Pro Display',
    android: fontFamily?.default || 'Roboto',
    web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: fontFamily?.default || 'system-ui',
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  scale: {
    // Display - Hero titles, large headings
    display: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    // Title - Screen titles, card titles
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    // Heading - Section headers
    heading: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    // Body - Main content text
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    },
    // Body Small - Secondary content
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0,
    },
    // Caption - Metadata, hints
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    // Label - Button text, labels
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
  },
} as const;

/**
 * Get font family for current platform
 * 
 * @returns Font family string for current platform
 */
export function getFontFamily(): string {
  return Platform.select({
    ios: typography.fontFamily.ios,
    android: typography.fontFamily.android,
    default: typography.fontFamily.web,
  }) || typography.fontFamily.default;
}

/**
 * Create text style from typography scale
 * 
 * @param scale - Typography scale key (e.g., 'title', 'body')
 * @param color - Text color (optional)
 * @returns StyleSheet-compatible text style object
 * 
 * @example
 * ```tsx
 * const titleStyle = createTextStyle('title', colors.dark.text.primary);
 * <Text style={titleStyle}>Title</Text>
 * ```
 */
export function createTextStyle(
  scale: keyof typeof typography.scale,
  color?: string
): {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing: number;
  color?: string;
} {
  const scaleConfig = typography.scale[scale];
  return {
    fontFamily: getFontFamily(),
    fontSize: scaleConfig.fontSize,
    lineHeight: scaleConfig.lineHeight,
    fontWeight: scaleConfig.fontWeight,
    letterSpacing: scaleConfig.letterSpacing,
    ...(color && { color }),
  };
}
