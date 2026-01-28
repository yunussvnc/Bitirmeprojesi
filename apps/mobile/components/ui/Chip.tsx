/**
 * Chip Component
 * 
 * Reusable chip component for filters and tags.
 * Supports active/inactive states and interactive/non-interactive modes.
 * 
 * @module components/ui/Chip
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { lightImpact } from '@/src/utils/haptics';

/**
 * Chip component props
 */
export interface ChipProps {
  /**
   * Chip label text
   */
  label: string;
  
  /**
   * Active state (for filter chips)
   * @default false
   */
  active?: boolean;
  
  /**
   * Press handler (makes chip interactive)
   */
  onPress?: () => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Custom text style
   */
  textStyle?: TextStyle;
  
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Chip Component
 * 
 * Versatile chip component that can be used as:
 * - Filter chip (interactive, with active state)
 * - Tag chip (non-interactive, display only)
 * 
 * @example
 * ```tsx
 * // Interactive filter chip
 * <Chip
 *   label="Quiet"
 *   active={isQuietSelected}
 *   onPress={() => setFilter('quiet')}
 * />
 * 
 * // Non-interactive tag
 * <Chip label="Café" />
 * ```
 */
export function Chip({
  label,
  active = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const { colors, spacing, typography } = useTheme();

  // Interactive chip (filter)
  if (onPress) {
    const handlePress = () => {
      lightImpact();
      onPress();
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.chip, style]}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        testID={testID}
      >
        {active ? (
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryHover]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chipGradient}
          >
            <Text
              style={[
                styles.chipText,
                styles.chipTextActive,
                { color: colors.text.inverse },
                textStyle,
              ]}
            >
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <Text
            style={[
              styles.chipText,
              {
                color: colors.text.secondary,
                backgroundColor: colors.surface.default,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Non-interactive chip (tag)
  return (
    <View
      style={[
        styles.chip,
        styles.chipTag,
        {
          backgroundColor: colors.surface.hover,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="text"
      testID={testID}
    >
      <Text
        style={[
          styles.chipText,
          styles.chipTextTag,
          { color: colors.text.secondary },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipTag: {
    // Non-interactive tag styling
  },
  chipGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  chipTextActive: {
    // Color applied dynamically
  },
  chipTextTag: {
    fontSize: 12,
    fontWeight: '400',
  },
});
