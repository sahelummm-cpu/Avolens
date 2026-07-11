import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import type {
  ActivitySummary,
  AvoLensState,
  ChartRange,
  FoodEntry,
  HeightUnit,
  InjectionSite,
  OnboardingProfile,
  ThemeMode,
  WeightUnit,
} from './types';
import { defaultState } from './constants';
import { computeGoal } from './goals';
import { computeStreak, dayKey, rolledOver } from './days';
import { getMedication, nextDoseAt, takenThisCycle } from './meds';
import { darkTheme, lightTheme, type Theme } from './theme';
import { armMissedDoseCheck, syncLogReminder, syncMedReminder } from './notifications';
import { getTodayActivity, requestHealthPermissions } from './health';
import { publishSnapshot } from './widgets';
import { supabase } from './supabase';

const STORAGE_KEY = 'avolens.state.v1';

interface StoreValue {
  state: AvoLensState;
  resolvedDark: boolean;
  theme: Theme;
  activity: ActivitySummary | null;
  streak: number;
  session: Session | null;
  selectDay: (i: number) => void;
  addGlass: () => void;
  removeGlass: () => void;
  setDose: (i: number) => void;
  setMedication: (key: string) => void;
  setMedSchedule: (day: number, hour: number, minute: number) => void;
  setMedEnabled: (on: boolean) => void;
  markShot: (site: InjectionSite) => void;
  toggleReminder: () => void;
  toggleLogReminder: () => void;
  setUnit: (u: WeightUnit) => void;
  setThemeMode: (m: ThemeMode) => void;
  toggleDarkManual: () => void;
  setChartRange: (r: ChartRange) => void;
  addEntry: (e: Omit<FoodEntry, 'id'>) => void;
  updateEntry: (id: string, patch: Partial<Omit<FoodEntry, 'id'>>) => void;
  removeEntry: (id: string) => void;
  logWeight: (kg: number) => void;
  setGoalCalories: (kcal: number) => void;
  setHeightCm: (cm: number) => void;
  setHeightUnit: (u: HeightUnit) => void;
  setTargetWeight: (kg: number | null) => void;
  finishOnboarding: () => void;
  completeOnboarding: (p: OnboardingProfile) => void;
  connectHealth: () => Promise<boolean>;
  disconnectHealth: () => void;
  refreshActivity: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function getSystemDark(): boolean {
  return Appearance.getColorScheme() === 'dark';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AvoLensState>(() => defaultState());
  const [systemDark, setSystemDark] = useState(() => getSystemDark());
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const hydrated = useRef(false);
  const skipNextPush = useRef(false);

  // Load persisted state after mount; re-check the date on foreground.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AvoLensState>;
          setState((s) => rolledOver({ ...s, ...saved }));
        }
      } catch {
        // ignore corrupt storage
      }
      hydrated.current = true;
    })();

    const appearanceSub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemDark(colorScheme === 'dark'),
    );
    const appStateSub = AppState.addEventListener('change', (status) => {
      if (status === 'active') setState((s) => rolledOver(s));
    });
    return () => {
      appearanceSub.remove();
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // ignore quota errors
    });
  }, [state]);

  const resolvedDark = state.themeMode === 'auto' ? systemDark : state.themeMode === 'dark';
  const theme = resolvedDark ? darkTheme : lightTheme;

  const streak = useMemo(
    () => computeStreak({ history: state.history, todayEntries: state.todayEntries }),
    [state.history, state.todayEntries],
  );

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
      streak,
    });
  }, [state.todayEntries, state.goal, streak]);

  // Keep the dose reminder + missed-dose follow-up in sync with the schedule.
  useEffect(() => {
    if (!hydrated.current) return;
    const med = getMedication(state.medKey);
    const on = state.medEnabled && state.reminderOn;
    syncMedReminder({
      on,
      medName: med.name,
      frequency: med.frequency,
      day: state.medDay,
      hour: state.medHour,
      minute: state.medMinute,
    });
    const sched = {
      medKey: state.medKey,
      medDay: state.medDay,
      medHour: state.medHour,
      medMinute: state.medMinute,
      shots: state.shots,
    };
    const missedAt =
      on && !takenThisCycle(sched)
        ? new Date(nextDoseAt(sched).getTime() + 14 * 60 * 60 * 1000)
        : null;
    armMissedDoseCheck(missedAt, med.name);
  }, [state.medEnabled, state.reminderOn, state.medKey, state.medDay, state.medHour, state.medMinute, state.shots]);

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

  // ---- Cloud sync (Supabase) -------------------------------------------
  // One jsonb row per user; last write wins. On sign-in the remote copy (if
  // any) replaces local state; afterwards every local change is pushed,
  // debounced.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const pullRemote = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('state').eq('id', userId).maybeSingle();
    if (data?.state) {
      skipNextPush.current = true;
      setState((s) => rolledOver({ ...s, ...(data.state as Partial<AvoLensState>) }));
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) pullRemote(session.user.id);
  }, [session?.user?.id, pullRemote]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session?.user?.id || !hydrated.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const userId = session.user.id;
    const timer = setTimeout(() => {
      client
        .from('profiles')
        .upsert({ id: userId, state, updated_at: new Date().toISOString() })
        .then(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, session?.user?.id]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      resolvedDark,
      theme,
      activity,
      streak,
      session,
      selectDay: (i) => setState((s) => ({ ...s, selectedDay: i })),
      addGlass: () =>
        setState((s) => {
          const r = rolledOver(s);
          return { ...r, glasses: Math.min(r.goal.water, r.glasses + 1) };
        }),
      removeGlass: () =>
        setState((s) => {
          const r = rolledOver(s);
          return { ...r, glasses: Math.max(0, r.glasses - 1) };
        }),
      setDose: (i) => setState((s) => ({ ...s, dose: i })),
      setMedication: (key) =>
        setState((s) => ({
          ...s,
          medKey: key,
          dose: Math.min(s.dose, getMedication(key).doses.length - 1),
        })),
      setMedSchedule: (day, hour, minute) =>
        setState((s) => ({ ...s, medDay: day, medHour: hour, medMinute: minute })),
      setMedEnabled: (on) => setState((s) => ({ ...s, medEnabled: on })),
      markShot: (site) =>
        setState((s) => ({
          ...s,
          shots: [
            ...s.shots,
            {
              date: dayKey(new Date()),
              time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              doseMg: getMedication(s.medKey).doses[s.dose] ?? '',
              site,
            },
          ],
        })),
      toggleReminder: () => setState((s) => ({ ...s, reminderOn: !s.reminderOn })),
      toggleLogReminder: () =>
        setState((s) => {
          const logReminderOn = !s.logReminderOn;
          syncLogReminder(logReminderOn);
          return { ...s, logReminderOn };
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
        setState((s) => {
          const r = rolledOver(s);
          return {
            ...r,
            todayEntries: [
              { ...e, id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
              ...r.todayEntries,
            ],
          };
        }),
      updateEntry: (id, patch) =>
        setState((s) => ({
          ...s,
          todayEntries: s.todayEntries.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
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
      setTargetWeight: (kg) => setState((s) => ({ ...s, targetWeightKg: kg })),
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
          targetWeightKg: p.targetWeightKg ?? s.targetWeightKg,
          medEnabled: p.usesGlp1 ?? s.medEnabled,
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
      signIn: async (email, password) => {
        if (!supabase) return 'Cloud sync is not configured.';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
      },
      signUp: async (email, password) => {
        if (!supabase) return 'Cloud sync is not configured.';
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? error.message : null;
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [state, resolvedDark, theme, systemDark, activity, streak, session],
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
