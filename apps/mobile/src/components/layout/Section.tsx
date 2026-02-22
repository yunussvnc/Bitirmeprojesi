/**
 * Section Component
 * 
 * Section container with optional title.
 * 
 * @module components/layout/Section
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { createTextStyle } from '@/src/constants/design';

export interface SectionProps {
  /**
   * Section title (optional)
   */
  title?: string;
  
  /**
   * Section content
   */
  children: React.ReactNode;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Section Component
 * 
 * Container for grouping related content with optional title.
 * 
 * @example
 * ```tsx
 * <Section title="Featured Places">
 *   <PlaceCard ... />
 * </Section>
 * ```
 */
export function Section({ title, children, style }: SectionProps) {
  const { colors, spacing } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);

  return (
    <View style={[styles.section, { marginBottom: spacing.sectionGap }, style]}>
      {title && (
        <Text style={[titleStyle, styles.title, { marginBottom: spacing.base }]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    alignSelf: 'stretch',
  },
  title: {
    // Styling applied dynamically
  },
});
