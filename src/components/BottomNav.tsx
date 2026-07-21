import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';

export type NavTab = 'home' | 'progress' | 'coach' | 'settings';

function HomeIcon({ stroke, size = 20 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10.5 12 4l9 6.5" />
      <Path d="M5 9.5V20h14V9.5" />
    </Svg>
  );
}

function TrendsIcon({ stroke, size = 20 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19V5" />
      <Path d="M4 19h16" />
      <Path d="m7 14 3-4 3 2 4-6" />
    </Svg>
  );
}

function CoachIcon({ stroke, size = 20 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3c.35 3.7 2.3 5.65 6 6-3.7.35-5.65 2.3-6 6-.35-3.7-2.3-5.65-6-6 3.7-.35 5.65-2.3 6-6Z" />
      <Path d="M18.5 14.5c.16 1.5 1 2.34 2.5 2.5-1.5.16-2.34 1-2.5 2.5-.16-1.5-1-2.34-2.5-2.5 1.5-.16 2.34-1 2.5-2.5Z" />
    </Svg>
  );
}

function SettingsIcon({ stroke, size = 20 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M5 21a7 7 0 0 1 14 0" />
    </Svg>
  );
}

function NavIcon({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      {children}
    </Pressable>
  );
}

export function BottomNav({ active }: { active?: NavTab }) {
  const router = useRouter();
  const { resolvedDark, theme: t } = useStore();
  const { width } = useWindowDimensions();

  const containerW = Math.min(width - 32, 390);

  // Pure High-Contrast Liquid Glass Palette
  const activeBg = resolvedDark ? '#FFFFFF' : '#111116';
  const activeFg = resolvedDark ? '#0E0E12' : '#FFFFFF';
  const inactiveFg = '#8A8A8F';
  const scanBg = resolvedDark ? '#FFFFFF' : '#111116';
  const scanFg = resolvedDark ? '#0E0E12' : '#FFFFFF';

  const pill = (label: string, icon: (color: string) => React.ReactNode) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: activeBg,
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: resolvedDark ? 0.2 : 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      {icon(activeFg)}
      <Text style={{ fontFamily: F.d700, fontSize: 13, color: activeFg, letterSpacing: -0.2 }}>{label}</Text>
    </View>
  );

  return (
    <BlurView
      intensity={85}
      tint={resolvedDark ? 'dark' : 'light'}
      experimentalBlurMethod="dimezisBlurView"
      style={{
        position: 'absolute',
        left: (width - containerW) / 2,
        bottom: 20,
        width: containerW,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: resolvedDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.85)',
        shadowColor: '#000',
        shadowOpacity: resolvedDark ? 0.55 : 0.16,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 12 },
        elevation: 16,
        paddingVertical: 9,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        zIndex: 100,
      }}
    >
      {/* Specular Liquid Glass Top Rim Sheen */}
      <LinearGradient
        colors={
          resolvedDark
            ? ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)']
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 24,
          borderRadius: 999,
        }}
      />

      {active === 'home' ? (
        pill('Home', (c) => <HomeIcon stroke={c} size={19} />)
      ) : (
        <NavIcon label="Home" onPress={() => router.push('/home')}>
          <HomeIcon stroke={inactiveFg} />
        </NavIcon>
      )}

      {active === 'progress' ? (
        pill('Trends', (c) => <TrendsIcon stroke={c} size={19} />)
      ) : (
        <NavIcon label="Trends" onPress={() => router.push('/progress')}>
          <TrendsIcon stroke={inactiveFg} />
        </NavIcon>
      )}

      <Pressable
        onPress={() => router.push('/scanner')}
        accessibilityLabel="Scan food"
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: 64,
          height: 64,
          borderRadius: 999,
          backgroundColor: scanBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: -24,
          borderWidth: 4,
          borderColor: t.bg,
          shadowColor: '#000',
          shadowOpacity: resolvedDark ? 0.6 : 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={scanFg} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <Circle cx={12} cy={13} r={3.5} />
        </Svg>
      </Pressable>

      {active === 'coach' ? (
        pill('Coach', (c) => <CoachIcon stroke={c} size={19} />)
      ) : (
        <NavIcon label="AI Coach" onPress={() => router.push('/coach')}>
          <CoachIcon stroke={inactiveFg} />
        </NavIcon>
      )}

      {active === 'settings' ? (
        pill('Settings', (c) => <SettingsIcon stroke={c} size={19} />)
      ) : (
        <NavIcon label="Settings" onPress={() => router.push('/settings')}>
          <SettingsIcon stroke={inactiveFg} />
        </NavIcon>
      )}
    </BlurView>
  );
}
