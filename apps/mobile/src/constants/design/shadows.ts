/**
 * Shadow System
 * 
 * Consistent shadow definitions for depth and elevation.
 * Platform-specific implementations for iOS and Android.
 * 
 * Usage:
 * ```tsx
 * import { shadows } from '@/src/constants/design';
 * 
 * <View style={shadows.medium} />
 * ```
 */

import { Platform } from 'react-native';
import type { ShadowDefinition } from './types';

/**
 * Shadow definitions
 * 
 * iOS uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android uses elevation
 */
export const shadows = {
  // Small shadow - Subtle elevation (cards, buttons)
  small: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  } as ShadowDefinition,

  // Medium shadow - Moderate elevation (modals, bottom sheets)
  medium: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    ...(Platform.OS === 'android' && { elevation: 4 }),
  } as ShadowDefinition,

  // Large shadow - High elevation (floating elements)
  large: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    ...(Platform.OS === 'android' && { elevation: 8 }),
  } as ShadowDefinition,

  // Accent shadow - For primary actions (uses accent color)
  accent: {
    shadowColor: '#1DB954',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  } as ShadowDefinition,
} as const;

/**
 * Create custom shadow
 * 
 * @param config - Shadow configuration
 * @returns Shadow definition
 * 
 * @example
 * ```tsx
 * const customShadow = createShadow({
 *   color: '#000000',
 *   offset: { width: 0, height: 4 },
 *   opacity: 0.2,
 *   radius: 8,
 *   elevation: 4,
 * });
 * ```
 */
export function createShadow(config: {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}): ShadowDefinition {
  return {
    shadowColor: config.color || '#000000',
    shadowOffset: config.offset || { width: 0, height: 2 },
    shadowOpacity: config.opacity || 0.1,
    shadowRadius: config.radius || 4,
    ...(Platform.OS === 'android' && config.elevation !== undefined && { elevation: config.elevation }),
  };
}
