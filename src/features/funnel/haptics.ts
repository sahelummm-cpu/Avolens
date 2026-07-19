import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Fire-and-forget haptics for the onboarding funnel. Every call is safe on
 * every platform — web just no-ops, and hardware failures are swallowed.
 */

/** Light tap for button presses and card selections. */
export function tap(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Subtle tick for continuous controls (ruler slider detents). */
export function tick(): void {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

/** Success buzz for milestone moments (analysis complete, purchase). */
export function success(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
