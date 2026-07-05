'use client';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        background: 'var(--av-surface-3)',
        borderRadius: 12,
        padding: 3,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '7px 0',
              borderRadius: 9,
              background: active ? 'var(--av-surface)' : 'transparent',
              color: active ? 'var(--av-ink)' : 'var(--av-muted)',
              font: '700 12px var(--font-display)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}
