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

const GOAL_ADJUST: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export interface ComputedGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Daily calorie / macro targets from the onboarding answers.
 * Mifflin-St Jeor BMR × activity factor, adjusted for the goal, with a
 * 30 / 40 / 30 protein-carb-fat split (4-4-9 kcal per gram).
 */
export function computeGoal(p: OnboardingProfile): ComputedGoal {
  const bmr =
    10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[p.activityLevel];
  const calories = Math.max(1200, Math.round((tdee + GOAL_ADJUST[p.goalType]) / 10) * 10);

  return {
    calories,
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}
