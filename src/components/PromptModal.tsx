'use client';

import { useState } from 'react';

export function PromptModal({
  title,
  placeholder,
  initial = '',
  onClose,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  initial?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'var(--av-scrim)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--av-surface)', borderRadius: '28px 28px 0 0', padding: '24px 22px 32px' }}>
        <div style={{ font: '700 17px var(--font-display)', color: 'var(--av-ink)', marginBottom: 16 }}>{title}</div>
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          style={{ width: '100%', background: 'var(--av-surface-2)', border: '1px solid var(--av-border)', borderRadius: 14, padding: '13px 15px', font: '600 16px var(--font-body)', color: 'var(--av-ink)', marginBottom: 16, outline: 'none' }}
        />
        <button
          onClick={submit}
          style={{ width: '100%', height: 50, borderRadius: 16, background: 'var(--av-green)', color: '#fff', border: 'none', font: '700 15px var(--font-display)', cursor: 'pointer' }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
