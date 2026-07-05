'use client';

export function ToggleSwitch({
  on,
  onChange,
  activeColor = 'var(--av-green)',
}: {
  on: boolean;
  onChange: () => void;
  activeColor?: string;
}) {
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange()}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: on ? activeColor : 'var(--av-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        padding: 3,
        cursor: 'pointer',
        transition: 'background .2s',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: 999, background: '#fff' }} />
    </div>
  );
}
