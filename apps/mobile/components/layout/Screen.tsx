/**
 * Screen Component
 * 
 * Base screen wrapper with safe area and scroll support.
 * 
 * @module components/layout/Screen
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenProps {
  /**
   * Screen content
   */
  children: React.ReactNode;
  
  /**
   * Enable scrolling
   * @default true
   */
  scrollable?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Content container style
   */
  contentContainerStyle?: ViewStyle;
  
  /**
   * Pull-to-refresh handler
   */
  onRefresh?: () => void | Promise<void>;
  
  /**
   * Refresh state
   */
  refreshing?: boolean;
}

/**
 * Screen Component
 * 
 * Base screen wrapper with safe area handling and optional scrolling.
 * 
 * @example
 * ```tsx
 * <Screen>
 *   <Text>Screen content</Text>
 * </Screen>
 * ```
 */
export function Screen({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const { colors, spacing } = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background.primary },
    style,
  ];

  if (scrollable) {
    return (
      <SafeAreaView style={containerStyle}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing.screenPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary}
                colors={[colors.accent.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
});
