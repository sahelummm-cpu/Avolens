'use client';

/**
 * Single-series magnitude bar chart for the Progress trends.
 * Follows the dataviz mark spec: thin marks, 4px rounded tops anchored to the
 * baseline, a 2px surface gap between bars, a recessive dashed average line,
 * per-bar hover tooltip, and no legend (one series — the card title names it).
 */
export function MiniBarChart({
  values,
  labels,
  color,
  avg,
  unit = '',
  format = (n: number) => String(Math.round(n)),
}: {
  values: number[];
  labels: string[];
  color: string;
  avg: number;
  unit?: string;
  format?: (n: number) => string;
}) {
  const W = 300;
  const H = 132;
  const padTop = 12;
  const baseline = 104; // y of the bar baseline; leaves room for x labels below
  const n = values.length;
  const slot = W / n;
  const barW = Math.min(26, slot - 8);
  const max = Math.max(...values, 1);

  const y = (v: number) => baseline - (baseline - padTop) * (v / max);
  const avgY = y(avg);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart, average ${format(avg)}${unit}`}>
      {/* recessive baseline */}
      <line x1={0} y1={baseline} x2={W} y2={baseline} stroke="var(--av-border)" strokeWidth={1} />

      {values.map((v, i) => {
        const cx = i * slot + slot / 2;
        const barH = Math.max(4, baseline - y(v));
        const x = cx - barW / 2;
        const isLast = i === n - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={baseline - barH}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={isLast ? 1 : 0.42}
            >
              <title>{`${labels[i]}: ${format(v)}${unit}`}</title>
            </rect>
          </g>
        );
      })}

      {/* average reference line — recessive, dashed, labeled */}
      <line x1={0} y1={avgY} x2={W} y2={avgY} stroke="var(--av-muted-2)" strokeWidth={1.5} strokeDasharray="4 4" />
      <rect x={W - 54} y={avgY - 18} width={50} height={15} rx={7} fill="var(--av-nav-bg)" />
      <text x={W - 29} y={avgY - 7} fontSize="9" fontWeight={700} fontFamily="var(--font-display)" fill="#fff" textAnchor="middle">
        avg
      </text>

      {labels.map((lab, i) => (
        <text
          key={i}
          x={i * slot + slot / 2}
          y={H - 4}
          fontSize="10"
          fontFamily="var(--font-body)"
          fill="var(--av-muted-2)"
          textAnchor="middle"
        >
          {lab}
        </text>
      ))}
    </svg>
  );
}
