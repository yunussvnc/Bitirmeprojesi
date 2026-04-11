/**
 * Haptics Utility
 * 
 * Centralized haptic feedback for better UX.
 * All calls are wrapped in try/catch to prevent crashes on
 * web, simulators, and devices without haptic hardware.
 * 
 * @module utils/haptics
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Haptics only available on native (iOS/Android) */
const canVibrate = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light haptic feedback for subtle interactions
 * Use for: Button presses, filter selections, chip taps
 */
export function lightImpact() {
  if (!canVibrate) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

/**
 * Medium haptic feedback for standard interactions
 * Use for: Card presses, important actions
 */
export function mediumImpact() {
  if (!canVibrate) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
}

/**
 * Heavy haptic feedback for significant actions
 * Use for: Save/delete actions, confirmations
 */
export function heavyImpact() {
  if (!canVibrate) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
}

/**
 * Success haptic feedback
 * Use for: Successful saves, confirmations
 */
export function success() {
  if (!canVibrate) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}

/**
 * Warning haptic feedback
 * Use for: Warnings, errors
 */
export function warning() {
  if (!canVibrate) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
}

/**
 * Error haptic feedback
 * Use for: Errors, failures
 */
export function error() {
  if (!canVibrate) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
}

/**
 * Selection haptic feedback
 * Use for: Picker selections, toggle switches
 */
export function selection() {
  if (!canVibrate) return;
  try { Haptics.selectionAsync(); } catch {}
}

