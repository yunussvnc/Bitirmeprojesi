/**
 * Animation System
 * 
 * Consistent animation timing and easing functions.
 * Ensures smooth, purposeful animations throughout the app.
 * 
 * Usage:
 * ```tsx
 * import { animations } from '@/src/constants/design';
 * 
 * Animated.timing(value, {
 *   toValue: 1,
 *   duration: animations.timing.normal,
 *   easing: Easing.bezier(...),
 * });
 * ```
 */

import { Easing } from 'react-native';
import type { AnimationTiming, AnimationEasing } from './types';

/**
 * Animation timing constants
 * 
 * All durations in milliseconds
 */
export const animationTiming: AnimationTiming = {
  fast: 150,      // Quick feedback (button press)
  normal: 250,    // Standard transitions
  slow: 400,      // Complex animations
} as const;

/**
 * Animation easing functions
 * 
 * Cubic bezier curves for smooth animations
 */
export const animationEasing: AnimationEasing = {
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',      // Ease out (entrances)
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',         // Ease in (exits)
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',   // Ease in-out (transitions)
} as const;

/**
 * React Native Easing functions
 * 
 * Pre-configured easing functions for React Native Animated API
 */
export const easing = {
  easeOut: Easing.bezier(0.0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  // Standard easing functions
  linear: Easing.linear,
  quad: Easing.quad,
  cubic: Easing.cubic,
} as const;

/**
 * Standard animation configurations
 */
export const animations = {
  // Fade in animation
  fadeIn: {
    opacity: { from: 0, to: 1 },
    duration: animationTiming.normal,
    easing: easing.easeOut,
  },
  // Fade out animation
  fadeOut: {
    opacity: { from: 1, to: 0 },
    duration: animationTiming.fast,
    easing: easing.easeIn,
  },
  // Slide up animation
  slideUp: {
    translateY: { from: 20, to: 0 },
    opacity: { from: 0, to: 1 },
    duration: animationTiming.normal,
    easing: easing.easeOut,
  },
  // Scale animation (for button presses)
  scale: {
    scale: { from: 0.95, to: 1 },
    duration: animationTiming.fast,
    easing: easing.easeOut,
  },
  // Scale down (for press states)
  scaleDown: {
    scale: { from: 1, to: 0.95 },
    duration: animationTiming.fast,
    easing: easing.easeIn,
  },
} as const;

/**
 * Get animation timing
 * 
 * @param speed - 'fast', 'normal', or 'slow'
 * @returns Duration in milliseconds
 */
export function getAnimationTiming(speed: keyof AnimationTiming): number {
  return animationTiming[speed];
}
