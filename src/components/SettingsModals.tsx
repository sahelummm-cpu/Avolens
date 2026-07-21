import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore, useTheme } from '@/lib/store';
import type { ActivityLevel, Sex } from '@/lib/types';
import { F } from '@/lib/fonts';

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const t = useTheme();
  return (
    <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32, maxHeight: '86%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const inputBox = (t: ReturnType<typeof useTheme>) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: t.surface2,
  borderWidth: 1,
  borderColor: t.border,
  borderRadius: 12,
  paddingHorizontal: 14,
});

const SPLITS: { key: string; label: string; p: number; c: number; f: number }[] = [
  { key: 'balanced', label: 'Balanced', p: 0.3, c: 0.4, f: 0.3 },
  { key: 'high-protein', label: 'High protein', p: 0.4, c: 0.3, f: 0.3 },
  { key: 'low-carb', label: 'Low carb', p: 0.35, c: 0.25, f: 0.4 },
  { key: 'keto', label: 'Keto', p: 0.3, c: 0.1, f: 0.6 },
];

export function MacroGoalModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, setGoal } = useStore();
  const [protein, setProtein] = useState(String(state.goal.protein));
  const [carbs, setCarbs] = useState(String(state.goal.carbs));
  const [fat, setFat] = useState(String(state.goal.fat));

  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  const kcal = p * 4 + c * 4 + f * 9;

  const applySplit = (s: (typeof SPLITS)[number]) => {
    const cal = state.goal.calories;
    setProtein(String(Math.round((cal * s.p) / 4)));
    setCarbs(String(Math.round((cal * s.c) / 4)));
    setFat(String(Math.round((cal * s.f) / 9)));
  };

  const save = () => {
    setGoal({ protein: p, carbs: c, fat: f, calories: Math.round(kcal) });
    onClose();
  };

  const Field = ({ label, color, value, onChange }: { label: string; color: string; value: string; onChange: (v: string) => void }) => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: color }} />
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>{label}</Text>
      </View>
      <View style={inputBox(t)}>
        <TextInput keyboardType="number-pad" value={value} onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))} style={{ flex: 1, paddingVertical: 12, fontFamily: F.d700, fontSize: 16, color: t.ink }} />
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>g</Text>
      </View>
    </View>
  );

  return (
    <Sheet onClose={onClose}>
      <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 4 }}>Macro goals</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginBottom: 16 }}>Pick a split, or fine-tune the grams. Calories update to match.</Text>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {SPLITS.map((s) => (
          <Pressable key={s.key} onPress={() => applySplit(s)} accessibilityRole="button" style={{ backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 13 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
        <Field label="Protein" color={t.protein} value={protein} onChange={setProtein} />
        <Field label="Carbs" color={t.carbs} value={carbs} onChange={setCarbs} />
        <Field label="Fat" color={t.fat} value={fat} onChange={setFat} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 18 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink }}>Calories from macros</Text>
        <Text style={{ fontFamily: F.d800, fontSize: 20, color: t.green }}>{Math.round(kcal).toLocaleString('en-US')}</Text>
      </View>

      <SaveButton onPress={save} />
    </Sheet>
  );
}

export function WaterGoalModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, setGoal } = useStore();
  const [glasses, setGlasses] = useState(state.goal.water);

  return (
    <Sheet onClose={onClose}>
      <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 4 }}>Water goal</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginBottom: 20 }}>Each glass is 500 ml.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 22 }}>
        <Stepper onPress={() => setGlasses((g) => Math.max(1, g - 1))} icon="minus" />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: F.d800, fontSize: 30, color: t.ink }}>{glasses}</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>{(glasses * 0.5).toFixed(1)} L</Text>
        </View>
        <Stepper onPress={() => setGlasses((g) => Math.min(20, g + 1))} icon="plus" primary />
      </View>
      <SaveButton onPress={() => { setGoal({ water: glasses }); onClose(); }} />
    </Sheet>
  );
}

const ACTIVITIES: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Mostly sitting' },
  { key: 'light', label: 'Lightly active' },
  { key: 'moderate', label: 'Active' },
  { key: 'very', label: 'Very active' },
];

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, session, setDisplayName, setProfile } = useStore();
  const [name, setName] = useState(state.displayName);
  const [sex, setSex] = useState<Sex | null>(state.sex);
  const [age, setAge] = useState(state.age != null ? String(state.age) : '');
  const [activity, setActivity] = useState<ActivityLevel | null>(state.activityLevel);

  const save = () => {
    setDisplayName(name.trim());
    setProfile({ sex, age: age ? parseInt(age, 10) : null, activityLevel: activity });
    onClose();
  };

  const chip = (active: boolean) => ({ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: active ? t.green : t.border, backgroundColor: active ? t.greenTint : t.surface2, alignItems: 'center' as const });

  return (
    <Sheet onClose={onClose}>
      <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 16 }}>Profile</Text>

      <Label>Display name</Label>
      <View style={[inputBox(t), { marginBottom: 16 }]}>
        <TextInput value={name} onChangeText={setName} placeholder={session?.user.email?.split('@')[0] ?? 'Your name'} placeholderTextColor={t.muted2} style={{ flex: 1, paddingVertical: 12, fontFamily: F.b600, fontSize: 15, color: t.ink }} />
      </View>

      <Label>Sex</Label>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <Pressable onPress={() => setSex('male')} accessibilityRole="button" accessibilityState={{ selected: sex === 'male' }} style={chip(sex === 'male')}><Text style={{ fontFamily: F.d700, fontSize: 14, color: sex === 'male' ? t.green : t.ink }}>Male</Text></Pressable>
        <Pressable onPress={() => setSex('female')} accessibilityRole="button" accessibilityState={{ selected: sex === 'female' }} style={chip(sex === 'female')}><Text style={{ fontFamily: F.d700, fontSize: 14, color: sex === 'female' ? t.green : t.ink }}>Female</Text></Pressable>
        <Pressable onPress={() => setSex('other')} accessibilityRole="button" accessibilityState={{ selected: sex === 'other' }} style={chip(sex === 'other')}><Text style={{ fontFamily: F.d700, fontSize: 14, color: sex === 'other' ? t.green : t.ink }}>Other</Text></Pressable>
      </View>

      <Label>Age</Label>
      <View style={[inputBox(t), { marginBottom: 16 }]}>
        <TextInput keyboardType="number-pad" value={age} onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))} placeholder="e.g. 28" placeholderTextColor={t.muted2} style={{ flex: 1, paddingVertical: 12, fontFamily: F.b600, fontSize: 15, color: t.ink }} />
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>years</Text>
      </View>

      <Label>Activity level</Label>
      <View style={{ gap: 8, marginBottom: 20 }}>
        {ACTIVITIES.map((a) => (
          <Pressable key={a.key} onPress={() => setActivity(a.key)} accessibilityRole="button" accessibilityState={{ selected: activity === a.key }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: activity === a.key ? t.green : t.border, backgroundColor: activity === a.key ? t.greenTint : t.surface2 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>{a.label}</Text>
            {activity === a.key && <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
          </Pressable>
        ))}
      </View>

      <SaveButton onPress={save} />
    </Sheet>
  );
}

export function ReminderTimeModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, setLogReminderTime } = useStore();
  const [hour, setHour] = useState(state.logReminderHour);
  const [minute, setMinute] = useState(state.logReminderMinute);
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';

  return (
    <Sheet onClose={onClose}>
      <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 4 }}>Reminder time</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginBottom: 20 }}>When should we nudge you to log your meals?</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 22 }}>
        <Stepper onPress={() => setHour((h) => (h + 23) % 24)} icon="minus" />
        <Pressable onPress={() => setMinute((m) => (m === 0 ? 30 : 0))} accessibilityRole="button">
          <Text style={{ fontFamily: F.d800, fontSize: 30, color: t.ink }}>{h12}:{String(minute).padStart(2, '0')}<Text style={{ fontSize: 16, color: t.muted }}> {ampm}</Text></Text>
        </Pressable>
        <Stepper onPress={() => setHour((h) => (h + 1) % 24)} icon="plus" primary />
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted2, textAlign: 'center', marginBottom: 18 }}>Tap the time to switch between :00 and :30</Text>
      <SaveButton onPress={() => { setLogReminderTime(hour, minute); onClose(); }} />
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 8 }}>{children}</Text>;
}

function Stepper({ onPress, icon, primary }: { onPress: () => void; icon: 'plus' | 'minus'; primary?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: primary ? t.green : t.surface2, borderWidth: primary ? 0 : 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={primary ? '#fff' : t.ink} strokeWidth={2.8} strokeLinecap="round">
        {icon === 'plus' ? <Path d="M12 5v14M5 12h14" /> : <Path d="M5 12h14" />}
      </Svg>
    </Pressable>
  );
}

function SaveButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: '100%', height: 50, borderRadius: 16, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Save</Text>
    </Pressable>
  );
}
