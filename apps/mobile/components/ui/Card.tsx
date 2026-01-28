/**
 * Card Component
 * 
 * Base card component for consistent card styling.
 * Provides foundation for place cards, review cards, etc.
 * 
 * @module components/ui/Card
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { shadows } from '@/constants/design';

/**
 * Card component props
 */
export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Make card pressable
   * @default false
   */
  pressable?: boolean;
  
  /**
   * Press handler (required if pressable)
   */
  onPress?: () => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shadow size
   * @default 'small'
   */
  shadow?: 'small' | 'medium' | 'large' | 'none';
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Card Component
 * 
 * Base card component with consistent styling.
 * Can be used as a container or as a pressable element.
 * 
 * @example
 * ```tsx
 * // Non-pressable card
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 * 
 * // Pressable card
 * <Card pressable onPress={handlePress}>
 *   <Text>Pressable card</Text>
 * </Card>
 * ```
 */
export function Card({
  children,
  pressable = false,
  onPress,
  style,
  shadow = 'small',
  testID,
  ...touchableProps
}: CardProps) {
  const { colors, spacing } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface.default,
      borderColor: colors.surface.border,
      padding: spacing.cardPadding,
    },
    shadow !== 'none' && shadows[shadow],
    style,
  ];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={cardStyle}
        testID={testID}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
});
