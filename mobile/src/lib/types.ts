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
  paceKgPerWeek?: number;
  dietSplit?: import('./goals').DietSplit;
  name?: string;
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
  /** Display portion, e.g. amount 150 unit 'g'. Macros above stay absolute. */
  amount?: number;
  unit?: 'g' | 'ml' | 'serving' | 'item' | 'kcal';
}

/** A saved food the user can re-log in one tap (per-100g basis). */
export interface FavoriteFood {
  id: string;
  name: string;
  brands?: string;
  calories: number; // per 100 g
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  healthScore: number;
  servingG?: number;
}

export interface WeightEntry {
  date: string;
  kg: number;
  /** Epoch ms of the weigh-in (added for trend/projection math). */
  ts?: number;
}

/** Body measurements logged over time. All values in cm. */
export interface MeasurementEntry {
  date: string;
  ts: number;
  waist?: number;
  chest?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
}

/** A progress photo stored in the Supabase bucket (or a local uri offline). */
export interface ProgressPhoto {
  id: string;
  ts: number;
  date: string;
  uri: string; // remote (signed/public) or local file uri
  path?: string; // storage path when uploaded
  weightKg?: number;
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
  doses: string[]; // dose ladder, low → high
  unit: string; // 'mg' | 'mcg' | '' (empty for custom / unit baked into the dose text)
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
  displayName: string;
  themeMode: ThemeMode;
  glasses: number;
  /** GLP-1 tracking */
  medEnabled: boolean;
  medKey: string;
  dose: number; // index into the medication's dose ladder
  medDay: number; // 0=Sun … 6=Sat (weekly meds)
  medHour: number;
  medMinute: number;
  /** Used only when medKey === 'custom'. */
  medCustomName: string;
  medCustomFrequency: MedFrequency;
  medCustomDose: string;
  shots: ShotRecord[];
  reminderOn: boolean;
  logReminderOn: boolean;
  logReminderHour: number;
  logReminderMinute: number;
  healthConnected: boolean;
  chartRange: ChartRange;
  selectedDay: number;
  /** The 'YYYY-MM-DD' key todayEntries/glasses belong to; rolls over at midnight. */
  todayKey: string;
  todayEntries: FoodEntry[];
  /** Past days ('YYYY-MM-DD' → what was logged). Today lives in todayEntries. */
  history: Record<string, DayRecord>;
  favorites: FavoriteFood[];
  weightLog: WeightEntry[];
  measurements: MeasurementEntry[];
  photos: ProgressPhoto[];
  achievementsSeen: string[];
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
  /** Per-100g basis, when the result came from a database lookup. */
  per100?: import('./foods').FoodBasis;
}
