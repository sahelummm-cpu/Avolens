import type { AvoLensState, DemoDay, FoodEntry, WeightEntry } from './types';

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DEFAULT_GOAL = {
  calories: 2050,
  protein: 124,
  carbs: 180,
  fat: 56,
  fiber: 30,
  sodium: 2300,
  sugar: 50,
  water: 5, // glasses (500ml each = 2.5L)
};

export const DOSE_OPTIONS = ['0.25', '0.5', '1.0', '1.7', '2.4'];

/** Last-7-day demo trends for the Progress screen charts (Mon → Sun). */
export const EXERCISE_BURNED_WEEK = [380, 520, 260, 640, 410, 590, 420]; // kcal burned
export const EATEN_KCAL_WEEK = [1740, 2010, 1620, 1980, 1710, 2130, 1750]; // kcal eaten

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Static demo history for the six non-today days of the week (for the day-strip). */
export const DEMO_WEEK: Omit<DemoDay, 'label' | 'date' | 'logged'>[] = [
  { kcalLeft: -110, protein: 128, carbs: 214, fat: 66, fiber: 24, sodium: 2480, sugar: 71 },
  { kcalLeft: 180, protein: 112, carbs: 168, fat: 47, fiber: 26, sodium: 2180, sugar: 54 },
  { kcalLeft: 470, protein: 96, carbs: 132, fat: 36, fiber: 21, sodium: 1820, sugar: 46 },
  { kcalLeft: 1240, protein: 98, carbs: 142, fat: 34, fiber: 22, sodium: 1950, sugar: 49 },
  { kcalLeft: 1600, protein: 45, carbs: 80, fat: 18, fiber: 11, sodium: 1180, sugar: 29 },
  { kcalLeft: 1900, protein: 20, carbs: 44, fat: 9, fiber: 6, sodium: 620, sugar: 16 },
  { kcalLeft: 2050, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 },
];

export const SEED_ENTRIES: FoodEntry[] = [
  {
    id: 'seed-1',
    name: 'Greek yogurt bowl',
    meal: 'Breakfast',
    time: '8:20 AM',
    calories: 320,
    protein: 22,
    carbs: 38,
    fat: 9,
    fiber: 4,
    sodium: 95,
    sugar: 18,
    healthScore: 8,
    ingredients: [
      { name: 'Greek yogurt', amount: '1 cup', calories: 150 },
      { name: 'Granola', amount: '1/3 cup', calories: 120 },
      { name: 'Honey', amount: '1 tbsp', calories: 30 },
      { name: 'Berries', amount: '1/2 cup', calories: 20 },
    ],
    icon: 'yogurt',
  },
  {
    id: 'seed-2',
    name: 'Grilled chicken bowl',
    meal: 'Lunch',
    time: '12:40 PM',
    calories: 520,
    protein: 42,
    carbs: 38,
    fat: 18,
    fiber: 6,
    sodium: 640,
    sugar: 7,
    healthScore: 9,
    ingredients: [
      { name: 'Chicken breast', amount: '150 g', calories: 250 },
      { name: 'Brown rice', amount: '1 cup', calories: 215 },
      { name: 'Broccoli', amount: '1 cup', calories: 35 },
      { name: 'Olive oil', amount: '1 tbsp', calories: 20 },
    ],
    icon: 'bowl',
  },
];

export const SEED_WEIGHT_LOG: WeightEntry[] = [
  { date: 'May 12', kg: 70.5 },
  { date: 'May 19', kg: 70.1 },
  { date: 'May 26', kg: 69.5 },
  { date: 'Jun 2', kg: 68.9 },
  { date: 'Jun 9', kg: 68.4 },
];

export const FREQUENT_FOODS = [
  { name: 'Greek yogurt', color: 'var(--av-protein)', calories: 130, protein: 17, carbs: 8, fat: 3 },
  { name: 'Banana', color: 'var(--av-carbs)', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Chicken breast', color: 'var(--av-green)', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Almonds', color: 'var(--av-fat)', calories: 164, protein: 6, carbs: 6, fat: 14 },
];

export function defaultState(): AvoLensState {
  return {
    goal: DEFAULT_GOAL,
    heightCm: 174,
    unit: 'kg',
    themeMode: 'auto',
    glasses: 3,
    dose: 2,
    reminderOn: true,
    streak: 12,
    chartRange: 'M',
    selectedDay: mondayIndex(new Date()),
    todayEntries: SEED_ENTRIES,
    weightLog: SEED_WEIGHT_LOG,
    hasOnboarded: false,
  };
}

/** Mon=0 ... Sun=6, matching DAY_LABELS order. */
export function mondayIndex(d: Date): number {
  const day = d.getDay(); // Sun=0..Sat=6
  return (day + 6) % 7;
}
