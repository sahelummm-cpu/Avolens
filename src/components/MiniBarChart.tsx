import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

/**
 * Single-series magnitude bar chart for the Progress trends — same mark spec
 * as the web version: thin marks with rounded tops, muted non-final bars, and
 * a recessive dashed average line with an "avg" chip.
 */
export function MiniBarChart({
  values,
  labels,
  color,
  avg,
}: {
  values: number[];
  labels: string[];
  color: string;
  avg: number;
}) {
  const t = useTheme();
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
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* recessive baseline */}
      <Line x1={0} y1={baseline} x2={W} y2={baseline} stroke={t.border} strokeWidth={1} />

      {values.map((v, i) => {
        const cx = i * slot + slot / 2;
        const barH = Math.max(4, baseline - y(v));
        const x = cx - barW / 2;
        const isLast = i === n - 1;
        return (
          <Rect
            key={i}
            x={x}
            y={baseline - barH}
            width={barW}
            height={barH}
            rx={4}
            fill={color}
            opacity={isLast ? 1 : 0.42}
          />
        );
      })}

      {/* average reference line — recessive, dashed, labeled */}
      <Line x1={0} y1={avgY} x2={W} y2={avgY} stroke={t.muted2} strokeWidth={1.5} strokeDasharray="4 4" />
      <Rect x={W - 54} y={avgY - 18} width={50} height={15} rx={7} fill={t.navBg} />
      <SvgText x={W - 29} y={avgY - 7} fontSize={9} fontFamily={F.d700} fill="#fff" textAnchor="middle">
        avg
      </SvgText>

      {labels.map((lab, i) => (
        <SvgText
          key={i}
          x={i * slot + slot / 2}
          y={H - 4}
          fontSize={10}
          fontFamily={F.b400}
          fill={t.muted2}
          textAnchor="middle"
        >
          {lab}
        </SvgText>
      ))}
    </Svg>
  );
}
