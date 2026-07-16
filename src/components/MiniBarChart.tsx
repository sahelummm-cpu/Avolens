import { Fragment, useId } from 'react';
import Svg, { Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

/**
 * Single-series bar chart for the Progress trends — gradient bars over faint
 * full-height tracks, the highlighted day emphasized with its value on top,
 * and a recessive dashed average line with an "avg" chip. Pass `onBarPress`
 * to make past-day bars tappable (`selected` controls the highlight).
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
  /** Index of the tapped bar; highlights it instead of today. */
  selected?: number | null;
  onBarPress?: (index: number) => void;
}) {
  const t = useTheme();
  // SVG ids are global per document (web) — a fixed id makes every chart on
  // screen reuse the FIRST chart's gradient, so the calories/protein/water
  // charts all rendered in one color. Unique ids per instance fix that.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const barId = `mbcBar${uid}`;
  const dimId = `mbcDim${uid}`;
  const W = 300;
  const H = 138;
  const padTop = 22; // room for the value label above the highlighted bar
  const baseline = 110;
  const n = values.length || 1;
  const slot = W / n;
  const barW = Math.max(6, Math.min(26, slot - 10));
  const max = Math.max(...values, 1);

  const y = (v: number) => baseline - (baseline - padTop) * (v / max);
  const avgY = y(avg);
  const lastIdx = n - 1;
  const highlightIdx = selected != null && selected >= 0 && selected < n ? selected : lastIdx;
  const highlightVal = values[highlightIdx] ?? 0;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={barId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="1" stopColor={color} stopOpacity={0.6} />
        </LinearGradient>
        <LinearGradient id={dimId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.4} />
          <Stop offset="1" stopColor={color} stopOpacity={0.14} />
        </LinearGradient>
      </Defs>

      {/* recessive baseline */}
      <Line x1={0} y1={baseline} x2={W} y2={baseline} stroke={t.border} strokeWidth={1} />

      {values.map((v, i) => {
        const cx = i * slot + slot / 2;
        const x = cx - barW / 2;
        const isLast = i === highlightIdx;
        const barH = v > 0 ? Math.max(5, baseline - y(v)) : 0;
        return (
          <Fragment key={i}>
            {/* faint full-height track so empty days still read as slots */}
            <Rect
              x={x}
              y={padTop}
              width={barW}
              height={baseline - padTop}
              rx={barW / 2}
              fill={t.chartTrack}
              opacity={0.5}
            />
            {barH > 0 && (
              <Rect
                x={x}
                y={baseline - barH}
                width={barW}
                height={barH}
                rx={Math.min(barW / 2, barH / 2)}
                fill={isLast ? `url(#${barId})` : `url(#${dimId})`}
              />
            )}
          </Fragment>
        );
      })}

      {/* the highlighted day's value floats above its bar */}
      {highlightVal > 0 && (
        <SvgText
          x={highlightIdx * slot + slot / 2}
          y={Math.max(12, y(highlightVal) - 7)}
          fontSize={10}
          fontFamily={F.d700}
          fill={t.ink}
          textAnchor="middle"
        >
          {Math.round(highlightVal).toLocaleString('en-US')}
        </SvgText>
      )}

      {/* average reference line — recessive, dashed, labeled. The chip sits
          above the line but flips below it near the top so it never clips. */}
      {avg > 0 && (
        <>
          <Line x1={0} y1={avgY} x2={W} y2={avgY} stroke={t.muted2} strokeWidth={1.5} strokeDasharray="4 4" />
          {(() => {
            const chipY = avgY - 18 < 2 ? avgY + 4 : avgY - 18;
            return (
              <>
                <Rect x={W - 44} y={chipY} width={40} height={15} rx={7} fill={t.navBg} />
                <SvgText x={W - 24} y={chipY + 11} fontSize={9} fontFamily={F.d700} fill="#fff" textAnchor="middle">
                  avg
                </SvgText>
              </>
            );
          })()}
        </>
      )}

      {labels.map((lab, i) => (
        <SvgText
          key={i}
          x={i * slot + slot / 2}
          y={H - 4}
          fontSize={10}
          fontFamily={i === highlightIdx ? F.b600 : F.b400}
          fill={i === highlightIdx ? t.ink : t.muted2}
          textAnchor="middle"
        >
          {lab}
        </SvgText>
      ))}

      {/* invisible full-height touch targets, one per day */}
      {onBarPress &&
        values.map((_, i) => (
          <Rect
            key={`hit${i}`}
            x={i * slot}
            y={0}
            width={slot}
            height={H}
            fill="transparent"
            onPress={() => onBarPress(i)}
          />
        ))}
    </Svg>
  );
}
