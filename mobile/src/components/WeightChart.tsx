import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

export function WeightChart({ values, goal }: { values: number[]; goal?: number }) {
  const t = useTheme();
  const bars = values.slice(-8);
  while (bars.length < 8) bars.unshift(bars[0] ?? 0);

  const min = Math.min(...bars, ...(goal != null ? [goal] : []));
  const max = Math.max(...bars, ...(goal != null ? [goal] : []));
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
