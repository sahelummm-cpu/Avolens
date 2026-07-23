import { Platform, ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { DayStrip } from '@/components/DayStrip';
import { CalorieRing } from '@/components/CalorieRing';
import { SummaryRingCarousel } from '@/components/SummaryRingCarousel';
import { NutrientCarousel } from '@/components/NutrientCarousel';
import { FoodLogCard } from '@/components/FoodLogCard';
import { BottomNav } from '@/components/BottomNav';
import { useDailyTotals, useStore } from '@/lib/store';
import { selectedDayTotals } from '@/lib/dayStrip';
import { computeRollover, daysAgoKey } from '@/lib/days';
import type { FoodEntry } from '@/lib/types';
import { F } from '@/lib/fonts';

const MEAL_ORDER: FoodEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, theme: t, activity, streak, copyDayToToday } = useStore();
  // Derived per render (keyed off todayKey) so the header can't go stale if
  // the app stays open across midnight.
  const todayLabel = new Date(`${state.todayKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const liveTotals = useDailyTotals();
  const yesterdayEntries = state.history[daysAgoKey(1)]?.entries ?? [];
  const viewingToday = state.selectedDate === state.todayKey;
  const dayEntries = viewingToday
    ? state.todayEntries
    : (state.history[state.selectedDate]?.entries ?? []);
  const mealGroups = MEAL_ORDER.map((m) => ({
    meal: m,
    entries: dayEntries.filter((e) => e.meal === m),
  })).filter((g) => g.entries.length > 0);
  const totals = selectedDayTotals(state, liveTotals);
  const selectedLabel = viewingToday
    ? "Today's Log"
    : new Date(`${state.selectedDate}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const fractions = {
    calories: state.goal.calories > 0 ? totals.calories / state.goal.calories : 0,
    protein: state.goal.protein > 0 ? totals.protein / state.goal.protein : 0,
    carbs: state.goal.carbs > 0 ? totals.carbs / state.goal.carbs : 0,
    fat: state.goal.fat > 0 ? totals.fat / state.goal.fat : 0,
  };

  return (
    <Screen inset={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Logo size={30} />
            <View>
              <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted }}>{todayLabel}</Text>
              <Text style={{ fontFamily: F.d700, fontSize: 22, color: t.ink }}>Today</Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              paddingTop: 5,
              paddingBottom: 5,
              paddingLeft: 5,
              paddingRight: 13,
              backgroundColor: t.navBg,
            }}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF2D55']}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={{ width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={23} height={23} viewBox="0 0 24 24" fill="#fff">
                <Path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" />
              </Svg>
            </LinearGradient>
            <View>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: '#fff', lineHeight: 15 }}>{streak}</Text>
              <Text style={{ fontFamily: F.b600, fontSize: 8, color: t.navIcon, letterSpacing: 0.48, textTransform: 'uppercase', lineHeight: 9 }}>
                day streak
              </Text>
            </View>
          </View>
        </View>

        <DayStrip />

        <SummaryRingCarousel
          totals={totals}
          state={state}
          activity={activity}
          fractions={fractions}
          viewingToday={viewingToday}
        />

        <NutrientCarousel />



        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>{selectedLabel}</Text>
          <Pressable
            onPress={() => router.push('/scanner')}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 }}
          >
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.8} strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.ink }}>Add meal</Text>
          </Pressable>
        </View>
        {dayEntries.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
            <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 13, color: t.muted }}>
              {viewingToday ? 'Nothing logged yet — scan or add a meal.' : 'Nothing was logged on this day.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {viewingToday && (
                <Pressable
                  onPress={() => router.push('/scanner')}
                  accessibilityRole="button"
                  style={{ backgroundColor: '#111116', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 }}
                >
                  <Text style={{ fontFamily: F.d700, fontSize: 13, color: '#fff' }}>Scan a meal</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  router.push(
                    viewingToday
                      ? '/manual-entry'
                      : { pathname: '/manual-entry', params: { day: state.selectedDate } },
                  )
                }
                accessibilityRole="button"
                style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 }}
              >
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>
                  {viewingToday ? 'Add manually' : 'Add to this day'}
                </Text>
              </Pressable>
            </View>
            {viewingToday && yesterdayEntries.length > 0 && (
              <Pressable onPress={() => copyDayToToday(daysAgoKey(1))} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M8 4h9a2 2 0 0 1 2 2v11M6 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
                </Svg>
                <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.muted }}>Copy yesterday's {yesterdayEntries.length} meals</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {mealGroups.map((group, gi) => {
              const subtotal = group.entries.reduce((a, e) => a + e.calories, 0);
              return (
                <View key={group.meal} style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ fontFamily: F.b700, fontSize: 11.5, color: t.muted2, letterSpacing: 0.6, textTransform: 'uppercase' }}>{group.meal}</Text>
                    <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.muted }}>{subtotal.toLocaleString('en-US')} kcal</Text>
                  </View>
                  {group.entries.map((entry, i) => (
                    <FoodLogCard
                      key={entry.id}
                      entry={entry}
                      delay={0.4 + (gi + i) * 0.1}
                      onPress={() =>
                        router.push({
                          pathname: '/manual-entry',
                          params: viewingToday ? { edit: entry.id } : { edit: entry.id, editDay: state.selectedDate },
                        })
                      }
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav active="home" />
    </Screen>
  );
}

function MacroRow({ color, label, cur, target }: { color: string; label: string; cur: number; target: number }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: color, flexShrink: 0 }} />
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>
        {cur}
        <Text style={{ fontFamily: F.d600, fontSize: 11, color: t.muted2 }}>/{target}g</Text>
      </Text>
    </View>
  );
}
