'use client';

import type { FoodEntry } from '@/lib/types';

function MealIcon({ icon }: { icon?: FoodEntry['icon'] }) {
  if (icon === 'yogurt') {
    return (
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--av-protein-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#E2703C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15h24a12 12 0 0 1-24 0Z" /><path d="M8 15a8 5 0 0 1 16 0" />
          <circle cx="12" cy="10.5" r="1.3" fill="#E2703C" stroke="none" />
          <circle cx="16.5" cy="9" r="1.3" fill="#E2703C" stroke="none" />
          <circle cx="21" cy="11" r="1.3" fill="#E2703C" stroke="none" />
        </svg>
      </div>
    );
  }
  if (icon === 'bowl') {
    return (
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--av-green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="27" height="27" viewBox="0 0 32 32" fill="none" stroke="var(--av-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16h24a12 12 0 0 1-24 0Z" /><path d="M7.5 16a8.5 5.5 0 0 1 17 0" /><path d="M18 5 27 10M20 4 28 8" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--av-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5 17.5 17.5" /><path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M20 16v2a2 2 0 0 1-2 2h-2" /><path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
      </svg>
    </div>
  );
}

function MealTimeIcon({ meal }: { meal: FoodEntry['meal'] }) {
  if (meal === 'Breakfast') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-carbs)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v2" /><path d="M5 7l1.5 1.5" /><path d="M19 7l-1.5 1.5" /><path d="M7 15a5 5 0 0 1 10 0" /><path d="M3 19h18" />
      </svg>
    );
  }
  if (meal === 'Lunch') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-carbs)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  );
}

export function FoodLogCard({ entry, delay = 0 }: { entry: FoodEntry; delay?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'var(--av-surface)',
        border: '1px solid var(--av-border)',
        borderRadius: 20,
        padding: 12,
        animation: 'av-card-in .55s cubic-bezier(.22,.9,.3,1) both',
        animationDelay: `${delay}s`,
      }}
    >
      <MealIcon icon={entry.icon} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MealTimeIcon meal={entry.meal} />
          <span style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted-2)' }}>{entry.meal} · {entry.time}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: '600 11px var(--font-body)', color: 'var(--av-muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--av-protein)' }} />{entry.protein}g
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: '600 11px var(--font-body)', color: 'var(--av-muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--av-carbs)' }} />{entry.carbs}g
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: '600 11px var(--font-body)', color: 'var(--av-muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--av-fat)' }} />{entry.fat}g
          </span>
        </div>
      </div>
      <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <div style={{ background: 'var(--av-green-tint)', borderRadius: 99, padding: '5px 11px', font: '700 12px var(--font-display)', color: 'var(--av-green-grad-2)' }}>{entry.calories} kcal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--av-green)"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></svg>
          <span style={{ font: '700 11px var(--font-display)', color: 'var(--av-green)' }}>{entry.healthScore}<span style={{ color: 'var(--av-muted-2)' }}>/10</span></span>
        </div>
      </div>
    </div>
  );
}
