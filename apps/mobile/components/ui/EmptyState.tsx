/**
 * Empty State Component
 * 
 * Displays empty state with icon, title, description, and optional action.
 * 
 * @module components/ui/EmptyState
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
import { createTextStyle } from '@/constants/design';
import { animationTiming, easing } from '@/constants/design';

export interface EmptyStateProps {
  /**
   * Icon name
   */
  icon: string;
  
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
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const descriptionStyle = createTextStyle('body', colors.text.secondary);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: animationTiming.normal,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: animationTiming.normal,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: 100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
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
      <Animated.View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.surface.default,
            marginBottom: spacing.base,
          },
        ]}
      >
        <IconSymbol name={icon} size={48} color={colors.text.tertiary} />
      </Animated.View>
      <Text style={[titleStyle, styles.title, { marginBottom: spacing.sm }]}>
        {title}
      </Text>
      <Text style={[descriptionStyle, styles.description, { marginBottom: spacing.xl }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button variant="primary" onPress={onAction}>
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
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
