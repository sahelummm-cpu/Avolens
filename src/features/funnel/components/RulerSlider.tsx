import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useStore } from '@/lib/store';
import type { Theme } from '@/lib/theme';
import { F } from '@/lib/fonts';
import { tap, tick } from '../haptics';

const TICK_W = 10;
const RULER_H = 64;

/**
 * Horizontal ruler picker — drag the tape (or use the −/+ steppers, which are
 * also the mouse/screen-reader path on web) and the centre needle reads the
 * value. Values snap to `step`; each detent fires a selection haptic. `value`
 * only seeds the initial position; the component owns the scroll afterwards,
 * so re-renders never fight the user's drag. Initial position is applied via
 * scrollTo once content lays out — the contentOffset prop is not honored on
 * react-native-web.
 */
export function RulerSlider({ min, max, step, value, onChange, format }: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  /** Renders the big readout, e.g. (v) => `${v} kg` */
  format: (v: number) => string;
}) {
  const { theme: t } = useStore();
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(() => clamp(value, min, max));
  const scrollRef = useRef<ScrollView>(null);
  const lastIdx = useRef(-1);
  const didInit = useRef(false);

  const count = Math.round((max - min) / step) + 1;
  const decimals = step < 1 ? 1 : 0;
  const idxFor = (v: number) => Math.round((clamp(v, min, max) - min) / step);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.min(count - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / TICK_W)));
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    const v = round(min + idx * step, decimals);
    tick();
    setCurrent(v);
    onChange(v);
  };

  /** Programmatic move (steppers): update state first, then glide the tape. */
  const setTo = (v: number) => {
    const c = round(clamp(v, min, max), decimals);
    if (c === current) return;
    lastIdx.current = idxFor(c);
    setCurrent(c);
    onChange(c);
    scrollRef.current?.scrollTo({ x: idxFor(c) * TICK_W, animated: true });
  };

  const ticks = [];
  for (let i = 0; i < count; i++) {
    const v = round(min + i * step, decimals);
    const major = v % 5 === 0;
    const mid = !major && v % 1 === 0;
    ticks.push(
      <View key={i} style={{ width: TICK_W, height: RULER_H, alignItems: 'center' }}>
        <View style={{ width: major ? 2 : 1.5, height: major ? 30 : mid ? 20 : 12, borderRadius: 2, backgroundColor: major ? t.muted : t.faint }} />
        {major && (
          <Text style={{ position: 'absolute', top: 36, width: 40, marginLeft: -15, fontFamily: F.b600, fontSize: 10, color: t.muted2, textAlign: 'center' }}>{v}</Text>
        )}
      </View>,
    );
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 }}>
        <StepBtn label="−" onPress={() => { tap(); setTo(current - step); }} t={t} />
        <Text style={{ fontFamily: F.d800, fontSize: 34, color: t.ink, letterSpacing: -0.7, textAlign: 'center', minWidth: 130 }}>
          {format(current)}
        </Text>
        <StepBtn label="+" onPress={() => { tap(); setTo(current + step); }} t={t} />
      </View>
      {width > 0 && (
        <View style={{ height: RULER_H }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_W}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={onScroll}
            onContentSizeChange={() => {
              if (didInit.current) return;
              didInit.current = true;
              lastIdx.current = idxFor(value);
              scrollRef.current?.scrollTo({ x: idxFor(value) * TICK_W, animated: false });
            }}
            contentContainerStyle={{ paddingHorizontal: width / 2 - TICK_W / 2 }}
          >
            {ticks}
          </ScrollView>
          {/* Centre needle */}
          <View pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 1.5, top: 0, width: 3, height: 34, borderRadius: 3, backgroundColor: t.green }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 4, top: -3, width: 8, height: 8, borderRadius: 99, backgroundColor: t.green }} />
        </View>
      )}
    </View>
  );
}

function StepBtn({ label, onPress, t }: { label: string; onPress: () => void; t: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Increase' : 'Decrease'}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 99,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Text style={{ fontFamily: F.d700, fontSize: 18, color: t.ink, lineHeight: 20 }}>{label}</Text>
    </Pressable>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
