/**
 * Rating Stars Component
 * 
 * Interactive 1-5 star rating component.
 * Trendyol-style rating system.
 * 
 * @module components/ui/RatingStars
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useTheme } from '@/hooks/useTheme';

export interface RatingStarsProps {
  /**
   * Current rating value (1-5)
   * @default 0
   */
  value: number;
  
  /**
   * Rating change handler
   */
  onChange?: (rating: number) => void;
  
  /**
   * Disable interaction
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Star size
   * @default 32
   */
  size?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Rating Stars Component
 * 
 * Interactive star rating with visual feedback.
 */
export function RatingStars({
  value,
  onChange,
  disabled = false,
  size = 32,
  style,
}: RatingStarsProps) {
  const { colors } = useTheme();

  const handlePress = (rating: number) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          disabled={disabled || !onChange}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <IconSymbol
            name={star <= value ? 'star.fill' : 'star'}
            size={size}
            color={star <= value ? colors.accent.primary : colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
});
