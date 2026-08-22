/**
 * Theme Context & Provider
 * 
 * Manages app-wide theme state with persistence.
 * Allows users to:
 * - Toggle between dark/light themes
 * - Use system theme preference
 * - Persist theme choice
 * 
 * @module context/ThemeContext
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mmkv } from '@/src/utils/mmkvStorage';
import { useColorScheme } from 'react-native';
import { logger } from '@/src/utils/logger';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /** Current active theme (light or dark) */
  theme: 'light' | 'dark';
  
  /** User's theme preference (light, dark, or system) */
  themeMode: ThemeMode;
  
  /** Set theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  
  /** Toggle between light and dark */
  toggleTheme: () => void;
  
  /** Is dark theme active */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@asemos_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemTheme = useColorScheme();
  
  // MMKV senkron okuduğu için initialState'i doğrudan set edebiliyoruz — flaş yok!
  const savedTheme = (() => {
    try {
      const saved = mmkv.getString(THEME_STORAGE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved as ThemeMode;
      }
    } catch {}
    return 'system' as ThemeMode;
  })();
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(savedTheme);
  const [isReady] = useState(true); // MMKV senkron: baştan hazır

  // Calculate active theme based on mode
  const theme: 'light' | 'dark' = 
    themeMode === 'system' 
      ? (systemTheme || 'dark')
      : themeMode;

  const isDark = theme === 'dark';

  const setThemeMode = (mode: ThemeMode) => {
    try {
      mmkv.set(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      logger.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = theme === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Don't render until theme is loaded
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeMode, 
        setThemeMode, 
        toggleTheme,
        isDark 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * 
 * @example
 * ```tsx
 * const { theme, toggleTheme, isDark } = useThemeContext();
 * 
 * <Button onPress={toggleTheme}>
 *   {isDark ? '🌙' : '☀️'} Toggle Theme
 * </Button>
 * ```
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
