import { DAY_LABELS, mondayIndex } from './constants';
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
  // No historical data is stored yet — other days of the week show an empty day
  // (nothing eaten, full goal remaining) until per-day history exists.
  return { left: state.goal.calories, protein: 0, carbs: 0, fat: 0 };
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
    // Only "today" has real data; other days stay empty until history is tracked.
    const eaten = isToday ? todayCalories : 0;
    const logged = isToday && state.todayEntries.length > 0;
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
