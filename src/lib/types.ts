export type ThemeMode = 'auto' | 'light' | 'dark';
export type WeightUnit = 'kg' | 'lb';
export type ChartRange = 'W' | 'M' | 'Y';

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
  unit: WeightUnit;
  themeMode: ThemeMode;
  glasses: number;
  dose: number;
  reminderOn: boolean;
  streak: number;
  chartRange: ChartRange;
  selectedDay: number;
  todayEntries: FoodEntry[];
  weightLog: WeightEntry[];
  hasOnboarded: boolean;
}
