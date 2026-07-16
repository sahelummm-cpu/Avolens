import { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { useStore } from '@/lib/store';
import { cmToFtIn, computeGoal, ftInToCm, KG_PER_LB, type DietSplit } from '@/lib/goals';
import { CUSTOM_MED_KEY, MEDICATIONS } from '@/lib/meds';
import { supabaseConfigured } from '@/lib/supabase';
import type { ActivityLevel, GoalType, HeightUnit, OnboardingProfile, Sex, WeightUnit } from '@/lib/types';
import { F } from '@/lib/fonts';

const PRIVACY_URL = 'https://avolens.app/privacy';
const TERMS_URL = 'https://avolens.app/terms';

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

const DIETS: { key: DietSplit; title: string; sub: string }[] = [
  { key: 'balanced', title: 'Balanced', sub: '30% protein · 40% carbs · 30% fat' },
  { key: 'high-protein', title: 'High protein', sub: '40% protein · 30% carbs · 30% fat' },
  { key: 'low-carb', title: 'Low carb', sub: '35% protein · 25% carbs · 40% fat' },
  { key: 'keto', title: 'Keto', sub: '30% protein · 10% carbs · 60% fat' },
];

/** Daily water goal options (500 ml glasses). */
const WATER_OPTIONS: { glasses: number; title: string; sub: string; rec?: boolean }[] = [
  { glasses: 4, title: '2.0 L', sub: '4 glasses · light activity' },
  { glasses: 5, title: '2.5 L', sub: '5 glasses · recommended', rec: true },
  { glasses: 6, title: '3.0 L', sub: '6 glasses · active days' },
  { glasses: 8, title: '4.0 L', sub: '8 glasses · training hard' },
];

const PACES: Record<'lose' | 'gain', { kg: number; label: string; rec?: boolean }[]> = {
  lose: [
    { kg: 0.25, label: 'Relaxed' },
    { kg: 0.5, label: 'Steady', rec: true },
    { kg: 0.75, label: 'Ambitious' },
  ],
  gain: [
    { kg: 0.125, label: 'Lean' },
    { kg: 0.25, label: 'Steady', rec: true },
    { kg: 0.5, label: 'Aggressive' },
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { state, completeOnboarding, connectHealth, toggleLogReminder, theme: t } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [pace, setPace] = useState<number | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [cm, setCm] = useState('');
  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [usesGlp1, setUsesGlp1] = useState(false);
  const [medKey, setMedKey] = useState('semaglutide');
  const [waterGlasses, setWaterGlasses] = useState(5);
  const [diet, setDiet] = useState<DietSplit>('balanced');
  const [activity, setActivity] = useState<ActivityLevel | null>(null);

  const heightCm = (): number => (heightUnit === 'cm' ? parseInt(cm, 10) || 0 : ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0));
  const weightKg = (): number => {
    const w = parseFloat(weight) || 0;
    return unit === 'kg' ? w : w * KG_PER_LB;
  };
  const targetKg = (): number | null => {
    const w = parseFloat(targetWeight);
    return Number.isFinite(w) && w > 0 ? (unit === 'kg' ? w : w * KG_PER_LB) : null;
  };

  // Dynamic step list — pace only when losing/gaining, medication only when
  // the user said they take a GLP-1.
  const steps = useMemo(() => {
    const s: string[] = ['name', 'goal', 'about', 'body'];
    if (goalType && goalType !== 'maintain') s.push('pace');
    if (usesGlp1) s.push('glp1');
    s.push('diet', 'water', 'activity', 'summary');
    return s;
  }, [goalType, usesGlp1]);
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = current === 'summary';

  const valid: Record<string, boolean> = {
    name: true,
    goal: goalType !== null,
    about: sex !== null && (parseInt(age, 10) || 0) >= 13 && (parseInt(age, 10) || 0) <= 100,
    body: heightCm() >= 90 && heightCm() <= 250 && weightKg() >= 30 && weightKg() <= 300,
    pace: pace !== null,
    glp1: medKey.length > 0,
    diet: true,
    water: true,
    activity: activity !== null,
    summary: true,
  };

  const next = () => {
    Keyboard.dismiss();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const profile = (): OnboardingProfile => ({
    goalType: goalType!,
    sex: sex!,
    age: parseInt(age, 10),
    heightCm: heightCm(),
    heightUnit,
    weightKg: Math.round(weightKg() * 10) / 10,
    unit,
    activityLevel: activity!,
    targetWeightKg: targetKg() != null ? Math.round(targetKg()! * 10) / 10 : null,
    usesGlp1,
    medKey: usesGlp1 ? medKey : undefined,
    waterGlasses,
    paceKgPerWeek: pace ?? undefined,
    dietSplit: diet,
    name: name.trim() || undefined,
  });

  const finish = (dest: '/paywall' | '/auth') => {
    completeOnboarding(profile());
    if (dest === '/auth') router.push('/auth');
    else router.replace('/paywall');
  };

  const switchHeightUnit = (u: HeightUnit) => {
    if (u === heightUnit) return;
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
    if (Number.isFinite(w)) setWeight(String(Math.round((u === 'lb' ? w / KG_PER_LB : w * KG_PER_LB) * 10) / 10));
    if (targetWeight) {
      const tw = parseFloat(targetWeight);
      if (Number.isFinite(tw)) setTargetWeight(String(Math.round((u === 'lb' ? tw / KG_PER_LB : tw * KG_PER_LB) * 10) / 10));
    }
    setUnit(u);
  };

  const paceLabel = (kg: number) => (unit === 'lb' ? `${(kg * 2.20462).toFixed(kg < 0.2 ? 2 : 1)} lb` : `${kg} kg`);

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m15 5-7 7 7 7" /></Svg>
          </Pressable>
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
            {steps.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= step ? t.green : t.surface3 }} />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 24 }}>
            {current === 'name' && (
              <StepView>
                <Title t={t.ink}>What should we call you?</Title>
                <Sub t={t.muted}>We'll use it to personalise your plan.</Sub>
                <View style={{ marginTop: 24 }}>
                  <Input value={name} onChangeText={setName} placeholder="Your name" suffix={undefined} keyboard="default" onSubmit={next} />
                </View>
              </StepView>
            )}

            {current === 'goal' && (
              <StepView>
                <Title t={t.ink}>What's your goal?</Title>
                <Sub t={t.muted}>We'll tailor your daily calories and macros to match.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {GOALS.map((g) => (
                    <OptionCard key={g.key} selected={goalType === g.key} onPress={() => { setGoalType(g.key); setPace(g.key === 'lose' ? 0.5 : g.key === 'gain' ? 0.25 : null); }} title={g.title} sub={g.sub} icon={g.icon} />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'about' && (
              <StepView>
                <Title t={t.ink}>About you</Title>
                <Sub t={t.muted}>Used to estimate how much energy you burn at rest.</Sub>
                <FieldLabel t={t.muted2}>Sex</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Chip label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
                  <Chip label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
                </View>
                <FieldLabel t={t.muted2}>Age</FieldLabel>
                <Input value={age} onChangeText={setAge} placeholder="e.g. 28" suffix="years" />
                <FieldLabel t={t.muted2}>Do you use GLP-1 medication?</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Chip label="Yes" selected={usesGlp1} onPress={() => setUsesGlp1(true)} />
                  <Chip label="No" selected={!usesGlp1} onPress={() => setUsesGlp1(false)} />
                </View>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted2, marginTop: 8 }}>Ozempic, Wegovy, Mounjaro, Saxenda… adds dose reminders and injection tracking.</Text>
              </StepView>
            )}

            {current === 'body' && (
              <StepView>
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
                    <View style={{ flex: 1 }}><Input value={ft} onChangeText={setFt} placeholder="5" suffix="ft" /></View>
                    <View style={{ flex: 1 }}><Input value={inch} onChangeText={setInch} placeholder="9" suffix="in" /></View>
                  </View>
                )}
                <FieldLabel t={t.muted2}>Weight</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <Chip label="kg" small selected={unit === 'kg'} onPress={() => switchWeightUnit('kg')} />
                  <Chip label="lb" small selected={unit === 'lb'} onPress={() => switchWeightUnit('lb')} />
                </View>
                <Input value={weight} onChangeText={setWeight} placeholder={unit === 'kg' ? 'e.g. 72' : 'e.g. 159'} suffix={unit} />
                {goalType !== 'maintain' && (
                  <>
                    <FieldLabel t={t.muted2}>Target weight (optional)</FieldLabel>
                    <Input value={targetWeight} onChangeText={setTargetWeight} placeholder={unit === 'kg' ? 'e.g. 68' : 'e.g. 150'} suffix={unit} />
                  </>
                )}
              </StepView>
            )}

            {current === 'pace' && goalType && goalType !== 'maintain' && (
              <StepView>
                <Title t={t.ink}>How fast?</Title>
                <Sub t={t.muted}>Your weekly {goalType === 'lose' ? 'loss' : 'gain'} rate sets your calorie {goalType === 'lose' ? 'deficit' : 'surplus'}.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {PACES[goalType].map((p) => (
                    <OptionCard key={p.kg} selected={pace === p.kg} onPress={() => setPace(p.kg)} title={`${paceLabel(p.kg)} / week`} sub={p.rec ? `${p.label} · recommended` : p.label} />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'glp1' && (
              <StepView>
                <Title t={t.ink}>Which medication?</Title>
                <Sub t={t.muted}>We'll match dose reminders and the dose ladder to your medication. You can change it any time in Settings.</Sub>
                <View style={{ gap: 10, marginTop: 24 }}>
                  {MEDICATIONS.filter((m) => m.key !== CUSTOM_MED_KEY).map((m) => (
                    <OptionCard
                      key={m.key}
                      selected={medKey === m.key}
                      onPress={() => setMedKey(m.key)}
                      title={m.name}
                      sub={`${m.brands} · ${m.frequency === 'weekly' ? 'Weekly' : 'Daily'}`}
                    />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'diet' && (
              <StepView>
                <Title t={t.ink}>Diet preference</Title>
                <Sub t={t.muted}>Sets your macro split. You can change it any time.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {DIETS.map((d) => (
                    <OptionCard key={d.key} selected={diet === d.key} onPress={() => setDiet(d.key)} title={d.title} sub={d.sub} />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'water' && (
              <StepView>
                <Title t={t.ink}>Daily hydration</Title>
                <Sub t={t.muted}>How much water do you want to drink each day? We'll track it in 500 ml glasses on Home.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {WATER_OPTIONS.map((w) => (
                    <OptionCard
                      key={w.glasses}
                      selected={waterGlasses === w.glasses}
                      onPress={() => setWaterGlasses(w.glasses)}
                      title={w.title}
                      sub={w.rec ? `${w.sub} ✓` : w.sub}
                      icon="💧"
                    />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'activity' && (
              <StepView>
                <Title t={t.ink}>How active are you?</Title>
                <Sub t={t.muted}>The last piece — then we'll build your plan.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {ACTIVITIES.map((a) => (
                    <OptionCard key={a.key} selected={activity === a.key} onPress={() => { setActivity(a.key); setStep((s) => s + 1); }} title={a.title} sub={a.sub} />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'summary' && activity && (
              <PlanSummary
                profile={profile()}
                unit={unit}
                usesGlp1={usesGlp1}
                targetKg={targetKg()}
                remindOn={state.logReminderOn}
                healthOn={state.healthConnected}
                onToggleRemind={toggleLogReminder}
                onToggleHealth={() => connectHealth()}
                onStart={() => finish('/paywall')}
                onCreateAccount={supabaseConfigured ? () => finish('/auth') : undefined}
                openLink={(u) => Linking.openURL(u).catch(() => {})}
              />
            )}
          </ScrollView>

          {!isLast && current !== 'activity' && (
            <View style={{ paddingBottom: 32 }}>
              <PrimaryButton onPress={next} disabled={!valid[current]}>Continue</PrimaryButton>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

function PlanSummary({ profile, unit, usesGlp1, targetKg, remindOn, healthOn, onToggleRemind, onToggleHealth, onStart, onCreateAccount, openLink }: {
  profile: OnboardingProfile; unit: WeightUnit; usesGlp1: boolean; targetKg: number | null;
  remindOn: boolean; healthOn: boolean; onToggleRemind: () => void; onToggleHealth: () => void;
  onStart: () => void; onCreateAccount?: () => void; openLink: (u: string) => void;
}) {
  const { theme: t } = useStore();
  const goal = computeGoal(profile);
  const weeks = targetKg != null && profile.paceKgPerWeek ? Math.max(1, Math.round(Math.abs(profile.weightKg - targetKg) / profile.paceKgPerWeek)) : null;

  const Macro = ({ label, g, color }: { label: string; g: number; color: string }) => (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: color }} />
        <Text style={{ fontFamily: F.d800, fontSize: 18, color: t.ink }}>{g}g</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );

  return (
    <Animated.View entering={FadeInRight.duration(260)}>
      <Title t={t.ink}>{profile.name ? `${profile.name}, your plan` : 'Your plan is ready'}</Title>
      <Sub t={t.muted}>Based on your answers — you can fine-tune everything later.</Sub>

      <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 24, padding: 20, marginTop: 22 }}>
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>Daily calorie target</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2, marginBottom: 16 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 40, color: t.ink, letterSpacing: -0.8 }}>{goal.calories.toLocaleString('en-US')}</Text>
          <Text style={{ fontFamily: F.d600, fontSize: 15, color: t.muted2 }}>kcal</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Macro label="Protein" g={goal.protein} color={t.protein} />
          <Macro label="Carbs" g={goal.carbs} color={t.carbs} />
          <Macro label="Fat" g={goal.fat} color={t.fat} />
        </View>
        {weeks != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: t.greenTint, borderRadius: 12, padding: 12 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 3v18h18" /><Path d="m19 9-5 5-4-4-3 3" /></Svg>
            <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.greenGrad2 }}>
              Reach your goal in about {weeks} week{weeks === 1 ? '' : 's'} at {unit === 'lb' ? `${(profile.paceKgPerWeek! * 2.20462).toFixed(1)} lb` : `${profile.paceKgPerWeek} kg`}/week
            </Text>
          </View>
        )}
        {usesGlp1 && (
          <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 12 }}>GLP-1 tracking is on — set up your medication on the Home screen.</Text>
        )}
      </View>

      <FieldLabel t={t.muted2}>Stay on track</FieldLabel>
      <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 20, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Daily reminders</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 1 }}>A nudge to log your meals</Text>
          </View>
          <ToggleSwitch on={remindOn} onChange={onToggleRemind} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: t.border2 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>Sync activity</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 1 }}>{Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} — steps & calories burned</Text>
          </View>
          <ToggleSwitch on={healthOn} onChange={onToggleHealth} />
        </View>
      </View>

      <View style={{ marginTop: 22, gap: 12 }}>
        <PrimaryButton onPress={onStart}>Start tracking</PrimaryButton>
        {onCreateAccount && (
          <Pressable onPress={onCreateAccount} accessibilityRole="button">
            <Text style={{ textAlign: 'center', fontFamily: F.b600, fontSize: 13.5, color: t.green }}>Create an account to save your plan</Text>
          </Pressable>
        )}
        <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 11, color: t.muted2, lineHeight: 17 }}>
          By continuing you agree to our{' '}
          <Text style={{ color: t.green }} onPress={() => openLink(TERMS_URL)}>Terms</Text> and{' '}
          <Text style={{ color: t.green }} onPress={() => openLink(PRIVACY_URL)}>Privacy Policy</Text>.
        </Text>
      </View>
    </Animated.View>
  );
}

function StepView({ children }: { children: React.ReactNode }) {
  return <Animated.View entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>{children}</Animated.View>;
}

function Title({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.d800, fontSize: 28, color: t, letterSpacing: -0.56 }}>{children}</Text>;
}

function Sub({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.b500, fontSize: 14, color: t, marginTop: 8, lineHeight: 21 }}>{children}</Text>;
}

function FieldLabel({ children, t }: { children: React.ReactNode; t: string }) {
  return <Text style={{ fontFamily: F.b700, fontSize: 11, color: t, letterSpacing: 0.66, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>{children}</Text>;
}

function OptionCard({ selected, onPress, title, sub, icon }: { selected: boolean; onPress: () => void; title: string; sub: string; icon?: string }) {
  const { theme: t } = useStore();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: selected ? t.greenTint : t.surface, borderWidth: 1.5, borderColor: selected ? t.green : t.border, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18 }}>
      {icon != null && <Text style={{ fontSize: 24 }}>{icon}</Text>}
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

function Chip({ label, selected, onPress, small }: { label: string; selected: boolean; onPress: () => void; small?: boolean }) {
  const { theme: t } = useStore();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: small ? 0 : 1, paddingVertical: small ? 8 : 14, paddingHorizontal: small ? 18 : 0, borderRadius: 14, borderWidth: 1.5, borderColor: selected ? t.green : t.border, backgroundColor: selected ? t.greenTint : t.surface, alignItems: 'center' }}>
      <Text style={{ fontFamily: F.d700, fontSize: 14, color: selected ? t.green : t.ink }}>{label}</Text>
    </Pressable>
  );
}

function Input({ value, onChangeText, placeholder, suffix, keyboard = 'decimal-pad', onSubmit }: { value: string; onChangeText: (v: string) => void; placeholder: string; suffix?: string; keyboard?: 'decimal-pad' | 'default'; onSubmit?: () => void }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingHorizontal: 15 }}>
      <TextInput keyboardType={keyboard} value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor={t.muted2} style={{ flex: 1, paddingVertical: 13, fontFamily: F.b600, fontSize: 16, color: t.ink }} />
      {suffix != null && <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted2 }}>{suffix}</Text>}
    </View>
  );
}
