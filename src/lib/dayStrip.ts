import { DAY_LABELS, mondayIndex } from './constants';
import { entriesFor, sumCalories, weekDayKey } from './days';
import type { AvoLensState } from './types';
import type { Theme } from './theme';

export interface SelectedDayTotals {
  left: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Values shown in the hero calorie ring for whichever day is tapped in the strip. */
export function selectedDayTotals(
  state: AvoLensState,
  liveTotals: { left: number; protein: number; carbs: number; fat: number },
): SelectedDayTotals {
  const todayIdx = mondayIndex(new Date());
  if (state.selectedDay === todayIdx) return liveTotals;
  const entries = entriesFor(state, weekDayKey(state.selectedDay, todayIdx));
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
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  };
}

export interface DayCell {
  index: number;
  label: string;
  date: number;
  selected: boolean;
  isToday: boolean;
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

export function buildWeek(state: AvoLensState, todayCalories: number): DayCell[] {
  const now = new Date();
  const todayIdx = mondayIndex(now);
  const target = state.goal.calories;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - todayIdx);

  return DAY_LABELS.map((label, i) => {
    const isToday = i === todayIdx;
    const entries = isToday ? state.todayEntries : entriesFor(state, weekDayKey(i, todayIdx));
    const eaten = isToday ? todayCalories : sumCalories(entries);
    const logged = entries.length > 0;
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    return {
      index: i,
      label,
      date: d.getDate(),
      selected: i === state.selectedDay,
      isToday,
      ringColor: logged ? ringColorFor(eaten, target) : 'transparent',
      fraction: logged ? Math.min(1, eaten / target) : 0,
    };
  });
}
