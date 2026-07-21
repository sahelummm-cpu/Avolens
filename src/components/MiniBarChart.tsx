import { Fragment, useId } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

const W = 300;
const H = 138;
const PAD_L = 16;
const PAD_R = 16;
const TOP = 26;
const BOTTOM = 106;

/** Smooth cubic spline path through data points (matching WeightChart) */
function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  if (xs.length === 1) return `M ${xs[0]} ${ys[0]}`;
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const mx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${mx} ${ys[i - 1]}, ${mx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return d;
}

/**
 * Progress Spline Line-Area Chart — matches the WeightChart visual style.
 * Renders smooth spline curve, translucent area gradient, tappable data points,
 * and floating value badge chip.
 */
export function MiniBarChart({
  values,
  labels,
  color,
  avg,
  selected,
  onBarPress,
}: {
  values: number[];
  labels: string[];
  color: string;
  avg: number;
  /** Index of the selected data point. */
  selected?: number | null;
  onBarPress?: (index: number) => void;
}) {
  const t = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const areaId = `mbcArea${uid}`;
  const lineId = `mbcLine${uid}`;

  const n = values.length || 1;
  const max = Math.max(...values, avg || 1, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);

  const x = (i: number) => (n === 1 ? W / 2 : PAD_L + ((W - PAD_L - PAD_R) * i) / (n - 1));
  const y = (v: number) => BOTTOM - (BOTTOM - TOP) * ((v - min) / span);

  const xs = values.map((_, i) => x(i));
  const ys = values.map((v) => y(v));
  const line = smoothPath(xs, ys);
  const area = n > 1 ? `${line} L ${xs[n - 1]} ${BOTTOM} L ${xs[0]} ${BOTTOM} Z` : '';

  const highlightIdx = selected != null && selected >= 0 && selected < n ? selected : n - 1;
  const highlightVal = values[highlightIdx] ?? 0;
  const hX = xs[highlightIdx] ?? x(n - 1);
  const hY = ys[highlightIdx] ?? y(0);

  const chipW = 52;
  const chipX = Math.min(W - chipW - 2, Math.max(2, hX - chipW / 2));
  const chipY = hY - 26 < 2 ? hY + 10 : hY - 26;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.32} />
          <Stop offset="1" stopColor={color} stopOpacity={0.03} />
        </LinearGradient>
        <LinearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>

      {/* Recessive grid lines */}
      {[0.3, 0.65].map((f) => {
        const gy = TOP + (BOTTOM - TOP) * f;
        return <Line key={f} x1={PAD_L} y1={gy} x2={W - PAD_R} y2={gy} stroke={t.border} strokeWidth={1} opacity={0.5} />;
      })}

      {/* Average dashed line */}
      {avg > 0 && (
        <Line
          x1={PAD_L}
          y1={y(avg)}
          x2={W - PAD_R}
          y2={y(avg)}
          stroke={color}
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.45}
        />
      )}

      {/* Translucent area fill */}
      {area ? <Path d={area} fill={`url(#${areaId})`} /> : null}

      {/* Main Spline Line */}
      <Path d={line} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data point dots */}
      {values.map((v, i) => {
        const cx = xs[i];
        const cy = ys[i];
        const isSelected = i === highlightIdx;
        return (
          <Fragment key={i}>
            <Circle
              cx={cx}
              cy={cy}
              r={isSelected ? 5 : 3.5}
              fill={isSelected ? color : t.surface}
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.8}
              onPress={() => onBarPress?.(i)}
            />
          </Fragment>
        );
      })}

      {/* Floating value chip badge */}
      {highlightVal > 0 && (
        <Fragment>
          <Rect
            x={chipX}
            y={chipY}
            width={chipW}
            height={19}
            rx={9.5}
            fill={color}
          />
          <SvgText
            x={chipX + chipW / 2}
            y={chipY + 13}
            fontFamily={F.d700}
            fontSize={11}
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {highlightVal >= 1000 ? `${(highlightVal / 1000).toFixed(1)}k` : Math.round(highlightVal)}
          </SvgText>
        </Fragment>
      )}

      {/* Day Labels along bottom */}
      {labels.map((lbl, i) => (
        <SvgText
          key={i}
          x={xs[i]}
          y={H - 4}
          fontFamily={F.b600}
          fontSize={10}
          fill={i === highlightIdx ? t.ink : t.muted2}
          textAnchor="middle"
          onPress={() => onBarPress?.(i)}
        >
          {lbl}
        </SvgText>
      ))}
    </Svg>
  );
}
