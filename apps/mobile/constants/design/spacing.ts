/**
 * Spacing System
 * 
 * Consistent spacing system based on 4px base unit.
 * Ensures visual harmony and predictable layouts.
 * 
 * Usage:
 * ```tsx
 * import { spacing } from '@/constants/design';
 * 
 * <View style={{ padding: spacing.base, gap: spacing.cardGap }} />
 * ```
 */

import type { SpacingSystem } from './types';

/**
 * Spacing system configuration
 * 
 * All values are multiples of 4px for consistency.
 */
export const spacing: SpacingSystem = {
  // Base units (4px increments)
  xs: 4,      // 4px - Tiny gaps
  sm: 8,      // 8px - Small gaps
  md: 12,     // 12px - Medium gaps
  base: 16,   // 16px - Most common spacing
  lg: 20,     // 20px - Large gaps
  xl: 24,     // 24px - Extra large gaps
  xxl: 32,    // 32px - Section spacing
  xxxl: 40,   // 40px - Large section spacing
  
  // Semantic spacing (for common use cases)
  screenPadding: 20,        // Screen horizontal padding
  cardPadding: 16,         // Card internal padding
  cardGap: 12,             // Gap between cards
  sectionGap: 24,          // Gap between sections
  elementGap: 8,           // Gap between related elements
} as const;

/**
 * Get spacing value
 * 
 * @param key - Spacing key
 * @returns Spacing value in pixels
 * 
 * @example
 * ```tsx
 * const padding = getSpacing('base'); // 16
 * ```
 */
export function getSpacing(key: keyof SpacingSystem): number {
  return spacing[key];
}

/**
 * Create spacing object for StyleSheet
 * 
 * @param values - Object with spacing keys and values
 * @returns StyleSheet-compatible spacing object
 * 
 * @example
 * ```tsx
 * const styles = createSpacing({
 *   padding: 'base',
 *   marginTop: 'lg',
 *   gap: 'cardGap',
 * });
 * ```
 */
export function createSpacing<T extends Record<string, keyof SpacingSystem>>(
  values: T
): Record<keyof T, number> {
  const result = {} as Record<keyof T, number>;
  for (const [key, value] of Object.entries(values)) {
    result[key as keyof T] = spacing[value];
  }
  return result;
}
