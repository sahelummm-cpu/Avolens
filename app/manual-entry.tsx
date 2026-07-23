import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { recentMeals, dayKey } from '@/lib/days';
import { searchFoods, scaleBasis, type FoodBasis } from '@/lib/foods';
import { searchCommonFoods } from '@/lib/commonFoods';
import type { FavoriteFood, FoodEntry, SavedScan } from '@/lib/types';
import { F } from '@/lib/fonts';
import { ProteinIcon, CarbsIcon, FatIcon, FiberIcon, SodiumIcon, SugarIcon, CalorieIcon } from '@/components/NutritionIcons';
import { SwipeableMacros } from '@/components/SwipeableMacros';


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
  const { state, addEntryToDay, updateEntry, removeEntry, toggleFavorite, removeSavedScan, theme: t } = useStore();
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

  const [dbTab, setDbTab] = useState<'recent' | 'foods' | 'scans'>('recent');

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodBasis[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);

  // A selected database/recent food (per-100g basis) → log by weight.
  const [basis, setBasis] = useState<FoodBasis | null>(null);
  const [grams, setGrams] = useState('100');

  // Quick Add Toggle (Active by default)
  const [quick, setQuick] = useState(true);
  const [quickKcal, setQuickKcal] = useState(editing ? String(editing.calories) : '');

  const [name, setName] = useState(editing?.name ?? '');
  const [meal, setMeal] = useState<FoodEntry['meal']>(editing?.meal ?? mealForNow());
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [servings, setServings] = useState(1);
  const [protein, setProtein] = useState(editing?.protein ?? 0);
  const [carbs, setCarbs] = useState(editing?.carbs ?? 0);
  const [fat, setFat] = useState(editing?.fat ?? 0);
  const [fiber, setFiber] = useState(editing?.fiber ?? 0);
  const [sodium, setSodium] = useState(editing?.sodium ?? 0);
  const [sugar, setSugar] = useState(editing?.sugar ?? 0);
  const [basisImageUri, setBasisImageUri] = useState<string | null>(editing?.imageUri ?? null);

  const recents = useMemo(() => recentMeals(state, 50), [state]);
  const favBasis = state.favorites.some((f) => f.name.toLowerCase() === name.trim().toLowerCase());

  // Search: the built-in common-foods database answers instantly (fruits,
  // staples, basics), then debounced OpenFoodFacts results merge in below.
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
    const local = searchCommonFoods(q);
    setResults(local);
    setSearchErr(null);
    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const found = await searchFoods(q, ctrl.signal);
        const seen = new Set(local.map((f) => `${f.name.toLowerCase()}|${f.brands ?? ''}`));
        const merged = [...local, ...found.filter((f) => !seen.has(`${f.name.toLowerCase()}|${f.brands ?? ''}`))].slice(0, 20);
        setResults(merged);
        setSearchErr(merged.length === 0 ? 'No matches — enter it manually below.' : null);
      } catch {
        if (!ctrl.signal.aborted && local.length === 0) {
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
    if (quick) {
      const typed = Number(quickKcal) || 0;
      if (typed > 0) return typed;
      return Math.round(protein * 4 + carbs * 4 + fat * 9);
    }
    if (scaled) return scaled.calories;
    return Math.round((protein * 4 + carbs * 4 + fat * 9) * servings);
  }, [quick, quickKcal, scaled, protein, carbs, fat, servings]);

  const [kcalOverride, setKcalOverride] = useState(editing ? String(editing.calories) : '');
  const overrideServings = quick || basis || editing ? 1 : servings;
  const kcalFinal =
    kcalOverride.trim() !== ''
      ? Math.max(0, Math.round((Number(kcalOverride) || 0) * overrideServings))
      : calories;

  const pickBasis = (b: FoodBasis) => {
    setBasis(b);
    setName(b.brands ? `${b.name} (${b.brands})` : b.name);
    setGrams(String(b.servingG ?? 100));
    setBasisImageUri(b.imageUri ?? null);
    setQuickKcal(String(b.calories));
    setSearch('');
    setResults([]);
  };

  const pickScan = (scan: SavedScan) => {
    setBasis(null);
    setName(scan.name);
    setProtein(scan.protein);
    setCarbs(scan.carbs);
    setFat(scan.fat);
    setFiber(scan.fiber);
    setSodium(scan.sodium);
    setSugar(scan.sugar);
    setQuickKcal(String(scan.calories));
    setBasisImageUri(scan.imageUri ?? null);
    setServings(1);
  };

  const clearBasis = () => setBasis(null);

  const buildEntry = (): Omit<FoodEntry, 'id'> => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (quick) {
      return {
        name: name.trim() || 'Quick add',
        meal,
        time,
        calories,
        protein: protein * servings,
        carbs: carbs * servings,
        fat: fat * servings,
        fiber: fiber * servings,
        sodium: sodium * servings,
        sugar: sugar * servings,
        healthScore: 6,
        icon: 'generic',
        unit: 'kcal',
      };
    }
    if (basis && scaled) {
      return { name: name.trim() || 'Food', meal, time, calories: kcalFinal, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, fiber: scaled.fiber, sodium: scaled.sodium, sugar: scaled.sugar, healthScore: basis.healthScore, icon: 'generic', imageUri: basisImageUri || undefined, amount: gramsNum, unit: 'g' };
    }
    return { name: name.trim() || 'Quick add', meal, time, calories: kcalFinal, protein: protein * servings, carbs: carbs * servings, fat: fat * servings, fiber: fiber * servings, sodium: sodium * servings, sugar: sugar * servings, healthScore: 7, icon: 'generic', imageUri: basisImageUri || undefined, amount: servings, unit: 'serving' };
  };

  const canSave = quick
    ? Number(quickKcal) > 0 || calories > 0 || protein > 0 || carbs > 0 || fat > 0 || name.trim().length > 0
    : name.trim().length > 0 && (basis != null || kcalFinal > 0);

  const save = () => {
    if (!canSave) return;
    const entry = buildEntry();
    if (editing) {
      updateEntry(editing.id, entry, targetKey);
    } else {
      addEntryToDay(targetKey, entry);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editing) return;
    removeEntry(editing.id, targetKey);
    router.back();
  };

  const handleFav = () => {
    toggleFavorite({
      name: name.trim() || 'Favorite food',
      brands: basis?.brands,
      calories: Math.max(1, calories),
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      sugar,
      healthScore: basis?.healthScore ?? 7,
      servingG: basis?.servingG,
    });
  };

  const inputStyle = {
    fontFamily: F.b600,
    fontSize: 15,
    color: t.ink,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  } as const;

  const savedScans = state.savedScans ?? [];

  return (
    <Screen inset={false}>
      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: Math.max(16, insets.top + 8),
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: t.bg,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.border }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m15 18-6-6 6-6" />
          </Svg>
        </Pressable>

        <Text style={{ fontFamily: F.d700, fontSize: 18, color: t.ink, letterSpacing: -0.36 }}>
          {editing ? 'Edit Food' : 'Food Database'}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {name.trim().length > 0 && (
            <Pressable
              onPress={handleFav}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={favBasis ? 'Unstar' : 'Star'}
              style={{ padding: 6 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill={favBasis ? t.amberGrad1 : 'none'} stroke={favBasis ? t.amberGrad1 : t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
            </Pressable>
          )}

          {editing && (
            <Pressable
              onPress={handleDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete entry"
              style={{ padding: 6 }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </Svg>
            </Pressable>
          )}

          <Pressable onPress={save} disabled={!canSave} accessibilityRole="button">
            <Text style={{ fontFamily: F.d700, fontSize: 15, color: canSave ? t.green : t.muted }}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}>
          {/* Target Day Selector */}
          {!editing && (
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 8 }}>
                Log To
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {days.map((d) => {
                  const sel = d.key === targetKey;
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => setTargetKey(d.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 14,
                        borderRadius: 99,
                        backgroundColor: sel ? t.ink : t.surface,
                        borderWidth: 1,
                        borderColor: sel ? t.ink : t.border,
                      }}
                    >
                      <Text style={{ fontFamily: F.b600, fontSize: 12, color: sel ? t.bg : t.ink }}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Database Search Input */}
          {!editing && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <Circle cx={11} cy={11} r={8} />
                  <Path d="m21 21-4.35-4.35" />
                </Svg>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Describe what you ate"
                  placeholderTextColor={t.muted2}
                  style={{ flex: 1, fontFamily: F.b500, fontSize: 14, color: t.ink, padding: 0 }}
                />
                {searching && <ActivityIndicator size="small" color={t.green} />}
                {search.length > 0 && !searching && (
                  <Pressable onPress={() => setSearch('')} hitSlop={6}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.4} strokeLinecap="round">
                      <Path d="M18 6 6 18M6 6l12 12" />
                    </Svg>
                  </Pressable>
                )}
              </View>

              {/* Database Search Results */}
              {results.length > 0 && (
                <View style={{ marginTop: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, overflow: 'hidden', paddingVertical: 4 }}>
                  {results.map((r, i) => (
                    <Pressable
                      key={`${r.name}-${r.brands ?? ''}-${i}`}
                      onPress={() => pickBasis(r)}
                      accessibilityRole="button"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderBottomWidth: i < results.length - 1 ? 1 : 0,
                        borderBottomColor: t.border,
                      }}
                    >
                      {r.imageUri ? (
                        <Image source={{ uri: r.imageUri }} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: t.bg }} />
                      ) : (
                        <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v16z" />
                          </Svg>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontFamily: F.b600, fontSize: 13.5, color: t.ink }}>{r.name}</Text>
                        <Text numberOfLines={1} style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 1 }}>
                          {r.brands ? `${r.brands} · ` : ''}{r.calories} kcal · P{r.protein} C{r.carbs} F{r.fat} (per 100g)
                        </Text>
                      </View>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Quick Add Toggle Button — Directly Below Search Input */}
          {!editing && results.length === 0 && !searching && (
            <Pressable
              onPress={() => setQuick((q) => !q)}
              accessibilityRole="button"
              accessibilityState={{ selected: quick }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: quick ? t.greenTint : t.surface,
                borderWidth: 1.5,
                borderColor: quick ? t.green : t.border,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 18,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={quick ? t.green : t.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
                </Svg>
                <View>
                  <Text style={{ fontFamily: F.d700, fontSize: 14, color: quick ? t.green : t.ink }}>
                    Quick Add (Calories & All Nutrition)
                  </Text>
                  <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 1 }}>
                    Instant entry for calories, protein, carbs, fat, fiber & more
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  borderWidth: 2,
                  borderColor: quick ? t.green : t.faint,
                  backgroundColor: quick ? t.green : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {quick && (
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="m5 12 5 5 9-11" />
                  </Svg>
                )}
              </View>
            </Pressable>
          )}

          {/* Quick Add Panel (Expands when Quick Add is active) */}
          {quick ? (
            <View
              style={{
                backgroundColor: t.surface,
                borderWidth: 1.5,
                borderColor: t.green,
                borderRadius: 22,
                padding: 18,
                marginBottom: 20,
                gap: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              {/* Food Name (Optional) */}
              <View>
                <FieldLabel>Entry Name</FieldLabel>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Quick add (or food name)"
                  placeholderTextColor={t.muted2}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </View>

              {/* Meal Selector */}
              <View>
                <FieldLabel>Meal</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MEALS.map((m) => {
                    const isSel = meal === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMeal(m)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 12,
                          backgroundColor: isSel ? t.greenTint : t.bg,
                          borderWidth: 1,
                          borderColor: isSel ? t.green : t.border,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: F.b600, fontSize: 12, color: isSel ? t.green : t.ink }}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Quick Calories */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.bg, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CalorieIcon color="#FF3B30" size={16} />
                  <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>Calories</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <TextInput
                    keyboardType="number-pad"
                    value={quickKcal}
                    onChangeText={(v) => setQuickKcal(v.replace(/[^0-9]/g, ''))}
                    placeholder={calories > 0 ? String(calories) : '0'}
                    placeholderTextColor={t.muted2}
                    style={{ fontFamily: F.d800, fontSize: 26, color: t.ink, textAlign: 'right', minWidth: 60, padding: 0 }}
                  />
                  <Text style={{ fontFamily: F.d600, fontSize: 12, color: t.muted2 }}>kcal</Text>
                </View>
              </View>

              {/* All 6 Swipeable Nutrients */}
              <View>
                <FieldLabel>Nutrients & Macros (Swipe for all 6)</FieldLabel>
                <SwipeableMacros
                  values={{ protein, carbs, fat, fiber, sodium, sugar }}
                  onChange={(key, val) => {
                    if (key === 'protein') setProtein(val);
                    else if (key === 'carbs') setCarbs(val);
                    else if (key === 'fat') setFat(val);
                    else if (key === 'fiber') setFiber(val);
                    else if (key === 'sodium') setSodium(val);
                    else if (key === 'sugar') setSugar(val);
                  }}
                />
              </View>
            </View>
          ) : (
            /* Database Navigation Tabs & Items */
            <>
              {!editing && results.length === 0 && !searching && (
                <View style={{ marginBottom: 18 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingHorizontal: 2 }}>
                    <Pressable onPress={() => setDbTab('recent')}>
                      <Text style={{ fontFamily: dbTab === 'recent' ? F.d700 : F.b600, fontSize: 14, color: dbTab === 'recent' ? t.ink : t.muted2 }}>Recent ({recents.length})</Text>
                      {dbTab === 'recent' && <View style={{ height: 2.5, backgroundColor: t.ink, borderRadius: 99, marginTop: 4 }} />}
                    </Pressable>

                    <Pressable onPress={() => setDbTab('foods')}>
                      <Text style={{ fontFamily: dbTab === 'foods' ? F.d700 : F.b600, fontSize: 14, color: dbTab === 'foods' ? t.ink : t.muted2 }}>My foods ({state.favorites.length})</Text>
                      {dbTab === 'foods' && <View style={{ height: 2.5, backgroundColor: t.ink, borderRadius: 99, marginTop: 4 }} />}
                    </Pressable>

                    <Pressable onPress={() => setDbTab('scans')}>
                      <Text style={{ fontFamily: dbTab === 'scans' ? F.d700 : F.b600, fontSize: 14, color: dbTab === 'scans' ? t.ink : t.muted2 }}>Saved scans ({savedScans.length})</Text>
                      {dbTab === 'scans' && <View style={{ height: 2.5, backgroundColor: t.ink, borderRadius: 99, marginTop: 4 }} />}
                    </Pressable>
                  </ScrollView>

                  {/* Tab Content Rendering */}
                  <View style={{ marginTop: 12 }}>
                    {/* Tab: Recent Meals Logged */}
                    {dbTab === 'recent' && recents.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>All Recent Logged Foods ({recents.length})</Text>
                        <View style={{ gap: 10 }}>
                          {recents.map((r) => (
                            <Pressable
                              key={r.id}
                              onPress={() => pickScan({
                                id: r.id,
                                name: r.name,
                                calories: r.calories,
                                protein: r.protein,
                                carbs: r.carbs,
                                fat: r.fat,
                                fiber: r.fiber,
                                sodium: r.sodium,
                                sugar: r.sugar,
                                healthScore: r.healthScore,
                                imageUri: r.imageUri,
                                date: '',
                              })}
                              accessibilityRole="button"
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: t.surface,
                                borderWidth: 1,
                                borderColor: t.border,
                                borderRadius: 18,
                                padding: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.04,
                                shadowRadius: 6,
                                elevation: 2,
                              }}
                            >
                              {r.imageUri ? (
                                <Image source={{ uri: r.imageUri }} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.bg }} />
                              ) : (
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
                                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                    <Circle cx={12} cy={12} r={9} />
                                    <Path d="M12 7v5l3 3" />
                                  </Svg>
                                </View>
                              )}
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Text numberOfLines={1} style={{ fontFamily: F.b700, fontSize: 14, color: t.ink, flex: 1 }}>{r.name}</Text>
                                  <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.green }}>{r.calories} kcal</Text>
                                </View>
                                <Text numberOfLines={1} style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 2 }}>
                                  {r.meal} {r.time ? `· ${r.time}` : ''}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.proteinTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <ProteinIcon size={11} color={t.protein} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.protein }}>P {r.protein}g</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.carbsTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <CarbsIcon size={11} color={t.carbs} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.carbs }}>C {r.carbs}g</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.fatTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <FatIcon size={11} color={t.fat} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.fat }}>F {r.fat}g</Text>
                                  </View>
                                  {r.fiber > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#05966918', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                      <FiberIcon size={11} color="#059669" />
                                      <Text style={{ fontFamily: F.b700, fontSize: 10, color: '#059669' }}>{r.fiber}g</Text>
                                    </View>
                                  )}
                                  {r.sodium > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#6366F118', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                      <SodiumIcon size={11} color="#6366F1" />
                                      <Text style={{ fontFamily: F.b700, fontSize: 10, color: '#6366F1' }}>{r.sodium}mg</Text>
                                    </View>
                                  )}
                                  {r.sugar > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EC489918', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                      <SugarIcon size={11} color="#EC4899" />
                                      <Text style={{ fontFamily: F.b700, fontSize: 10, color: '#EC4899' }}>{r.sugar}g</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <View style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
                                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round">
                                  <Path d="M12 5v14M5 12h14" />
                                </Svg>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Empty Recent Meals Message */}
                    {dbTab === 'recent' && recents.length === 0 && (
                      <View style={{ paddingVertical: 18, alignItems: 'center', backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border }}>
                        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink, marginBottom: 4 }}>No Recent Meals Yet</Text>
                        <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, textAlign: 'center', paddingHorizontal: 20 }}>
                          Meals you log will automatically appear here for fast 1-tap re-logging.
                        </Text>
                      </View>
                    )}

                    {/* Tab: Saved Scans */}
                    {dbTab === 'scans' && savedScans.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>Saved Scans</Text>
                        <View style={{ gap: 8 }}>
                          {savedScans.map((s) => (
                            <Pressable
                              key={s.id}
                              onPress={() => pickScan(s)}
                              accessibilityRole="button"
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: t.surface,
                                borderWidth: 1,
                                borderColor: t.border,
                                borderRadius: 16,
                                padding: 12,
                              }}
                            >
                              {s.imageUri ? (
                                <Image source={{ uri: s.imageUri }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.bg }} />
                              ) : (
                                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
                                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2} strokeLinecap="round">
                                    <Path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                  </Svg>
                                </View>
                              )}
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text numberOfLines={1} style={{ fontFamily: F.b600, fontSize: 13.5, color: t.ink }}>{s.name}</Text>
                                <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.proteinTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <ProteinIcon size={10} color={t.protein} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.protein }}>P {s.protein}g</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.carbsTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <CarbsIcon size={10} color={t.carbs} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.carbs }}>C {s.carbs}g</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.fatTint, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                                    <FatIcon size={10} color={t.fat} />
                                    <Text style={{ fontFamily: F.b700, fontSize: 10, color: t.fat }}>F {s.fat}g</Text>
                                  </View>
                                </View>
                              </View>
                              <Pressable onPress={() => removeSavedScan(s.id)} hitSlop={8}>
                                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2.4} strokeLinecap="round">
                                  <Path d="M18 6 6 18M6 6l12 12" />
                                </Svg>
                              </Pressable>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Empty Saved Scans Message */}
                    {dbTab === 'scans' && savedScans.length === 0 && (
                      <View style={{ paddingVertical: 18, alignItems: 'center', backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border }}>
                        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink, marginBottom: 4 }}>No Saved Scans Yet</Text>
                        <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, textAlign: 'center', paddingHorizontal: 20 }}>
                          Scan barcodes or AI meals and tap "Save Scan" to store them here.
                        </Text>
                      </View>
                    )}

                    {/* Tab: My Foods (Favorites) */}
                    {dbTab === 'foods' && state.favorites.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>My Foods</Text>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                          {state.favorites.map((f) => (
                            <Pressable key={f.id} onPress={() => pickBasis(favToBasis(f))} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.carbsTint, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99 }}>
                              <Svg width={11} height={11} viewBox="0 0 24 24" fill={t.carbs} stroke="none"><Path d="m12 3 2.7 5.9 6.3.6-4.7 4.2 1.4 6.3L12 17.8 6.3 20.9l1.4-6.3L3 9.5l6.3-.6Z" /></Svg>
                              <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{f.name}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Empty My Foods Message */}
                    {dbTab === 'foods' && state.favorites.length === 0 && (
                      <View style={{ paddingVertical: 18, alignItems: 'center', backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border }}>
                        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink, marginBottom: 4 }}>No Favorite Foods Yet</Text>
                        <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, textAlign: 'center', paddingHorizontal: 20 }}>
                          Star any food while logging to save it here under My Foods.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(0,0,0,0)', t.bg]} locations={[0, 0.28]} style={{ paddingTop: 14, paddingHorizontal: 22, paddingBottom: Math.max(26, insets.bottom + 10) }}>
          <Pressable onPress={save} disabled={!canSave} accessibilityRole="button" style={{ width: '100%', height: 54, borderRadius: 18, backgroundColor: t.green, opacity: canSave ? 1 : 0.45, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(47,158,110,1)', shadowOpacity: canSave ? 0.6 : 0, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: canSave ? 8 : 0 }}>
            <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 16 }}>{editing ? 'Save changes' : 'Add to Log'}</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Meal Picker Modal */}
      <Modal visible={mealPickerOpen} transparent animationType="fade" onRequestClose={() => setMealPickerOpen(false)}>
        <Pressable onPress={() => setMealPickerOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Math.max(28, insets.bottom + 12), gap: 8 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 8, textAlign: 'center' }}>Select Meal</Text>
            {MEALS.map((m) => {
              const sel = m === meal;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMeal(m);
                    setMealPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: sel ? t.greenTint : t.bg,
                    borderWidth: 1,
                    borderColor: sel ? t.green : t.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontFamily: F.b600, fontSize: 15, color: sel ? t.green : t.ink }}>{m}</Text>
                  {sel && <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, marginBottom: 6 }}>{children}</Text>;
}

function Stepper({ onPress, bg, iconColor, icon }: { onPress: () => void; bg: string; iconColor: string; icon: 'plus' | 'minus' }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2.6} strokeLinecap="round">
        {icon === 'plus' ? <Path d="M12 5v14M5 12h14" /> : <Path d="M5 12h14" />}
      </Svg>
    </Pressable>
  );
}

function chip(selected: boolean) {
  return {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: selected ? '#2F9E6E22' : 'transparent',
    borderWidth: 1,
    borderColor: selected ? '#2F9E6E' : 'rgba(0,0,0,0.1)',
  } as const;
}
