/**
 * Empty State Component
 * 
 * Displays empty state with icon, title, description, and optional action.
 * 
 * @module components/ui/EmptyState
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import type { IconSymbolName } from './icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from './Button';
import { createTextStyle, spacing } from '@/src/constants/design';
import LottieView from 'lottie-react-native';

/** Preset variants for common empty states */
export type EmptyStateVariant = 'feed' | 'saved' | 'reels' | 'notifications' | 'search' | 'places' | 'custom';


export interface EmptyStateProps {
  /**
   * Icon name (SF Symbol / Material icon key). Ignored if variant is set.
   */
  icon?: IconSymbolName;
  
  /**
   * Title text
   */
  title: string;
  
  /**
   * Description text
   */
  description: string;
  
  /**
   * Action button label (optional)
   */
  actionLabel?: string;
  
  /**
   * Action button handler (optional)
   */
  onAction?: () => void;
  
  /**
   * Use accent color for icon (default: false). Ignored if variant is set.
   */
  accentIcon?: boolean;
  
  /**
   * Preset variant for screen-specific styling (optional).
   * When set, overrides icon and accentIcon from preset.
   */
  variant?: EmptyStateVariant;
}

/**
 * Empty State Component
 * 
 * Displays a centered empty state with icon, title, description, and optional action.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon="bookmark"
 *   title="No saved places"
 *   description="Start saving places you like"
 *   actionLabel="Explore"
 *   onAction={handleExplore}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'custom',
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const descriptionStyle = createTextStyle('body', colors.text.secondary);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
    ]).start();
  }, [opacity, translateY, scale]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {variant !== 'saved' && (
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('@/assets/animations/empty-box.json')}
            autoPlay
            loop
            style={styles.lottie}
            colorFilters={[
              {
                keypath: '**', // Boyanabilecek tüm katmanları accent renge çevirir
                color: colors.accent.primary,
              },
            ]}
          />
        </View>
      )}
      {!!title && (
        <Text style={[titleStyle, styles.title, { marginBottom: spacing.sm }]}>
          {title}
        </Text>
      )}
      {!!description && (
        <Text style={[descriptionStyle, styles.description, { marginBottom: spacing.xl }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onPress={onAction}
          style={variant === 'saved' ? { borderRadius: 30 } : undefined}
        >
          {actionLabel}
        </Button>
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
  lottieContainer: {
    width: 140,
    height: 140,
    marginBottom: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
