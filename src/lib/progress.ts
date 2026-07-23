import { daysAgoKey, sumCalories } from './days';
import { maintenanceCalories } from './goals';
import type { ActivitySummary, AvoLensState, WeightEntry } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Epoch ms for a weigh-in — real ts when present, else spaced one/day back. */
export function weightTs(log: WeightEntry[], i: number): number {
  const e = log[i];
  if (e.ts) return e.ts;
  return Date.now() - (log.length - 1 - i) * DAY_MS;
}

/**
 * Exponential moving average of the weigh-ins — a smoothed "trend weight"
 * that filters daily noise (water, food). Returns one value per entry.
 */
export function weightTrend(values: number[], alpha = 0.25): number[] {
  if (values.length === 0) return [];
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(alpha * values[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

export interface WeightProjection {
  ratePerWeek: number; // kg/week (negative = losing)
  etaDate: Date | null;
  weeksToGoal: number | null;
  onTrack: boolean;
}

/**
 * Least-squares slope of the trend weight over time → projected date the
 * target weight is reached.
 */
export function projectWeight(log: WeightEntry[], targetKg: number | null): WeightProjection | null {
  if (log.length < 3) return null;
  const trend = weightTrend(log.map((w) => w.kg));
  // Regress trend on days since first weigh-in.
  const t0 = weightTs(log, 0);
  const xs = log.map((_, i) => (weightTs(log, i) - t0) / DAY_MS);
  const ys = trend;
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slopePerDay = den < 1e-4 ? 0 : num / den; // kg/day
  const ratePerWeek = slopePerDay * 7;
  const current = trend[trend.length - 1];

  let etaDate: Date | null = null;
  let weeksToGoal: number | null = null;
  let onTrack = false;
  if (targetKg != null && Math.abs(slopePerDay) > 1e-4) {
    const daysNeeded = (targetKg - current) / slopePerDay;
    // Moving toward the goal in the right direction and in the future.
    if (daysNeeded > 0 && daysNeeded < 3650) {
      etaDate = new Date(Date.now() + daysNeeded * DAY_MS);
      weeksToGoal = daysNeeded / 7;
      onTrack = true;
    }
  }
  return { ratePerWeek, etaDate, weeksToGoal, onTrack };
}

/** Calories eaten/burned/net for the last `n` days (index 0 = today). */
export interface NetDay {
  eaten: number;
  net: number;
}

/**
 * Net-calorie + deficit summary vs. true maintenance (Mifflin-St Jeor TDEE
 * when the profile is complete — goal.calories is already deficit-adjusted,
 * so using it here would double-count the planned deficit). Only meaningful
 * when activity is available.
 */
export function netCalories(state: AvoLensState, activity: ActivitySummary | null): {
  eatenToday: number;
  burnedToday: number;
  netToday: number;
  maintenance: number; // estimated TDEE the deficit is measured against
  deficitToday: number; // maintenance+burned − eaten ; positive = deficit
  weeklyRateKg: number; // est. kg/week from the deficit (7700 kcal/kg)
} {
  const eatenToday = sumCalories(state.todayEntries);
  const burnedToday = activity?.activeCalories ?? 0;
  const lastKg = state.weightLog[state.weightLog.length - 1]?.kg;
  const maintenance =
    state.sex != null && state.age != null && state.activityLevel != null && lastKg != null
      ? Math.round(
          maintenanceCalories({
            weightKg: lastKg,
            heightCm: state.heightCm,
            age: state.age,
            sex: state.sex,
            activityLevel: state.activityLevel,
          }),
        )
      : state.goal.calories;
  const deficitToday = maintenance + burnedToday - eatenToday;
  return {
    eatenToday,
    burnedToday,
    netToday: eatenToday - burnedToday,
    maintenance,
    deficitToday,
    weeklyRateKg: (deficitToday * 7) / 7700,
  };
}

/** Per-day totals for the last 7 days (oldest→newest), for the trend charts. */
export function last7(state: AvoLensState): { calories: number; protein: number; logged: boolean; label: string }[] {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entries = i === 0 ? state.todayEntries : (state.history[daysAgoKey(i)]?.entries ?? []);
    out.push({
      calories: sumCalories(entries),
      protein: entries.reduce((a, e) => a + e.protein, 0),
      logged: entries.length > 0,
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
    });
  }
  return out;
}

export interface Adherence {
  calorieDaysOnTarget: number; // within ±10% of goal
  proteinDaysHit: number; // ≥ protein goal
  loggedDays: number;
}

/** Goal-adherence counts over the last 7 logged days. */
export function adherence(state: AvoLensState): Adherence {
  const days = last7(state).filter((d) => d.logged);
  const calGoal = state.goal.calories;
  const proGoal = state.goal.protein;
  return {
    loggedDays: days.length,
    calorieDaysOnTarget: days.filter((d) => Math.abs(d.calories - calGoal) <= calGoal * 0.1).length,
    proteinDaysHit: days.filter((d) => d.protein >= proGoal).length,
  };
}

export interface HeatCell {
  key: string;
  day: number; // 1-31
  logged: boolean;
  future: boolean;
  isToday: boolean;
}

/** A calendar grid for the current month showing which days were logged. */
export function monthHeatmap(state: AvoLensState): { cells: HeatCell[]; monthLabel: string; leadBlanks: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadBlanks = first.getDay(); // Sun=0
  const todayStr = daysAgoKey(0);

  const cells: HeatCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entries = key === todayStr ? state.todayEntries : (state.history[key]?.entries ?? []);
    cells.push({
      key,
      day: d,
      logged: entries.length > 0,
      future: date > now && key !== todayStr,
      isToday: key === todayStr,
    });
  }
  return { cells, monthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), leadBlanks };
}

export interface Achievement {
  id: string;
  label: string;
  hint: string;
  earned: boolean;
}

/** Milestone badges derived from current state. */
export function achievements(state: AvoLensState, streak: number): Achievement[] {
  const totalLogged =
    (state.todayEntries.length > 0 ? 1 : 0) +
    Object.values(state.history).filter((d) => d.entries.length > 0).length;
  const adh = adherence(state);
  const firstWeight = state.weightLog[0]?.kg;
  const lastWeight = state.weightLog[state.weightLog.length - 1]?.kg;
  const lost = firstWeight != null && lastWeight != null ? firstWeight - lastWeight : 0;
  const isGain = state.goalType === 'gain';
  const progress2 = isGain ? -lost >= 2 : lost >= 2;
  const progress5 = isGain ? -lost >= 5 : lost >= 5;

  return [
    { id: 'first-log', label: 'First log', hint: 'Log your first meal', earned: totalLogged >= 1 },
    { id: 'streak-3', label: '3-day streak', hint: 'Log 3 days in a row', earned: streak >= 3 },
    { id: 'streak-7', label: '7-day streak', hint: 'Log 7 days in a row', earned: streak >= 7 },
    { id: 'streak-30', label: '30-day streak', hint: 'Log 30 days in a row', earned: streak >= 30 },
    { id: 'protein-5', label: 'Protein pro', hint: 'Hit protein 5 of 7 days', earned: adh.proteinDaysHit >= 5 },
    { id: 'consistent', label: 'Consistent', hint: 'Log 14 days total', earned: totalLogged >= 14 },
    {
      id: 'down-2',
      label: isGain ? 'Up 2 kg' : 'Down 2 kg',
      hint: isGain ? 'Gain 2 kg from your start' : 'Lose 2 kg from your start',
      earned: progress2,
    },
    {
      id: 'down-5',
      label: isGain ? 'Up 5 kg' : 'Down 5 kg',
      hint: isGain ? 'Gain 5 kg from your start' : 'Lose 5 kg from your start',
      earned: progress5,
    },
  ];
}

/** IDs of newly earned achievements not yet acknowledged. */
export function newlyEarned(state: AvoLensState, streak: number): string[] {
  const seen = new Set(state.achievementsSeen);
  return achievements(state, streak)
    .filter((a) => a.earned && !seen.has(a.id))
    .map((a) => a.id);
}
