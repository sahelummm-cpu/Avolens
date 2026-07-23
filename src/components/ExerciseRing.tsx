import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ExerciseFractions {
  calories: number; // 0-1 (or >1 when exceeding goal)
  steps: number;
  minutes: number;
}

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
  const mainProgress = useSharedValue(0);
  const overflowProgress = useSharedValue(0);

  useEffect(() => {
    const mainTarget = Math.max(0, Math.min(1, fraction));
    const overflowTarget = Math.max(0, Math.min(1, fraction - 1));

    mainProgress.value = withDelay(
      delay,
      withTiming(mainTarget, { duration: 1100, easing: RING_EASING })
    );

    if (fraction > 1) {
      overflowProgress.value = withDelay(
        delay + 300,
        withTiming(overflowTarget, { duration: 900, easing: RING_EASING })
      );
    } else {
      overflowProgress.value = 0;
    }
  }, [fraction, delay, mainProgress, overflowProgress]);

  const mainAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - mainProgress.value),
  }));

  const overflowAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - overflowProgress.value),
  }));

  return (
    <G>
      {/* Background Track */}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={sw} />

      {/* Main Base Arc */}
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        animatedProps={mainAnimatedProps}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* 2nd Lap Arc */}
      {fraction > 1 && (
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          animatedProps={overflowAnimatedProps}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
    </G>
  );
}

export function ExerciseRing({ size = 156, fractions }: { size?: number; fractions: ExerciseFractions }) {
  const rings = [
    {
      r: 66,
      sw: 12,
      track: 'rgba(255,45,85,0.18)',
      color: '#FF2D55',
      fraction: fractions.calories,
    },
    {
      r: 51,
      sw: 10,
      track: 'rgba(163,230,53,0.18)',
      color: '#A3E635',
      fraction: fractions.steps,
    },
    {
      r: 38,
      sw: 10,
      track: 'rgba(0,213,232,0.18)',
      color: '#00D5E8',
      fraction: fractions.minutes,
    },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 156;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => (
        <Ring
          key={i}
          cx={cx}
          cy={cy}
          r={ring.r * scale}
          sw={ring.sw}
          track={ring.track}
          color={ring.color}
          fraction={ring.fraction}
          delay={i * 120}
        />
      ))}
    </Svg>
  );
}
