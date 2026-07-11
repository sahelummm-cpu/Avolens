import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

/**
 * The GLP-1 medication reminder shown on the Home carousel: "Wed 9:00".
 * Toggling the bell schedules / cancels a weekly local notification.
 */

const REMINDER_ID = 'glp1-weekly-reminder';

// Show notifications as banners even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // simulators can't receive scheduled notifications reliably
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Medication reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6e9e3a',
  });
}

const LOG_REMINDER_ID = 'daily-log-reminder';

/** Schedule (on) or cancel (off) the daily 20:00 "log your meals" reminder. */
export async function syncLogReminder(on: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(LOG_REMINDER_ID).catch(() => {});
    if (!on) return;

    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureAndroidChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: LOG_REMINDER_ID,
      content: {
        title: 'AvoLens',
        body: "Don't forget to log today's meals 🥑",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
    });
  } catch {
    // Notifications are best-effort; never crash the UI over them.
  }
}

/** Schedule (on) or cancel (off) the weekly Wednesday 9:00 reminder. */
export async function syncReminder(on: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
    if (!on) return;

    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureAndroidChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'GLP-1 Medication',
        body: 'Time for your weekly Semaglutide dose.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 4, // Wednesday (1 = Sunday)
        hour: 9,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
    });
  } catch {
    // Notifications are best-effort; never crash the UI over them.
  }
}
