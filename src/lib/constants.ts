import type { AvoLensState } from './types';
import type { Theme } from './theme';
import { dayKey } from './days';

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const STATE_VERSION = 1;

/**
 * Bring a persisted / cloud-synced partial state (possibly written by an
 * older app version) up to the current shape before it's merged into state.
 * Add a `if (v < N)` block here for every future STATE_VERSION bump.
 */
export function migrateState(saved: Partial<AvoLensState>): Partial<AvoLensState> {
  const v = saved.stateVersion ?? 0;
  const out: Partial<AvoLensState> = { ...saved };
  if (v < 1) {
    // v0 → v1: no structural changes — the version field itself is new.
  }
  out.stateVersion = STATE_VERSION;
  return out;
}

export const DEFAULT_GOAL = {
  calories: 2050,
  protein: 124,
  carbs: 180,
  fat: 56,
  fiber: 30,
  sodium: 2300,
  sugar: 50,
  water: 5, // glasses (500ml each = 2.5L)
};

export const DOSE_OPTIONS = ['0.25', '0.5', '1.0', '1.7', '2.4'];

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Starter suggestions shown in manual entry only for brand-new users who have
 * no favorites or recents yet. Not seeded history — a UI affordance. `color` is
 * a Theme token key so the dot follows light/dark mode.
 */
export const SUGGESTED_FOODS: { name: string; color: keyof Theme; calories: number; protein: number; carbs: number; fat: number }[] = [
  { name: 'Greek yogurt', color: 'protein', calories: 130, protein: 17, carbs: 8, fat: 3 },
  { name: 'Banana', color: 'carbs', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Apple', color: 'carbs', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: 'Orange', color: 'carbs', calories: 62, protein: 1, carbs: 15, fat: 0 },
  { name: 'Chicken breast', color: 'green', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Eggs (2)', color: 'protein', calories: 155, protein: 13, carbs: 1, fat: 11 },
  { name: 'Almonds', color: 'fat', calories: 164, protein: 6, carbs: 6, fat: 14 },
];

/**
 * A fresh account starts empty — no seeded meals, weight history, streak, or
 * activity. Real data appears only as the user logs it (or, once wired,
 * syncs it from Apple Health / Google Fit).
 */
export function defaultState(): AvoLensState {
  return {
    stateVersion: STATE_VERSION,
    goal: DEFAULT_GOAL,
    heightCm: 174,
    heightUnit: 'cm',
    unit: 'kg',
    sex: null,
    age: null,
    goalType: null,
    activityLevel: null,
    targetWeightKg: null,
    displayName: '',
    themeMode: 'light',
    glasses: 0,
    medEnabled: true,
    medKey: 'semaglutide',
    dose: 2,
    medDay: 3, // Wednesday
    medHour: 9,
    medMinute: 0,
    medCustomName: '',
    medCustomFrequency: 'weekly',
    medCustomDose: '',
    shots: [],
    reminderOn: false,
    logReminderOn: false,
    logReminderHour: 20,
    logReminderMinute: 0,
    healthConnected: false,
    chartRange: 'M',
    selectedDate: dayKey(new Date()),
    todayKey: dayKey(new Date()),
    todayEntries: [],
    history: {},
    favorites: [],
    weightLog: [],
    measurements: [],
    photos: [],
    achievementsSeen: [],
    hasOnboarded: false,
  };
}

/** Mon=0 ... Sun=6, matching DAY_LABELS order. */
export function mondayIndex(d: Date): number {
  const day = d.getDay(); // Sun=0..Sat=6
  return (day + 6) % 7;
}
