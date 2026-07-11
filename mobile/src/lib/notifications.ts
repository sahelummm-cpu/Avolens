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

export interface MedReminderConfig {
  on: boolean;
  medName: string;
  frequency: 'weekly' | 'daily';
  day: number; // 0=Sun … 6=Sat (weekly only)
  hour: number;
  minute: number;
}

/** Schedule (on) or cancel (off) the dose reminder at the user's slot. */
export async function syncMedReminder(cfg: MedReminderConfig): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
    if (!cfg.on) return;

    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureAndroidChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'GLP-1 Medication',
        body: `Time for your ${cfg.frequency} ${cfg.medName} dose.`,
        sound: true,
      },
      trigger:
        cfg.frequency === 'daily'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: cfg.hour,
              minute: cfg.minute,
              ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: cfg.day + 1, // expo: 1 = Sunday
              hour: cfg.hour,
              minute: cfg.minute,
              ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
            },
    });
  } catch {
    // Notifications are best-effort; never crash the UI over them.
  }
}

const MISSED_ID = 'med-missed-dose';

/**
 * One-shot "did you take your dose?" follow-up ~14h after the scheduled
 * time. Pass null (dose logged / reminders off) to cancel it.
 */
export async function armMissedDoseCheck(at: Date | null, medName: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(MISSED_ID).catch(() => {});
    if (!at || at.getTime() <= Date.now()) return;
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: MISSED_ID,
      content: {
        title: 'Missed dose?',
        body: `Looks like your ${medName} dose isn't logged yet. Tap "Mark as taken" if you already injected.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
    });
  } catch {
    // best-effort
  }
}
