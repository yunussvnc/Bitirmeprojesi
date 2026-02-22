/**
 * Empty State Component
 * 
 * Displays empty state with icon, title, description, and optional action.
 * 
 * @module components/ui/EmptyState
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from './Button';
import { createTextStyle, spacing, radius } from '@/src/constants/design';

/** Preset variants for common empty states */
export type EmptyStateVariant = 'feed' | 'saved' | 'reels' | 'notifications' | 'search' | 'places' | 'custom';

const VARIANT_PRESETS: Record<Exclude<EmptyStateVariant, 'custom'>, { icon: IconSymbolName; accentIcon: boolean }> = {
  feed: { icon: 'photo.on.rectangle.angled', accentIcon: true },
  saved: { icon: 'bookmark', accentIcon: true },
  reels: { icon: 'video.fill', accentIcon: true },
  notifications: { icon: 'bell.slash', accentIcon: false },
  search: { icon: 'magnifyingglass', accentIcon: true },
  places: { icon: 'mappin.slash', accentIcon: false },
};

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
  icon: iconProp,
  title,
  description,
  actionLabel,
  onAction,
  accentIcon: accentIconProp = false,
  variant = 'custom',
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const descriptionStyle = createTextStyle('body', colors.text.secondary);
  const preset = variant !== 'custom' ? VARIANT_PRESETS[variant] : null;
  const icon = preset?.icon ?? iconProp ?? 'doc.text';
  const accentIcon = preset ? preset.accentIcon : accentIconProp;
  const iconColor = accentIcon ? colors.accent.primary : colors.text.tertiary;
  const iconBgColor = accentIcon ? `${colors.accent.primary}18` : colors.surface.default;
  
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
      <Animated.View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconBgColor,
            marginBottom: spacing.base,
          },
        ]}
      >
        <IconSymbol name={icon} size={48} color={iconColor} />
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
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
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
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
