/**
 * Color System
 * 
 * Complete color palette for dark and light themes.
 * Based on Spotify-inspired design principles.
 * 
 * Usage:
 * ```tsx
 * import { colors } from '@/constants/design';
 * 
 * <View style={{ backgroundColor: colors.dark.background.primary }} />
 * ```
 */

import type { ColorTheme } from './types';

/**
 * Dark theme color palette (Primary)
 * 
 * - Background: Near-black (#121212) for premium feel
 * - Accent: Single green (#1DB954) used sparingly
 * - Surfaces: Subtle white overlays for depth
 */
export const darkColors: ColorTheme = {
  background: {
    primary: '#121212',      // Main app background (near-black, not pure)
    secondary: '#181818',     // Card backgrounds
    tertiary: '#1A1A1A',      // Elevated surfaces
    elevated: '#242424',      // Modals, bottom sheets
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.05)',    // Subtle cards
    hover: 'rgba(255, 255, 255, 0.08)',      // Interactive states
    pressed: 'rgba(255, 255, 255, 0.12)',   // Pressed states
    border: 'rgba(255, 255, 255, 0.1)',     // Subtle borders
    elevated: '#242424',                     // Cards, filter bars, raised UI
  },
  accent: {
    primary: '#1DB954',       // Spotify green equivalent - primary action color
    primaryHover: '#1ED760',  // Lighter on hover
    primaryPressed: '#1AA34A', // Darker on press
  },
  text: {
    primary: '#FFFFFF',        // Main text
    secondary: '#B3B3B3',      // Secondary text (metadata)
    tertiary: '#727272',       // Tertiary text (hints, disabled)
    inverse: '#121212',        // Text on light backgrounds
  },
  semantic: {
    success: '#1DB954',
    warning: '#FFA500',
    error: '#E22134',
    info: '#1DB954',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',    // Image overlays
    medium: 'rgba(0, 0, 0, 0.5)',   // Modal backdrops
    dark: 'rgba(0, 0, 0, 0.7)',     // Heavy overlays
  },
} as const;

/**
 * Light theme color palette (Optional, Secondary)
 * Yumuşak tonlar – parlak beyaz yerine göz yormayan arka planlar.
 */
export const lightColors: ColorTheme = {
  background: {
    primary: '#F5F5F7',
    secondary: '#EBEBED',
    tertiary: '#E5E5E7',
    elevated: '#FAFAFA',
  },
  surface: {
    default: 'rgba(0, 0, 0, 0.04)',
    hover: 'rgba(0, 0, 0, 0.06)',
    pressed: 'rgba(0, 0, 0, 0.1)',
    border: 'rgba(0, 0, 0, 0.08)',
    elevated: '#EBEBED',
  },
  accent: {
    primary: '#1DB954',
    primaryHover: '#1ED760',
    primaryPressed: '#1AA34A',
  },
  text: {
    primary: '#1C1C1E',
    secondary: '#48484A',
    tertiary: '#636366',
    inverse: '#FFFFFF',
  },
  semantic: {
    success: '#1DB954',
    warning: '#FF9F0A',
    error: '#E22134',
    info: '#1DB954',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.3)',
    medium: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(255, 255, 255, 0.7)',
  },
} as const;

/**
 * Complete color system
 */
export const colors = {
  dark: darkColors,
  light: lightColors,
} as const;

/**
 * Get color by theme
 * 
 * @param theme - 'dark' or 'light'
 * @returns Color theme object
 */
export function getColors(theme: 'dark' | 'light' = 'dark'): ColorTheme {
  return theme === 'dark' ? darkColors : lightColors;
}
