/**
 * Filter Card Component
 * 
 * Trendyol-style large filter card for better UX.
 * 
 * @module components/ui/FilterCard
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { createTextStyle } from '@/constants/design';

export interface FilterCardProps {
  /**
   * Filter label
   */
  label: string;
  
  /**
   * Filter value/count (optional)
   */
  value?: string | number;
  
  /**
   * Active state
   */
  active?: boolean;
  
  /**
   * Icon name (optional)
   */
  icon?: IconSymbolName;
  
  /**
   * Press handler
   */
  onPress: () => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Filter Card Component
 * 
 * Large, pressable filter card inspired by Trendyol.
 * Better UX than small chips.
 */
export function FilterCard({
  label,
  value,
  active = false,
  icon,
  onPress,
  style,
}: FilterCardProps) {
  const { colors, spacing } = useTheme();
  const labelStyle = createTextStyle('body', colors.text.primary);
  const valueStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {active ? (
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryHover]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {icon && (
              <IconSymbol
                name={icon}
                size={20}
                color={colors.text.inverse}
                style={styles.icon}
              />
            )}
            <View style={styles.textContainer}>
              <Text style={[labelStyle, styles.label, { color: colors.text.inverse }]} numberOfLines={1}>
                {label}
              </Text>
              {value !== undefined && (
                <Text style={[valueStyle, styles.value, { color: colors.text.inverse + 'CC' }]} numberOfLines={1}>
                  {value}
                </Text>
              )}
            </View>
            <View style={[styles.checkmark, { backgroundColor: colors.text.inverse + '20' }]}>
              <IconSymbol
                name="checkmark"
                size={16}
                color={colors.text.inverse}
              />
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.content,
            styles.inactiveContent,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
            },
          ]}
        >
          {icon && (
            <IconSymbol
              name={icon}
              size={20}
              color={colors.text.secondary}
              style={styles.icon}
            />
          )}
          <View style={styles.textContainer}>
            <Text style={[labelStyle, styles.label, { color: colors.text.primary }]} numberOfLines={1}>
              {label}
            </Text>
            {value !== undefined && (
              <Text style={[valueStyle, styles.value, { color: colors.text.secondary }]} numberOfLines={1}>
                {value}
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  inactiveContent: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    opacity: 0.8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
