'use client';

import { useRouter } from 'next/navigation';

const iconStroke = 'var(--av-nav-icon)';

function NavIcon({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <div
      onClick={onClick}
      aria-label={label}
      role="button"
      style={{ width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      {children}
    </div>
  );
}

export function BottomNav({ active }: { active: 'home' | 'progress' | 'settings' }) {
  const router = useRouter();

  const pill = (label: string, icon: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--av-green)', borderRadius: 999, padding: '11px 18px' }}>
      {icon}
      <span style={{ font: '700 13px var(--font-display)', color: '#fff' }}>{label}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 18,
        width: 'calc(100% - 40px)',
        maxWidth: 390,
        background: 'var(--av-nav-bg)',
        borderRadius: 999,
        boxShadow: '0 12px 30px -10px rgba(22,40,31,.4)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        zIndex: 100,
      }}
    >
      {active === 'home' ? (
        pill(
          'Home',
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 4l9 6.5" />
            <path d="M5 9.5V20h14V9.5" />
          </svg>,
        )
      ) : (
        <NavIcon label="Home" onClick={() => router.push('/home')}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 4l9 6.5" />
            <path d="M5 9.5V20h14V9.5" />
          </svg>
        </NavIcon>
      )}

      {active === 'progress' ? (
        pill(
          'Trends',
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 14 3-4 3 2 4-6" />
          </svg>,
        )
      ) : (
        <NavIcon label="Trends" onClick={() => router.push('/progress')}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 14 3-4 3 2 4-6" />
          </svg>
        </NavIcon>
      )}

      <div
        onClick={() => router.push('/scanner')}
        role="button"
        aria-label="Scan food"
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--av-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '-18px 0',
          boxShadow: '0 8px 18px -6px rgba(47,158,110,.6),0 0 0 5px var(--av-bg)',
          cursor: 'pointer',
        }}
      >
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </div>

      <NavIcon label="Coach (coming soon)" onClick={() => {}}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c.35 3.7 2.3 5.65 6 6-3.7.35-5.65 2.3-6 6-.35-3.7-2.3-5.65-6-6 3.7-.35 5.65-2.3 6-6Z" />
          <path d="M18.5 14.5c.16 1.5 1 2.34 2.5 2.5-1.5.16-2.34 1-2.5 2.5-.16-1.5-1-2.34-2.5-2.5 1.5-.16 2.34-1 2.5-2.5Z" />
        </svg>
      </NavIcon>

      <NavIcon label="Settings" onClick={() => router.push('/settings')}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      </NavIcon>
    </div>
  );
}
