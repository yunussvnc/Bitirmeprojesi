/**
 * useTheme Hook
 * 
 * Provides access to the design system with theme support.
 * Now integrated with ThemeContext for manual theme switching.
 * 
 * Usage:
 * ```tsx
 * const { colors, isDark, toggleTheme } = useTheme();
 * 
 * <View style={{ backgroundColor: colors.background.primary }} />
 * ```
 */

import { colors, typography, spacing, shadows, animations } from '@/src/constants/design';
import type { ColorTheme } from '@/src/constants/design';
import { useThemeContext } from '@/src/context/ThemeContext';

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
   * Current theme mode ('light' | 'dark' | 'system')
   */
  themeMode: 'light' | 'dark' | 'system';
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => void;
  
  /**
   * Set specific theme mode
   */
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  
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
 * @returns Design system tokens for current theme
 * 
 * @example
 * ```tsx
 * const { colors, isDark, toggleTheme } = useTheme();
 * 
 * <TouchableOpacity onPress={toggleTheme}>
 *   <Text>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
 * </TouchableOpacity>
 * ```
 */
export function useTheme(): UseThemeReturn {
  const { theme, themeMode, setThemeMode, toggleTheme, isDark } = useThemeContext();

  return {
    colors: theme === 'dark' ? colors.dark : colors.light,
    isDark,
    themeMode,
    toggleTheme,
    setThemeMode,
    typography,
    spacing,
    shadows,
    animations,
  };
}
