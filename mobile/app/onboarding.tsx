import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { cmToFtIn, ftInToCm, KG_PER_LB } from '@/lib/goals';
import type { ActivityLevel, GoalType, HeightUnit, Sex, WeightUnit } from '@/lib/types';
import { F } from '@/lib/fonts';

const STEPS = 4;

const GOALS: { key: GoalType; title: string; sub: string; icon: string }[] = [
  { key: 'lose', title: 'Lose weight', sub: 'Trim down with a calorie deficit', icon: '📉' },
  { key: 'maintain', title: 'Maintain', sub: 'Stay right where you are', icon: '⚖️' },
  { key: 'gain', title: 'Build muscle', sub: 'Fuel growth with a surplus', icon: '💪' },
];

const ACTIVITIES: { key: ActivityLevel; title: string; sub: string }[] = [
  { key: 'sedentary', title: 'Mostly sitting', sub: 'Desk job, little exercise' },
  { key: 'light', title: 'Lightly active', sub: 'Walks or light exercise 1–3× a week' },
  { key: 'moderate', title: 'Active', sub: 'Exercise 3–5× a week' },
  { key: 'very', title: 'Very active', sub: 'Hard training 6–7× a week' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding, theme: t } = useStore();

  const [step, setStep] = useState(0);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [cm, setCm] = useState('');
  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState('');

  const heightCm = (): number => {
    if (heightUnit === 'cm') return parseInt(cm, 10) || 0;
    return ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0);
  };

  const weightKg = (): number => {
    const w = parseFloat(weight) || 0;
    return unit === 'kg' ? w : w * KG_PER_LB;
  };

  const stepValid = [
    goalType !== null,
    sex !== null && (parseInt(age, 10) || 0) >= 13 && (parseInt(age, 10) || 0) <= 100,
    heightCm() >= 90 && heightCm() <= 250 && weightKg() >= 30 && weightKg() <= 300,
    true, // activity picked on tap
  ][step];

  const next = () => {
    Keyboard.dismiss();
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const finish = (activityLevel: ActivityLevel) => {
    completeOnboarding({
      goalType: goalType!,
      sex: sex!,
      age: parseInt(age, 10),
      heightCm: heightCm(),
      heightUnit,
      weightKg: Math.round(weightKg() * 10) / 10,
      unit,
      activityLevel,
    });
    router.replace('/paywall');
  };

  const switchHeightUnit = (u: HeightUnit) => {
    if (u === heightUnit) return;
    // Carry the entered value across units.
    if (u === 'ftin' && cm) {
      const v = cmToFtIn(parseInt(cm, 10) || 0);
      setFt(v.ft ? String(v.ft) : '');
      setInch(v.ft ? String(v.inch) : '');
    } else if (u === 'cm' && (ft || inch)) {
      const v = ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0);
      setCm(v ? String(v) : '');
    }
    setHeightUnit(u);
  };

  const switchWeightUnit = (u: WeightUnit) => {
    if (u === unit) return;
    const w = parseFloat(weight);
    if (Number.isFinite(w)) {
      setWeight(String(Math.round((u === 'lb' ? w / KG_PER_LB : w * KG_PER_LB) * 10) / 10));
    }
    setUnit(u);
  };

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 24 }}>
        {/* Header: back + progress */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m15 5-7 7 7 7" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= step ? t.green : t.surface3 }} />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {step === 0 && (
            <Animated.View key="s0" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
              <Title t={t.ink}>What's your goal?</Title>
              <Sub t={t.muted}>We'll tailor your daily calories and macros to match.</Sub>
              <View style={{ gap: 12, marginTop: 24 }}>
                {GOALS.map((g) => (
                  <OptionCard key={g.key} selected={goalType === g.key} onPress={() => setGoalType(g.key)} title={g.title} sub={g.sub} icon={g.icon} />
                ))}
              </View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View key="s1" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
              <Title t={t.ink}>About you</Title>
              <Sub t={t.muted}>Used to estimate how much energy you burn at rest.</Sub>
              <FieldLabel t={t.muted2}>Sex</FieldLabel>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Chip label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
                <Chip label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
              </View>
              <FieldLabel t={t.muted2}>Age</FieldLabel>
              <Input value={age} onChangeText={setAge} placeholder="e.g. 28" suffix="years" />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View key="s2" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
              <Title t={t.ink}>Your body</Title>
              <Sub t={t.muted}>Height and current weight — switch units any time.</Sub>

              <FieldLabel t={t.muted2}>Height</FieldLabel>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <Chip label="cm" small selected={heightUnit === 'cm'} onPress={() => switchHeightUnit('cm')} />
                <Chip label="ft / in" small selected={heightUnit === 'ftin'} onPress={() => switchHeightUnit('ftin')} />
              </View>
              {heightUnit === 'cm' ? (
                <Input value={cm} onChangeText={setCm} placeholder="e.g. 174" suffix="cm" />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Input value={ft} onChangeText={setFt} placeholder="5" suffix="ft" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input value={inch} onChangeText={setInch} placeholder="9" suffix="in" />
                  </View>
                </View>
              )}

              <FieldLabel t={t.muted2}>Weight</FieldLabel>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <Chip label="kg" small selected={unit === 'kg'} onPress={() => switchWeightUnit('kg')} />
                <Chip label="lb" small selected={unit === 'lb'} onPress={() => switchWeightUnit('lb')} />
              </View>
              <Input value={weight} onChangeText={setWeight} placeholder={unit === 'kg' ? 'e.g. 72' : 'e.g. 159'} suffix={unit} />
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View key="s3" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
              <Title t={t.ink}>How active are you?</Title>
              <Sub t={t.muted}>Pick one and we'll build your plan.</Sub>
              <View style={{ gap: 12, marginTop: 24 }}>
                {ACTIVITIES.map((a) => (
                  <OptionCard key={a.key} selected={false} onPress={() => finish(a.key)} title={a.title} sub={a.sub} />
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {step < 3 && (
          <View style={{ paddingBottom: 32 }}>
            <PrimaryButton onPress={next} disabled={!stepValid}>
              Continue
            </PrimaryButton>
          </View>
        )}
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

function Title({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.d800, fontSize: 28, color: t, letterSpacing: -0.56 }}>{children}</Text>;
}

function Sub({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.b500, fontSize: 14, color: t, marginTop: 8, lineHeight: 21 }}>{children}</Text>;
}

function FieldLabel({ children, t }: { children: React.ReactNode; t: string }) {
  return (
    <Text style={{ fontFamily: F.b700, fontSize: 11, color: t, letterSpacing: 0.66, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

function OptionCard({ selected, onPress, title, sub, icon }: { selected: boolean; onPress: () => void; title: string; sub: string; icon?: string }) {
  const { theme: t } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: selected ? t.greenTint : t.surface,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 18,
      }}
    >
      {icon != null && <Text style={{ fontSize: 24 }}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 2 }}>{sub}</Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 99,
          borderWidth: 2,
          borderColor: selected ? t.green : t.faint,
          backgroundColor: selected ? t.green : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m5 12 5 5 9-11" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

function Chip({ label, selected, onPress, small }: { label: string; selected: boolean; onPress: () => void; small?: boolean }) {
  const { theme: t } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flex: small ? 0 : 1,
        paddingVertical: small ? 8 : 14,
        paddingHorizontal: small ? 18 : 0,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        backgroundColor: selected ? t.greenTint : t.surface,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: F.d700, fontSize: 14, color: selected ? t.green : t.ink }}>{label}</Text>
    </Pressable>
  );
}

function Input({ value, onChangeText, placeholder, suffix }: { value: string; onChangeText: (v: string) => void; placeholder: string; suffix?: string }) {
  const { theme: t } = useStore();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        paddingHorizontal: 15,
      }}
    >
      <TextInput
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted2}
        style={{ flex: 1, paddingVertical: 13, fontFamily: F.b600, fontSize: 16, color: t.ink }}
      />
      {suffix != null && <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted2 }}>{suffix}</Text>}
    </View>
  );
}
