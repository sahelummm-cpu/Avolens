import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/lib/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingFractions {
  calories: number; // 0-1
  protein: number;
  carbs: number;
  fat: number;
}

// Mirrors the web transition: 1.1s cubic-bezier(.34,1.2,.44,1) with a .12s stagger.
const RING_EASING = Easing.bezier(0.34, 1.2, 0.44, 1);

function Ring({
  cx,
  cy,
  r,
  sw,
  track,
  color,
  fraction,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  sw: number;
  track: string;
  color: string;
  fraction: number;
  delay: number;
}) {
  const circ = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, fraction));
    progress.value = withDelay(delay, withTiming(target, { duration: 1100, easing: RING_EASING }));
  }, [fraction, delay, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={sw} />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </G>
  );
}

export function CalorieRing({ size = 156, fractions }: { size?: number; fractions: RingFractions }) {
  const t = useTheme();

  const rings = [
    { r: 66, sw: 12, track: t.carbsTint, color: 'url(#avoRingKcal)', fraction: fractions.calories },
    { r: 51, sw: 10, track: t.proteinTint, color: t.protein, fraction: fractions.protein },
    { r: 38, sw: 10, track: t.carbsTint, color: t.carbs, fraction: fractions.carbs },
    { r: 25, sw: 10, track: t.fatTint, color: t.fat, fraction: fractions.fat },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 156;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="avoRingKcal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.amberGrad1} />
          <Stop offset="1" stopColor={t.amberGrad2} />
        </LinearGradient>
      </Defs>
      {rings.map((ring, i) => (
        <Ring key={i} cx={cx} cy={cy} r={ring.r * scale} sw={ring.sw} track={ring.track} color={ring.color} fraction={ring.fraction} delay={i * 120} />
      ))}
    </Svg>
  );
}
