/**
 * Stat Card Component
 * 
 * Professional stat card for profile screens.
 * 
 * @module components/ui/StatCard
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { createTextStyle } from '@/constants/design';

export interface StatCardProps {
  /**
   * Stat label
   */
  label: string;
  
  /**
   * Stat value
   */
  value: string | number;
  
  /**
   * Icon name (optional)
   */
  icon?: IconSymbolName;
  
  /**
   * Gradient colors (optional)
   */
  gradientColors?: string[];
  
  /**
   * Press handler (optional)
   */
  onPress?: () => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Stat Card Component
 * 
 * Professional stat card with optional gradient background.
 */
export function StatCard({
  label,
  value,
  icon,
  gradientColors,
  onPress,
  style,
}: StatCardProps) {
  const { colors, spacing } = useTheme();
  const valueStyle = createTextStyle('heading', colors.text.primary);
  const labelStyle = createTextStyle('bodySmall', colors.text.secondary);

  const content = (
    <View style={[styles.container, style]}>
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: colors.text.inverse + '20' }]}>
                <IconSymbol
                  name={icon}
                  size={24}
                  color={colors.text.inverse}
                />
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={[valueStyle, styles.value, { color: colors.text.inverse }]} numberOfLines={1}>
                {value}
              </Text>
              <Text style={[labelStyle, styles.label, { color: colors.text.inverse + 'CC' }]} numberOfLines={2}>
                {label}
              </Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.content,
            styles.defaultContent,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
            },
          ]}
        >
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: colors.accent.primary + '20' }]}>
              <IconSymbol
                name={icon}
                size={24}
                color={colors.accent.primary}
              />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={[valueStyle, styles.value, { color: colors.text.primary }]} numberOfLines={1}>
              {value}
            </Text>
            <Text style={[labelStyle, styles.label, { color: colors.text.secondary }]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradient: {
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultContent: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
    flexWrap: 'wrap',
  },
});
