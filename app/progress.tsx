import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';
import { SegmentedControl } from '@/components/SegmentedControl';
import { WeightChart } from '@/components/WeightChart';
import { MiniBarChart } from '@/components/MiniBarChart';
import { PromptModal } from '@/components/PromptModal';
import { AchievementsCard, AdherenceCard, ExportCard, HeatmapCard, NetCaloriesCard, ProjectionCard } from '@/components/ProgressCards';
import { MeasurementsCard, PhotosCard } from '@/components/BodyProgress';
import { useStore } from '@/lib/store';
import { daysAgoKey, sumCalories, weeklyInsights } from '@/lib/days';
import { weightTrend } from '@/lib/progress';
import { recentCycles, resolveMedication, shotStreak } from '@/lib/meds';
import type { ChartRange } from '@/lib/types';
import { F } from '@/lib/fonts';

const kgToLb = (kg: number) => kg * 2.20462;

type Category = 'weight' | 'calories' | 'protein' | 'exercise' | 'body' | 'awards';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'body', label: 'Body' },
  { key: 'awards', label: 'Awards' },
];

export default function ProgressPage() {
  const insets = useSafeAreaInsets();
  const { state, setChartRange, logWeight, setTargetWeight, activity, streak, theme: t } = useStore();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [cat, setCat] = useState<Category>('weight');
  const hasActivity = state.healthConnected && activity != null;

  const isLb = state.unit === 'lb';
  const conv = (kg: number) => (isLb ? kgToLb(kg) : kg);
  const fmt = (kg: number) => conv(kg).toFixed(1);

  const hasWeight = state.weightLog.length > 0;
  const latest = hasWeight ? state.weightLog[state.weightLog.length - 1] : undefined;
  const prev = state.weightLog.length > 1 ? state.weightLog[state.weightLog.length - 2] : undefined;
  const delta = latest && prev ? conv(latest.kg) - conv(prev.kg) : 0;

  const chartValues = state.weightLog.map((w) => conv(w.kg));

  const rangeLabels = useMemo(() => {
    const dates = state.weightLog.map((w) => w.date);
    if (dates.length === 0) return ['', '', ''];
    if (state.chartRange === 'Y') return ['Jan', 'Apr', dates[dates.length - 1] ?? ''];
    if (dates.length < 3) return [dates[0] ?? '', '', dates[dates.length - 1] ?? ''];
    if (state.chartRange === 'W') return dates.slice(-3);
    const mid = dates[Math.floor(dates.length / 2)];
    return [dates[0], mid, dates[dates.length - 1]];
  }, [state.weightLog, state.chartRange]);

  const heightM = state.heightCm / 100;
  const bmi = latest ? latest.kg / (heightM * heightM) : 0;
  const bmiCat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiMarker = Math.min(96, Math.max(4, ((bmi - 15) / (40 - 15)) * 100));


  const insights = useMemo(() => weeklyInsights(state), [state]);

  // Last-7-days calorie bars (Mon-style short labels, today last).
  const calorieTrend = useMemo(() => {
    const values: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const entries = i === 0 ? state.todayEntries : (state.history[daysAgoKey(i)]?.entries ?? []);
      values.push(sumCalories(entries));
      labels.push(d.toLocaleDateString('en-US', { weekday: 'narrow' }));
    }
    return { values, labels, hasData: values.some((v) => v > 0) };
  }, [state.todayEntries, state.history]);

  const goalKg = state.targetWeightKg;
  const toGo = latest && goalKg != null ? conv(latest.kg) - conv(goalKg) : null;

  // GLP-1 adherence + shot markers on the weight chart (matched by display date).
  const med = resolveMedication(state);
  const medSched = {
    medKey: state.medKey,
    medDay: state.medDay,
    medHour: state.medHour,
    medMinute: state.medMinute,
    shots: state.shots,
    medCustomName: state.medCustomName,
    medCustomFrequency: state.medCustomFrequency,
    medCustomDose: state.medCustomDose,
  };
  const shotDisplayDates = useMemo(
    () =>
      new Set(
        state.shots.map((s) =>
          new Date(`${s.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ),
      ),
    [state.shots],
  );
  const chartMarkers = state.weightLog.map((w) => shotDisplayDates.has(w.date));
  const lastShot = state.shots[state.shots.length - 1];

  const avgHealth =
    state.todayEntries.length > 0
      ? state.todayEntries.reduce((a, e) => a + e.healthScore, 0) / state.todayEntries.length
      : null;

  const submitWeight = (raw: string) => {
    const val = parseFloat(raw);
    if (!Number.isFinite(val) || val <= 0) return;
    const kg = isLb ? val / 2.20462 : val;
    logWeight(kg);
    setShowLogModal(false);
  };

  const card = {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
  } as const;

  const LogWeightButton = (
    <Pressable
      onPress={() => setShowLogModal(true)}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.green, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 }}
    >
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round">
        <Path d="M12 5v14M5 12h14" />
      </Svg>
      <Text style={{ fontFamily: F.d700, fontSize: 12, color: '#fff' }}>Log weight</Text>
    </Pressable>
  );

  return (
    <Screen inset={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2 }}>
          <Logo size={28} />
          <Text style={{ fontFamily: F.d700, fontSize: 24, color: t.ink }}>Progress</Text>
        </View>
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, marginBottom: 16 }}>Last 30 days</Text>

        {/* Category picker — each tab shows just that topic's charts + stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -24, marginBottom: 18, flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
        >
          {CATEGORIES.map((c) => {
            const active = cat === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCat(c.key)}
                accessibilityRole="button"
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 99,
                  backgroundColor: active ? t.navBg : t.surface,
                  borderWidth: 1,
                  borderColor: active ? t.navBg : t.border,
                }}
              >
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: active ? '#fff' : t.muted }}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {cat === 'weight' && (
          <>
        {/* Weight */}
        <View style={{ ...card, borderRadius: 26, padding: 22 }}>
          {hasWeight && latest ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <View>
                  <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>Current weight</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                    <Text style={{ fontFamily: F.d800, fontSize: 36, color: t.ink, letterSpacing: -0.72 }}>{fmt(latest.kg)}</Text>
                    <Text style={{ fontFamily: F.d600, fontSize: 14, color: t.muted2 }}>{state.unit}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  {prev && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        borderWidth: 1,
                        borderColor: t.border,
                        backgroundColor: t.greenTint,
                        paddingVertical: 6,
                        paddingHorizontal: 11,
                        borderRadius: 99,
                      }}
                    >
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <Path d={delta <= 0 ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
                      </Svg>
                      <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>
                        {Math.abs(delta).toFixed(1)} {state.unit}
                      </Text>
                    </View>
                  )}
                  {LogWeightButton}
                </View>
              </View>

              <Pressable
                onPress={() => setShowGoalModal(true)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  backgroundColor: t.surface2,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 99,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginTop: -8,
                  marginBottom: 14,
                }}
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={9} />
                  <Circle cx={12} cy={12} r={4.5} />
                  <Circle cx={12} cy={12} r={0.8} fill={t.green} />
                </Svg>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>
                  {goalKg != null && toGo != null
                    ? `Goal ${fmt(goalKg)} ${state.unit} · ${Math.abs(toGo).toFixed(1)} ${state.unit} to go`
                    : 'Set a weight goal'}
                </Text>
              </Pressable>

              <View style={{ marginBottom: 16 }}>
                <SegmentedControl
                  value={state.chartRange}
                  onChange={(v: ChartRange) => setChartRange(v)}
                  options={[
                    { value: 'W', label: 'Week' },
                    { value: 'M', label: 'Month' },
                    { value: 'Y', label: 'Year' },
                  ]}
                />
              </View>

              <WeightChart values={chartValues} goal={goalKg != null ? conv(goalKg) : undefined} markers={state.medEnabled ? chartMarkers : undefined} trend={weightTrend(chartValues)} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                {rangeLabels.map((lab, i) => (
                  <Text key={i} style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2 }}>{lab}</Text>
                ))}
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 8, gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 19V5" />
                  <Path d="M4 19h16" />
                  <Path d="m7 13 3-3 3 2 4-5" />
                </Svg>
              </View>
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: F.d700, fontSize: 16, color: t.ink }}>No weight logged yet</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: t.muted, textAlign: 'center' }}>
                  Log your weight to track progress and see your BMI.
                </Text>
              </View>
              {LogWeightButton}
            </View>
          )}
        </View>

        {/* Weight trend projection */}
        <ProjectionCard />

        {/* BMI — only once there's a weight to compute it from */}
        {hasWeight && (
          <View style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ alignItems: 'center', flexShrink: 0, width: 72 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 30, color: t.ink, lineHeight: 32 }}>{bmi.toFixed(1)}</Text>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: t.green, marginTop: 4 }}>{bmiCat}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink, marginBottom: 10 }}>BMI score</Text>
              <View style={{ height: 8, borderRadius: 99 }}>
                <LinearGradient
                  colors={[t.fat, t.green, t.carbs, t.protein]}
                  locations={[0, 0.4, 0.72, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ height: 8, borderRadius: 99 }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    left: `${bmiMarker}%`,
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    backgroundColor: t.surface,
                    borderWidth: 3,
                    borderColor: t.ink,
                    marginLeft: -7,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                {['Under', 'Normal', 'Over', 'Obese'].map((lab) => (
                  <Text key={lab} style={{ fontFamily: F.b500, fontSize: 9, color: t.muted2 }}>{lab}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

          </>
        )}

        {cat === 'exercise' && (
          <>
        {/* Exercise — real synced stats when connected, else an empty state */}
        {hasActivity && activity ? (
          <View style={card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <View>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Exercise</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                  <Text style={{ fontFamily: F.d800, fontSize: 26, color: t.green, letterSpacing: -0.52 }}>
                    {activity.activeCalories.toLocaleString('en-US')}
                  </Text>
                  <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>kcal burned today</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <Path d="M21 3v5h-5" />
                </Svg>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>Auto-sync</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <StatBlock value={activity.steps.toLocaleString('en-US')} label="steps" color={t.green} />
              <StatBlock value={String(activity.activeMinutes)} label="active min" />
              <StatBlock value={String(activity.workouts)} label="workouts" />
            </View>
          </View>
        ) : (
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6.5 6.5 17.5 17.5" />
                  <Path d="M4 8V6a2 2 0 0 1 2-2h2" />
                  <Path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                  <Path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Exercise</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>
                  Connect Apple Health or Google Fit to see workouts and calories burned.
                </Text>
              </View>
            </View>
          </View>
        )}

          </>
        )}

        {cat === 'calories' && (
          <>
        {/* Net calories / deficit (needs health sync) */}
        <NetCaloriesCard />

        {/* Calories eaten — last 7 days */}
        <View style={card}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Calories eaten</Text>
          {calorieTrend.hasData ? (
            <View style={{ marginTop: 10 }}>
              <MiniBarChart
                values={calorieTrend.values}
                labels={calorieTrend.labels}
                color={t.green}
                avg={insights.avgCalories}
              />
            </View>
          ) : (
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>
              Keep logging meals — your daily calorie trend will appear here.
            </Text>
          )}
        </View>

          </>
        )}

        {cat === 'awards' && (
          <>
        {/* GLP-1 adherence */}
        {state.medEnabled && (
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{med.name}</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 2 }}>
                  {lastShot
                    ? `Last dose ${lastShot.doseMg} mg · ${lastShot.site}`
                    : 'No injections logged yet — use "Mark as taken" on Home.'}
                </Text>
              </View>
              {state.shots.length > 0 && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: F.d800, fontSize: 22, color: t.purple }}>{shotStreak(medSched)}</Text>
                  <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2 }}>
                    {med.frequency === 'weekly' ? 'week streak' : 'day streak'}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {recentCycles(medSched).map((hit, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 26,
                    borderRadius: 9,
                    backgroundColor: hit ? t.purple : t.surface2,
                    borderWidth: hit ? 0 : 1,
                    borderColor: t.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {hit && (
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="m5 12 5 5 9-11" />
                    </Svg>
                  )}
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: t.muted2, marginTop: 7 }}>
              Last 8 {med.frequency === 'weekly' ? 'weeks' : 'days'} · {state.shots.length} injection{state.shots.length === 1 ? '' : 's'} logged
            </Text>
          </View>
        )}

          </>
        )}

        {/* Protein trend + goal adherence */}
        {cat === 'protein' && <AdherenceCard />}

        {/* Weekly insights */}
        {cat === 'calories' && insights.daysLogged > 0 && (
          <View style={card}>
            <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink, marginBottom: 12 }}>This week</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBlock value={insights.avgCalories.toLocaleString('en-US')} label="avg kcal / day" color={t.green} />
              <StatBlock value={`${insights.avgProtein}g`} label="avg protein / day" />
              <StatBlock
                value={
                  insights.prevAvgCalories > 0
                    ? `${insights.avgCalories - insights.prevAvgCalories >= 0 ? '+' : ''}${(insights.avgCalories - insights.prevAvgCalories).toLocaleString('en-US')}`
                    : '—'
                }
                label="vs last week"
              />
            </View>
          </View>
        )}

        {/* Body measurements + progress photos */}
        {cat === 'body' && (
          <>
            <MeasurementsCard />
            <PhotosCard />
          </>
        )}

        {/* Logging heatmap + achievements */}
        {cat === 'awards' && (
          <>
            <HeatmapCard />
            <AchievementsCard />
          </>
        )}

        {/* Export + share */}
        <ExportCard />

        {/* Summary tiles */}
        {cat === 'weight' && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink }}>{latest ? fmt(latest.kg) : '—'}</Text>
              {latest && <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.muted2 }}>{state.unit}</Text>}
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 3 }}>Current weight</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill={streak > 0 ? t.green : t.muted2}>
                <Path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" />
              </Svg>
              <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink }}>{streak}</Text>
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 3 }}>Day streak</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 24, color: avgHealth != null ? t.green : t.muted2 }}>
                {avgHealth != null ? avgHealth.toFixed(1) : '—'}
              </Text>
              {avgHealth != null && <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.muted2 }}>/10</Text>}
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 3 }}>Health score</Text>
          </View>
        </View>
        )}
      </ScrollView>

      {showLogModal && (
        <PromptModal
          title="Log weight"
          placeholder={`Weight in ${state.unit}`}
          onClose={() => setShowLogModal(false)}
          onSubmit={submitWeight}
        />
      )}
      {showGoalModal && (
        <PromptModal
          title="Weight goal"
          placeholder={`Target weight in ${state.unit}`}
          initial={goalKg != null ? conv(goalKg).toFixed(1) : ''}
          onClose={() => setShowGoalModal(false)}
          onSubmit={(raw) => {
            const val = parseFloat(raw);
            if (Number.isFinite(val) && val > 0) {
              setTargetWeight(isLb ? val / 2.20462 : val);
            }
            setShowGoalModal(false);
          }}
        />
      )}

      <BottomNav active="progress" />
    </Screen>
  );
}

function StatBlock({ value, label, color }: { value: string; label: string; color?: string }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface2, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 }}>
      <Text style={{ fontFamily: F.d800, fontSize: 20, color: color ?? t.ink }}>{value}</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
