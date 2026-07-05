'use client';

import { useStore, useDailyTotals } from '@/lib/store';
import { buildWeek } from '@/lib/dayStrip';

const CIRC = 2 * Math.PI * 12.5;

export function DayStrip() {
  const { state, selectDay } = useStore();
  const totals = useDailyTotals();
  const days = buildWeek(state, totals.calories);

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
      {days.map((d) => {
        const sel = d.selected;
        return (
          <div
            key={d.index}
            onClick={() => selectDay(d.index)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: '8px 0',
              borderRadius: 14,
              background: sel ? 'var(--av-nav-bg)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                font: '600 11px var(--font-body)',
                color: sel ? 'rgba(255,255,255,.6)' : 'var(--av-muted-2)',
              }}
            >
              {d.label}
            </span>
            <div style={{ position: 'relative', width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={29} height={29} viewBox="0 0 29 29" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle
                  cx={14.5}
                  cy={14.5}
                  r={12.5}
                  fill="none"
                  stroke={sel ? 'rgba(255,255,255,.18)' : d.ringColor === 'transparent' ? 'transparent' : 'var(--av-green-track)'}
                  strokeWidth={2.4}
                />
                <circle
                  cx={14.5}
                  cy={14.5}
                  r={12.5}
                  fill="none"
                  stroke={d.ringColor === 'transparent' ? 'transparent' : sel ? '#fff' : d.ringColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - d.fraction)}
                />
              </svg>
              <span style={{ font: '600 13px var(--font-display)', color: sel ? '#fff' : 'var(--av-muted)', zIndex: 1 }}>
                {d.date}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
