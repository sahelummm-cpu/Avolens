'use client';

import { useMemo, useState } from 'react';
import { Logo } from '@/components/Logo';
import { MobileFrame } from '@/components/MobileFrame';
import { BottomNav } from '@/components/BottomNav';
import { SegmentedControl } from '@/components/SegmentedControl';
import { WeightChart } from '@/components/WeightChart';
import { MiniBarChart } from '@/components/MiniBarChart';
import { PromptModal } from '@/components/PromptModal';
import { useStore } from '@/lib/store';
import { DAY_LABELS, EATEN_KCAL_WEEK, EXERCISE_BURNED_WEEK, average } from '@/lib/constants';
import type { ChartRange } from '@/lib/types';

const kgToLb = (kg: number) => kg * 2.20462;

export default function ProgressPage() {
  const { state, setChartRange, logWeight } = useStore();
  const [showLogModal, setShowLogModal] = useState(false);

  const isLb = state.unit === 'lb';
  const conv = (kg: number) => (isLb ? kgToLb(kg) : kg);
  const fmt = (kg: number) => conv(kg).toFixed(1);

  const latest = state.weightLog[state.weightLog.length - 1];
  const prev = state.weightLog[state.weightLog.length - 2];
  const delta = prev ? conv(latest.kg) - conv(prev.kg) : 0;

  const chartValues = state.weightLog.map((w) => conv(w.kg));

  const rangeLabels = useMemo(() => {
    const dates = state.weightLog.map((w) => w.date);
    if (state.chartRange === 'Y') return ['Jan', 'Apr', dates[dates.length - 1] ?? 'Jun'];
    if (dates.length < 3) return [dates[0] ?? '', '', dates[dates.length - 1] ?? ''];
    if (state.chartRange === 'W') return dates.slice(-3);
    const mid = dates[Math.floor(dates.length / 2)];
    return [dates[0], mid, dates[dates.length - 1]];
  }, [state.weightLog, state.chartRange]);

  const heightM = state.heightCm / 100;
  const bmi = latest.kg / (heightM * heightM);
  const bmiCat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiMarker = Math.min(96, Math.max(4, ((bmi - 15) / (40 - 15)) * 100));

  const daysLoggedFrac = 24 / 30;
  const circ = 2 * Math.PI * 29;

  const avgBurned = average(EXERCISE_BURNED_WEEK);
  const avgEaten = average(EATEN_KCAL_WEEK);

  const submitWeight = (raw: string) => {
    const val = parseFloat(raw);
    if (!Number.isFinite(val) || val <= 0) return;
    const kg = isLb ? val / 2.20462 : val;
    logWeight(kg);
    setShowLogModal(false);
  };

  return (
    <MobileFrame>
      <div style={{ padding: '24px 24px 130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 2 }}>
          <Logo size={28} />
          <div style={{ font: '700 24px var(--font-display)', color: 'var(--av-ink)' }}>Progress</div>
        </div>
        <div style={{ font: '500 13px var(--font-body)', color: 'var(--av-muted)', marginBottom: 22 }}>Last 30 days</div>

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 26, padding: 22, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>Current weight</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                <span style={{ font: '800 36px var(--font-display)', color: 'var(--av-ink)', letterSpacing: '-.02em' }}>{fmt(latest.kg)}</span>
                <span style={{ font: '600 14px var(--font-display)', color: 'var(--av-muted-2)' }}>{state.unit}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--av-border)', background: 'var(--av-green-tint)', padding: '6px 11px', borderRadius: 99 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={delta <= 0 ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
                </svg>
                <span style={{ font: '700 12px var(--font-display)', color: 'var(--av-green)' }}>{Math.abs(delta).toFixed(1)} {state.unit}</span>
              </div>
              <div onClick={() => setShowLogModal(true)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--av-green)', borderRadius: 99, padding: '7px 13px', cursor: 'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span style={{ font: '700 12px var(--font-display)', color: '#fff' }}>Log weight</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SegmentedControl
              value={state.chartRange}
              onChange={(v: ChartRange) => setChartRange(v)}
              options={[
                { value: 'W', label: 'Week' },
                { value: 'M', label: 'Month' },
                { value: 'Y', label: 'Year' },
              ]}
            />
          </div>

          <WeightChart values={chartValues} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: '500 11px var(--font-body)', color: 'var(--av-muted-2)' }}>
            <span>{rangeLabels[0]}</span>
            <span>{rangeLabels[1]}</span>
            <span>{rangeLabels[2]}</span>
          </div>
        </div>

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 24, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ textAlign: 'center', flexShrink: 0, width: 72 }}>
            <div style={{ font: '800 30px var(--font-display)', color: 'var(--av-ink)', lineHeight: 1 }}>{bmi.toFixed(1)}</div>
            <div style={{ font: '600 11px var(--font-body)', color: 'var(--av-green)', marginTop: 4 }}>{bmiCat}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 14px var(--font-display)', color: 'var(--av-ink)', marginBottom: 10 }}>BMI score</div>
            <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'linear-gradient(90deg,var(--av-fat),var(--av-green) 40%,var(--av-carbs) 72%,var(--av-protein))' }}>
              <div style={{ position: 'absolute', top: -3, left: `${bmiMarker}%`, width: 14, height: 14, borderRadius: 99, background: 'var(--av-surface)', border: '3px solid var(--av-ink)', transform: 'translateX(-50%)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, font: '500 9px var(--font-body)', color: 'var(--av-muted-2)' }}>
              <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 24, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <span style={{ font: '700 15px var(--font-display)', color: 'var(--av-ink)' }}>Exercise</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <span style={{ font: '800 26px var(--font-display)', color: 'var(--av-green)', letterSpacing: '-.02em' }}>{avgBurned}</span>
                <span style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>avg kcal burned / day</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
              <span style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)' }}>Auto-sync</span>
            </div>
          </div>
          <MiniBarChart values={EXERCISE_BURNED_WEEK} labels={DAY_LABELS} color="var(--av-green)" avg={avgBurned} unit=" kcal" />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <StatBlock value="420" label="kcal today" color="var(--av-green)" />
            <StatBlock value="52" label="active min" />
            <StatBlock value="4" label="workouts" />
          </div>
        </div>

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 24, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <span style={{ font: '700 15px var(--font-display)', color: 'var(--av-ink)' }}>Calories eaten</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <span style={{ font: '800 26px var(--font-display)', color: 'var(--av-protein)', letterSpacing: '-.02em' }}>{avgEaten.toLocaleString('en-US')}</span>
                <span style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>avg kcal eaten / day</span>
              </div>
            </div>
            <span style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)' }}>Last 7 days</span>
          </div>
          <MiniBarChart values={EATEN_KCAL_WEEK} labels={DAY_LABELS} color="var(--av-protein)" avg={avgEaten} unit=" kcal" format={(n) => Math.round(n).toLocaleString('en-US')} />
        </div>

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 24, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="29" fill="none" stroke="var(--av-green-track)" strokeWidth="8" />
              <circle cx="36" cy="36" r="29" fill="none" stroke="var(--av-green)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - daysLoggedFrac)} transform="rotate(-90 36 36)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ font: '800 19px var(--font-display)', color: 'var(--av-ink)' }}>24</div>
            </div>
          </div>
          <div>
            <div style={{ font: '700 15px var(--font-display)', color: 'var(--av-ink)' }}>Days logged</div>
            <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)', marginTop: 2 }}>of 30 days this month</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <div style={{ font: '800 24px var(--font-display)', color: 'var(--av-ink)' }}>{fmt(latest.kg)}</div>
              <div style={{ font: '700 12px var(--font-display)', color: 'var(--av-muted-2)' }}>{state.unit}</div>
            </div>
            <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)', marginTop: 3 }}>Current weight</div>
          </div>
          <div style={{ flex: 1, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--av-green)"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" /></svg>
              <div style={{ font: '800 24px var(--font-display)', color: 'var(--av-ink)' }}>{state.streak}</div>
            </div>
            <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)', marginTop: 3 }}>Day streak</div>
          </div>
          <div style={{ flex: 1, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <div style={{ font: '800 24px var(--font-display)', color: 'var(--av-green)' }}>7.8</div>
              <div style={{ font: '700 13px var(--font-display)', color: 'var(--av-muted-2)' }}>/10</div>
            </div>
            <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)', marginTop: 3 }}>Health score</div>
          </div>
        </div>
      </div>

      {showLogModal && (
        <PromptModal
          title="Log weight"
          placeholder={`Weight in ${state.unit}`}
          onClose={() => setShowLogModal(false)}
          onSubmit={submitWeight}
        />
      )}

      <BottomNav active="progress" />
    </MobileFrame>
  );
}

function StatBlock({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--av-surface-2)', borderRadius: 16, padding: '14px 12px' }}>
      <div style={{ font: '800 20px var(--font-display)', color: color ?? 'var(--av-ink)' }}>{value}</div>
      <div style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
