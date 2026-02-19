/**
 * Loading State Component
 * 
 * Displays loading state with animated spinner and optional text.
 * 
 * @module components/ui/LoadingState
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { createTextStyle, spacing, animationTiming, easing } from '@/constants/design';

export interface LoadingStateProps {
  /**
   * Loading message (optional)
   */
  message?: string;
  
  /**
   * Size of the spinner
   * @default 'large'
   */
  size?: 'small' | 'large';
  
  /**
   * Compact mode (smaller padding)
   * @default false
   */
  compact?: boolean;
}

/**
 * Loading State Component
 * 
 * Displays a centered loading state with spinner and optional message.
 * 
 * @example
 * ```tsx
 * <LoadingState message="Mekanlar yükleniyor..." />
 * ```
 */
export function LoadingState({
  message = 'Yükleniyor...',
  size = 'large',
  compact = false,
}: LoadingStateProps) {
  const { colors } = useTheme();
  const messageStyle = createTextStyle('body', colors.text.secondary);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <ActivityIndicator
        size={size}
        color={colors.accent.primary}
        style={styles.spinner}
      />
      {message && (
        <Text style={[messageStyle, styles.message]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  containerCompact: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  spinner: {
    marginBottom: spacing.base,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
});
