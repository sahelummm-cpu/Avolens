export type ThemeMode = 'auto' | 'light' | 'dark';
export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ftin';
export type ChartRange = 'W' | 'M' | 'Y';

export type Sex = 'male' | 'female';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very';

/** Answers collected by the onboarding questionnaire. */
export interface OnboardingProfile {
  goalType: GoalType;
  sex: Sex;
  age: number;
  heightCm: number;
  heightUnit: HeightUnit;
  weightKg: number;
  unit: WeightUnit;
  activityLevel: ActivityLevel;
}

export interface FoodEntry {
  id: string;
  name: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  healthScore: number;
  ingredients?: string[];
  icon?: 'yogurt' | 'bowl' | 'generic';
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface DemoDay {
  label: string;
  date: number;
  kcalLeft: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  logged: boolean;
}

/** Today's activity, sourced from Apple Health (iOS) or Health Connect (Android). */
export interface ActivitySummary {
  activeCalories: number;
  steps: number;
  workouts: number;
  activeMinutes: number;
}

/** The compact daily summary pushed to the Home / Lock Screen widgets. */
export interface WidgetSnapshot {
  kcalLeft: number;
  kcalGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  streak: number;
}

export interface AvoLensState {
  goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
    water: number;
  };
  heightCm: number;
  heightUnit: HeightUnit;
  unit: WeightUnit;
  sex: Sex | null;
  age: number | null;
  goalType: GoalType | null;
  activityLevel: ActivityLevel | null;
  themeMode: ThemeMode;
  glasses: number;
  dose: number;
  reminderOn: boolean;
  healthConnected: boolean;
  streak: number;
  chartRange: ChartRange;
  selectedDay: number;
  todayEntries: FoodEntry[];
  weightLog: WeightEntry[];
  hasOnboarded: boolean;
}

export interface ScanResult {
  name: string;
  matchConfidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  healthScore: number;
  ingredients: string[];
}
