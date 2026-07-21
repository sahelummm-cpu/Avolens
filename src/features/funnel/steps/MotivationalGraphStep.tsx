import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withDelay } from 'react-native-reanimated';
import type { Theme } from '@/lib/theme';
import { Sub, Title } from '../components/ui';
import { F } from '@/lib/fonts';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MotivationalGraphStep({ t }: { t: Theme }) {
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);

  useEffect(() => {
    progress1.value = 0;
    progress2.value = 0;
    progress1.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    progress2.value = withDelay(500, withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.cubic) }));
  }, [progress1, progress2]);

  // Straight line expectation
  const expPath = "M 40 160 L 320 60";
  const expLength = 320;

  // Wiggly line reality - built with smooth Cubic Bezier segments
  const realityPath = "M 40 160 C 70 160, 80 130, 110 145 C 130 155, 140 120, 160 115 C 180 110, 190 140, 210 120 C 230 100, 250 80, 270 95 C 290 110, 300 60, 320 60";
  const realityArea = `${realityPath} L 320 200 L 40 200 Z`;
  const realityLength = 380;

  const expAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: expLength - expLength * progress1.value,
  }));

  const realityAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: realityLength - realityLength * progress2.value,
  }));

  const opacityProps = useAnimatedProps(() => ({
    opacity: progress2.value > 0.9 ? withTiming(1, { duration: 500 }) : 0,
  }));

  const areaOpacityProps = useAnimatedProps(() => ({
    opacity: progress2.value * 0.4,
  }));

  return (
    <View style={{ flex: 1 }}>
      <Title t={t.ink}>Progress isn't perfect</Title>
      <Sub t={t.muted}>
        Don't let a bad day derail your week. We expect bumps along the road — just keep logging.
      </Sub>

      <View style={{ marginTop: 50, alignItems: 'center' }}>
        <Svg width={340} height={240} viewBox="0 0 340 240">
          <Defs>
            <LinearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.green} stopOpacity="0.5" />
              <Stop offset="1" stopColor={t.green} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid & Axes */}
          <Path d="M 40 40 L 320 40" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 100 L 320 100" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 160 L 320 160" stroke={t.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d="M 40 200 L 320 200" stroke={t.border} strokeWidth="2" />
          <Path d="M 40 40 L 40 200" stroke={t.border} strokeWidth="2" />

          {/* Y-Axis Labels */}
          <SvgText x="30" y="65" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="end">Goal</SvgText>
          <SvgText x="30" y="165" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="end">Start</SvgText>

          {/* X-Axis Labels */}
          <SvgText x="40" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">Day 1</SvgText>
          <SvgText x="180" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">Time</SvgText>
          <SvgText x="320" y="220" fill={t.muted2} fontSize="10" fontFamily={F.b600} textAnchor="middle">Future</SvgText>

          {/* Area */}
          <AnimatedPath d={realityArea} fill="url(#realGrad)" animatedProps={areaOpacityProps} />

          {/* Expectation Line */}
          <AnimatedPath
            d={expPath}
            stroke={t.muted}
            strokeWidth="3"
            strokeDasharray="8,8"
            fill="none"
            strokeLinecap="round"
            animatedProps={expAnimatedProps}
          />

          {/* Reality Line */}
          <AnimatedPath
            d={realityPath}
            stroke={t.green}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={realityLength}
            animatedProps={realityAnimatedProps}
          />

          {/* End Points & Troughs */}
          <AnimatedG animatedProps={opacityProps}>
            <Circle cx="110" cy="145" r="4" fill={t.bg} stroke={t.green} strokeWidth="2" />
            <Circle cx="210" cy="120" r="4" fill={t.bg} stroke={t.green} strokeWidth="2" />
            <Circle cx="270" cy="95" r="4" fill={t.bg} stroke={t.green} strokeWidth="2" />
            <Circle cx="320" cy="60" r="6" fill={t.bg} stroke={t.green} strokeWidth="3" />
            <Circle cx="320" cy="60" r="5" fill={t.bg} stroke={t.muted} strokeWidth="2" />
          </AnimatedG>
        </Svg>

        <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 24, gap: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 20, height: 3, backgroundColor: t.muted }} />
            <Text style={{ fontFamily: F.b700, fontSize: 13, color: t.muted }}>Expectation</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: t.green }} />
            <Text style={{ fontFamily: F.b700, fontSize: 13, color: t.ink }}>Reality</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
