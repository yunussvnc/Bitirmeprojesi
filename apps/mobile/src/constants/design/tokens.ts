/**
 * Design Tokens – Helpers
 *
 * Spacing scale: 8/12/16/24/32 (4px base).
 * s(n) = spacing, r(n) = radius, font(size, weight) = text style base.
 */

import { spacing } from './spacing';
import { radius } from './radii';
import { typography, getFontFamily } from './typography';
import type { TypographyScale } from './types';

const SPACING_SCALE = [0, 4, 8, 12, 16, 24, 32, 40, 48] as const;
const RADIUS_SCALE = [0, 4, 8, 12, 16, 20, 24, 9999] as const;

/**
 * Spacing helper – use scale index 0..8 or named key.
 * s(0)=0, s(1)=4, s(2)=8, s(3)=12, s(4)=16, s(5)=24, s(6)=32, s(7)=40, s(8)=48
 */
export function s(
  n: number | keyof typeof spacing
): number {
  if (typeof n === 'string') {
    return spacing[n] ?? 0;
  }
  return SPACING_SCALE[Math.max(0, Math.min(n, SPACING_SCALE.length - 1))] ?? 0;
}

/**
 * Radius helper – use scale index 0..7 or named key.
 */
export function r(
  n: number | keyof typeof radius
): number {
  if (typeof n === 'string') {
    return radius[n] ?? 0;
  }
  return RADIUS_SCALE[Math.max(0, Math.min(n, RADIUS_SCALE.length - 1))] ?? 0;
}

/**
 * Font style helper – returns style object for Text.
 * size: typography scale key (title, heading, body, bodySmall, caption, label)
 * weight: optional override '400' | '500' | '600' | '700'
 */
export function font(
  size: keyof typeof typography.scale,
  weight?: '400' | '500' | '600' | '700' | '800'
): {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing: number;
} {
  const scaleConfig = typography.scale[size] as TypographyScale;
  return {
    fontFamily: getFontFamily(),
    fontSize: scaleConfig.fontSize,
    lineHeight: scaleConfig.lineHeight,
    fontWeight: weight ?? scaleConfig.fontWeight,
    letterSpacing: scaleConfig.letterSpacing,
  };
}

/** Touch target minimum (44pt) */
export const TOUCH_TARGET_MIN = 44;

/** Search input height (48–52px) */
export const SEARCH_INPUT_HEIGHT = 50;

/** Place card image aspect ratio */
export const PLACE_CARD_ASPECT = 3 / 2;

/** Place card image max height – no limit, aspect ratio controls size */
export const PLACE_CARD_IMAGE_MAX_HEIGHT = 9999;

export { spacing, radius, typography };
