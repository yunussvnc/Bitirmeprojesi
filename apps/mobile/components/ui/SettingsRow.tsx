/**
 * SettingsRow Component
 * 
 * A row component for settings screens with label, value, and optional arrow.
 * 
 * Usage:
 * ```tsx
 * <SettingsRow
 *   label="Notifications"
 *   value="On"
 *   onPress={handlePress}
 *   showArrow
 * />
 * ```
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/design';

export interface SettingsRowProps {
  /**
   * Row label
   */
  label: string;
  
  /**
   * Optional value text (shown on the right)
   */
  value?: string;
  
  /**
   * Press handler
   */
  onPress?: () => void;
  
  /**
   * Show chevron arrow
   * @default false
   */
  showArrow?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Icon name (left side)
   */
  icon?: IconSymbolName;
}

/**
 * Settings row component
 */
export function SettingsRow({
  label,
  value,
  onPress,
  showArrow = false,
  style,
  icon,
}: SettingsRowProps) {
  const { colors, typography } = useTheme();

  const content = (
    <View style={[styles.row, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <IconSymbol name={icon} size={24} color={colors.text.secondary} />
        </View>
      )}
      <Text style={[styles.label, { color: colors.text.primary }, typography.body]}>
        {label}
      </Text>
      <View style={styles.right}>
        {value && (
          <Text
            style={[
              styles.value,
              { color: colors.text.secondary },
              typography.bodySmall,
            ]}
          >
            {value}
          </Text>
        )}
        {showArrow && (
          <IconSymbol
            name="chevron.right"
            size={20}
            color={colors.text.tertiary}
            style={styles.arrow}
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: colors.surface.elevated,
            borderWidth: 1,
            borderColor: colors.surface.border,
          },
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.elevated,
          borderWidth: 1,
          borderColor: colors.surface.border,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    marginRight: spacing.xs,
  },
  arrow: {
    marginLeft: spacing.xs,
  },
});
