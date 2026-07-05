'use client';

export function WeightChart({ values }: { values: number[] }) {
  const bars = values.slice(-8);
  while (bars.length < 8) bars.unshift(bars[0] ?? 0);

  const min = Math.min(...bars);
  const max = Math.max(...bars);
  const span = Math.max(0.1, max - min);
  const top = 14;
  const bottom = 104;
  const barW = 26;
  const step = 37;

  const heights = bars.map((v) => {
    const frac = (v - min) / span; // 0 = lowest, 1 = highest
    return (bottom - top) * (0.35 + 0.65 * frac);
  });

  const last = bars[bars.length - 1];

  return (
    <svg width="100%" height="110" viewBox="0 0 300 110">
      {bars.map((v, i) => {
        const h = heights[i];
        const x = 4 + i * step;
        const y = bottom - h;
        const isLast = i === bars.length - 1;
        return <rect key={i} x={x} y={y} width={barW} height={h} rx={11} fill={isLast ? 'var(--av-green)' : 'var(--av-chart-track)'} />;
      })}
      <rect x={4 + 7 * step - 11} y={18} width={48} height={20} rx={10} fill="var(--av-nav-bg)" />
      <text x={4 + 7 * step + 13} y={32} fontSize="11" fontWeight={700} fontFamily="var(--font-display)" fill="#fff" textAnchor="middle">
        {last.toFixed(1)}
      </text>
    </svg>
  );
}
