/**
 * useTheme Hook
 * 
 * Provides access to the design system with theme support.
 * Automatically detects system theme preference.
 * 
 * Usage:
 * ```tsx
 * const { colors, isDark } = useTheme();
 * 
 * <View style={{ backgroundColor: colors.background.primary }} />
 * ```
 */

import { useColorScheme } from 'react-native';
import { colors, typography, spacing, shadows, animations } from '@/constants/design';
import type { ColorTheme } from '@/constants/design';

export interface UseThemeReturn {
  /**
   * Current color theme (dark or light)
   */
  colors: ColorTheme;
  
  /**
   * Whether dark theme is active
   */
  isDark: boolean;
  
  /**
   * Typography system
   */
  typography: typeof typography;
  
  /**
   * Spacing system
   */
  spacing: typeof spacing;
  
  /**
   * Shadow definitions
   */
  shadows: typeof shadows;
  
  /**
   * Animation constants
   */
  animations: typeof animations;
}

/**
 * Hook to access design system with theme support
 * 
 * @param forcedTheme - Optional theme override ('dark' | 'light')
 * @returns Design system tokens for current theme
 * 
 * @example
 * ```tsx
 * // Auto-detect theme
 * const { colors } = useTheme();
 * 
 * // Force dark theme
 * const { colors } = useTheme('dark');
 * ```
 */
export function useTheme(forcedTheme?: 'dark' | 'light'): UseThemeReturn {
  const systemTheme = useColorScheme();
  const theme = forcedTheme || systemTheme || 'dark';
  const isDark = theme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    isDark,
    typography,
    spacing,
    shadows,
    animations,
  };
}
