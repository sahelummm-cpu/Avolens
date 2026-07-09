import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { PromptModal } from '@/components/PromptModal';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';

export default function SettingsPage() {
  const { state, setUnit, setThemeMode, toggleDarkManual, resolvedDark, setGoalCalories, setHeightCm, connectHealth, disconnectHealth, theme: t } = useStore();
  const [editGoal, setEditGoal] = useState(false);
  const [editHeight, setEditHeight] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isLb = state.unit === 'lb';

  const toggleHealth = async () => {
    if (state.healthConnected) {
      disconnectHealth();
      return;
    }
    setConnecting(true);
    try {
      await connectHealth();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <Logo size={28} />
          <Text style={{ fontFamily: F.d700, fontSize: 24, color: t.ink }}>Settings</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 22,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <LinearGradient
            colors={[t.greenGrad1, t.greenGrad2]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={{ width: 52, height: 52, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Text style={{ fontFamily: F.d700, fontSize: 20, color: '#fff' }}>A</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 16, color: t.ink }}>Alex Rivera</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>alex@avolens.app</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.navBg, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 11 }}>
            <Logo size={13} />
            <Text style={{ fontFamily: F.d700, fontSize: 10, color: '#fff' }}>PRO</Text>
          </View>
        </View>

        <SectionLabel>Preferences</SectionLabel>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, overflow: 'hidden', marginBottom: 20 }}>
          <Row>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Units</Text>
            <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface3, borderRadius: 11, padding: 3 }}>
              <Pressable
                onPress={() => setUnit('kg')}
                style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: !isLb ? t.navBg : 'transparent' }}
              >
                <Text style={{ color: !isLb ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>kg</Text>
              </Pressable>
              <Pressable
                onPress={() => setUnit('lb')}
                style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: isLb ? t.navBg : 'transparent' }}
              >
                <Text style={{ color: isLb ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>lb</Text>
              </Pressable>
            </View>
          </Row>
          <Row border>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </Svg>
              <View style={{ gap: 1 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Dark theme</Text>
                {state.themeMode === 'auto' && (
                  <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green }}>Following system</Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {state.themeMode !== 'auto' && (
                <Pressable onPress={() => setThemeMode('auto')} style={{ backgroundColor: t.greenTint, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 99 }}>
                  <Text style={{ fontFamily: F.d700, fontSize: 11, color: t.green }}>Auto</Text>
                </Pressable>
              )}
              <ToggleSwitch on={resolvedDark} onChange={toggleDarkManual} />
            </View>
          </Row>
          <Row border onPress={() => setEditGoal(true)}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Daily goal</Text>
            <ChevronValue>{state.goal.calories.toLocaleString('en-US')} kcal</ChevronValue>
          </Row>
          <Row border onPress={() => setEditHeight(true)}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Height</Text>
            <ChevronValue>{state.heightCm} cm</ChevronValue>
          </Row>
        </View>

        <SectionLabel>Connected apps</SectionLabel>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, overflow: 'hidden' }}>
          {Platform.OS !== 'android' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 18 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.proteinTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill={t.protein}>
                  <Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Apple Health</Text>
                {connecting && <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green, marginTop: 1 }}>Connecting…</Text>}
              </View>
              <ToggleSwitch on={state.healthConnected} onChange={toggleHealth} />
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 15,
              paddingHorizontal: 18,
              borderTopWidth: Platform.OS !== 'android' ? 1 : 0,
              borderTopColor: t.border2,
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fatTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill={t.fat}>
                <Circle cx={12} cy={12} r={8} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>
                {Platform.OS === 'android' ? 'Health Connect' : 'Google Fit'}
              </Text>
              {connecting && Platform.OS === 'android' && (
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green, marginTop: 1 }}>Connecting…</Text>
              )}
            </View>
            <ToggleSwitch
              on={Platform.OS === 'android' ? state.healthConnected : false}
              onChange={Platform.OS === 'android' ? toggleHealth : () => {}}
            />
          </View>
        </View>
      </ScrollView>

      {editGoal && (
        <PromptModal
          title="Daily calorie goal"
          placeholder="e.g. 2050"
          initial={String(state.goal.calories)}
          onClose={() => setEditGoal(false)}
          onSubmit={(v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) setGoalCalories(n);
            setEditGoal(false);
          }}
        />
      )}
      {editHeight && (
        <PromptModal
          title="Height (cm)"
          placeholder="e.g. 174"
          initial={String(state.heightCm)}
          onClose={() => setEditHeight(false)}
          onSubmit={(v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) setHeightCm(n);
            setEditHeight(false);
          }}
        />
      )}

      <BottomNav active="settings" />
    </Screen>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return (
    <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </Text>
  );
}

function Row({ children, border, onPress }: { children: React.ReactNode; border?: boolean; onPress?: () => void }) {
  const { theme: t } = useStore();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderTopWidth: border ? 1 : 0,
        borderTopColor: t.border2,
      }}
    >
      {children}
    </Pressable>
  );
}

function ChevronValue({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted }}>{children}</Text>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.faint} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="m9 6 6 6-6 6" />
      </Svg>
    </View>
  );
}
