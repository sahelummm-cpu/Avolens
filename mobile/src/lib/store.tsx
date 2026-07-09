import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ActivitySummary,
  AvoLensState,
  ChartRange,
  FoodEntry,
  HeightUnit,
  OnboardingProfile,
  ThemeMode,
  WeightUnit,
} from './types';
import { defaultState } from './constants';
import { computeGoal } from './goals';
import { darkTheme, lightTheme, type Theme } from './theme';
import { syncReminder } from './notifications';
import { getTodayActivity, requestHealthPermissions } from './health';
import { publishSnapshot } from './widgets';

const STORAGE_KEY = 'avolens.state.v1';

interface StoreValue {
  state: AvoLensState;
  resolvedDark: boolean;
  theme: Theme;
  activity: ActivitySummary | null;
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
  setHeightUnit: (u: HeightUnit) => void;
  finishOnboarding: () => void;
  completeOnboarding: (p: OnboardingProfile) => void;
  connectHealth: () => Promise<boolean>;
  disconnectHealth: () => void;
  refreshActivity: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function getSystemDark(): boolean {
  return Appearance.getColorScheme() === 'dark';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AvoLensState>(() => defaultState());
  const [systemDark, setSystemDark] = useState(() => getSystemDark());
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const hydrated = useRef(false);

  // Load persisted state after mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AvoLensState>;
          setState((s) => ({ ...s, ...saved }));
        }
      } catch {
        // ignore corrupt storage
      }
      hydrated.current = true;
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemDark(colorScheme === 'dark'),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // ignore quota errors
    });
  }, [state]);

  const resolvedDark = state.themeMode === 'auto' ? systemDark : state.themeMode === 'dark';
  const theme = resolvedDark ? darkTheme : lightTheme;

  // Keep the Home / Lock Screen widgets in sync with today's log.
  useEffect(() => {
    if (!hydrated.current) return;
    const totals = state.todayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    publishSnapshot({
      kcalLeft: Math.max(0, state.goal.calories - totals.calories),
      kcalGoal: state.goal.calories,
      protein: totals.protein,
      proteinGoal: state.goal.protein,
      carbs: totals.carbs,
      carbsGoal: state.goal.carbs,
      fat: totals.fat,
      fatGoal: state.goal.fat,
      streak: state.streak,
    });
  }, [state.todayEntries, state.goal, state.streak]);

  // Pull today's activity from Apple Health / Health Connect while connected.
  useEffect(() => {
    if (!state.healthConnected) {
      setActivity(null);
      return;
    }
    let cancelled = false;
    getTodayActivity().then((a) => {
      if (!cancelled) setActivity(a);
    });
    return () => {
      cancelled = true;
    };
  }, [state.healthConnected]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      resolvedDark,
      theme,
      activity,
      selectDay: (i) => setState((s) => ({ ...s, selectedDay: i })),
      addGlass: () =>
        setState((s) => ({ ...s, glasses: Math.min(s.goal.water, s.glasses + 1) })),
      removeGlass: () => setState((s) => ({ ...s, glasses: Math.max(0, s.glasses - 1) })),
      setDose: (i) => setState((s) => ({ ...s, dose: i })),
      toggleReminder: () =>
        setState((s) => {
          const reminderOn = !s.reminderOn;
          syncReminder(reminderOn);
          return { ...s, reminderOn };
        }),
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
      setHeightUnit: (u) => setState((s) => ({ ...s, heightUnit: u })),
      finishOnboarding: () => setState((s) => ({ ...s, hasOnboarded: true })),
      completeOnboarding: (p) =>
        setState((s) => ({
          ...s,
          goal: { ...s.goal, ...computeGoal(p) },
          heightCm: p.heightCm,
          heightUnit: p.heightUnit,
          unit: p.unit,
          sex: p.sex,
          age: p.age,
          goalType: p.goalType,
          activityLevel: p.activityLevel,
          weightLog: [
            ...s.weightLog,
            { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), kg: p.weightKg },
          ],
          hasOnboarded: true,
        })),
      connectHealth: async () => {
        const ok = await requestHealthPermissions();
        if (ok) {
          setState((s) => ({ ...s, healthConnected: true }));
          setActivity(await getTodayActivity());
        }
        return ok;
      },
      disconnectHealth: () => {
        setState((s) => ({ ...s, healthConnected: false }));
        setActivity(null);
      },
      refreshActivity: async () => {
        if (!state.healthConnected) return;
        const a = await getTodayActivity();
        if (a) setActivity(a);
      },
    }),
    [state, resolvedDark, theme, systemDark, activity],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useStore().theme;
}

/** 0-1 fraction of `value` against `total`, clamped like the web app's pct(). */
export function frac(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, value / total);
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
