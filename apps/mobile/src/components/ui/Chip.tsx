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
import { useTheme } from '@/src/hooks/useTheme';
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
   * Chip size
   * @default "medium"
   */
  size?: 'small' | 'medium';
  
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
  size = 'medium',
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const { colors } = useTheme();

  const isSmall = size === 'small';
  const chipStyle = isSmall ? styles.chipSmall : styles.chip;
  const textSizeStyle = isSmall ? styles.chipTextSmall : styles.chipText;

  // Interactive chip (filter)
  if (onPress) {
    const handlePress = () => {
      lightImpact();
      onPress();
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={[
          chipStyle,
          styles.chipInteractive,
          {
            backgroundColor: active ? colors.accent.primary + '18' : colors.surface.default,
            borderWidth: 1,
            borderColor: active ? colors.accent.primary : colors.surface.border,
          },
          style,
        ]}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        testID={testID}
      >
        <Text
          style={[
            textSizeStyle,
            { color: active ? colors.accent.primary : colors.text.primary },
            active && { fontWeight: '700' },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  // Non-interactive chip (tag)
  return (
    <View
      style={[
        chipStyle,
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
          textSizeStyle,
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
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipSmall: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipInteractive: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipTag: {
    // Non-interactive tag styling
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipTextTag: {
    fontSize: 13,
    fontWeight: '500',
  },
});
