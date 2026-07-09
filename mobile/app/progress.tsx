import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';
import { SegmentedControl } from '@/components/SegmentedControl';
import { WeightChart } from '@/components/WeightChart';
import { PromptModal } from '@/components/PromptModal';
import { useStore } from '@/lib/store';
import type { ChartRange } from '@/lib/types';
import { F } from '@/lib/fonts';

const kgToLb = (kg: number) => kg * 2.20462;

export default function ProgressPage() {
  const { state, setChartRange, logWeight, theme: t } = useStore();
  const [showLogModal, setShowLogModal] = useState(false);

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

  // Only "today" is tracked, so days-logged is 0 or 1 until per-day history exists.
  const daysLogged = state.todayEntries.length > 0 ? 1 : 0;
  const daysLoggedFrac = daysLogged / 30;
  const circ = 2 * Math.PI * 29;

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
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2 }}>
          <Logo size={28} />
          <Text style={{ fontFamily: F.d700, fontSize: 24, color: t.ink }}>Progress</Text>
        </View>
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, marginBottom: 22 }}>Last 30 days</Text>

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

              <WeightChart values={chartValues} />
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

        {/* Exercise — empty until a health source is connected */}
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

        {/* Calories eaten — needs day-over-day history */}
        <View style={card}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Calories eaten</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>
            Keep logging meals — your daily calorie trend will appear here.
          </Text>
        </View>

        {/* Days logged */}
        <View style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={72} height={72} viewBox="0 0 72 72" style={{ position: 'absolute' }}>
              <Circle cx={36} cy={36} r={29} fill="none" stroke={t.greenTrack} strokeWidth={8} />
              {daysLogged > 0 && (
                <Circle
                  cx={36}
                  cy={36}
                  r={29}
                  fill="none"
                  stroke={t.green}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={`${circ}`}
                  strokeDashoffset={circ * (1 - daysLoggedFrac)}
                  transform="rotate(-90 36 36)"
                />
              )}
            </Svg>
            <Text style={{ fontFamily: F.d800, fontSize: 19, color: t.ink }}>{daysLogged}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Days logged</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>of 30 days this month</Text>
          </View>
        </View>

        {/* Summary tiles */}
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
              <Svg width={16} height={16} viewBox="0 0 24 24" fill={state.streak > 0 ? t.green : t.muted2}>
                <Path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" />
              </Svg>
              <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink }}>{state.streak}</Text>
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
      </ScrollView>

      {showLogModal && (
        <PromptModal
          title="Log weight"
          placeholder={`Weight in ${state.unit}`}
          onClose={() => setShowLogModal(false)}
          onSubmit={submitWeight}
        />
      )}

      <BottomNav active="progress" />
    </Screen>
  );
}
