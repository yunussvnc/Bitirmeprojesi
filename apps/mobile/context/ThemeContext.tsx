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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

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
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Calculate active theme based on mode
  const theme: 'light' | 'dark' = 
    themeMode === 'system' 
      ? (systemTheme || 'dark')
      : themeMode;

  const isDark = theme === 'dark';

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
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
