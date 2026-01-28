/**
 * Haptics Utility
 * 
 * Centralized haptic feedback for better UX.
 * 
 * @module utils/haptics
 */

import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for subtle interactions
 * Use for: Button presses, filter selections, chip taps
 */
export function lightImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium haptic feedback for standard interactions
 * Use for: Card presses, important actions
 */
export function mediumImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy haptic feedback for significant actions
 * Use for: Save/delete actions, confirmations
 */
export function heavyImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Success haptic feedback
 * Use for: Successful saves, confirmations
 */
export function success() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning haptic feedback
 * Use for: Warnings, errors
 */
export function warning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error haptic feedback
 * Use for: Errors, failures
 */
export function error() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Selection haptic feedback
 * Use for: Picker selections, toggle switches
 */
export function selection() {
  Haptics.selectionAsync();
}
