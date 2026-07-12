import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { SUGGESTED_FOODS } from '@/lib/constants';
import { recentMeals, dayKey } from '@/lib/days';
import { searchFoods, scaleBasis, type FoodBasis } from '@/lib/foods';
import type { FavoriteFood, FoodEntry } from '@/lib/types';
import { F } from '@/lib/fonts';

const MEALS: FoodEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function mealForNow(): FoodEntry['meal'] {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

/** The last 7 days as {key,label} for the "log to" selector. */
function recentDays(): { key: string; label: string }[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    return { key: dayKey(d), label };
  });
}

function favToBasis(f: FavoriteFood): FoodBasis {
  return { name: f.name, brands: f.brands, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, sodium: f.sodium, sugar: f.sugar, healthScore: f.healthScore, servingG: f.servingG };
}

export default function ManualEntryPage() {
  const router = useRouter();
  const { state, addEntryToDay, updateEntry, removeEntry, toggleFavorite, theme: t } = useStore();
  const insets = useSafeAreaInsets();
  const { edit, day, editDay } = useLocalSearchParams<{ edit?: string; day?: string; editDay?: string }>();
  const editing = useMemo(
    () => {
      if (!edit) return undefined;
      const pool =
        editDay && editDay !== state.todayKey
          ? (state.history[editDay]?.entries ?? [])
          : state.todayEntries;
      return pool.find((e) => e.id === edit);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edit, editDay],
  );

  const days = useMemo(recentDays, []);
  const [targetKey, setTargetKey] = useState(day && days.some((d) => d.key === day) ? day : days[0].key);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodBasis[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);

  // A selected database/recent food (per-100g basis) → log by weight.
  const [basis, setBasis] = useState<FoodBasis | null>(null);
  const [grams, setGrams] = useState('100');

  // Quick-add: calories only.
  const [quick, setQuick] = useState(false);
  const [quickKcal, setQuickKcal] = useState('');

  const [name, setName] = useState(editing?.name ?? 'Avocado toast');
  const [meal, setMeal] = useState<FoodEntry['meal']>(editing?.meal ?? mealForNow());
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [servings, setServings] = useState(1);
  const [protein, setProtein] = useState(editing?.protein ?? 12);
  const [carbs, setCarbs] = useState(editing?.carbs ?? 34);
  const [fat, setFat] = useState(editing?.fat ?? 16);
  const [fiber, setFiber] = useState(editing?.fiber ?? 8);
  const [sodium, setSodium] = useState(editing?.sodium ?? 380);
  const [sugar, setSugar] = useState(editing?.sugar ?? 4);
  const [showMoreNutrients, setShowMoreNutrients] = useState(false);

  const recents = useMemo(() => recentMeals(state), [state]);
  const favBasis = state.favorites.some((f) => f.name.toLowerCase() === name.trim().toLowerCase());

  // Debounced OpenFoodFacts search.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (editing) return;
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchErr(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const found = await searchFoods(q, ctrl.signal);
        setResults(found);
        setSearchErr(found.length === 0 ? 'No matches — enter it manually below.' : null);
      } catch {
        if (!ctrl.signal.aborted) {
          setSearchErr("Couldn't reach the food database — you can still add the food manually below.");
        }
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, editing, searchAttempt]);

  const gramsNum = Math.max(0, Number(grams) || 0);
  const scaled = basis ? scaleBasis(basis, gramsNum) : null;

  const calories = useMemo(() => {
    if (quick) return Math.max(0, Number(quickKcal) || 0);
    if (scaled) return scaled.calories;
    return Math.round((protein * 4 + carbs * 4 + fat * 9) * servings);
  }, [quick, quickKcal, scaled, protein, carbs, fat, servings]);

  // Typing a value here overrides the computed calories (empty = auto).
  const [kcalOverride, setKcalOverride] = useState(editing ? String(editing.calories) : '');
  const kcalFinal = kcalOverride.trim() !== '' ? Math.max(0, Number(kcalOverride) || 0) : calories;

  const pickBasis = (b: FoodBasis) => {
    setBasis(b);
    setName(b.brands ? `${b.name} (${b.brands})` : b.name);
    setGrams(String(b.servingG ?? 100));
    setSearch('');
    setResults([]);
  };

  const clearBasis = () => setBasis(null);

  const buildEntry = (): Omit<FoodEntry, 'id'> => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (quick) {
      return { name: name.trim() || 'Quick add', meal, time, calories, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, healthScore: 6, icon: 'generic', unit: 'kcal' };
    }
    if (basis && scaled) {
      return { name, meal, time, calories: kcalFinal, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, fiber: scaled.fiber, sodium: scaled.sodium, sugar: scaled.sugar, healthScore: basis.healthScore, icon: 'generic', amount: gramsNum, unit: 'g' };
    }
    return { name, meal, time, calories: kcalFinal, protein: protein * servings, carbs: carbs * servings, fat: fat * servings, fiber: fiber * servings, sodium: sodium * servings, sugar: sugar * servings, healthScore: 7, icon: 'generic', amount: servings, unit: 'serving' };
  };

  const save = () => {
    if (editing) {
      const e = buildEntry();
      updateEntry(editing.id, { name: e.name, meal: e.meal, calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat, fiber: e.fiber, sodium: e.sodium, sugar: e.sugar, amount: e.amount, unit: e.unit }, editDay);
      router.push('/home');
      return;
    }
    addEntryToDay(targetKey, buildEntry());
    router.push('/home');
  };

  const deleteEntry = () => {
    if (!editing) return;
    removeEntry(editing.id, editDay);
    router.push('/home');
  };

  const saveFavorite = () => {
    // Favorite stores a per-100g basis. From a DB basis directly; from a custom
    // food, treat the entered per-serving macros as the per-portion basis.
    const b: Omit<FavoriteFood, 'id'> = basis
      ? { name: basis.name, brands: basis.brands, calories: basis.calories, protein: basis.protein, carbs: basis.carbs, fat: basis.fat, fiber: basis.fiber, sodium: basis.sodium, sugar: basis.sugar, healthScore: basis.healthScore, servingG: basis.servingG }
      : { name: name.trim(), calories: Math.round(protein * 4 + carbs * 4 + fat * 9), protein, carbs, fat, fiber, sodium, sugar, healthScore: 7, servingG: 100 };
    toggleFavorite(b);
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: F.b600,
    fontSize: 15,
    color: t.ink,
  } as const;

  const chip = (active: boolean) => ({
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: active ? t.green : t.border,
    backgroundColor: active ? t.greenTint : t.surface,
  });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 22, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m15 5-7 7 7 7" />
          </Svg>
        </Pressable>
        <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>{editing ? 'Edit Food' : 'Add Food'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={saveFavorite} accessibilityRole="button" accessibilityLabel="Save to favorites">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={favBasis ? t.carbs : 'none'} stroke={favBasis ? t.carbs : t.muted2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m12 3 2.7 5.9 6.3.6-4.7 4.2 1.4 6.3L12 17.8 6.3 20.9l1.4-6.3L3 9.5l6.3-.6Z" />
            </Svg>
          </Pressable>
          {editing && (
            <Pressable onPress={deleteEntry} accessibilityRole="button" accessibilityLabel="Delete entry">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.protein} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
              </Svg>
            </Pressable>
          )}
          <Pressable onPress={save} accessibilityRole="button">
            <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.green }}>Save</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingTop: 2, paddingHorizontal: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {!editing && (
            <>
              {/* Log to which day */}
              <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>Log to</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 18 }}>
                {days.map((d) => (
                  <Pressable key={d.key} onPress={() => setTargetKey(d.key)} style={chip(targetKey === d.key)}>
                    <Text style={{ fontFamily: F.d700, fontSize: 12, color: targetKey === d.key ? t.green : t.ink }}>{d.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingVertical: 3, paddingHorizontal: 15, marginBottom: 12 }}>
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={11} cy={11} r={7} />
                  <Path d="m21 21-4.3-4.3" />
                </Svg>
                <TextInput value={search} onChangeText={setSearch} placeholder="Search foods (e.g. chicken breast)" placeholderTextColor={t.muted2} style={{ flex: 1, fontFamily: F.b500, fontSize: 14, color: t.ink, paddingVertical: 10 }} />
                {searching && <ActivityIndicator size="small" color={t.muted2} />}
              </View>

              {/* Search results */}
              {(results.length > 0 || searchErr) && (
                <View style={{ marginBottom: 16, gap: 8 }}>
                  {results.map((r, i) => (
                    <Pressable key={`${r.name}-${i}`} onPress={() => pickBasis(r)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14 }}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontFamily: F.b600, fontSize: 13.5, color: t.ink }}>{r.name}</Text>
                        <Text numberOfLines={1} style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 1 }}>
                          {r.brands ? `${r.brands} · ` : ''}{r.calories} kcal · P{r.protein} C{r.carbs} F{r.fat} (per 100g)
                        </Text>
                      </View>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                    </Pressable>
                  ))}
                  {searchErr && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
                      <Text style={{ flex: 1, fontFamily: F.b500, fontSize: 12, color: t.muted }}>{searchErr}</Text>
                      {searchErr.startsWith("Couldn't reach") && (
                        <Pressable
                          onPress={() => setSearchAttempt((n) => n + 1)}
                          accessibilityRole="button"
                          style={{ backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 }}
                        >
                          <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>Retry</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Favorites + Recents + Quick add — hidden while a search is active */}
              {results.length === 0 && !searching && (
                <>
                  {state.favorites.length > 0 && (
                    <>
                      <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>Favorites</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                        {state.favorites.map((f) => (
                          <Pressable key={f.id} onPress={() => pickBasis(favToBasis(f))} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.carbsTint, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99 }}>
                            <Svg width={11} height={11} viewBox="0 0 24 24" fill={t.carbs} stroke="none"><Path d="m12 3 2.7 5.9 6.3.6-4.7 4.2 1.4 6.3L12 17.8 6.3 20.9l1.4-6.3L3 9.5l6.3-.6Z" /></Svg>
                            <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{f.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}

                  {state.favorites.length === 0 && recents.length === 0 && (
                    <>
                      <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>Suggested</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                        {SUGGESTED_FOODS.map((f) => (
                          <Pressable
                            key={f.name}
                            onPress={() => {
                              setBasis(null);
                              setName(f.name);
                              setProtein(f.protein);
                              setCarbs(f.carbs);
                              setFat(f.fat);
                              setServings(1);
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99 }}
                          >
                            <View style={{ width: 7, height: 7, borderRadius: 9, backgroundColor: t[f.color] as string }} />
                            <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{f.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}

                  {recents.length > 0 && (
                    <>
                      <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>Recent</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                        {recents.map((r) => (
                          <Pressable
                            key={r.id}
                            onPress={() => {
                              setBasis(null);
                              setName(r.name);
                              setMeal(r.meal);
                              setProtein(r.protein);
                              setCarbs(r.carbs);
                              setFat(r.fat);
                              setFiber(r.fiber);
                              setSodium(r.sodium);
                              setSugar(r.sugar);
                              setServings(1);
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.greenTint, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99 }}
                          >
                            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 3" /></Svg>
                            <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.greenGrad2 }}>{r.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}

                  <Pressable onPress={() => setQuick((q) => !q)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: quick ? t.greenTint : t.surface, borderWidth: 1, borderColor: quick ? t.green : t.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={quick ? t.green : t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></Svg>
                      <Text style={{ fontFamily: F.b600, fontSize: 13.5, color: quick ? t.green : t.ink }}>Quick add calories only</Text>
                    </View>
                    <View style={{ width: 18, height: 18, borderRadius: 99, borderWidth: 2, borderColor: quick ? t.green : t.faint, backgroundColor: quick ? t.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {quick && <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
                    </View>
                  </Pressable>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                    <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>Details</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                  </View>
                </>
              )}
            </>
          )}

          {/* Name */}
          <FieldLabel>Food name</FieldLabel>
          <TextInput value={name} onChangeText={setName} style={{ ...inputStyle, marginBottom: 14 }} />

          {/* Meal + portion controls */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Meal</FieldLabel>
              <Pressable onPress={() => setMealPickerOpen(true)} style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>{meal}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m6 9 6 6 6-6" /></Svg>
              </Pressable>
            </View>
            {!quick && (
              <View style={{ flex: 1 }}>
                <FieldLabel>{basis ? 'Amount' : 'Servings'}</FieldLabel>
                {basis ? (
                  <View style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }}>
                    <TextInput keyboardType="number-pad" value={grams} onChangeText={(v) => setGrams(v.replace(/[^0-9]/g, ''))} style={{ flex: 1, fontFamily: F.d700, fontSize: 16, color: t.ink, paddingVertical: 13 }} />
                    <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted2 }}>g</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10 }}>
                    <Stepper onPress={() => setServings((s) => Math.max(1, s - 1))} bg={t.surface3} iconColor={t.ink} icon="minus" />
                    <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{servings}</Text>
                    <Stepper onPress={() => setServings((s) => s + 1)} bg={t.greenTint} iconColor={t.green} icon="plus" />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Portion quick chips for DB foods */}
          {basis && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[basis.servingG, 50, 100, 150, 200].filter((g, i, a): g is number => !!g && a.indexOf(g) === i).map((g) => (
                <Pressable key={g} onPress={() => setGrams(String(g))} style={chip(gramsNum === g)}>
                  <Text style={{ fontFamily: F.b600, fontSize: 12, color: gramsNum === g ? t.green : t.ink }}>
                    {g === basis.servingG ? `1 serving (${g}g)` : `${g}g`}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={clearBasis} style={chip(false)}>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>Enter macros manually</Text>
              </Pressable>
            </View>
          )}

          {/* Calories */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>Calories</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 2 }}>
                {quick
                  ? 'Enter total calories'
                  : kcalOverride.trim() !== ''
                    ? 'Custom — clear to auto-calculate'
                    : basis
                      ? `${basis.calories} kcal / 100g · tap to edit`
                      : 'Auto from macros · tap to edit'}
              </Text>
            </View>
            {quick ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <TextInput keyboardType="number-pad" value={quickKcal} onChangeText={(v) => setQuickKcal(v.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={t.muted2} style={{ fontFamily: F.d800, fontSize: 28, color: t.ink, textAlign: 'right', minWidth: 70, padding: 0 }} />
                <Text style={{ fontFamily: F.d600, fontSize: 13, color: t.muted2 }}>kcal</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <TextInput
                  keyboardType="number-pad"
                  value={kcalOverride}
                  onChangeText={(v) => setKcalOverride(v.replace(/[^0-9]/g, ''))}
                  placeholder={String(calories)}
                  placeholderTextColor={t.ink}
                  style={{ fontFamily: F.d800, fontSize: 28, color: t.ink, letterSpacing: -0.56, textAlign: 'right', minWidth: 70, padding: 0 }}
                />
                <Text style={{ fontFamily: F.d600, fontSize: 13, color: t.muted2 }}>kcal</Text>
              </View>
            )}
          </View>

          {/* Macros — hidden for quick-add and for DB foods (auto from basis) */}
          {!quick && !basis && (
            <>
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, marginBottom: 8 }}>Macros (g)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <MacroInput label="Protein" color={t.protein} value={protein} onChange={setProtein} />
                <MacroInput label="Carbs" color={t.carbs} value={carbs} onChange={setCarbs} />
                <MacroInput label="Fat" color={t.fat} value={fat} onChange={setFat} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>More nutrients</Text>
                {!showMoreNutrients && (
                  <Pressable onPress={() => setShowMoreNutrients(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                    <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.green }}>Add</Text>
                  </Pressable>
                )}
              </View>
              {showMoreNutrients && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <NutrientInput label="Fiber" suffix="g" value={fiber} onChange={setFiber} />
                  <NutrientInput label="Sodium" suffix="mg" value={sodium} onChange={setSodium} />
                  <NutrientInput label="Sugar" suffix="g" value={sugar} onChange={setSugar} />
                </View>
              )}
            </>
          )}

          {/* Macro summary for DB foods (scaled, read-only) */}
          {!quick && basis && scaled && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReadMacro label="Protein" color={t.protein} value={scaled.protein} />
              <ReadMacro label="Carbs" color={t.carbs} value={scaled.carbs} />
              <ReadMacro label="Fat" color={t.fat} value={scaled.fat} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(0,0,0,0)', t.bg]} locations={[0, 0.28]} style={{ paddingTop: 14, paddingHorizontal: 22, paddingBottom: Math.max(26, insets.bottom + 10) }}>
          <Pressable onPress={save} style={{ width: '100%', height: 54, borderRadius: 18, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(47,158,110,1)', shadowOpacity: 0.6, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
            <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 16 }}>{editing ? 'Save changes' : 'Add to Log'}</Text>
          </Pressable>
        </LinearGradient>
      </View>

      <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="fade" visible={mealPickerOpen} onRequestClose={() => setMealPickerOpen(false)}>
        <Pressable onPress={() => setMealPickerOpen(false)} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 12 }}>Meal</Text>
            {MEALS.map((m, i) => (
              <Pressable key={m} onPress={() => { setMeal(m); setMealPickerOpen(false); }} style={{ paddingVertical: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.border2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: meal === m ? t.green : t.ink }}>{m}</Text>
                {meal === m && <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, marginBottom: 7 }}>{children}</Text>;
}

function Stepper({ onPress, bg, iconColor, icon }: { onPress: () => void; bg: string; iconColor: string; icon: 'plus' | 'minus' }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={3} strokeLinecap="round">
        {icon === 'plus' ? <Path d="M12 5v14M5 12h14" /> : <Path d="M5 12h14" />}
      </Svg>
    </Pressable>
  );
}

function numericOnChange(onChange: (n: number) => void) {
  return (text: string) => onChange(Number(text.replace(/[^0-9.]/g, '')) || 0);
}

function MacroInput({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (n: number) => void }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: color }} />
        <TextInput keyboardType="number-pad" value={String(value)} onChangeText={numericOnChange(onChange)} style={{ width: 40, fontFamily: F.d800, fontSize: 20, color: t.ink, textAlign: 'center', padding: 0 }} />
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted }}>{label}</Text>
    </View>
  );
}

function ReadMacro({ label, color, value }: { label: string; color: string; value: number }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: color }} />
        <Text style={{ fontFamily: F.d800, fontSize: 20, color: t.ink }}>{value}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted }}>{label} (g)</Text>
    </View>
  );
}

function NutrientInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (n: number) => void }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12, alignItems: 'center', gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <TextInput keyboardType="number-pad" value={String(value)} onChangeText={numericOnChange(onChange)} style={{ minWidth: 24, fontFamily: F.d700, fontSize: 16, color: t.ink, textAlign: 'center', padding: 0 }} />
        <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2 }}>{suffix}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted }}>{label}</Text>
    </View>
  );
}
