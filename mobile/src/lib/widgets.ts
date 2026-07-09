import type { WidgetSnapshot } from './types';

/**
 * Home Screen & Lock Screen widget bridge.
 *
 * Web / Expo-Go-safe fallback — a `.native.ts` sibling replaces this on device
 * and pushes the daily summary to:
 *   iOS      → a WidgetKit extension (via an App Group shared store)
 *   Android  → a home-screen widget (react-native-android-widget)
 *
 * The App Group id is shared with the native iOS target's entitlement.
 */
export const APP_GROUP = 'group.app.avolens.mobile';
export const WIDGET_STORAGE_KEY = 'avolens.widget.snapshot.v1';
export const ANDROID_WIDGET_NAME = 'AvoLensSummary';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function publishSnapshot(_snapshot: WidgetSnapshot): Promise<void> {
  // no-op on web / when native widget modules aren't present
}
