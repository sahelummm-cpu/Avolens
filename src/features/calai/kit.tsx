/**
 * Cal AI onboarding clone — self-contained UI kit.
 *
 * A faithful reproduction of the Cal AI onboarding aesthetic: near-white
 * background, jet-black display type, soft grey option cards, and a charcoal
 * pill CTA. Kept independent from the green AvoLens theme so it can live in the
 * repo without touching the rest of the app. Fonts reuse the already-loaded
 * Poppins (display) + Plus Jakarta Sans (body) families.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { F } from '@/lib/fonts';

/** Cal AI palette — 1:1 replica of the Cal AI design system with macro nutrition tokens. */
export const C = {
  bg: '#FFFFFF',
  ink: '#0E0E12',
  ink2: '#1C1C22',
  sub: '#8A8A8F',
  sub2: '#A9A9AE',
  faint: '#C7C7CC',
  card: '#F5F5F6',
  cardSel: '#111116',
  border: '#ECECEE',
  borderSel: '#111116',
  line: '#EDEDEF',
  track: '#E9E9EB',
  dark: '#111116', // charcoal primary button fill
  accent: '#B8925A',
  danger: '#E0A253',
  white: '#FFFFFF',
  green: '#111116',
  greenTint: '#F5F5F6',
  protein: '#E4586E',
  carbs: '#E8A13B',
  fat: '#06B6D4',
} as const;

/* ------------------------------------------------------------------ layout */

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

/** Thin progress bar with a back chevron, matching Cal AI's top rail. */
export function ProgressHeader({ progress, onBack }: { progress: number; onBack: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, height: 44 }}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="m15 5-7 7 7 7" />
        </Svg>
      </Pressable>
      <View style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: C.track, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(4, Math.min(100, progress * 100))}%`, height: 5, borderRadius: 99, backgroundColor: C.ink }} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------- typography */

export function Title({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text style={[{ fontFamily: F.d800, fontSize: 30, lineHeight: 37, color: C.ink, letterSpacing: -0.7 }, style]}>
      {children}
    </Text>
  );
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: F.b500, fontSize: 15, lineHeight: 21, color: C.sub, marginTop: 10 }}>{children}</Text>;
}

/* ---------------------------------------------------------------- buttons */

export function Cta({ children, onPress, disabled, variant = 'primary' }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' }) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 60,
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? (disabled ? '#CFCFD4' : C.dark) : 'transparent',
        opacity: pressed && !disabled ? 0.9 : 1,
      })}
    >
      <Text style={{ fontFamily: F.d700, fontSize: 17, color: primary ? '#FFFFFF' : C.ink }}>{children}</Text>
    </Pressable>
  );
}

/** The Yes / No stacked pair used on the calorie-behaviour screens. */
export function YesNo({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <View style={{ gap: 4 }}>
      <Cta onPress={onYes}>Yes</Cta>
      <Cta onPress={onNo} variant="ghost">No</Cta>
    </View>
  );
}

/* ------------------------------------------------------------ option rows */

export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 99,
        borderWidth: 2,
        borderColor: selected ? C.ink : C.faint,
        backgroundColor: selected ? C.ink : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected && (
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="m5 12 5 5 9-11" />
        </Svg>
      )}
    </View>
  );
}

/**
 * A selectable row. Cal AI uses two styles: a soft grey card with a radio
 * (`card`) and, for the icon list, a lighter bordered row (`list`). When
 * selected the whole card flips to charcoal with white text.
 */
export function OptionRow({
  title,
  sub,
  icon,
  selected,
  onPress,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 68,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected ? C.borderSel : C.border,
        backgroundColor: selected ? C.cardSel : C.card,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {icon != null && <View style={{ width: 30, alignItems: 'center' }}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 17, color: selected ? C.white : C.ink }}>{title}</Text>
        {sub ? <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: selected ? 'rgba(255,255,255,0.66)' : C.sub, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 99,
          borderWidth: 2,
          borderColor: selected ? C.white : C.faint,
          backgroundColor: selected ? C.white : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m5 12 5 5 9-11" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------- segmented */

export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', backgroundColor: C.card, borderRadius: 99, padding: 4 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ paddingHorizontal: 34, paddingVertical: 9, borderRadius: 99, backgroundColor: active ? C.white : 'transparent', ...(active ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : null) }}
          >
            <Text style={{ fontFamily: F.d700, fontSize: 15, color: active ? C.ink : C.sub }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- rulers */

const RULER_ITEM = 10; // px between tick marks

/**
 * Horizontal ruler slider. The value under the fixed centre pointer is the
 * selection. Big ticks every 5 units, tall centre needle above.
 */
export function Ruler({ min, max, step, value, onChange, renderValue }: { min: number; max: number; step: number; value: number; onChange: (v: number) => void; renderValue: (v: number) => React.ReactNode }) {
  const ticks = useMemo(() => Math.round((max - min) / step), [min, max, step]);
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  const settled = useRef(false);

  const pad = w / 2;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / RULER_ITEM);
    const v = Math.round((min + idx * step) * 100) / 100;
    if (v !== value && v >= min && v <= max) onChange(v);
  };

  const initialX = ((value - min) / step) * RULER_ITEM;

  useEffect(() => {
    ref.current?.scrollTo({ x: initialX, animated: false });
  }, [initialX]);

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 18 }}>{renderValue(value)}</View>
      <View style={{ height: 96 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {/* centre needle */}
        <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 6, marginLeft: -1.5, width: 3, height: 56, borderRadius: 2, backgroundColor: C.ink, zIndex: 2 }} />
        {w > 0 && (
          <ScrollView
            ref={ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={RULER_ITEM}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: pad, alignItems: 'flex-start' }}
            contentOffset={{ x: initialX, y: 0 }}
            onContentSizeChange={() => {
              if (!settled.current) {
                settled.current = true;
                ref.current?.scrollTo({ x: initialX, animated: false });
              }
            }}
          >
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const major = i % 5 === 0;
              return (
                <View key={i} style={{ width: RULER_ITEM, alignItems: 'center', paddingTop: 10 }}>
                  <View style={{ width: major ? 2 : 1.5, height: major ? 44 : 26, borderRadius: 2, backgroundColor: major ? C.sub2 : C.faint }} />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------- wheel picker */

const ROW = 44;
const VISIBLE = 5;

/** A single snapping wheel column. Centre row is the selected value. */
export function Wheel({ items, index, onChange, width = 110, align = 'center' }: { items: string[]; index: number; onChange: (i: number) => void; width?: number; align?: 'center' | 'left' | 'right' }) {
  const ref = useRef<ScrollView>(null);
  const settled = useRef(false);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    if (clamped !== index) onChange(clamped);
  };

  useEffect(() => {
    ref.current?.scrollTo({ y: index * ROW, animated: true });
  }, [index]);

  return (
    <View style={{ width, height: ROW * VISIBLE }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}
        contentOffset={{ x: 0, y: index * ROW }}
        onContentSizeChange={() => {
          if (!settled.current) {
            settled.current = true;
            ref.current?.scrollTo({ y: index * ROW, animated: false });
          }
        }}
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
      >
        {items.map((label, i) => {
          const active = i === index;
          const near = Math.abs(i - index) === 1;
          return (
            <View key={i} style={{ height: ROW, justifyContent: 'center', paddingHorizontal: 8 }}>
              <Text
                style={{
                  fontFamily: active ? F.d700 : F.b500,
                  fontSize: active ? 22 : 20,
                  color: active ? C.ink : near ? C.sub2 : C.faint,
                  textAlign: align,
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Centre highlight band shared by the birthday wheels. */
export function WheelBand() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ROW * 2, height: ROW, backgroundColor: C.card, borderRadius: 12 }} />
  );
}

/* ------------------------------------------------------------------- misc */

export function TextField({ value, onChangeText, placeholder, onSubmit }: { value: string; onChangeText: (v: string) => void; placeholder: string; onSubmit?: () => void }) {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 18, height: 58, justifyContent: 'center' }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.sub2}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        style={{ fontFamily: F.b600, fontSize: 16, color: C.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) }}
      />
    </View>
  );
}

export function Note({ tone = 'muted', title, children }: { tone?: 'muted' | 'warn'; title?: string; children: React.ReactNode }) {
  const warn = tone === 'warn';
  return (
    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: warn ? '#FBF3E7' : C.card, borderRadius: 16, padding: 16 }}>
      {warn && (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
          <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <Path d="M12 9v4M12 17h.01" />
        </Svg>
      )}
      <View style={{ flex: 1 }}>
        {title ? <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink, marginBottom: 3 }}>{title}</Text> : null}
        <Text style={{ fontFamily: F.b500, fontSize: 12.5, lineHeight: 18, color: C.sub }}>{children}</Text>
      </View>
    </View>
  );
}
