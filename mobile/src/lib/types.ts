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
  targetWeightKg?: number | null;
  usesGlp1?: boolean;
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

/** Everything logged on one calendar day, keyed by 'YYYY-MM-DD' in history. */
export interface DayRecord {
  entries: FoodEntry[];
  glasses: number;
}

export type MedFrequency = 'weekly' | 'daily';

export interface Medication {
  key: string;
  name: string;
  brands: string;
  frequency: MedFrequency;
  doses: string[]; // mg ladder, low → high
}

export type InjectionSite = 'Belly L' | 'Belly R' | 'Thigh L' | 'Thigh R' | 'Arm L' | 'Arm R';

/** One logged injection. */
export interface ShotRecord {
  date: string; // 'YYYY-MM-DD'
  time: string; // display time, e.g. "8:02 PM"
  doseMg: string;
  site: InjectionSite;
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
  targetWeightKg: number | null;
  themeMode: ThemeMode;
  glasses: number;
  /** GLP-1 tracking */
  medEnabled: boolean;
  medKey: string;
  dose: number; // index into the medication's dose ladder
  medDay: number; // 0=Sun … 6=Sat (weekly meds)
  medHour: number;
  medMinute: number;
  shots: ShotRecord[];
  reminderOn: boolean;
  logReminderOn: boolean;
  healthConnected: boolean;
  chartRange: ChartRange;
  selectedDay: number;
  /** The 'YYYY-MM-DD' key todayEntries/glasses belong to; rolls over at midnight. */
  todayKey: string;
  todayEntries: FoodEntry[];
  /** Past days ('YYYY-MM-DD' → what was logged). Today lives in todayEntries. */
  history: Record<string, DayRecord>;
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
