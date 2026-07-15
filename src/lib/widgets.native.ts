import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetSnapshot } from './types';
export const APP_GROUP = 'group.app.avolens.mobile';
export const WIDGET_STORAGE_KEY = 'avolens.widget.snapshot.v1';
export const ANDROID_WIDGET_NAME = 'AvoLensSummary';
export const ANDROID_STREAK_WIDGET_NAME = 'AvoLensStreak';
export const ANDROID_WATER_WIDGET_NAME = 'AvoLensWater';

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
      const { SummaryWidget, StreakWidget, WaterWidget } = require('../widgets/SummaryWidget');
      const updates: Array<[string, (p: { snapshot: WidgetSnapshot }) => unknown]> = [
        [ANDROID_WIDGET_NAME, SummaryWidget],
        [ANDROID_STREAK_WIDGET_NAME, StreakWidget],
        [ANDROID_WATER_WIDGET_NAME, WaterWidget],
      ];
      await Promise.all(
        updates.map(([widgetName, render]) =>
          requestWidgetUpdate({
            widgetName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            renderWidget: () => render({ snapshot }) as any,
            widgetNotFound: () => {},
          }),
        ),
      );
    } catch {
      // native module not present
    }
  }
}
