import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

export function WeightChart({
  values,
  goal,
  markers,
  trend,
}: {
  values: number[];
  goal?: number;
  /** Per-value flags (aligned with `values`) — true draws an injection dot. */
  markers?: boolean[];
  /** Smoothed trend weight (aligned with `values`) — drawn as a line. */
  trend?: number[];
}) {
  const t = useTheme();
  const bars = values.slice(-8);
  const marks = (markers ?? []).slice(-8);
  const trendVals = (trend ?? []).slice(-8);
  while (marks.length < bars.length) marks.unshift(false);
  while (trendVals.length < bars.length) trendVals.unshift(trendVals[0] ?? bars[0] ?? 0);
  while (bars.length < 8) {
    bars.unshift(bars[0] ?? 0);
    marks.unshift(false);
    trendVals.unshift(trendVals[0] ?? 0);
  }

  const showTrend = (trend?.length ?? 0) >= 2;
  const min = Math.min(...bars, ...(goal != null ? [goal] : []), ...(showTrend ? trendVals : []));
  const max = Math.max(...bars, ...(goal != null ? [goal] : []), ...(showTrend ? trendVals : []));
  const span = Math.max(0.1, max - min);
  const top = 14;
  const bottom = 104;
  const barW = 26;
  const step = 37;

  const yFor = (v: number) => bottom - (bottom - top) * (0.35 + 0.65 * ((v - min) / span));

  const heights = bars.map((v) => {
    const frac = (v - min) / span; // 0 = lowest, 1 = highest
    return (bottom - top) * (0.35 + 0.65 * frac);
  });

  const last = bars[bars.length - 1];

  return (
    <Svg width="100%" height={110} viewBox="0 0 300 110">
      {bars.map((v, i) => {
        const h = heights[i];
        const x = 4 + i * step;
        const y = bottom - h;
        const isLast = i === bars.length - 1;
        return <Rect key={i} x={x} y={y} width={barW} height={h} rx={11} fill={isLast ? t.green : t.chartTrack} />;
      })}
      {/* smoothed trend line */}
      {showTrend && (
        <Path
          d={trendVals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${4 + i * step + barW / 2} ${yFor(v)}`).join(' ')}
          fill="none"
          stroke={t.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
      )}
      {/* injection-day markers */}
      {marks.map((hit, i) =>
        hit ? (
          <Circle key={`m${i}`} cx={4 + i * step + barW / 2} cy={bottom - heights[i] - 7} r={3.4} fill={t.purple} />
        ) : null,
      )}
      {goal != null && (
        <>
          <Line x1={0} y1={yFor(goal)} x2={300} y2={yFor(goal)} stroke={t.muted2} strokeWidth={1.5} strokeDasharray="5 5" />
          <Rect x={0} y={yFor(goal) - 9} width={40} height={16} rx={8} fill={t.navBg} />
          <SvgText x={20} y={yFor(goal) + 3} fontSize={9} fontFamily={F.d700} fill="#fff" textAnchor="middle">
            goal
          </SvgText>
        </>
      )}
      <Rect x={4 + 7 * step - 11} y={18} width={48} height={20} rx={10} fill={t.navBg} />
      <SvgText x={4 + 7 * step + 13} y={32} fontSize={11} fontFamily={F.d700} fill="#fff" textAnchor="middle">
        {last.toFixed(1)}
      </SvgText>
    </Svg>
  );
}
