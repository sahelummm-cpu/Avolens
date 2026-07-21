import type { ActivityLevel, GoalType, OnboardingProfile } from './types';

/** Height conversions shared by onboarding and settings. */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54);
}

export function formatHeight(cm: number, unit: 'cm' | 'ftin'): string {
  if (unit === 'cm') return `${cm} cm`;
  const { ft, inch } = cmToFtIn(cm);
  return `${ft}'${inch}"`;
}

export const KG_PER_LB = 0.45359237;

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

export type DietSplit = 'balanced' | 'high-protein' | 'low-carb' | 'keto';

/** protein / carb / fat fractions of daily calories. */
export const DIET_SPLITS: Record<DietSplit, { p: number; c: number; f: number }> = {
  balanced: { p: 0.3, c: 0.4, f: 0.3 },
  'high-protein': { p: 0.4, c: 0.3, f: 0.3 },
  'low-carb': { p: 0.35, c: 0.25, f: 0.4 },
  keto: { p: 0.3, c: 0.1, f: 0.6 },
};

/** Default weekly pace (kg/week) when the user doesn't pick one. */
const DEFAULT_PACE: Record<GoalType, number> = { lose: 0.5, maintain: 0, gain: 0.25 };
const KCAL_PER_KG = 7700;

export interface ComputedGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function maintenanceCalories(p: Pick<OnboardingProfile, 'weightKg' | 'heightCm' | 'age' | 'sex' | 'activityLevel'>): number {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78);
  return bmr * (ACTIVITY_FACTOR[p.activityLevel] ?? 1.375);
}

/**
 * Daily calorie / macro targets from the onboarding answers.
 * Mifflin-St Jeor BMR × activity factor, adjusted by the chosen weekly pace
 * (7700 kcal ≈ 1 kg), split by the chosen diet (4-4-9 kcal per gram).
 */
export function computeGoal(p: OnboardingProfile): ComputedGoal {
  const tdee = maintenanceCalories(p);
  const pace = p.paceKgPerWeek ?? DEFAULT_PACE[p.goalType];
  const dir = p.goalType === 'lose' ? -1 : p.goalType === 'gain' ? 1 : 0;
  const dailyAdjust = (dir * pace * KCAL_PER_KG) / 7;
  const calories = Math.max(1200, Math.round((tdee + dailyAdjust) / 10) * 10);

  const split = DIET_SPLITS[p.dietSplit ?? 'balanced'];
  return {
    calories,
    protein: Math.round((calories * split.p) / 4),
    carbs: Math.round((calories * split.c) / 4),
    fat: Math.round((calories * split.f) / 9),
  };
}
