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
import { lightImpact } from '@/src/utils/haptics';

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
  
  /**
   * Show bottom divider
   * @default false
   */
  showDivider?: boolean;
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
  showDivider = false,
}: SettingsRowProps) {
  const { colors, typography } = useTheme();

  const content = (
    <>
      <View style={[styles.row, style]}>
        {icon && (
          <View style={styles.iconContainer}>
            <IconSymbol name={icon} size={22} color={colors.text.secondary} />
          </View>
        )}
        <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.right}>
          {value && (
            <Text
              style={[
                styles.value,
                { color: colors.text.secondary },
              ]}
              numberOfLines={1}
            >
              {value}
            </Text>
          )}
          {showArrow && (
            <IconSymbol
              name="chevron.right"
              size={18}
              color={colors.text.tertiary}
              style={styles.arrow}
            />
          )}
        </View>
      </View>
      {showDivider && (
        <View style={[styles.divider, { backgroundColor: colors.surface.border }]} />
      )}
    </>
  );

  const handlePress = () => {
    if (onPress) {
      lightImpact();
      onPress();
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
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
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 52, // >= 44pt touch target
  },
  iconContainer: {
    marginRight: spacing.md,
    width: 28,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    maxWidth: '50%',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.base + 28 + spacing.md, // Align with label
  },
});
