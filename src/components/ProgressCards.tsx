import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '@/lib/store';
import { exportCsv, shareProgress } from '@/lib/export';
import { daysAgoKey } from '@/lib/days';
import { MiniBarChart } from './MiniBarChart';
import {
  achievements,
  adherence,
  last7,
  monthHeatmap,
  netCalories,
  projectWeight,
} from '@/lib/progress';
import { F } from '@/lib/fonts';

const kgToLb = (kg: number) => kg * 2.20462;

function useCard() {
  const { theme: t } = useStore();
  return {
    t,
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 24,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginBottom: 14,
    } as const,
  };
}

/** "On track to reach 68 kg by Mar 12 (~6 weeks) · −0.6 kg/week". */
export function ProjectionCard() {
  const { state, theme: t } = useStore();
  const { card } = useCard();
  const isLb = state.unit === 'lb';
  const conv = (kg: number) => (isLb ? kgToLb(kg) : kg);
  const proj = projectWeight(state.weightLog, state.targetWeightKg);
  if (!proj) return null;

  const rate = Math.abs(conv(proj.ratePerWeek));
  const dir = proj.ratePerWeek < -0.02 ? 'Losing' : proj.ratePerWeek > 0.02 ? 'Gaining' : 'Holding';
  const arrow = proj.ratePerWeek < -0.02 ? 'm6 9 6 6 6-6' : proj.ratePerWeek > 0.02 ? 'm6 15 6-6 6 6' : 'M5 12h14';

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: proj.onTrack ? 12 : 0 }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 3v18h18" /><Path d="m19 9-5 5-4-4-3 3" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Trend</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={dir === 'Gaining' ? t.protein : t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d={arrow} /></Svg>
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>{dir} {rate.toFixed(2)} {state.unit}/week</Text>
          </View>
        </View>
      </View>
      {proj.onTrack && proj.etaDate && (
        <View style={{ backgroundColor: t.greenTint, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: t.greenGrad2 }}>At this rate you'll reach your goal around</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 20, color: t.green, marginTop: 3 }}>
            {proj.etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>
            about {Math.round(proj.weeksToGoal ?? 0)} week{Math.round(proj.weeksToGoal ?? 0) === 1 ? '' : 's'} away
          </Text>
        </View>
      )}
    </View>
  );
}

/** Net calories = eaten − burned, and the deficit vs. maintenance. */
export function NetCaloriesCard() {
  const { state, activity, theme: t } = useStore();
  const { card } = useCard();
  if (!state.healthConnected || !activity) return null;
  const n = netCalories(state, activity);
  const deficit = n.deficitToday;
  const losing = deficit > 0;
  const weeklyRate = state.unit === 'lb' ? n.weeklyRateKg * 2.20462 : n.weeklyRateKg;

  return (
    <View style={card}>
      <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink, marginBottom: 12 }}>Net calories today</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <NetPart label="Eaten" value={n.eatenToday} color={t.ink} />
        <Text style={{ fontFamily: F.d700, fontSize: 18, color: t.muted2 }}>−</Text>
        <NetPart label="Burned" value={n.burnedToday} color={t.green} />
        <Text style={{ fontFamily: F.d700, fontSize: 18, color: t.muted2 }}>=</Text>
        <NetPart label="Net" value={n.netToday} color={t.ink} />
      </View>
      <View style={{ backgroundColor: losing ? t.greenTint : t.proteinTint, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 19, color: losing ? t.green : t.protein }}>
            {Math.abs(Math.round(deficit)).toLocaleString('en-US')} kcal {losing ? 'deficit' : 'surplus'}
          </Text>
          <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 2 }}>vs ≈{n.maintenance.toLocaleString('en-US')} kcal maintenance</Text>
        </View>
        <Text style={{ fontFamily: F.d700, fontSize: 12.5, color: losing ? t.green : t.protein }}>
          ≈ {weeklyRate <= 0 ? '' : '+'}{weeklyRate.toFixed(2).replace('0.00', '0')} {state.unit}/wk
        </Text>
      </View>
    </View>
  );
}

function NetPart({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme: t } = useStore();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: F.d800, fontSize: 19, color }}>{Math.round(value).toLocaleString('en-US')}</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: t.muted2, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

/**
 * Detail row shown when a chart bar is tapped — names the day, shows its
 * value, and opens that date on Home (day strip + log + water follow it).
 */
export function ChartDayLink({ dateKey, value }: { dateKey: string; value: string }) {
  const router = useRouter();
  const { selectDay, theme: t } = useStore();
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return (
    <Pressable
      onPress={() => {
        selectDay(dateKey);
        router.push('/home');
      }}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        backgroundColor: t.surface2,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.ink }}>
        {label} · {value}
      </Text>
      <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>Open day →</Text>
    </Pressable>
  );
}

/** Hydration — last-7-days water bars vs the daily goal. */
export function HydrationCard() {
  const { state, theme: t } = useStore();
  const { card } = useCard();
  const [sel, setSel] = useState<number | null>(null);

  const days: { glasses: number; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const glasses = i === 0 ? state.glasses : (state.history[daysAgoKey(i)]?.glasses ?? 0);
    days.push({ glasses, label: d.toLocaleDateString('en-US', { weekday: 'narrow' }) });
  }
  const totalGlasses = days.reduce((a, d) => a + d.glasses, 0);
  const avgGlasses = totalGlasses / 7;
  const daysMet = days.filter((d) => d.glasses >= state.goal.water).length;
  const todayL = (state.glasses * 0.5).toFixed(1);
  const goalL = (state.goal.water * 0.5).toFixed(1);

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Hydration</Text>
        <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.water }}>
          {todayL}
          <Text style={{ color: t.muted2, fontSize: 11 }}>/{goalL} L today</Text>
        </Text>
      </View>
      {totalGlasses > 0 ? (
        <>
          <MiniBarChart
            values={days.map((d) => d.glasses)}
            labels={days.map((d) => d.label)}
            color={t.water}
            avg={avgGlasses}
            selected={sel}
            onBarPress={(i) => setSel(i === sel ? null : i)}
          />
          {sel != null && (
            <ChartDayLink
              dateKey={daysAgoKey(6 - sel)}
              value={`${days[sel].glasses} glasses · ${(days[sel].glasses * 0.5).toFixed(1)} L`}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <AdherenceTile value={`${(avgGlasses * 0.5).toFixed(1)} L`} label="avg per day" color={t.water} />
            <AdherenceTile value={`${daysMet}/7`} label="days goal met" color={t.green} />
          </View>
        </>
      ) : (
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 6 }}>
          Tap + on the Home water card as you drink — your week shows up here.
        </Text>
      )}
    </View>
  );
}

/** Protein trend + calorie/protein goal adherence over the last 7 logged days. */
export function AdherenceCard() {
  const { state, theme: t } = useStore();
  const { card } = useCard();
  const [sel, setSel] = useState<number | null>(null);
  const week = last7(state);
  const logged = week.some((d) => d.logged);
  if (!logged) return null;
  const adh = adherence(state);
  const proteinVals = week.map((d) => d.protein);
  const avgProtein = Math.round(proteinVals.reduce((a, b) => a + b, 0) / Math.max(1, week.filter((d) => d.logged).length));

  return (
    <View style={card}>
      <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink, marginBottom: 4 }}>Protein this week</Text>
      <MiniBarChart
        values={proteinVals}
        labels={week.map((d) => d.label)}
        color={t.protein}
        avg={avgProtein}
        selected={sel}
        onBarPress={(i) => setSel(i === sel ? null : i)}
      />
      {sel != null && (
        <ChartDayLink dateKey={daysAgoKey(6 - sel)} value={`${Math.round(week[sel].protein)}g protein`} />
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <AdherenceTile value={`${adh.proteinDaysHit}/${adh.loggedDays}`} label={`days hit ${state.goal.protein}g protein`} color={t.protein} />
        <AdherenceTile value={`${adh.calorieDaysOnTarget}/${adh.loggedDays}`} label="days on calorie target" color={t.green} />
      </View>
    </View>
  );
}

function AdherenceTile({ value, label, color }: { value: string; label: string; color: string }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface2, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: F.d800, fontSize: 22, color }}>{value}</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

/** Month calendar heatmap of logged days. */
export function HeatmapCard() {
  const { state, theme: t } = useStore();
  const { card } = useCard();
  const { cells, monthLabel, leadBlanks } = monthHeatmap(state);
  const loggedCount = cells.filter((c) => c.logged).length;

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{monthLabel}</Text>
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.green }}>{loggedCount} days logged</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 10, color: t.muted2 }}>{d}</Text>
          </View>
        ))}
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 34 }} />
        ))}
        {cells.map((c) => (
          <View key={c.key} style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.logged ? t.green : c.future ? 'transparent' : t.surface2,
                borderWidth: c.isToday ? 2 : c.future ? 1 : 0,
                borderColor: c.isToday ? t.green : t.border,
              }}
            >
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: c.logged ? '#fff' : c.future ? t.muted2 : t.muted }}>{c.day}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Export data (CSV) + share a progress summary. */
export function ExportCard() {
  const { state, streak, theme: t } = useStore();
  const { card } = useCard();

  const doExport = async () => {
    try {
      await exportCsv(state);
    } catch {
      Alert.alert('Export failed', 'Could not create the export file.');
    }
  };

  return (
    <View style={[card, { flexDirection: 'row', gap: 10 }]}>
      <Pressable onPress={doExport} accessibilityRole="button" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 13 }}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></Svg>
        <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>Export CSV</Text>
      </Pressable>
      <Pressable onPress={() => shareProgress(state, streak, state.unit)} accessibilityRole="button" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.greenTint, borderRadius: 14, paddingVertical: 13 }}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></Svg>
        <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.green }}>Share progress</Text>
      </Pressable>
    </View>
  );
}

/** Milestone badges. */
export function AchievementsCard() {
  const { state, streak, theme: t } = useStore();
  const { card } = useCard();
  const list = achievements(state, streak);
  const earned = list.filter((a) => a.earned);
  if (earned.length === 0) return null;

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Achievements</Text>
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>{earned.length}/{list.length}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((a) => (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 99,
              backgroundColor: a.earned ? t.greenTint : t.surface2,
              opacity: a.earned ? 1 : 0.6,
            }}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill={a.earned ? t.green : 'none'} stroke={a.earned ? t.green : t.muted2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2 15 8.5 22 9.3l-5 4.6L18.5 21 12 17.3 5.5 21 7 13.9l-5-4.6 7-.8Z" />
            </Svg>
            <Text style={{ fontFamily: F.b600, fontSize: 12, color: a.earned ? t.greenGrad2 : t.muted }}>{a.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
