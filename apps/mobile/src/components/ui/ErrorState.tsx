/**
 * Error State Component
 * 
 * Displays error state with icon, title, description, and retry action.
 * 
 * @module components/ui/ErrorState
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from './Button';
import { createTextStyle, spacing, radius } from '@/src/constants/design';

export interface ErrorStateProps {
  /**
   * Icon name (SF Symbol / Material icon key)
   * @default 'exclamationmark.triangle.fill'
   */
  icon?: IconSymbolName;
  
  /**
   * Error title
   * @default 'Bir Hata Oluştu'
   */
  title?: string;
  
  /**
   * Error description
   * @default 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.'
   */
  description?: string;
  
  /**
   * Retry button label (optional)
   * @default 'Tekrar Dene'
   */
  retryLabel?: string;
  
  /**
   * Retry button handler (optional)
   */
  onRetry?: () => void;
  
  /**
   * Compact mode (smaller padding)
   * @default false
   */
  compact?: boolean;
}

/**
 * Error State Component
 * 
 * Displays a centered error state with icon, title, description, and retry action.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Mekanlar Yüklenemedi"
 *   description="Bağlantı hatası oluştu"
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function ErrorState({
  icon = 'exclamationmark.triangle.fill',
  title = 'Bir Hata Oluştu',
  description = 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.',
  retryLabel = 'Tekrar Dene',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const descriptionStyle = createTextStyle('body', colors.text.secondary);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, scale]);

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
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
        <IconSymbol name={icon} size={40} color={colors.semantic.error} />
      </Animated.View>
      <Text style={[titleStyle, styles.title, { marginBottom: spacing.sm }]}>
        {title}
      </Text>
      <Text style={[descriptionStyle, styles.description, { marginBottom: spacing.xl }]}>
        {description}
      </Text>
      {onRetry && (
        <Button variant="secondary" onPress={onRetry}>
          {retryLabel}
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
  containerCompact: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
});
