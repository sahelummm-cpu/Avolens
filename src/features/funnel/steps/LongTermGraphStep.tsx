import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withDelay } from 'react-native-reanimated';
import type { Theme } from '@/lib/theme';
import { Sub, Title } from '../components/ui';
import { F } from '@/lib/fonts';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export function LongTermGraphStep({ t }: { t: Theme }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  // Smoother curves using Cubic Bezier
  const avoPath = "M 40 160 C 100 160, 160 110, 220 90 C 260 76, 290 70, 320 70";
  const avoArea = `${avoPath} L 320 200 L 40 200 Z`;
  const avoLength = 320;

  const typicalPath = "M 40 160 C 80 150, 100 130, 140 145 C 180 160, 200 175, 240 170 C 280 165, 300 150, 320 155";
  const typicalLength = 320;

  const avoAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: avoLength - avoLength * progress.value,
  }));

  const typicalAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: typicalLength - typicalLength * progress.value,
  }));

  const opacityProps = useAnimatedProps(() => ({
    opacity: progress.value > 0.8 ? withTiming(1, { duration: 500 }) : 0,
  }));

  const areaOpacityProps = useAnimatedProps(() => ({
    opacity: progress.value * 0.4, // Max opacity 0.4
  }));

  return (
    <View style={{ flex: 1 }}>
      <Title t={t.ink}>Built for long-term results</Title>
      <Sub t={t.muted}>
        Most apps focus on 30-day crashes. AvoLens is designed to build habits that last a lifetime.
      </Sub>

      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Svg width={340} height={240} viewBox="0 0 340 240">
          <Defs>
            <LinearGradient id="avoGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.green} stopOpacity="0.6" />
              <Stop offset="1" stopColor={t.green} stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="typGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.muted} stopOpacity="0.3" />
              <Stop offset="1" stopColor={t.bg} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid & Axes */}
          <Path d="M 40 40 L 320 40" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 100 L 320 100" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 160 L 320 160" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 200 L 320 200" stroke={t.border} strokeWidth="2" />
          <Path d="M 40 40 L 40 200" stroke={t.border} strokeWidth="2" />

          {/* Y-Axis Labels */}
          <SvgText x="30" y="45" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="end">Goal</SvgText>
          <SvgText x="30" y="165" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="end">Start</SvgText>

          {/* X-Axis Labels */}
          <SvgText x="40" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">Day 1</SvgText>
          <SvgText x="180" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">6 Months</SvgText>
          <SvgText x="320" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">1 Year</SvgText>

          {/* Areas */}
          <AnimatedPath d={avoArea} fill="url(#avoGrad)" animatedProps={areaOpacityProps} />

          {/* Typical App Line */}
          <AnimatedPath
            d={typicalPath}
            stroke={t.muted}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={typicalLength}
            animatedProps={typicalAnimatedProps}
          />

          {/* AvoLens Line */}
          <AnimatedPath
            d={avoPath}
            stroke={t.green}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={avoLength}
            animatedProps={avoAnimatedProps}
          />

          {/* End Points */}
          <AnimatedG animatedProps={opacityProps}>
            <Circle cx="320" cy="155" r="5" fill={t.bg} stroke={t.muted} strokeWidth="2" />
            <Circle cx="320" cy="70" r="6" fill={t.bg} stroke={t.green} strokeWidth="3" />
          </AnimatedG>
        </Svg>

        <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 24, gap: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: t.green }} />
            <Text style={{ fontFamily: F.b700, fontSize: 13, color: t.ink }}>AvoLens</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: t.muted }} />
            <Text style={{ fontFamily: F.b700, fontSize: 13, color: t.muted }}>Typical diet</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
