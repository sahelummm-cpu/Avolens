import { Platform, ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { DayStrip } from '@/components/DayStrip';
import { CalorieRing } from '@/components/CalorieRing';
import { NutrientCarousel } from '@/components/NutrientCarousel';
import { FoodLogCard } from '@/components/FoodLogCard';
import { BottomNav } from '@/components/BottomNav';
import { useDailyTotals, useStore } from '@/lib/store';
import { selectedDayTotals } from '@/lib/dayStrip';
import { daysAgoKey } from '@/lib/days';
import type { FoodEntry } from '@/lib/types';
import { F } from '@/lib/fonts';

const MEAL_ORDER: FoodEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, theme: t, activity, streak, copyDayToToday } = useStore();
  const liveTotals = useDailyTotals();
  const yesterdayEntries = state.history[daysAgoKey(1)]?.entries ?? [];
  const mealGroups = MEAL_ORDER.map((m) => ({
    meal: m,
    entries: state.todayEntries.filter((e) => e.meal === m),
  })).filter((g) => g.entries.length > 0);
  const totals = selectedDayTotals(state, liveTotals);

  const fractions = {
    calories: state.goal.calories > 0 ? Math.min(1, (state.goal.calories - totals.left) / state.goal.calories) : 0,
    protein: Math.min(1, totals.protein / state.goal.protein),
    carbs: Math.min(1, totals.carbs / state.goal.carbs),
    fat: Math.min(1, totals.fat / state.goal.fat),
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
              colors={[t.amberGrad1, t.amberGrad2]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={{ width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="#fff">
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

        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 28,
            paddingVertical: 24,
            paddingHorizontal: 22,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <View style={{ width: 156, height: 156, flexShrink: 0 }}>
              <CalorieRing size={156} fractions={fractions} />
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <Text style={{ fontFamily: F.d800, fontSize: 34, color: t.ink, lineHeight: 36, letterSpacing: -0.68 }}>
                  {totals.left.toLocaleString('en-US')}
                </Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>kcal left</Text>
              </View>
              <View style={{ gap: 8 }}>
                <MacroRow color={t.protein} label="Protein" cur={totals.protein} target={state.goal.protein} />
                <MacroRow color={t.carbs} label="Carbs" cur={totals.carbs} target={state.goal.carbs} />
                <MacroRow color={t.fat} label="Fat" cur={totals.fat} target={state.goal.fat} />
              </View>
            </View>
          </View>
        </View>

        <NutrientCarousel />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 22,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.fatTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={t.fat} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6.5 6.5 17.5 17.5" />
              <Path d="M4 8V6a2 2 0 0 1 2-2h2" />
              <Path d="M20 16v2a2 2 0 0 1-2 2h-2" />
              <Path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
            </Svg>
          </View>
          {state.healthConnected && activity ? (
            <>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Exercise</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <Path d="M21 3v5h-5" />
                  </Svg>
                  <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>
                    Auto-synced · {Platform.OS === 'android' ? 'Health Connect' : 'Apple Health'}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.green }}>
                  {activity.activeCalories.toLocaleString('en-US')}
                  <Text style={{ fontFamily: F.d600, fontSize: 11, color: t.muted2 }}> kcal</Text>
                </Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 1 }}>
                  {activity.steps.toLocaleString('en-US')} steps
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Exercise</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>
                  Connect a device to auto-sync activity
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 }}
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 17H7A5 5 0 0 1 7 7h2" />
                  <Path d="M15 7h2a5 5 0 0 1 0 10h-2" />
                  <Path d="M8 12h8" />
                </Svg>
                <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>Connect</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>Today's Log</Text>
          <Pressable
            onPress={() => router.push('/scanner')}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 }}
          >
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>Add meal</Text>
          </Pressable>
        </View>
        {state.todayEntries.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
            <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 13, color: t.muted }}>
              Nothing logged yet — scan or add a meal.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => router.push('/scanner')}
                accessibilityRole="button"
                style={{ backgroundColor: t.green, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 }}
              >
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: '#fff' }}>Scan a meal</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/manual-entry')}
                accessibilityRole="button"
                style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 }}
              >
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>Add manually</Text>
              </Pressable>
            </View>
            {yesterdayEntries.length > 0 && (
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
                      onPress={() => router.push({ pathname: '/manual-entry', params: { edit: entry.id } })}
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
