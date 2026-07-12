import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { PromptModal } from '@/components/PromptModal';
import { HeightModal } from '@/components/HeightModal';
import { MacroGoalModal, ProfileModal, ReminderTimeModal, WaterGoalModal } from '@/components/SettingsModals';
import { MedScheduleModal } from '@/components/MedScheduleModal';
import { useStore } from '@/lib/store';
import { resolveMedication } from '@/lib/meds';
import { formatHeight } from '@/lib/goals';
import { exportCsv } from '@/lib/export';
import { supabaseConfigured } from '@/lib/supabase';
import { F } from '@/lib/fonts';

// Point these at your hosted pages / support inbox.
const PRIVACY_URL = 'https://avolens.app/privacy';
const TERMS_URL = 'https://avolens.app/terms';
const SUPPORT_EMAIL = 'support@avolens.app';
const APP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/idYOUR_APP_ID',
  android: 'https://play.google.com/store/apps/details?id=app.avolens.mobile',
  default: 'https://avolens.app',
})!;

type ModalKind = 'cal' | 'macros' | 'water' | 'height' | 'profile' | 'time' | null;

function fmtTime(h: number, m: number) {
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    state, session, signOut, deleteAccount, toggleLogReminder, setMedEnabled,
    setUnit, setThemeMode, toggleDarkManual, resolvedDark, setGoalCalories, setHeightCm,
    setHeightUnit, recalcGoals, clearLoggedData, connectHealth, disconnectHealth, theme: t,
  } = useStore();
  const [modal, setModal] = useState<ModalKind>(null);
  const [medModalOpen, setMedModalOpen] = useState(false);
  const medName = resolveMedication(state).name;
  const [connecting, setConnecting] = useState(false);

  const isLb = state.unit === 'lb';
  const name = state.displayName.trim() || session?.user.email?.split('@')[0] || 'Guest';
  const email = session?.user.email ?? 'Not signed in';
  const initial = (name[0] ?? 'A').toUpperCase();

  const toggleHealth = async () => {
    if (state.healthConnected) return disconnectHealth();
    setConnecting(true);
    try {
      const ok = await connectHealth();
      if (!ok) {
        Alert.alert(
          Platform.OS === 'android' ? 'Health Connect unavailable' : 'Apple Health unavailable',
          Platform.OS === 'android'
            ? "Couldn't connect. Install the “Health Connect” app from the Play Store, then grant AvoLens permission. Most emulators don't have it, so this only works on a real device."
            : "Couldn't connect to Apple Health. Make sure you're on a real device and allow AvoLens access when prompted.",
        );
      }
    } finally {
      setConnecting(false);
    }
  };

  const doRecalc = () => {
    Alert.alert('Recalculate goals?', 'Update your calorie & macro targets from your current weight, age, and activity.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Recalculate',
        onPress: () => {
          if (!recalcGoals()) {
            Alert.alert('Not enough info', 'Add your weight, age, sex and activity level (Edit profile) first.');
          }
        },
      },
    ]);
  };

  const doClear = () => {
    Alert.alert('Clear logged data?', 'This deletes your meals, weight, measurements, photos and injections. Your goals and preferences stay. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearLoggedData },
    ]);
  };

  const doDelete = () => {
    Alert.alert('Delete account?', 'This permanently deletes your account and all synced data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const err = await deleteAccount();
          if (err) Alert.alert('Error', err);
          else router.replace('/');
        },
      },
    ]);
  };

  const openLink = (url: string) => Linking.openURL(url).catch(() => Alert.alert("Couldn't open link"));
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <Screen inset={false}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <Logo size={28} />
          <Text style={{ fontFamily: F.d700, fontSize: 24, color: t.ink }}>Settings</Text>
        </View>

        {/* Profile */}
        <Pressable
          onPress={() => setModal('profile')}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, padding: 16, marginBottom: 20 }}
        >
          <LinearGradient colors={[t.greenGrad1, t.greenGrad2]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ width: 52, height: 52, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 20, color: '#fff' }}>{initial}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: F.d700, fontSize: 16, color: t.ink }}>{name}</Text>
            <Text numberOfLines={1} style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>{email}</Text>
          </View>
          <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.navBg, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 11 }}>
            <Logo size={13} />
            <Text style={{ fontFamily: F.d700, fontSize: 10, color: '#fff' }}>PRO</Text>
          </Pressable>
        </Pressable>

        {/* Goals */}
        <SectionLabel>Goals</SectionLabel>
        <Card>
          <Row onPress={() => setModal('cal')}>
            <Text style={rowLabel(t)}>Daily calories</Text>
            <ChevronValue>{state.goal.calories.toLocaleString('en-US')} kcal</ChevronValue>
          </Row>
          <Row border onPress={() => setModal('macros')}>
            <Text style={rowLabel(t)}>Macro targets</Text>
            <ChevronValue>{`P${state.goal.protein} · C${state.goal.carbs} · F${state.goal.fat}`}</ChevronValue>
          </Row>
          <Row border onPress={() => setModal('water')}>
            <Text style={rowLabel(t)}>Water goal</Text>
            <ChevronValue>{state.goal.water} glasses</ChevronValue>
          </Row>
          <Row border onPress={doRecalc}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><Path d="M21 3v5h-5" /></Svg>
              <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.green }}>Recalculate from my stats</Text>
            </View>
          </Row>
        </Card>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <Card>
          <Row>
            <Text style={rowLabel(t)}>Units</Text>
            <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface3, borderRadius: 11, padding: 3 }}>
              <Pressable onPress={() => setUnit('kg')} style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: !isLb ? t.navBg : 'transparent' }}>
                <Text style={{ color: !isLb ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>kg</Text>
              </Pressable>
              <Pressable onPress={() => setUnit('lb')} style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: isLb ? t.navBg : 'transparent' }}>
                <Text style={{ color: isLb ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>lb</Text>
              </Pressable>
            </View>
          </Row>
          <Row border>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>
              <View style={{ gap: 1 }}>
                <Text style={rowLabel(t)}>Dark theme</Text>
                {state.themeMode === 'auto' && <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green }}>Following system</Text>}
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
          <Row border onPress={() => setModal('height')}>
            <Text style={rowLabel(t)}>Height</Text>
            <ChevronValue>{formatHeight(state.heightCm, state.heightUnit)}</ChevronValue>
          </Row>
        </Card>

        {/* Reminders */}
        <SectionLabel>Reminders</SectionLabel>
        <Card>
          <Row>
            <View style={{ gap: 1 }}>
              <Text style={rowLabel(t)}>Meal log reminder</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>Daily notification</Text>
            </View>
            <ToggleSwitch on={state.logReminderOn} onChange={toggleLogReminder} />
          </Row>
          {state.logReminderOn && (
            <Row border onPress={() => setModal('time')}>
              <Text style={rowLabel(t)}>Reminder time</Text>
              <ChevronValue>{fmtTime(state.logReminderHour, state.logReminderMinute)}</ChevronValue>
            </Row>
          )}
          <Row border>
            <View style={{ gap: 1 }}>
              <Text style={rowLabel(t)}>GLP-1 tracking</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>Dose reminders & injection log on Home</Text>
            </View>
            <ToggleSwitch on={state.medEnabled} onChange={() => setMedEnabled(!state.medEnabled)} />
          </Row>
          {state.medEnabled && (
            <Row border onPress={() => setMedModalOpen(true)}>
              <Text style={rowLabel(t)}>Medication</Text>
              <ChevronValue>{medName}</ChevronValue>
            </Row>
          )}
        </Card>

        {/* Account */}
        {supabaseConfigured && (
          <>
            <SectionLabel>Account</SectionLabel>
            <Card>
              {session ? (
                <>
                  <Row onPress={() => setModal('profile')}>
                    <View style={{ gap: 1, flex: 1 }}>
                      <Text style={rowLabel(t)} numberOfLines={1}>{session.user.email}</Text>
                      <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green }}>Synced to cloud</Text>
                    </View>
                    <ChevronValue>{'Edit profile'}</ChevronValue>
                  </Row>
                  <Row border onPress={() => signOut()}>
                    <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.protein }}>Sign out</Text>
                  </Row>
                </>
              ) : (
                <Row onPress={() => router.push('/auth')}>
                  <View style={{ gap: 1 }}>
                    <Text style={rowLabel(t)}>Sign in</Text>
                    <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>Back up & sync your data</Text>
                  </View>
                  <ChevronValue>{''}</ChevronValue>
                </Row>
              )}
            </Card>
          </>
        )}

        {/* Connected apps */}
        <SectionLabel>Connected apps</SectionLabel>
        <Card>
          {Platform.OS !== 'android' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 18 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.proteinTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill={t.protein}><Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={rowLabel(t)}>Apple Health</Text>
                {connecting && <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green, marginTop: 1 }}>Connecting…</Text>}
              </View>
              <ToggleSwitch on={state.healthConnected} onChange={toggleHealth} />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 18, borderTopWidth: Platform.OS !== 'android' ? 1 : 0, borderTopColor: t.border2 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fatTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill={t.fat}><Circle cx={12} cy={12} r={8} /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rowLabel(t)}>{Platform.OS === 'android' ? 'Health Connect' : 'Google Fit'}</Text>
              {connecting && Platform.OS === 'android' && <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green, marginTop: 1 }}>Connecting…</Text>}
            </View>
            <ToggleSwitch on={Platform.OS === 'android' ? state.healthConnected : false} onChange={Platform.OS === 'android' ? toggleHealth : () => {}} />
          </View>
        </Card>

        {/* Data & privacy */}
        <SectionLabel>Data & privacy</SectionLabel>
        <Card>
          <Row onPress={() => exportCsv(state).catch(() => Alert.alert('Export failed'))}>
            <Text style={rowLabel(t)}>Export my data (CSV)</Text>
            <ChevronValue>{''}</ChevronValue>
          </Row>
          <Row border onPress={doClear}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Clear logged data</Text>
            <ChevronValue>{''}</ChevronValue>
          </Row>
          {supabaseConfigured && session && (
            <Row border onPress={doDelete}>
              <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.protein }}>Delete account</Text>
              <ChevronValue>{''}</ChevronValue>
            </Row>
          )}
        </Card>

        {/* About */}
        <SectionLabel>About</SectionLabel>
        <Card>
          <Row onPress={() => openLink(PRIVACY_URL)}><Text style={rowLabel(t)}>Privacy policy</Text><ChevronValue>{''}</ChevronValue></Row>
          <Row border onPress={() => openLink(TERMS_URL)}><Text style={rowLabel(t)}>Terms of service</Text><ChevronValue>{''}</ChevronValue></Row>
          <Row border onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}><Text style={rowLabel(t)}>Contact support</Text><ChevronValue>{''}</ChevronValue></Row>
          <Row border onPress={() => openLink(APP_STORE_URL)}><Text style={rowLabel(t)}>Rate AvoLens</Text><ChevronValue>{''}</ChevronValue></Row>
          <Row border>
            <Text style={rowLabel(t)}>Version</Text>
            <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted2 }}>{version}</Text>
          </Row>
        </Card>
      </ScrollView>

      {modal === 'cal' && (
        <PromptModal title="Daily calorie goal" placeholder="e.g. 2050" initial={String(state.goal.calories)} onClose={() => setModal(null)} onSubmit={(v) => { const n = parseInt(v, 10); if (Number.isFinite(n) && n > 0) setGoalCalories(n); setModal(null); }} />
      )}
      {modal === 'macros' && <MacroGoalModal onClose={() => setModal(null)} />}
      {modal === 'water' && <WaterGoalModal onClose={() => setModal(null)} />}
      {medModalOpen && <MedScheduleModal onClose={() => setMedModalOpen(false)} />}
      {modal === 'height' && (
        <HeightModal heightCm={state.heightCm} heightUnit={state.heightUnit} onClose={() => setModal(null)} onSubmit={(cm, unit) => { setHeightCm(cm); setHeightUnit(unit); setModal(null); }} />
      )}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
      {modal === 'time' && <ReminderTimeModal onClose={() => setModal(null)} />}

      <BottomNav active="settings" />
    </Screen>
  );
}

function rowLabel(t: ReturnType<typeof useStore>['theme']) {
  return { fontFamily: F.b600, fontSize: 14, color: t.ink } as const;
}

function Card({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 22, overflow: 'hidden', marginBottom: 20 }}>{children}</View>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>{children}</Text>;
}

function Row({ children, border, onPress }: { children: React.ReactNode; border?: boolean; onPress?: () => void }) {
  const { theme: t } = useStore();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 18, borderTopWidth: border ? 1 : 0, borderTopColor: t.border2 }}>
      {children}
    </Pressable>
  );
}

function ChevronValue({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {children ? <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted }}>{children}</Text> : null}
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.faint} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m9 6 6 6-6 6" /></Svg>
    </View>
  );
}
