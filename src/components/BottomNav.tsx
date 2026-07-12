import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

function HomeIcon({ stroke, size = 21 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10.5 12 4l9 6.5" />
      <Path d="M5 9.5V20h14V9.5" />
    </Svg>
  );
}

function TrendsIcon({ stroke, size = 21 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19V5" />
      <Path d="M4 19h16" />
      <Path d="m7 14 3-4 3 2 4-6" />
    </Svg>
  );
}

function NavIcon({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}

export function BottomNav({ active }: { active: 'home' | 'progress' | 'settings' }) {
  const router = useRouter();
  const t = useTheme();
  const { width } = useWindowDimensions();

  const pill = (label: string, icon: React.ReactNode) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.green, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18 }}>
      {icon}
      <Text style={{ fontFamily: F.d700, fontSize: 13, color: '#fff' }}>{label}</Text>
    </View>
  );

  return (
    <View
      style={{
        position: 'absolute',
        left: (width - Math.min(width - 40, 390)) / 2,
        bottom: 18,
        width: Math.min(width - 40, 390),
        backgroundColor: t.navBg,
        borderRadius: 999,
        shadowColor: 'rgba(22,40,31,1)',
        shadowOpacity: 0.4,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        zIndex: 100,
      }}
    >
      {active === 'home' ? (
        pill('Home', <HomeIcon stroke="#fff" size={20} />)
      ) : (
        <NavIcon label="Home" onPress={() => router.push('/home')}>
          <HomeIcon stroke={t.navIcon} />
        </NavIcon>
      )}

      {active === 'progress' ? (
        pill('Trends', <TrendsIcon stroke="#fff" size={20} />)
      ) : (
        <NavIcon label="Trends" onPress={() => router.push('/progress')}>
          <TrendsIcon stroke={t.navIcon} />
        </NavIcon>
      )}

      <Pressable
        onPress={() => router.push('/scanner')}
        accessibilityLabel="Scan food"
        accessibilityRole="button"
        style={{
          width: 56 + 10,
          height: 56 + 10,
          borderRadius: 999,
          backgroundColor: t.green,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: -23,
          borderWidth: 5,
          borderColor: t.bg,
          shadowColor: 'rgba(47,158,110,1)',
          shadowOpacity: 0.6,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      >
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <Circle cx={12} cy={13} r={3.5} />
        </Svg>
      </Pressable>

      <NavIcon label="AI Coach" onPress={() => router.push('/coach')}>
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={t.navIcon} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3c.35 3.7 2.3 5.65 6 6-3.7.35-5.65 2.3-6 6-.35-3.7-2.3-5.65-6-6 3.7-.35 5.65-2.3 6-6Z" />
          <Path d="M18.5 14.5c.16 1.5 1 2.34 2.5 2.5-1.5.16-2.34 1-2.5 2.5-.16-1.5-1-2.34-2.5-2.5 1.5-.16 2.34-1 2.5-2.5Z" />
        </Svg>
      </NavIcon>

      <NavIcon label="Settings" onPress={() => router.push('/settings')}>
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={t.navIcon} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={8} r={4} />
          <Path d="M5 21a7 7 0 0 1 14 0" />
        </Svg>
      </NavIcon>
    </View>
  );
}
