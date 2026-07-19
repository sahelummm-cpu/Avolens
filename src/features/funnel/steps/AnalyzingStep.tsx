import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Logo } from '@/components/Logo';
import type { Theme } from '@/lib/theme';
import { F } from '@/lib/fonts';
import { success } from '../haptics';

const DURATION_MS = 4000;

const MESSAGES = [
  'Analyzing metabolic profile...',
  'Calibrating daily calorie targets...',
  'Customizing AI food recognition...',
];

/**
 * Step interstitial — a fixed 4-second "building your plan" moment between the
 * quiz and the results. Fills a bar, cycles the work messages, then advances
 * on its own; there is no button and the step rail is hidden while it runs.
 */
export function AnalyzingStep({ name, onDone, t }: { name?: string; onDone: () => void; t: Theme }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(1, { duration: DURATION_MS, easing: Easing.inOut(Easing.cubic) });

    const started = Date.now();
    const ticker = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / DURATION_MS);
      setPct(Math.round(p * 100));
      setMsgIdx(Math.min(MESSAGES.length - 1, Math.floor(p * MESSAGES.length)));
    }, 80);

    const done = setTimeout(() => {
      success();
      onDone();
    }, DURATION_MS + 150);

    return () => {
      clearInterval(ticker);
      clearTimeout(done);
    };
    // Runs exactly once for the lifetime of the interstitial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingBottom: 60 }}>
      <Logo size={84} shadow />

      <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink, letterSpacing: -0.5, marginTop: 30, textAlign: 'center' }}>
        {name ? `Building ${name}'s plan` : 'Building your plan'}
      </Text>

      <View style={{ width: '100%', marginTop: 34 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, letterSpacing: 0.3 }}>PERSONALIZING</Text>
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>{pct}%</Text>
        </View>
        <View style={{ height: 8, borderRadius: 99, backgroundColor: t.surface3, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 8, borderRadius: 99, backgroundColor: t.green }, fillStyle]} />
        </View>
      </View>

      <View style={{ height: 44, justifyContent: 'center', marginTop: 18 }}>
        <Animated.Text
          key={msgIdx}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(180)}
          style={{ fontFamily: F.b500, fontSize: 14, color: t.muted, textAlign: 'center' }}
        >
          {MESSAGES[msgIdx]}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
