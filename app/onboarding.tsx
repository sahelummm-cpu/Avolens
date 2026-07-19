import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { cmToFtIn, ftInToCm, KG_PER_LB, type DietSplit } from '@/lib/goals';
import { CUSTOM_MED_KEY, MEDICATIONS } from '@/lib/meds';
import { supabaseConfigured } from '@/lib/supabase';
import type { ActivityLevel, GoalType, HeightUnit, OnboardingProfile, Sex, WeightUnit } from '@/lib/types';
import type { Theme } from '@/lib/theme';
import { F } from '@/lib/fonts';
import { Chip, FieldLabel, OptionCard, StepView, Sub, Title } from '@/features/funnel/components/ui';
import { RulerSlider } from '@/features/funnel/components/RulerSlider';
import { DerailerStep, type Derailer } from '@/features/funnel/steps/DerailerStep';
import { ExperienceStep, type PriorAttempts } from '@/features/funnel/steps/ExperienceStep';
import { AnalyzingStep } from '@/features/funnel/steps/AnalyzingStep';
import { OnboardingScannerDemo } from '@/features/funnel/steps/ScannerDemoStep';
import { ProjectionStep } from '@/features/funnel/steps/ProjectionStep';
import { tap } from '@/features/funnel/haptics';

/**
 * Funnel spine. The two behavioral steps open the quiz, the profile steps
 * feed the calorie engine, then a fixed "analyzing" interstitial hands over
 * to the projection/results step. Only the quiz steps tick the progress rail —
 * 'analyzing' runs chromeless and 'summary' shows the rail full.
 */
const STEP_KEYS = ['derailer', 'experience', 'name', 'goal', 'about', 'body', 'preferences', 'scanner', 'analyzing', 'summary'] as const;
type StepKey = (typeof STEP_KEYS)[number];

const QUIZ_TOTAL = STEP_KEYS.indexOf('analyzing');
const SCANNER_IDX = STEP_KEYS.indexOf('scanner');
const SUMMARY_IDX = STEP_KEYS.indexOf('summary');

const GOALS: { key: GoalType; title: string; sub: string; icon: 'down' | 'equal' | 'up' }[] = [
  { key: 'lose', title: 'Lose weight', sub: 'Trim down with a calorie deficit', icon: 'down' },
  { key: 'maintain', title: 'Maintain', sub: 'Stay right where you are', icon: 'equal' },
  { key: 'gain', title: 'Build muscle', sub: 'Fuel growth with a surplus', icon: 'up' },
];

const ACTIVITIES: { key: ActivityLevel; title: string; sub: string }[] = [
  { key: 'sedentary', title: 'Mostly sitting', sub: 'Desk job, little exercise' },
  { key: 'light', title: 'Lightly active', sub: 'Walks or light exercise 1–3× a week' },
  { key: 'moderate', title: 'Active', sub: 'Exercise 3–5× a week' },
  { key: 'very', title: 'Very active', sub: 'Hard training 6–7× a week' },
];

const DIETS: { key: DietSplit; title: string; sub: string }[] = [
  { key: 'balanced', title: 'Balanced', sub: '30/40/30' },
  { key: 'high-protein', title: 'High protein', sub: '40/30/30' },
  { key: 'low-carb', title: 'Low carb', sub: '35/25/40' },
  { key: 'keto', title: 'Keto', sub: '30/10/60' },
];

/** Daily water goal options (500 ml glasses). */
const WATER_OPTIONS: { glasses: number; title: string; sub: string; rec?: boolean }[] = [
  { glasses: 4, title: '2.0L', sub: 'Light' },
  { glasses: 5, title: '2.5L', sub: 'Typical', rec: true },
  { glasses: 6, title: '3.0L', sub: 'Active' },
  { glasses: 8, title: '4.0L', sub: 'Training' },
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

/** Ruler ranges per display unit (weight sliders). */
const WEIGHT_RANGE: Record<WeightUnit, { min: number; max: number; step: number }> = {
  kg: { min: 35, max: 230, step: 0.5 },
  lb: { min: 77, max: 507, step: 1 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { state, completeOnboarding, connectHealth, toggleLogReminder, theme: t } = useStore();

  const [step, setStep] = useState(0);
  const [derailer, setDerailer] = useState<Derailer | null>(null);
  const [attempts, setAttempts] = useState<PriorAttempts | null>(null);
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
  const [weight, setWeight] = useState(70); // in display unit
  const [targetWeight, setTargetWeight] = useState<number | null>(null); // in display unit; seeded on entering the body step

  const [usesGlp1, setUsesGlp1] = useState(false);
  const [medKey, setMedKey] = useState('semaglutide');
  const [waterGlasses, setWaterGlasses] = useState(5);
  const [diet, setDiet] = useState<DietSplit>('balanced');
  const [activity, setActivity] = useState<ActivityLevel | null>(null);

  const current: StepKey = STEP_KEYS[step];

  const heightCm = (): number => (heightUnit === 'cm' ? parseInt(cm, 10) || 0 : ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0));
  const weightKg = (): number => (unit === 'kg' ? weight : weight * KG_PER_LB);
  const targetKg = (): number | null => {
    if (goalType === 'maintain' || targetWeight == null) return null;
    return Math.round((unit === 'kg' ? targetWeight : targetWeight * KG_PER_LB) * 10) / 10;
  };

  // Seed the target slider relative to current weight the first time the body
  // step is reached, so the tape starts near a sensible goal instead of at min.
  useEffect(() => {
    if (current !== 'body' || targetWeight != null || goalType === 'maintain') return;
    const delta = (goalType === 'gain' ? 5 : -5) * (unit === 'lb' ? 2 : 1);
    const r = WEIGHT_RANGE[unit];
    setTargetWeight(Math.min(r.max, Math.max(r.min, weight + delta)));
  }, [current, targetWeight, goalType, unit, weight]);

  const valid: Record<StepKey, boolean> = {
    derailer: derailer !== null,
    experience: attempts !== null,
    name: true,
    goal: goalType !== null && (goalType === 'maintain' || pace !== null),
    about: sex !== null && (parseInt(age, 10) || 0) >= 13 && (parseInt(age, 10) || 0) <= 100,
    body: heightCm() >= 90 && heightCm() <= 250,
    preferences: activity !== null,
    scanner: true,
    analyzing: true,
    summary: true,
  };

  const next = () => {
    Keyboard.dismiss();
    tap();
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  };
  const back = () => {
    if (step === 0) return router.back();
    // Don't land back on the interstitial — it would replay its 4 seconds.
    setStep((s) => (STEP_KEYS[s] === 'summary' ? SCANNER_IDX : s - 1));
  };

  const profile = (): OnboardingProfile => ({
    goalType: goalType!,
    sex: sex!,
    age: parseInt(age, 10),
    heightCm: heightCm(),
    heightUnit,
    weightKg: Math.round(weightKg() * 10) / 10,
    unit,
    activityLevel: activity!,
    targetWeightKg: targetKg(),
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
    const convert = (v: number) => (u === 'lb' ? Math.round(v / KG_PER_LB) : Math.round((v * KG_PER_LB) * 2) / 2);
    setWeight(convert(weight));
    setTargetWeight((tw) => (tw == null ? null : convert(tw)));
    setUnit(u);
  };

  const paceLabel = (kg: number) => (unit === 'lb' ? `${(kg * 2.20462).toFixed(kg < 0.2 ? 2 : 1)} lb` : `${kg} kg`);
  const fmtWeight = (v: number) => `${v} ${unit}`;

  if (current === 'scanner') {
    return <OnboardingScannerDemo onDone={next} onBack={back} />;
  }

  if (current === 'analyzing') {
    return (
      <Screen>
        <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 24 }}>
          <AnalyzingStep name={name.trim() || undefined} onDone={() => setStep(SUMMARY_IDX)} t={t} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 24 }}>
        <StepRail step={Math.min(step, QUIZ_TOTAL - 1)} total={QUIZ_TOTAL} onBack={back} t={t} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 24, paddingTop: 6 }}>
            {current === 'derailer' && (
              <StepView index={step} t={t}>
                <DerailerStep value={derailer} onSelect={setDerailer} t={t} />
              </StepView>
            )}

            {current === 'experience' && (
              <StepView index={step} t={t}>
                <ExperienceStep value={attempts} onSelect={setAttempts} t={t} />
              </StepView>
            )}

            {current === 'name' && (
              <StepView index={step} t={t}>
                <Title t={t.ink}>What should we call you?</Title>
                <Sub t={t.muted}>We'll use it to personalise your plan.</Sub>
                <View style={{ marginTop: 28 }}>
                  <Input value={name} onChangeText={setName} placeholder="Your name" keyboard="default" onSubmit={next} t={t} />
                </View>
              </StepView>
            )}

            {current === 'goal' && (
              <StepView index={step} t={t}>
                <Title t={t.ink}>What's your goal?</Title>
                <Sub t={t.muted}>We'll tailor your daily calories and macros to match.</Sub>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {GOALS.map((g) => (
                    <OptionCard key={g.key} selected={goalType === g.key} onPress={() => { setGoalType(g.key); setPace(g.key === 'lose' ? 0.5 : g.key === 'gain' ? 0.25 : null); }} title={g.title} sub={g.sub} icon={<TrendIcon dir={g.icon} color={t.muted} />} />
                  ))}
                </View>
                {goalType && goalType !== 'maintain' && (
                  <Animated.View entering={FadeIn.duration(240)}>
                    <FieldLabel t={t.muted2}>How fast?</FieldLabel>
                    <View style={{ gap: 10 }}>
                      {PACES[goalType].map((p) => (
                        <OptionCard key={p.kg} compact selected={pace === p.kg} onPress={() => setPace(p.kg)} title={`${paceLabel(p.kg)} / week`} sub={p.rec ? `${p.label} · recommended` : p.label} />
                      ))}
                    </View>
                  </Animated.View>
                )}
              </StepView>
            )}

            {current === 'about' && (
              <StepView index={step} t={t}>
                <Title t={t.ink}>About you</Title>
                <Sub t={t.muted}>Used to estimate how much energy you burn at rest.</Sub>
                <FieldLabel t={t.muted2}>Sex</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Chip label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
                  <Chip label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
                </View>
                <FieldLabel t={t.muted2}>Age</FieldLabel>
                <Input value={age} onChangeText={setAge} placeholder="e.g. 28" suffix="years" t={t} />
                <FieldLabel t={t.muted2}>Do you use GLP-1 medication?</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Chip label="Yes" selected={usesGlp1} onPress={() => setUsesGlp1(true)} />
                  <Chip label="No" selected={!usesGlp1} onPress={() => setUsesGlp1(false)} />
                </View>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted2, marginTop: 8 }}>Ozempic, Wegovy, Mounjaro, Saxenda… adds dose reminders and injection tracking.</Text>
                {usesGlp1 && (
                  <Animated.View entering={FadeIn.duration(220)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {MEDICATIONS.filter((m) => m.key !== CUSTOM_MED_KEY).map((m) => (
                      <Chip key={m.key} label={m.name} small selected={medKey === m.key} onPress={() => setMedKey(m.key)} />
                    ))}
                  </Animated.View>
                )}
              </StepView>
            )}

            {current === 'body' && (
              <StepView index={step} t={t}>
                <Title t={t.ink}>Your body</Title>
                <Sub t={t.muted}>Height and weight — drag the tape, switch units any time.</Sub>
                <FieldLabel t={t.muted2}>Height</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <Chip label="cm" small selected={heightUnit === 'cm'} onPress={() => switchHeightUnit('cm')} />
                  <Chip label="ft / in" small selected={heightUnit === 'ftin'} onPress={() => switchHeightUnit('ftin')} />
                </View>
                {heightUnit === 'cm' ? (
                  <Input value={cm} onChangeText={setCm} placeholder="e.g. 174" suffix="cm" t={t} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ flex: 1 }}><Input value={ft} onChangeText={setFt} placeholder="5" suffix="ft" t={t} /></View>
                    <View style={{ flex: 1 }}><Input value={inch} onChangeText={setInch} placeholder="9" suffix="in" t={t} /></View>
                  </View>
                )}
                <FieldLabel t={t.muted2}>Current weight</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                  <Chip label="kg" small selected={unit === 'kg'} onPress={() => switchWeightUnit('kg')} />
                  <Chip label="lb" small selected={unit === 'lb'} onPress={() => switchWeightUnit('lb')} />
                </View>
                <RulerSlider key={`w-${unit}`} {...WEIGHT_RANGE[unit]} value={weight} onChange={setWeight} format={fmtWeight} />
                {goalType !== 'maintain' && targetWeight != null && (
                  <>
                    <FieldLabel t={t.muted2}>Target weight</FieldLabel>
                    <RulerSlider key={`t-${unit}`} {...WEIGHT_RANGE[unit]} value={targetWeight} onChange={setTargetWeight} format={fmtWeight} />
                  </>
                )}
              </StepView>
            )}

            {current === 'preferences' && (
              <StepView index={step} t={t}>
                <Title t={t.ink}>Fine-tune your plan</Title>
                <Sub t={t.muted}>Diet style, hydration goal, and how active you are.</Sub>

                <FieldLabel t={t.muted2}>Diet preference</FieldLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {DIETS.map((d) => (
                    <DietCard key={d.key} selected={diet === d.key} onPress={() => { tap(); setDiet(d.key); }} title={d.title} sub={d.sub} t={t} />
                  ))}
                </View>

                <FieldLabel t={t.muted2}>Daily hydration</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {WATER_OPTIONS.map((w) => (
                    <WaterPill key={w.glasses} selected={waterGlasses === w.glasses} onPress={() => { tap(); setWaterGlasses(w.glasses); }} title={w.title} sub={w.sub} rec={w.rec} t={t} />
                  ))}
                </View>

                <FieldLabel t={t.muted2}>Activity level</FieldLabel>
                <View style={{ gap: 10 }}>
                  {ACTIVITIES.map((a) => (
                    <OptionCard key={a.key} compact selected={activity === a.key} onPress={() => setActivity(a.key)} title={a.title} sub={a.sub} />
                  ))}
                </View>
              </StepView>
            )}

            {current === 'summary' && activity && (
              <ProjectionStep
                profile={profile()}
                unit={unit}
                usesGlp1={usesGlp1}
                targetKg={targetKg()}
                derailer={derailer}
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

          {current !== 'summary' && (
            <View style={{ paddingBottom: 32 }}>
              <PrimaryButton onPress={next} disabled={!valid[current]}>Continue</PrimaryButton>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

/**
 * Slim top rail: back button, a spring-filled progress track with a leading
 * "seed" marker, and a monospaced 01/07 counter. The seed rides the fill's
 * tip — small nod to the AvoLens leaf mark without literally drawing one.
 */
function StepRail({ step, total, onBack, t }: { step: number; total: number; onBack: () => void; t: Theme }) {
  const [trackW, setTrackW] = useState(0);
  const fillW = useSharedValue(0);
  const fraction = (step + 1) / total;

  useEffect(() => {
    fillW.value = withSpring(fraction * trackW, { damping: 16, stiffness: 120, mass: 0.5 });
  }, [fraction, trackW, fillW]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillW.value }));
  const markerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: fillW.value - 5 }] }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 30 }}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m15 5-7 7 7 7" /></Svg>
      </Pressable>
      <View onLayout={(e) => setTrackW(e.nativeEvent.layout.width)} style={{ flex: 1, height: 6 }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, borderRadius: 99, backgroundColor: t.surface3 }} />
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, height: 6, borderRadius: 99, backgroundColor: t.green }, fillStyle]} />
        <Animated.View style={[{ position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 99, backgroundColor: t.green, borderWidth: 2, borderColor: t.bg }, markerStyle]} />
      </View>
      <Text style={{ fontFamily: F.d700, fontSize: 11.5, color: t.muted2, letterSpacing: 0.4, minWidth: 42, textAlign: 'right' }}>
        {String(step + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
      </Text>
    </View>
  );
}

function DietCard({ selected, onPress, title, sub, t }: { selected: boolean; onPress: () => void; title: string; sub: string; t: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        width: '47%',
        backgroundColor: selected ? t.greenTint : t.surface,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        borderRadius: 18,
        padding: 14,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>{title}</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: t.muted, marginTop: 3 }}>{sub} split</Text>
    </Pressable>
  );
}

function WaterPill({ selected, onPress, title, sub, rec, t }: { selected: boolean; onPress: () => void; title: string; sub: string; rec?: boolean; t: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: selected ? t.greenTint : t.surface,
        borderWidth: 1.5,
        borderColor: selected ? t.green : t.border,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Text style={{ fontFamily: F.d800, fontSize: 15, color: selected ? t.green : t.ink }}>{title}</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 9, color: t.muted2, marginTop: 3 }}>{sub}</Text>
      {rec && <View style={{ marginTop: 4, width: 5, height: 5, borderRadius: 9, backgroundColor: t.green }} />}
    </Pressable>
  );
}

/** Lose/maintain/gain glyph — trend arrows for lose/gain, an equals sign for maintain. Avoids emoji icons per the house style guide. */
function TrendIcon({ dir, color }: { dir: 'down' | 'equal' | 'up'; color: string }) {
  if (dir === 'equal') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 9h14M5 15h14" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={dir === 'up' ? 'M22 7 13.5 15.5 8.5 10.5 2 17' : 'M22 17 13.5 8.5 8.5 13.5 2 7'} />
      <Path d={dir === 'up' ? 'M16 7h6v6' : 'M16 17h6v-6'} />
    </Svg>
  );
}

function Input({ value, onChangeText, placeholder, suffix, keyboard = 'decimal-pad', onSubmit, t }: { value: string; onChangeText: (v: string) => void; placeholder: string; suffix?: string; keyboard?: 'decimal-pad' | 'default'; onSubmit?: () => void; t: Theme }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderBottomWidth: 2, borderBottomColor: value ? t.green : t.border, paddingBottom: 10 }}>
      <TextInput keyboardType={keyboard} value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor={t.faint} style={{ flex: 1, fontFamily: F.d800, fontSize: 26, color: t.ink, letterSpacing: -0.3 }} />
      {suffix != null && <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted2, paddingBottom: 4 }}>{suffix}</Text>}
    </View>
  );
}
