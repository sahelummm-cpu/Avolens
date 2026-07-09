import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetSnapshot } from './types';
import { ANDROID_WIDGET_NAME, APP_GROUP, WIDGET_STORAGE_KEY } from './widgets';

export { APP_GROUP, WIDGET_STORAGE_KEY, ANDROID_WIDGET_NAME } from './widgets';

/**
 * Push the daily summary to the platform widget. Everything is wrapped in
 * try/catch so a missing native module (e.g. plain Expo Go) never breaks the
 * app — the widget just won't update. Requires a development build to run.
 */
export async function publishSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  // Persist for the Android headless task handler, which re-reads it on update.
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage errors
  }

  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
      const { ExtensionStorage } = require('@bacons/apple-targets') as any;
      const storage = new ExtensionStorage(APP_GROUP);
      // Store as a JSON string so the Swift widget can Codable-decode it predictably.
      storage.set(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
      ExtensionStorage.reloadWidget();
    } catch {
      // native target not present
    }
    return;
  }

  if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
      const { requestWidgetUpdate } = require('react-native-android-widget') as any;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SummaryWidget } = require('../widgets/SummaryWidget');
      await requestWidgetUpdate({
        widgetName: ANDROID_WIDGET_NAME,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderWidget: () => SummaryWidget({ snapshot }) as any,
        widgetNotFound: () => {},
      });
    } catch {
      // native module not present
    }
  }
}
