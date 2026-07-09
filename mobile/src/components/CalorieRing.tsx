import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/lib/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingFractions {
  calories: number; // 0-1
  protein: number;
  carbs: number;
  fat: number;
}

export function CalorieRing({ size = 156, fractions }: { size?: number; fractions: RingFractions }) {
  const t = useTheme();
  const values = [fractions.calories, fractions.protein, fractions.carbs, fractions.fat];

  const rings = [
    { r: 66, sw: 12, track: t.greenTrack, color: 'url(#avoRingGreen)' },
    { r: 51, sw: 10, track: t.proteinTint, color: t.protein },
    { r: 38, sw: 10, track: t.carbsTint, color: t.carbs },
    { r: 25, sw: 10, track: t.fatTint, color: t.fat },
  ];

  const anims = useRef(values.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Mirrors the web transition: 1.1s cubic-bezier(.34,1.2,.44,1) with a .12s stagger.
    const animations = values.map((v, i) =>
      Animated.timing(anims[i], {
        toValue: Math.max(0, Math.min(1, v)),
        duration: 1100,
        delay: i * 120,
        easing: Easing.bezier(0.34, 1.2, 0.44, 1),
        useNativeDriver: false,
      }),
    );
    Animated.parallel(animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fractions.calories, fractions.protein, fractions.carbs, fractions.fat]);

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 156;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="avoRingGreen" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.greenGrad1} />
          <Stop offset="1" stopColor={t.greenGrad2} />
        </LinearGradient>
      </Defs>
      {rings.map((ring, i) => {
        const r = ring.r * scale;
        const circ = 2 * Math.PI * r;
        return (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={r} fill="none" stroke={ring.track} strokeWidth={ring.sw} />
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.sw}
              strokeLinecap="round"
              strokeDasharray={`${circ}`}
              strokeDashoffset={anims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [circ, 0],
              })}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </G>
        );
      })}
    </Svg>
  );
}
