import { DAY_LABELS, mondayIndex } from './constants';
import { dayKey, entriesFor, sumCalories } from './days';
import type { AvoLensState } from './types';
import type { Theme } from './theme';

/** How far back the Home date strip reaches (4 weeks) and how far ahead. */
export const STRIP_PAST_DAYS = 27;
export const STRIP_FUTURE_DAYS = 7;

export interface SelectedDayTotals {
  left: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Values shown in the hero calorie ring for whichever date is tapped in the strip. */
export function selectedDayTotals(
  state: AvoLensState,
  liveTotals: { left: number; calories: number; protein: number; carbs: number; fat: number },
): SelectedDayTotals {
  if (state.selectedDate === state.todayKey) return liveTotals;
  const entries = entriesFor(state, state.selectedDate);
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    left: Math.max(0, state.goal.calories - totals.calories),
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  };
}

export interface DayCell {
  key: string; // 'YYYY-MM-DD'
  label: string; // M T W …
  date: number; // day of month
  /** Short month marker shown on the 1st of a month and the first cell. */
  month: string | null;
  selected: boolean;
  isToday: boolean;
  /** Future dates render but can't be selected or logged. */
  isFuture: boolean;
  ringColor: keyof Theme | 'transparent';
  fraction: number; // 0-1 of the daily limit eaten
}

/** Classify a day's ring color from calories eaten vs. the daily target. */
function ringColorFor(eaten: number, target: number): keyof Theme | 'transparent' {
  if (eaten <= 0) return 'transparent';
  if (eaten > target) return 'protein'; // over the limit
  if (eaten >= target * 0.34) return 'green'; // reasonable / within limit
  return 'ink'; // logged very little
}

/**
 * The scrollable Home date strip: the past 4 weeks through today, plus the
 * next 7 dates (visible but not loggable).
 */
export function buildStrip(state: AvoLensState, todayCalories: number): DayCell[] {
  const now = new Date();
  const todayK = dayKey(now);
  const target = state.goal.calories;
  const cells: DayCell[] = [];

  for (let offset = -STRIP_PAST_DAYS; offset <= STRIP_FUTURE_DAYS; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const key = dayKey(d);
    const isToday = key === todayK;
    const isFuture = key > todayK;
    const entries = isFuture ? [] : entriesFor(state, key);
    const eaten = isToday ? todayCalories : sumCalories(entries);
    const logged = entries.length > 0;
    cells.push({
      key,
      label: DAY_LABELS[mondayIndex(d)],
      date: d.getDate(),
      month:
        d.getDate() === 1 || offset === -STRIP_PAST_DAYS
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : null,
      selected: key === state.selectedDate,
      isToday,
      isFuture,
      ringColor: logged ? ringColorFor(eaten, target) : 'transparent',
      fraction: logged ? Math.min(1, eaten / target) : 0,
    });
  }
  return cells;
}
