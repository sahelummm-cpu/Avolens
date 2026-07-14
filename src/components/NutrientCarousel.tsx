'use client';

import { useRef, useState } from 'react';
import { useStore, pct } from '@/lib/store';
import { DOSE_OPTIONS } from '@/lib/constants';

function ProgressRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: '600 12px var(--font-body)', color: 'var(--av-ink)' }}>{label}</span>
        <span style={{ font: '700 12px var(--font-display)', color: 'var(--av-ink)' }}>
          {value}
          <span style={{ font: '600 11px var(--font-display)', color: 'var(--av-muted-2)' }}>/{target}{label === 'Sodium' ? 'mg' : 'g'}</span>
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: 'var(--av-green-track)' }}>
        <div style={{ height: 7, borderRadius: 99, background: color, width: pct(value, target), transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

export function NutrientCarousel({ totals }: { totals: { fiber: number; sodium: number; sugar: number } }) {
  const { state, addGlass, removeGlass, setDose, toggleReminder } = useStore();
  const [page, setPage] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
    setPage(i);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  const waterCur = (state.glasses * 0.5).toFixed(1);
  const waterTarget = (state.goal.water * 0.5).toFixed(1);

  return (
    <div
      style={{
        background: 'var(--av-surface)',
        border: '1px solid var(--av-border)',
        borderRadius: 22,
        padding: '16px 18px',
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
      }}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        className="av-noscroll"
        style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory' }}
      >
        {/* Page 1: GLP-1 Medication */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', background: 'var(--av-purple-tint)', borderRadius: 16, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--av-purple-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--av-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 2 4 4" /><path d="m17 7 3-3" /><path d="M19 9 8.7 19.3c-1 1-2 1-3 0l-.7-.7c-1-1-1-2 0-3L15.3 5.3" /><path d="m9 11 4 4" /><path d="m5 19-3 3" /><path d="m14 4 6 6" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px var(--font-display)', color: 'var(--av-ink)' }}>GLP-1 Medication</div>
              <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted)', marginTop: 1 }}>Semaglutide · Weekly</div>
            </div>
            <div
              onClick={toggleReminder}
              role="button"
              aria-label="Toggle reminder"
              style={{ position: 'relative', width: 34, height: 34, borderRadius: 99, background: state.reminderOn ? 'var(--av-purple-tint-2)' : 'var(--av-surface)', border: '1px solid var(--av-purple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'background .2s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={state.reminderOn ? 'var(--av-purple)' : 'var(--av-muted-2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {state.reminderOn && (
                <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 99, background: 'var(--av-protein)', border: '1.5px solid var(--av-surface)' }} />
              )}
              {!state.reminderOn && (
                <span style={{ position: 'absolute', left: 5, top: 15, width: 24, height: 1.8, background: 'var(--av-muted-2)', transform: 'rotate(-45deg)', transformOrigin: 'left center' }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <span style={{ font: '700 12px var(--font-display)', color: 'var(--av-purple)', background: 'var(--av-purple-tint-2)', padding: '4px 10px', borderRadius: 99 }}>Wed 9:00</span>
              <span style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted-2)' }}>in 3 days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, font: '600 12px var(--font-body)', color: 'var(--av-ink)' }}>
              Current dose <span style={{ color: 'var(--av-muted)' }}>· {DOSE_OPTIONS[state.dose]} mg</span>
            </span>
            <div onClick={() => setDose(Math.max(0, state.dose - 1))} role="button" aria-label="Decrease dose" style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--av-surface)', border: '1px solid var(--av-purple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-purple)" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </div>
            <div onClick={() => setDose(Math.min(DOSE_OPTIONS.length - 1, state.dose + 1))} role="button" aria-label="Increase dose" style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--av-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
          </div>
        </div>

        {/* Page 2: Water */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', background: 'var(--av-fat-tint-2)', borderRadius: 16, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="19" viewBox="0 0 20 26" fill="var(--av-fat)"><path d="M10 1 C10 1 18 12 18 17.5 A8 8 0 0 1 2 17.5 C2 12 10 1 10 1 Z" /></svg>
              <span style={{ font: '600 13px var(--font-body)', color: 'var(--av-ink)' }}>Water</span>
            </div>
            <span style={{ font: '700 13px var(--font-display)', color: 'var(--av-fat)' }}>
              {waterCur}<span style={{ color: 'var(--av-muted-2)', fontSize: 11 }}>/{waterTarget}L</span>
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--av-fat-tint-3)' }}>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--av-fat)', width: pct(state.glasses, state.goal.water), transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={removeGlass} role="button" aria-label="Remove glass" style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--av-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-fat)" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </div>
            <div style={{ flex: 1, textAlign: 'center', font: '600 12px var(--font-body)', color: 'var(--av-ink)' }}>
              {state.glasses} glasses <span style={{ color: 'var(--av-muted)' }}>· 500 ml</span>
            </div>
            <div onClick={addGlass} role="button" aria-label="Add glass" style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--av-fat)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
          </div>
        </div>

        {/* Page 3: Fiber / Sodium / Sugar */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', background: 'var(--av-surface-2)', borderRadius: 16, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <ProgressRow label="Fiber" value={totals.fiber} target={state.goal.fiber} color="var(--av-green)" />
          <ProgressRow label="Sodium" value={totals.sodium} target={state.goal.sodium} color="var(--av-carbs)" />
          <ProgressRow label="Sugar" value={totals.sugar} target={state.goal.sugar} color="var(--av-protein)" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: page === i ? 16 : 6,
              height: 6,
              borderRadius: 99,
              background: page === i ? 'var(--av-purple)' : 'var(--av-border)',
              cursor: 'pointer',
              transition: 'width .2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
