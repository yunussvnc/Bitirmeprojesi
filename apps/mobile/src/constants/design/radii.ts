/**
 * Radius tokens – 4px grid.
 * Kart, buton, chip ve overlay tutarlı yuvarlaklık.
 */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
