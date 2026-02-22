/**
 * AppHeader – Reusable screen header
 * Title, optional subtitle, optional right actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { createTextStyle , spacing } from '@/src/constants/design';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function AppHeader({ title, subtitle, right, style }: AppHeaderProps) {
  const { colors } = useTheme();
  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={[titleStyle, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[subtitleStyle, styles.subtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
    minHeight: 44,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {},
  right: {
    marginLeft: spacing.sm,
  },
});
