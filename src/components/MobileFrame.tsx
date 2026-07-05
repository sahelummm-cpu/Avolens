export function MobileFrame({ children, bg = 'var(--av-bg)' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, minHeight: '100dvh', position: 'relative', background: bg }}>{children}</div>
    </div>
  );
}
