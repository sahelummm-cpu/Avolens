import { DAY_LABELS, DEMO_WEEK, mondayIndex } from './constants';
import type { AvoLensState } from './types';

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
  const d = DEMO_WEEK[state.selectedDay];
  return { left: d.kcalLeft, protein: d.protein, carbs: d.carbs, fat: d.fat };
}

export interface DayCell {
  index: number;
  label: string;
  date: number;
  selected: boolean;
  isToday: boolean;
  ringColor: string; // 'transparent' | color
  fraction: number; // 0-1 of the daily limit eaten
}

/** Classify a day's ring color from calories eaten vs. the daily target. */
function ringColorFor(eaten: number, target: number): string {
  if (eaten <= 0) return 'transparent';
  if (eaten > target) return 'var(--av-protein)'; // over the limit
  if (eaten >= target * 0.34) return 'var(--av-green)'; // reasonable / within limit
  return 'var(--av-ink)'; // logged very little
}

export function buildWeek(state: AvoLensState, todayCalories: number): DayCell[] {
  const now = new Date();
  const todayIdx = mondayIndex(now);
  const target = state.goal.calories;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - todayIdx);

  return DAY_LABELS.map((label, i) => {
    const isToday = i === todayIdx;
    const eaten = isToday ? todayCalories : target - DEMO_WEEK[i].kcalLeft;
    const logged = isToday ? state.todayEntries.length > 0 : eaten > 0;
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
