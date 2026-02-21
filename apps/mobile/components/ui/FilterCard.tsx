/**
 * Filter Card Component
 * 
 * Compact list item style filter card.
 * Premium, space-efficient design.
 * 
 * @module components/ui/FilterCard
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { spacing } from '@/constants/design';
import { lightImpact } from '@/src/utils/haptics';

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
 * Compact list item style filter card.
 * Layout: [Icon] [Title + Subtitle] [Chevron]
 * Height: 60px, premium feel, space-efficient.
 */
export function FilterCard({
  label,
  value,
  active = false,
  icon,
  onPress,
  style,
}: FilterCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    lightImpact();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.listItem,
        {
          backgroundColor: active ? colors.accent.primary + '10' : colors.surface.elevated,
          borderColor: active ? colors.accent.primary : colors.surface.border,
        },
        style,
      ]}
    >
      {/* Left: Icon */}
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: active ? colors.accent.primary + '15' : colors.surface.default }]}>
          <IconSymbol
            name={icon}
            size={22}
            color={active ? colors.accent.primary : colors.text.secondary}
          />
        </View>
      )}

      {/* Center: Title + Subtitle */}
      <View style={styles.textContainer}>
        <Text 
          style={[
            styles.title, 
            { color: active ? colors.accent.primary : colors.text.primary }
          ]} 
          numberOfLines={1}
        >
          {label}
        </Text>
        {value !== undefined && (
          <Text 
            style={[
              styles.subtitle, 
              { color: active ? colors.accent.primary + 'CC' : colors.text.tertiary }
            ]} 
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
      </View>

      {/* Right: Chevron */}
      <IconSymbol
        name="chevron.right"
        size={18}
        color={active ? colors.accent.primary : colors.text.tertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
