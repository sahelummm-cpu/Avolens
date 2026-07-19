import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import type { Theme } from '@/lib/theme';
import { F } from '@/lib/fonts';
import { tap } from '../haptics';

/**
 * Shared primitives for the onboarding funnel, extracted from onboarding.tsx
 * so the behavioral steps and the classic profile steps render identically.
 * Selection controls fire a light haptic tap on press.
 */

export const PRIVACY_URL = 'https://avolens.app/privacy';
export const TERMS_URL = 'https://avolens.app/terms';

/**
 * Step transitions: springy directional slides on native, plain fades on web —
 * Reanimated's slide layout animations intermittently stall on react-native-web,
 * leaving steps frozen off-screen.
 */
export const stepEntering = Platform.OS === 'web' ? FadeIn.duration(220) : SlideInRight.springify().damping(18).stiffness(150);
export const stepExiting = Platform.OS === 'web' ? FadeOut.duration(120) : SlideOutLeft.duration(160);

export function Title({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.d800, fontSize: 30, color: t, letterSpacing: -0.6 }}>{children}</Text>;
}

export function Sub({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.b500, fontSize: 14, color: t, marginTop: 8, lineHeight: 21 }}>{children}</Text>;
}

export function FieldLabel({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.b700, fontSize: 11, color: t, letterSpacing: 0.66, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>{children}</Text>;
}

/** Wraps each core step with the directional slide transition and the faint step numeral. */
export function StepView({ children, index, t }: { children: React.ReactNode; index: number; t: Theme }) {
  return (
    <Animated.View entering={stepEntering} exiting={stepExiting} style={{ position: 'relative' }}>
      <Text style={{ position: 'absolute', top: -20, left: -3, fontFamily: F.d800, fontSize: 84, lineHeight: 84, color: t.ink, opacity: 0.05 }}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      {children}
    </Animated.View>
  );
}

export function OptionCard({ selected, onPress, title, sub, icon, compact }: { selected: boolean; onPress: () => void; title: string; sub: string; icon?: React.ReactNode; compact?: boolean }) {
  const { theme: t } = useStore();
  return (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: selected ? t.greenTint : t.surface,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        borderRadius: 20,
        paddingVertical: compact ? 13 : 16,
        paddingHorizontal: 18,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        ...(selected ? { shadowColor: t.green, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 } : null),
      })}
    >
      {selected && <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 4, backgroundColor: t.green }} />}
      {icon != null && <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>{sub}</Text>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 99, borderWidth: 2, borderColor: selected ? t.green : t.faint, backgroundColor: selected ? t.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, small }: { label: string; selected: boolean; onPress: () => void; small?: boolean }) {
  const { theme: t } = useStore();
  return (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flex: small ? 0 : 1,
        paddingVertical: small ? 8 : 14,
        paddingHorizontal: small ? 18 : 0,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        backgroundColor: selected ? t.greenTint : t.surface,
        alignItems: 'center',
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Text style={{ fontFamily: F.d700, fontSize: 14, color: selected ? t.green : t.ink }}>{label}</Text>
    </Pressable>
  );
}
