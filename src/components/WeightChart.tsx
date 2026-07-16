import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

const W = 300;
const H = 124;
const PAD_L = 8;
const PAD_R = 10;
const TOP = 16;
const BOTTOM = 112;
const MAX_POINTS = 30;

/** Smooth-step cubic path through the points (control points at segment midpoints). */
function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const mx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${mx} ${ys[i - 1]}, ${mx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return d;
}

/**
 * Weight trend chart — smooth gradient area line with per-weigh-in dots,
 * a dashed goal line, the smoothed trend overlay, and purple injection-day
 * markers. Replaces the old bar version.
 */
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

  let pts = values.slice(-MAX_POINTS);
  let marks = (markers ?? []).slice(-MAX_POINTS);
  let trendPts = (trend ?? []).slice(-MAX_POINTS);
  if (pts.length === 1) {
    // A single weigh-in still draws as a flat line.
    pts = [pts[0], pts[0]];
    marks = [false, marks[0] ?? false];
    trendPts = trendPts.length ? [trendPts[0], trendPts[0]] : [];
  }
  while (marks.length < pts.length) marks.unshift(false);

  const n = pts.length;
  const showTrend = trendPts.length >= 2;
  const min = Math.min(...pts, ...(goal != null ? [goal] : []), ...(showTrend ? trendPts : []));
  const max = Math.max(...pts, ...(goal != null ? [goal] : []), ...(showTrend ? trendPts : []));
  const span = Math.max(0.1, max - min);

  const x = (i: number) => PAD_L + ((W - PAD_L - PAD_R) * i) / Math.max(1, n - 1);
  const y = (v: number) => BOTTOM - (BOTTOM - TOP) * (0.12 + 0.76 * ((v - min) / span));

  const xs = pts.map((_, i) => x(i));
  const ys = pts.map((v) => y(v));
  const line = smoothPath(xs, ys);
  const area = `${line} L ${xs[n - 1]} ${BOTTOM} L ${xs[0]} ${BOTTOM} Z`;

  const last = pts[n - 1];
  const lastX = xs[n - 1];
  const lastY = ys[n - 1];
  // Keep the floating value chip inside the canvas.
  const chipW = 46;
  const chipX = Math.min(W - chipW - 2, Math.max(2, lastX - chipW / 2));
  const chipY = lastY - 30 < 2 ? lastY + 12 : lastY - 30;
  const dotEvery = n > 14 ? Math.ceil(n / 10) : 1; // thin out dots on dense charts

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="wcArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.green} stopOpacity={0.28} />
          <Stop offset="1" stopColor={t.green} stopOpacity={0.02} />
        </LinearGradient>
        <LinearGradient id="wcLine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.greenGrad1} />
          <Stop offset="1" stopColor={t.greenGrad2} />
        </LinearGradient>
      </Defs>

      {/* faint horizontal grid */}
      {[0.25, 0.5, 0.75].map((f) => {
        const gy = TOP + (BOTTOM - TOP) * f;
        return <Line key={f} x1={PAD_L} y1={gy} x2={W - PAD_R} y2={gy} stroke={t.border} strokeWidth={1} opacity={0.6} />;
      })}

      {/* gradient area + smooth line */}
      <Path d={area} fill="url(#wcArea)" />
      <Path d={line} fill="none" stroke="url(#wcLine)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

      {/* smoothed trend overlay */}
      {showTrend && (
        <Path
          d={smoothPath(trendPts.map((_, i) => x(i)), trendPts.map((v) => y(v)))}
          fill="none"
          stroke={t.ink}
          strokeWidth={1.6}
          strokeDasharray="1 5"
          strokeLinecap="round"
          opacity={0.5}
        />
      )}

      {/* weigh-in dots (thinned on dense charts) + injection markers */}
      {pts.map((v, i) => {
        const isLast = i === n - 1;
        if (!isLast && i % dotEvery !== 0 && !marks[i]) return null;
        return (
          <Circle
            key={i}
            cx={xs[i]}
            cy={ys[i]}
            r={isLast ? 5 : 3}
            fill={marks[i] ? t.purple : isLast ? t.green : t.surface}
            stroke={marks[i] ? t.surface : isLast ? t.surface : t.green}
            strokeWidth={isLast ? 2.5 : 1.8}
          />
        );
      })}

      {/* goal line */}
      {goal != null && (
        <>
          <Line x1={PAD_L} y1={y(goal)} x2={W - PAD_R} y2={y(goal)} stroke={t.muted2} strokeWidth={1.5} strokeDasharray="5 5" />
          <Rect x={PAD_L} y={y(goal) - 9} width={40} height={16} rx={8} fill={t.navBg} />
          <SvgText x={PAD_L + 20} y={y(goal) + 3} fontSize={9} fontFamily={F.d700} fill="#fff" textAnchor="middle">
            goal
          </SvgText>
        </>
      )}

      {/* current-value chip near the last point */}
      <Rect x={chipX} y={chipY} width={chipW} height={20} rx={10} fill={t.navBg} />
      <SvgText x={chipX + chipW / 2} y={chipY + 14} fontSize={11} fontFamily={F.d700} fill="#fff" textAnchor="middle">
        {last.toFixed(1)}
      </SvgText>
    </Svg>
  );
}
