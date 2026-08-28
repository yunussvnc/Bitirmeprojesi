/**
 * Loading State Component
 * 
 * Displays loading state with animated spinner and optional text.
 * 
 * @module components/ui/LoadingState
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Text, Animated } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { createTextStyle, spacing } from '@/src/constants/design';
import { DotLoader } from './DotLoader';

export interface LoadingStateProps {
  /**
   * Loading message (optional)
   */
  message?: string;
  
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
      <DotLoader size={compact ? 8 : 12} />
      {message && (
        <Text style={[messageStyle, styles.message]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

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
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: spacing.base,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
});
