import { Platform } from 'react-native';
import type { ActivitySummary } from './types';

/**
 * Native activity sync.
 *   iOS      → Apple HealthKit  (@kingstinct/react-native-healthkit)
 *   Android  → Health Connect   (react-native-health-connect)
 *
 * The native modules are lazy-`require`d inside guarded try/catch blocks so a
 * missing/unlinked module (e.g. running in plain Expo Go) degrades to
 * "unavailable" instead of crashing. This code paths against each library's
 * documented API but must be exercised in a development build on a real device
 * — it can't be run in the JS-only / web verification environment.
 */

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hk = (): any => require('@kingstinct/react-native-healthkit');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hc = (): any => require('react-native-health-connect');

const HK_TYPES = ['activeEnergyBurned', 'stepCount', 'appleExerciseTime', 'workoutType'];

const HC_PERMISSIONS = [
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ExerciseSession' },
];

// ---------- iOS ----------

async function iosAvailable(): Promise<boolean> {
  try {
    return await hk().isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

async function iosRequest(): Promise<boolean> {
  try {
    await hk().requestAuthorization(HK_TYPES);
    return true;
  } catch {
    return false;
  }
}

async function iosToday(): Promise<ActivitySummary | null> {
  try {
    const { queryStatisticsForQuantity, queryWorkoutSamples } = hk();
    const filter = { filter: { startDate: startOfToday(), endDate: new Date() } };

    const energy = await queryStatisticsForQuantity('activeEnergyBurned', ['cumulativeSum'], { ...filter, unit: 'kcal' });
    const steps = await queryStatisticsForQuantity('stepCount', ['cumulativeSum'], { ...filter, unit: 'count' });
    const exercise = await queryStatisticsForQuantity('appleExerciseTime', ['cumulativeSum'], { ...filter, unit: 'min' });
    const workouts = await queryWorkoutSamples({ filter: { startDate: startOfToday(), endDate: new Date() } });

    return {
      activeCalories: Math.round(energy?.sumQuantity?.quantity ?? 0),
      steps: Math.round(steps?.sumQuantity?.quantity ?? 0),
      activeMinutes: Math.round(exercise?.sumQuantity?.quantity ?? 0),
      workouts: Array.isArray(workouts) ? workouts.length : 0,
    };
  } catch {
    return null;
  }
}

// ---------- Android ----------

async function androidInit(): Promise<boolean> {
  try {
    const { initialize, getSdkStatus, SdkAvailabilityStatus } = hc();
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
    return await initialize();
  } catch {
    return false;
  }
}

async function androidRequest(): Promise<boolean> {
  try {
    if (!(await androidInit())) return false;
    const granted = await hc().requestPermission(HC_PERMISSIONS);
    return Array.isArray(granted) && granted.length > 0;
  } catch {
    return false;
  }
}

async function androidToday(): Promise<ActivitySummary | null> {
  try {
    if (!(await androidInit())) return null;
    const { aggregateRecord, readRecords } = hc();
    const timeRangeFilter = {
      operator: 'between',
      startTime: startOfToday().toISOString(),
      endTime: new Date().toISOString(),
    };

    const cal = await aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter });
    const steps = await aggregateRecord({ recordType: 'Steps', timeRangeFilter });
    const sessions = await readRecords('ExerciseSession', { timeRangeFilter });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = sessions?.records ?? [];

    const activeMinutes = records.reduce((sum, r) => {
      const s = new Date(r.startTime).getTime();
      const e = new Date(r.endTime).getTime();
      return sum + Math.max(0, (e - s) / 60000);
    }, 0);

    return {
      activeCalories: Math.round(cal?.activeCalories?.inKilocalories ?? cal?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0),
      steps: Math.round(steps?.COUNT_TOTAL ?? steps?.count ?? 0),
      activeMinutes: Math.round(activeMinutes),
      workouts: records.length,
    };
  } catch {
    return null;
  }
}

// ---------- Platform-neutral surface ----------

export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === 'ios') return iosAvailable();
  if (Platform.OS === 'android') return androidInit();
  return false;
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') return iosRequest();
  if (Platform.OS === 'android') return androidRequest();
  return false;
}

export async function getTodayActivity(): Promise<ActivitySummary | null> {
  if (Platform.OS === 'ios') return iosToday();
  if (Platform.OS === 'android') return androidToday();
  return null;
}
