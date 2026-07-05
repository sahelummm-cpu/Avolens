'use client';

import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { MobileFrame } from '@/components/MobileFrame';
import { BottomNav } from '@/components/BottomNav';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { PromptModal } from '@/components/PromptModal';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const { state, setUnit, setThemeMode, toggleDarkManual, resolvedDark, setGoalCalories, setHeightCm } = useStore();
  const [editGoal, setEditGoal] = useState(false);
  const [editHeight, setEditHeight] = useState(false);

  const isLb = state.unit === 'lb';

  return (
    <MobileFrame>
      <div style={{ padding: '20px 22px 130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <Logo size={28} />
          <div style={{ font: '700 24px var(--font-display)', color: 'var(--av-ink)' }}>Settings</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, padding: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, background: 'linear-gradient(150deg,var(--av-green-grad-1),var(--av-green-grad-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 20px var(--font-display)', color: '#fff', flexShrink: 0 }}>
            A
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 16px var(--font-display)', color: 'var(--av-ink)' }}>Alex Rivera</div>
            <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)', marginTop: 2 }}>alex@avolens.app</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--av-nav-bg)', borderRadius: 99, padding: '5px 11px' }}>
            <Logo size={13} />
            <span style={{ font: '700 10px var(--font-display)', color: '#fff' }}>PRO</span>
          </div>
        </div>

        <SectionLabel>Preferences</SectionLabel>
        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, overflow: 'hidden', marginBottom: 20 }}>
          <Row>
            <span style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Units</span>
            <div style={{ display: 'flex', gap: 3, background: 'var(--av-surface-3)', borderRadius: 11, padding: 3 }}>
              <div
                onClick={() => setUnit('kg')}
                style={{ padding: '6px 16px', borderRadius: 8, background: !isLb ? 'var(--av-nav-bg)' : 'transparent', color: !isLb ? '#fff' : 'var(--av-muted)', font: '700 12px var(--font-display)', cursor: 'pointer' }}
              >
                kg
              </div>
              <div
                onClick={() => setUnit('lb')}
                style={{ padding: '6px 16px', borderRadius: 8, background: isLb ? 'var(--av-nav-bg)' : 'transparent', color: isLb ? '#fff' : 'var(--av-muted)', font: '700 12px var(--font-display)', cursor: 'pointer' }}
              >
                lb
              </div>
            </div>
          </Row>
          <Row border>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                Dark theme
                {state.themeMode === 'auto' && <span style={{ font: '500 11px var(--font-body)', color: 'var(--av-green)' }}>Following system</span>}
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {state.themeMode !== 'auto' && (
                <span onClick={() => setThemeMode('auto')} style={{ font: '700 11px var(--font-display)', color: 'var(--av-green)', background: 'var(--av-green-tint)', padding: '5px 11px', borderRadius: 99, cursor: 'pointer' }}>
                  Auto
                </span>
              )}
              <ToggleSwitch on={resolvedDark} onChange={toggleDarkManual} />
            </div>
          </Row>
          <Row border onClick={() => setEditGoal(true)}>
            <span style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Daily goal</span>
            <ChevronValue>{state.goal.calories.toLocaleString('en-US')} kcal</ChevronValue>
          </Row>
          <Row border onClick={() => setEditHeight(true)}>
            <span style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Height</span>
            <ChevronValue>{state.heightCm} cm</ChevronValue>
          </Row>
        </div>

        <SectionLabel>Connected apps</SectionLabel>
        <div style={{ background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--av-protein-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--av-protein)"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></svg>
            </div>
            <span style={{ flex: 1, font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Apple Health</span>
            <ToggleSwitch on onChange={() => {}} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderTop: '1px solid var(--av-border-2)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--av-fat-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--av-fat)"><circle cx="12" cy="12" r="8" /></svg>
            </div>
            <span style={{ flex: 1, font: '600 14px var(--font-body)', color: 'var(--av-ink)' }}>Google Fit</span>
            <ToggleSwitch on={false} onChange={() => {}} />
          </div>
        </div>
      </div>

      {editGoal && (
        <PromptModal
          title="Daily calorie goal"
          placeholder="e.g. 2050"
          initial={String(state.goal.calories)}
          onClose={() => setEditGoal(false)}
          onSubmit={(v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) setGoalCalories(n);
            setEditGoal(false);
          }}
        />
      )}
      {editHeight && (
        <PromptModal
          title="Height (cm)"
          placeholder="e.g. 174"
          initial={String(state.heightCm)}
          onClose={() => setEditHeight(false)}
          onSubmit={(v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) setHeightCm(n);
            setEditHeight(false);
          }}
        />
      )}

      <BottomNav active="settings" />
    </MobileFrame>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ font: '700 11px var(--font-body)', color: 'var(--av-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}

function Row({ children, border, onClick }: { children: React.ReactNode; border?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px',
        borderTop: border ? '1px solid var(--av-border-2)' : undefined, cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function ChevronValue({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 13px var(--font-body)', color: 'var(--av-muted)' }}>
      {children}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
    </span>
  );
}
