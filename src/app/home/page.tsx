'use client';

import { Logo } from '@/components/Logo';
import { MobileFrame } from '@/components/MobileFrame';
import { DayStrip } from '@/components/DayStrip';
import { CalorieRing } from '@/components/CalorieRing';
import { NutrientCarousel } from '@/components/NutrientCarousel';
import { FoodLogCard } from '@/components/FoodLogCard';
import { BottomNav } from '@/components/BottomNav';
import { useDailyTotals, useStore } from '@/lib/store';
import { selectedDayTotals } from '@/lib/dayStrip';

const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export default function HomePage() {
  const { state } = useStore();
  const liveTotals = useDailyTotals();
  const totals = selectedDayTotals(state, liveTotals);

  const fractions = {
    calories: state.goal.calories > 0 ? Math.min(1, (state.goal.calories - totals.left) / state.goal.calories) : 0,
    protein: Math.min(1, totals.protein / state.goal.protein),
    carbs: Math.min(1, totals.carbs / state.goal.carbs),
    fat: Math.min(1, totals.fat / state.goal.fat),
  };

  return (
    <MobileFrame>
      <div style={{ padding: '24px 24px 130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Logo size={30} />
            <div>
              <div style={{ font: '500 13px var(--font-body)', color: 'var(--av-muted)' }}>{todayLabel}</div>
              <div style={{ font: '700 22px var(--font-display)', color: 'var(--av-ink)' }}>Today</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '5px 13px 5px 5px', background: 'var(--av-nav-bg)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: 'linear-gradient(150deg,var(--av-amber-grad-1),var(--av-amber-grad-2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" /></svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ font: '700 14px var(--font-display)', color: '#fff' }}>{state.streak}</span>
              <span style={{ font: '600 8px var(--font-body)', color: 'var(--av-nav-icon)', letterSpacing: '.06em', textTransform: 'uppercase' }}>day streak</span>
            </div>
          </div>
        </div>

        <DayStrip />

        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 28, padding: '24px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 156, height: 156, flexShrink: 0 }}>
              <CalorieRing size={156} fractions={fractions} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ font: '800 34px var(--font-display)', color: 'var(--av-ink)', lineHeight: 1, letterSpacing: '-.02em' }}>{totals.left.toLocaleString('en-US')}</div>
                <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)', marginTop: 3 }}>kcal left</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <MacroRow color="var(--av-protein)" label="Protein" cur={totals.protein} target={state.goal.protein} />
                <MacroRow color="var(--av-carbs)" label="Carbs" cur={totals.carbs} target={state.goal.carbs} />
                <MacroRow color="var(--av-fat)" label="Fat" cur={totals.fat} target={state.goal.fat} />
              </div>
            </div>
          </div>
        </div>

        <NutrientCarousel totals={totals} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--av-fat-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--av-fat)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5 17.5 17.5" /><path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M20 16v2a2 2 0 0 1-2 2h-2" /><path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
            </svg>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Exercise</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
              <span style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)' }}>Auto-synced · Apple Health</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: '700 15px var(--font-display)', color: 'var(--av-green)' }}>420<span style={{ font: '600 11px var(--font-display)', color: 'var(--av-muted-2)' }}> kcal</span></div>
            <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted-2)', marginTop: 1 }}>8,240 steps</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ font: '700 17px var(--font-display)', color: 'var(--av-ink)' }}>Today&apos;s Log</span>
          <span style={{ font: '600 13px var(--font-body)', color: 'var(--av-green)' }}>See all</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.todayEntries.length === 0 ? (
            <div style={{ textAlign: 'center', font: '500 13px var(--font-body)', color: 'var(--av-muted)', padding: '24px 0' }}>
              Nothing logged yet — scan or add a meal.
            </div>
          ) : (
            state.todayEntries.map((entry, i) => <FoodLogCard key={entry.id} entry={entry} delay={0.45 + i * 0.13} />)
          )}
        </div>
      </div>

      <BottomNav active="home" />
    </MobileFrame>
  );
}

function MacroRow({ color, label, cur, target }: { color: string; label: string; cur: number; target: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 9, height: 9, borderRadius: 99, background: color, flexShrink: 0 }} />
      <span style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)', flex: 1 }}>{label}</span>
      <span style={{ font: '700 13px var(--font-display)', color: 'var(--av-ink)' }}>
        {cur}
        <span style={{ font: '600 11px var(--font-display)', color: 'var(--av-muted-2)' }}>/{target}g</span>
      </span>
    </div>
  );
}
