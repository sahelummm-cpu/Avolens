'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AvoLensState, ChartRange, FoodEntry, ThemeMode, WeightUnit } from './types';
import { defaultState } from './constants';

const STORAGE_KEY = 'avolens.state.v1';

interface StoreValue {
  state: AvoLensState;
  resolvedDark: boolean;
  selectDay: (i: number) => void;
  addGlass: () => void;
  removeGlass: () => void;
  setDose: (i: number) => void;
  toggleReminder: () => void;
  setUnit: (u: WeightUnit) => void;
  setThemeMode: (m: ThemeMode) => void;
  toggleDarkManual: () => void;
  setChartRange: (r: ChartRange) => void;
  addEntry: (e: Omit<FoodEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  logWeight: (kg: number) => void;
  setGoalCalories: (kcal: number) => void;
  setHeightCm: (cm: number) => void;
  finishOnboarding: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function getSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AvoLensState>(() => defaultState());
  const [systemDark, setSystemDark] = useState(() => getSystemDark());
  const hydrated = useRef(false);

  // Load persisted state after mount (avoids SSR/client hydration mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AvoLensState>;
        // localStorage is only readable client-side, so hydrating state here (post-mount) is unavoidable.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((s) => ({ ...s, ...saved }));
      }
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const resolvedDark = state.themeMode === 'auto' ? systemDark : state.themeMode === 'dark';

  // Reflect the resolved theme onto <html> so CSS variables switch everywhere.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedDark ? 'dark' : 'light');
  }, [resolvedDark]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      resolvedDark,
      selectDay: (i) => setState((s) => ({ ...s, selectedDay: i })),
      addGlass: () =>
        setState((s) => ({ ...s, glasses: Math.min(s.goal.water, s.glasses + 1) })),
      removeGlass: () => setState((s) => ({ ...s, glasses: Math.max(0, s.glasses - 1) })),
      setDose: (i) => setState((s) => ({ ...s, dose: i })),
      toggleReminder: () => setState((s) => ({ ...s, reminderOn: !s.reminderOn })),
      setUnit: (u) => setState((s) => ({ ...s, unit: u })),
      setThemeMode: (m) => setState((s) => ({ ...s, themeMode: m })),
      toggleDarkManual: () =>
        setState((s) => ({
          ...s,
          themeMode: (s.themeMode === 'auto' ? systemDark : s.themeMode === 'dark') ? 'light' : 'dark',
        })),
      setChartRange: (r) => setState((s) => ({ ...s, chartRange: r })),
      addEntry: (e) =>
        setState((s) => ({
          ...s,
          todayEntries: [{ ...e, id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...s.todayEntries],
        })),
      removeEntry: (id) =>
        setState((s) => ({ ...s, todayEntries: s.todayEntries.filter((e) => e.id !== id) })),
      logWeight: (kg) =>
        setState((s) => ({
          ...s,
          weightLog: [
            ...s.weightLog,
            { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), kg },
          ],
        })),
      setGoalCalories: (kcal) => setState((s) => ({ ...s, goal: { ...s.goal, calories: kcal } })),
      setHeightCm: (cm) => setState((s) => ({ ...s, heightCm: cm })),
      finishOnboarding: () => setState((s) => ({ ...s, hasOnboarded: true })),
    }),
    [state, resolvedDark, systemDark],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export const useAddGlass = () => useStore().addGlass;

export function pct(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.min(100, Math.round((value / total) * 100))}%`;
}

export function useDailyTotals() {
  const { state } = useStore();
  return useMemo(() => {
    const totals = state.todayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
        fiber: acc.fiber + e.fiber,
        sodium: acc.sodium + e.sodium,
        sugar: acc.sugar + e.sugar,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 },
    );
    return { ...totals, left: Math.max(0, state.goal.calories - totals.calories) };
  }, [state.todayEntries, state.goal.calories]);
}
