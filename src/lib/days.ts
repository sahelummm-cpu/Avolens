import type { AvoLensState, DayRecord, FoodEntry } from './types';

/** Local-timezone 'YYYY-MM-DD' key for a date. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

/** Key for day `i` (Mon=0…Sun=6) of the current week. */
export function weekDayKey(i: number, todayIdx: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (todayIdx - i));
  return dayKey(d);
}

export function sumCalories(entries: FoodEntry[]): number {
  return entries.reduce((a, e) => a + e.calories, 0);
}

/**
 * Consecutive days with at least one logged meal, ending today (if logged)
 * or yesterday. This is the "day streak" shown on Home and the widget.
 */
export function computeStreak(state: Pick<AvoLensState, 'history' | 'todayEntries'>): number {
  const todayLogged = state.todayEntries.length > 0;
  let streak = 0;
  const startOffset = todayLogged ? 0 : 1;
  for (let n = startOffset; n < 1000; n++) {
    const entries = n === 0 ? state.todayEntries : (state.history[daysAgoKey(n)]?.entries ?? []);
    if (entries.length > 0) streak++;
    else break;
  }
  return streak;
}

/**
 * Unconsumed calories from yesterday (up to `rolloverMax`, e.g. 200 cals)
 * that roll over into today's budget if `rolloverEnabled` is true.
 */
export function computeRollover(state: Pick<AvoLensState, 'history' | 'goal' | 'rolloverEnabled' | 'rolloverMax'>): number {
  if (state.rolloverEnabled === false) return 0;
  const maxRollover = state.rolloverMax ?? 200;
  const yesterdayKey = daysAgoKey(1);
  const yesterdayEntries = state.history[yesterdayKey]?.entries ?? [];
  if (yesterdayEntries.length === 0) return 0;
  const eaten = sumCalories(yesterdayEntries);
  const goal = state.goal.calories;
  const leftover = goal - eaten;
  if (leftover <= 0) return 0;
  return Math.min(leftover, maxRollover);
}

/** Entries logged on a given past day ('' → none). */
export function entriesFor(state: AvoLensState, key: string): FoodEntry[] {
  if (key === state.todayKey) return state.todayEntries;
  return state.history[key]?.entries ?? [];
}

/**
 * Recently logged meals (unique by name, newest first) for one-tap re-logging
 * in manual entry.
 */
export function recentMeals(state: AvoLensState, limit = 6): FoodEntry[] {
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  const push = (e: FoodEntry) => {
    const k = e.name.trim().toLowerCase();
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(e);
  };
  for (const e of state.todayEntries) push(e);
  for (let n = 1; n <= 30 && out.length < limit; n++) {
    const rec = state.history[daysAgoKey(n)];
    if (rec) for (const e of rec.entries) push(e);
  }
  return out.slice(0, limit);
}

export interface WeekInsights {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  prevAvgCalories: number; // 0 when the previous week has no data
}

/** Averages over the last 7 days (incl. today) vs the 7 before, logged days only. */
export function weeklyInsights(state: AvoLensState): WeekInsights {
  const dayTotals = (from: number, to: number) => {
    const days: { cal: number; protein: number }[] = [];
    for (let n = from; n < to; n++) {
      const entries = n === 0 ? state.todayEntries : (state.history[daysAgoKey(n)]?.entries ?? []);
      if (entries.length > 0) {
        days.push({
          cal: sumCalories(entries),
          protein: entries.reduce((a, e) => a + e.protein, 0),
        });
      }
    }
    return days;
  };
  const thisWeek = dayTotals(0, 7);
  const prevWeek = dayTotals(7, 14);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  return {
    daysLogged: thisWeek.length,
    avgCalories: avg(thisWeek.map((d) => d.cal)),
    avgProtein: avg(thisWeek.map((d) => d.protein)),
    prevAvgCalories: avg(prevWeek.map((d) => d.cal)),
  };
}

/** Move a stale "today" into history and reset the daily counters. */
export function rolledOver(state: AvoLensState): AvoLensState {
  const today = dayKey(new Date());
  if (state.todayKey === today) {
    // Guard against a stale/missing selection (old persisted states, futures).
    if (!state.selectedDate || state.selectedDate > today) {
      return { ...state, selectedDate: today };
    }
    return state;
  }
  const history: Record<string, DayRecord> = { ...state.history };
  if (state.todayKey && (state.todayEntries.length > 0 || state.glasses > 0)) {
    history[state.todayKey] = { entries: state.todayEntries, glasses: state.glasses };
  }
  return {
    ...state,
    history,
    todayKey: today,
    todayEntries: [],
    glasses: 0,
    selectedDate: today,
  };
}
