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
  FavoriteFood,
  FoodEntry,
  HeightUnit,
  InjectionSite,
  MeasurementEntry,
  MedFrequency,
  OnboardingProfile,
  ProgressPhoto,
  ThemeMode,
  WeightUnit,
} from './types';
import { defaultState, migrateState } from './constants';
import { computeGoal } from './goals';
import { computeStreak, dayKey, rolledOver } from './days';
import { deleteProgressPhoto } from './photos';
import { nextDoseAt, resolveMedication, takenThisCycle } from './meds';
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
  selectDay: (dateKey: string) => void;
  addGlass: () => void;
  removeGlass: () => void;
  setDose: (i: number) => void;
  setMedication: (key: string) => void;
  setCustomMed: (name: string, frequency: MedFrequency, dose: string) => void;
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
  /** Log to a specific 'YYYY-MM-DD' (today or a past day). */
  addEntryToDay: (dateKey: string, e: Omit<FoodEntry, 'id'>) => void;
  /** Edit an entry; pass the 'YYYY-MM-DD' it lives on for past days. */
  updateEntry: (id: string, patch: Partial<Omit<FoodEntry, 'id'>>, dateKey?: string) => void;
  removeEntry: (id: string, dateKey?: string) => void;
  toggleFavorite: (f: Omit<FavoriteFood, 'id'>) => void;
  saveScan: (scan: Omit<import('./types').SavedScan, 'id' | 'date'>) => void;
  removeSavedScan: (id: string) => void;
  copyDayToToday: (fromKey: string) => void;
  logWeight: (kg: number) => void;
  addMeasurement: (m: Omit<MeasurementEntry, 'date' | 'ts'>) => void;
  addPhoto: (photo: ProgressPhoto) => void;
  removePhoto: (id: string) => void;
  /** Replace a photo's display uri (e.g. after refreshing an expired signed URL). */
  setPhotoUri: (id: string, uri: string) => void;
  markAchievementsSeen: (ids: string[]) => void;
  setGoalCalories: (kcal: number) => void;
  setGoal: (patch: Partial<AvoLensState['goal']>) => void;
  setHeightCm: (cm: number) => void;
  setHeightUnit: (u: HeightUnit) => void;
  setTargetWeight: (kg: number | null) => void;
  setDisplayName: (name: string) => void;
  setProfile: (p: { sex?: AvoLensState['sex']; age?: number | null; activityLevel?: AvoLensState['activityLevel'] }) => void;
  recalcGoals: () => boolean;
  setRolloverEnabled: (on: boolean) => void;
  setRolloverMax: (max: number) => void;
  setAddBurnedCalories: (on: boolean) => void;
  setLogReminderTime: (hour: number, minute: number) => void;
  clearLoggedData: () => void;
  finishOnboarding: () => void;
  completeOnboarding: (p: OnboardingProfile) => void;
  connectHealth: () => Promise<boolean>;
  disconnectHealth: () => void;
  refreshActivity: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
}

const StoreContext = createContext<StoreValue | null>(null);

function getSystemDark(): boolean {
  return Appearance.getColorScheme() === 'dark';
}

/** +1/-1 a water glass on whichever day is selected (today or a past day). */
function adjustGlasses(r: AvoLensState, delta: number): AvoLensState {
  if (r.selectedDate === r.todayKey) {
    return { ...r, glasses: Math.max(0, r.glasses + delta) };
  }
  const rec = r.history[r.selectedDate] ?? { entries: [], glasses: 0 };
  const glasses = Math.max(0, rec.glasses + delta);
  if (glasses === rec.glasses) return r;
  return { ...r, history: { ...r.history, [r.selectedDate]: { ...rec, glasses } } };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AvoLensState>(() => defaultState());
  const [systemDark, setSystemDark] = useState(() => getSystemDark());
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const skipNextPush = useRef(false);
  // Pushes are held until the signed-in user's remote copy has been fetched,
  // so a slow pull can't be raced by an upsert of fresh local/default state.
  // State (not a ref) so completing the pull re-runs the push effect.
  const [pulledFor, setPulledFor] = useState<string | null>(null);

  // Load persisted state after mount; re-check the date on foreground.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AvoLensState>;
          setState((s) => rolledOver({ ...s, ...migrateState(saved) }));
        }
      } catch {
        // ignore corrupt storage
      }
      setIsHydrated(true);
    })();

    const appearanceSub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemDark(colorScheme === 'dark'),
    );
    const appStateSub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        setState((s) => rolledOver(s));
        if (state.healthConnected) {
          getTodayActivity().then((a) => {
            if (a) setActivity(a);
          });
        }
      }
    });
    return () => {
      appearanceSub.remove();
      appStateSub.remove();
    };
  }, [state.healthConnected]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // ignore quota errors
    });
    if (state.logReminderOn) {
      syncLogReminder(true, state.logReminderHour, state.logReminderMinute);
    }
  }, [state, isHydrated]);

  const resolvedDark = state.themeMode === 'auto' ? systemDark : state.themeMode === 'dark';
  const theme = resolvedDark ? darkTheme : lightTheme;

  const streak = useMemo(
    () => computeStreak({ history: state.history, todayEntries: state.todayEntries }),
    [state.history, state.todayEntries],
  );

  // Keep the Home / Lock Screen widgets in sync with today's log.
  useEffect(() => {
    if (!isHydrated) return;
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
      glasses: state.glasses,
      glassesGoal: state.goal.water,
    });
  }, [state.todayEntries, state.goal, streak, state.glasses, isHydrated]);

  // Keep the dose reminder + missed-dose follow-up in sync with the schedule.
  useEffect(() => {
    if (!isHydrated) return;
    const med = resolveMedication(state);
    const on = state.medEnabled && state.reminderOn;
    syncMedReminder({
      on,
      medName: med.name,
      frequency: med.frequency,
      day: state.medDay,
      hour: state.medHour,
      minute: state.medMinute,
    });
    let missedAt: Date | null = null;
    if (on && !takenThisCycle(state)) {
      const slot = new Date();
      slot.setHours(state.medHour, state.medMinute, 0, 0);
      if (med.frequency === 'weekly') {
        const daysSinceSlot = (slot.getDay() - state.medDay + 7) % 7;
        slot.setDate(slot.getDate() - daysSinceSlot);
      }
      missedAt = new Date(slot.getTime() + 14 * 60 * 60 * 1000);
    }
    armMissedDoseCheck(missedAt, med.name);
  }, [
    state.medEnabled,
    state.reminderOn,
    state.medKey,
    state.medDay,
    state.medHour,
    state.medMinute,
    state.shots,
    state.medCustomName,
    state.medCustomFrequency,
    state.medCustomDose,
    isHydrated,
  ]);

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
    const { data, error } = await supabase.from('profiles').select('state').eq('id', userId).maybeSingle();
    if (error) return; // keep pushes held; we never saw the remote copy
    if (data?.state) {
      skipNextPush.current = true;
      setState((s) => rolledOver({ ...s, ...migrateState(data.state as Partial<AvoLensState>) }));
    }
    setPulledFor(userId);
  }, []);

  useEffect(() => {
    if (session?.user?.id) pullRemote(session.user.id);
  }, [session?.user?.id, pullRemote]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session?.user?.id || !isHydrated) return;
    if (pulledFor !== session.user.id) return;
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
  }, [state, session?.user?.id, pulledFor, isHydrated]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      resolvedDark,
      theme,
      activity,
      streak,
      session,
      selectDay: (dateKey) =>
        setState((s) => {
          const r = rolledOver(s);
          // Never select the future; the strip disables those cells anyway.
          return dateKey > r.todayKey ? r : { ...r, selectedDate: dateKey };
        }),
      addGlass: () => setState((s) => adjustGlasses(rolledOver(s), +1)),
      removeGlass: () => setState((s) => adjustGlasses(rolledOver(s), -1)),
      setDose: (i) => setState((s) => ({ ...s, dose: i })),
      setMedication: (key) =>
        setState((s) => ({
          ...s,
          medKey: key,
          dose: Math.min(s.dose, resolveMedication({ ...s, medKey: key }).doses.length - 1),
        })),
      setCustomMed: (name, frequency, dose) =>
        setState((s) => ({
          ...s,
          medKey: 'custom',
          medCustomName: name,
          medCustomFrequency: frequency,
          medCustomDose: dose,
          dose: 0,
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
              doseMg: resolveMedication(s).doses[s.dose] ?? '',
              site,
            },
          ],
        })),
      toggleReminder: () => setState((s) => ({ ...s, reminderOn: !s.reminderOn })),
      toggleLogReminder: () =>
        setState((s) => {
          const logReminderOn = !s.logReminderOn;
          syncLogReminder(logReminderOn, s.logReminderHour, s.logReminderMinute);
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
      addEntryToDay: (dateKey, e) =>
        setState((s) => {
          const r = rolledOver(s);
          const entry: FoodEntry = { ...e, id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
          if (dateKey === r.todayKey) {
            return { ...r, todayEntries: [entry, ...r.todayEntries] };
          }
          const prev = r.history[dateKey] ?? { entries: [], glasses: 0 };
          return { ...r, history: { ...r.history, [dateKey]: { ...prev, entries: [entry, ...prev.entries] } } };
        }),
      updateEntry: (id, patch, dateKey) =>
        setState((s) => {
          if (dateKey && dateKey !== s.todayKey) {
            const rec = s.history[dateKey];
            if (!rec) return s;
            return {
              ...s,
              history: {
                ...s.history,
                [dateKey]: { ...rec, entries: rec.entries.map((e) => (e.id === id ? { ...e, ...patch, id } : e)) },
              },
            };
          }
          return {
            ...s,
            todayEntries: s.todayEntries.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
          };
        }),
      removeEntry: (id, dateKey) =>
        setState((s) => {
          if (dateKey && dateKey !== s.todayKey) {
            const rec = s.history[dateKey];
            if (!rec) return s;
            return {
              ...s,
              history: { ...s.history, [dateKey]: { ...rec, entries: rec.entries.filter((e) => e.id !== id) } },
            };
          }
          return { ...s, todayEntries: s.todayEntries.filter((e) => e.id !== id) };
        }),
      toggleFavorite: (f) =>
        setState((s) => {
          const key = (x: { name: string; brands?: string }) => `${x.name.toLowerCase()}|${x.brands ?? ''}`;
          const exists = s.favorites.find((x) => key(x) === key(f));
          if (exists) return { ...s, favorites: s.favorites.filter((x) => x.id !== exists.id) };
          return {
            ...s,
            favorites: [{ ...f, id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...s.favorites],
          };
        }),
      saveScan: (scan) =>
        setState((s) => ({
          ...s,
          savedScans: [
            {
              ...scan,
              id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              date: new Date().toISOString().split('T')[0],
            },
            ...(s.savedScans ?? []),
          ],
        })),
      removeSavedScan: (id) =>
        setState((s) => ({
          ...s,
          savedScans: (s.savedScans ?? []).filter((x) => x.id !== id),
        })),
      copyDayToToday: (fromKey) =>
        setState((s) => {
          const r = rolledOver(s);
          const src = fromKey === r.todayKey ? r.todayEntries : (r.history[fromKey]?.entries ?? []);
          if (src.length === 0) return r;
          const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const copies = src.map((e, idx) => ({
            ...e,
            id: `e-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            time: now,
          }));
          return { ...r, todayEntries: [...copies, ...r.todayEntries] };
        }),
      logWeight: (kg) =>
        setState((s) => {
          const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const nowTs = Date.now();
          const filtered = s.weightLog.filter((w) => w.date !== todayLabel);
          return {
            ...s,
            weightLog: [...filtered, { date: todayLabel, kg, ts: nowTs }],
          };
        }),
      addMeasurement: (m) =>
        setState((s) => ({
          ...s,
          measurements: [
            ...s.measurements,
            { ...m, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ts: Date.now() },
          ],
        })),
      addPhoto: (photo) => setState((s) => ({ ...s, photos: [{ ...photo }, ...s.photos] })),
      removePhoto: (id) => setState((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) })),
      setPhotoUri: (id, uri) =>
        setState((s) => ({ ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, uri } : p)) })),
      markAchievementsSeen: (ids) =>
        setState((s) => ({ ...s, achievementsSeen: Array.from(new Set([...s.achievementsSeen, ...ids])) })),
      setGoalCalories: (kcal) => setState((s) => ({ ...s, goal: { ...s.goal, calories: kcal } })),
      setGoal: (patch) => setState((s) => ({ ...s, goal: { ...s.goal, ...patch } })),
      setHeightCm: (cm) => setState((s) => ({ ...s, heightCm: cm })),
      setHeightUnit: (u) => setState((s) => ({ ...s, heightUnit: u })),
      setTargetWeight: (kg) => setState((s) => ({ ...s, targetWeightKg: kg })),
      setDisplayName: (name) => setState((s) => ({ ...s, displayName: name })),
      setProfile: (p) => setState((s) => ({ ...s, ...p })),
      setRolloverEnabled: (on) => setState((s) => ({ ...s, rolloverEnabled: on })),
      setRolloverMax: (max) => setState((s) => ({ ...s, rolloverMax: max })),
      setAddBurnedCalories: (on) => setState((s) => ({ ...s, addBurnedCalories: on })),
      recalcGoals: () => {
        let ok = false;
        setState((s) => {
          const weightKg = s.weightLog[s.weightLog.length - 1]?.kg;
          if (s.sex == null || s.age == null || s.activityLevel == null || s.goalType == null || weightKg == null) {
            return s;
          }
          ok = true;
          const g = computeGoal({
            goalType: s.goalType,
            sex: s.sex,
            age: s.age,
            heightCm: s.heightCm,
            heightUnit: s.heightUnit,
            weightKg,
            unit: s.unit,
            activityLevel: s.activityLevel,
          });
          return { ...s, goal: { ...s.goal, ...g } };
        });
        return ok;
      },
      setLogReminderTime: (hour, minute) =>
        setState((s) => {
          if (s.logReminderOn) syncLogReminder(true, hour, minute);
          return { ...s, logReminderHour: hour, logReminderMinute: minute };
        }),
      clearLoggedData: () => {
        // Also delete uploaded progress photos from storage — the settings
        // dialog promises photos are deleted, not just unlisted.
        for (const p of state.photos) {
          if (p.path) void deleteProgressPhoto(p);
        }
        setState((s) => ({
          ...s,
          todayEntries: [],
          history: {},
          weightLog: [],
          measurements: [],
          photos: [],
          shots: [],
          favorites: [],
          glasses: 0,
          achievementsSeen: [],
        }));
      },
      finishOnboarding: () => setState((s) => ({ ...s, hasOnboarded: true })),
      completeOnboarding: (p) =>
        setState((s) => ({
          ...s,
          goal: {
            ...s.goal,
            ...computeGoal(p),
            ...(p.waterGlasses && p.waterGlasses > 0 ? { water: p.waterGlasses } : null),
          },
          heightCm: p.heightCm,
          heightUnit: p.heightUnit,
          unit: p.unit,
          sex: p.sex,
          age: p.age,
          goalType: p.goalType,
          activityLevel: p.activityLevel,
          targetWeightKg: p.targetWeightKg ?? s.targetWeightKg,
          medEnabled: p.usesGlp1 ?? s.medEnabled,
          medKey: p.medKey ?? s.medKey,
          // A newly picked medication starts at the bottom of its dose ladder.
          dose: p.medKey ? 0 : s.dose,
          displayName: p.name?.trim() ? p.name.trim() : s.displayName,
          weightLog: [
            ...s.weightLog,
            {
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              kg: p.weightKg,
              ts: Date.now(),
            },
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
        setPulledFor(null);
        await supabase?.auth.signOut();
        // Reset to a fresh install so the next account on this device can't
        // inherit (or accidentally upload) this user's data.
        AsyncStorage.removeItem('avolens.coach.v1').catch(() => {}); // coach chat history
        setState(() => ({ ...defaultState(), hasOnboarded: true }));
      },
      deleteAccount: async () => {
        setPulledFor(null);
        try {
          if (supabase && session) {
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) return 'Could not delete your account. Please try again.';
            await supabase.auth.signOut();
          }
        } catch {
          return 'Could not delete your account. Please try again.';
        }
        // Wipe local data back to a fresh install.
        AsyncStorage.removeItem('avolens.coach.v1').catch(() => {}); // coach chat history
        setState(() => ({ ...defaultState(), hasOnboarded: true }));
        return null;
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
