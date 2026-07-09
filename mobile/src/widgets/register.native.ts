import { Platform } from 'react-native';

/**
 * Registers the Android widget task handler at JS startup (before React mounts).
 * Guarded so it only runs on Android — the require is never reached on iOS, so
 * the Android-only native module isn't touched there.
 */
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { widgetTaskHandler } = require('./task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // native module not present (e.g. Expo Go) — widget simply won't update
  }
}

export {};
