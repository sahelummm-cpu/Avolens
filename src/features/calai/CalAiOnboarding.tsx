/**
 * Cal AI onboarding clone — orchestrator.
 *
 * Reproduces the Cal AI new-user funnel step-for-step from the reference
 * recording: welcome → questionnaire (gender, workouts, birthday, source,
 * weight, goal, target, pace, diet, calorie behaviour) interleaved with the
 * motivational interstitials, then the "setting everything up" loader, the
 * custom-plan reveal, and the account screen.
 *
 * Fully self-contained: local state only, no dependency on the AvoLens store.
 * `onExit` fires when the user finishes or leaves the flow.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { F } from '@/lib/fonts';
import {
  C,
  Cta,
  Note,
  OptionRow,
  ProgressHeader,
  Ruler,
  Screen,
  Segmented,
  Sub,
  TextField,
  Title,
  Wheel,
  WheelBand,
  YesNo,
} from './kit';
import {
  BurnedCard,
  Comparison,
  HandsIllustration,
  PotentialChart,
  Review,
  RolloverCards,
  TrendChart,
} from './graphics';

import { Logo } from '@/components/Logo';
import { OnboardingScannerDemo } from '@/features/funnel/steps/ScannerDemoStep';
import { useStore } from '@/lib/store';
import type { OnboardingProfile } from '@/lib/types';

type WeightUnit = 'lbs' | 'kg';
type Goal = 'lose' | 'maintain' | 'gain';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: 90 }, (_, i) => `${2010 - i}`); // 2010 → 1921

/* --------------------------------------------------------------- helpers */

function CenterView({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>{children}</View>;
}

/** Small brand tile for the "Where did you hear about us?" list. */
function SourceIcon({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; fg: string; glyph: string }> = {
    Instagram: { bg: '#E1306C', fg: '#fff', glyph: '◉' },
    TikTok: { bg: '#111', fg: '#fff', glyph: '♪' },
    Google: { bg: '#fff', fg: '#4285F4', glyph: 'G' },
    TV: { bg: '#111', fg: '#fff', glyph: '▭' },
    Facebook: { bg: '#1877F2', fg: '#fff', glyph: 'f' },
    'App Store': { bg: '#0A84FF', fg: '#fff', glyph: 'A' },
    'Friend or family': { bg: '#111', fg: '#fff', glyph: '☺' },
  };
  const m = map[kind] ?? { bg: C.ink, fg: '#fff', glyph: '•' };
  return (
    <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: m.bg, borderWidth: m.bg === '#fff' ? 1 : 0, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.d800, fontSize: 15, color: m.fg }}>{m.glyph}</Text>
    </View>
  );
}

/** The braille-like dot clusters Cal AI shows next to each workout tier. */
function WorkoutDots({ n }: { n: 1 | 3 | 6 }) {
  const dot = (cx: number, cy: number) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.6} fill={C.ink} />;
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      {n === 1 && dot(13, 13)}
      {n === 3 && [dot(9, 9), dot(17, 10), dot(12, 17)]}
      {n === 6 && [dot(8, 8), dot(8, 13), dot(8, 18), dot(14, 8), dot(14, 13), dot(14, 18)]}
    </Svg>
  );
}

function GoalArrow({ dir }: { dir: 'down' | 'flat' | 'up' }) {
  if (dir === 'flat')
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round"><Path d="M5 12h14" /></Svg>
    );
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d={dir === 'down' ? 'M12 5v14M6 13l6 6 6-6' : 'M12 19V5M6 11l6-6 6 6'} />
    </Svg>
  );
}

/* ==================================================================== main */

const STEPS = [
  'demoScan',
  'gender',
  'workouts',
  'birth',
  'source',
  'trend',
  'weight',
  'goal',
  'desired',
  'pace',
  'comparison',
  'diet',
  'potential',
  'burned',
  'rollover',
  'reviews',
  'thankyou',
  'notifications',
  'referral',
] as const;
type Step = (typeof STEPS)[number];

export default function CalAiOnboarding({ onExit }: { onExit?: () => void }) {
  const { completeOnboarding: saveProfile } = useStore();
  const [phase, setPhase] = useState<'welcome' | 'quiz' | 'loading' | 'plan' | 'account'>('welcome');
  const [i, setI] = useState(0);

  // answers
  const [gender, setGender] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<string | null>(null);
  const [mo, setMo] = useState(0);
  const [day, setDay] = useState(0);
  const [yr, setYr] = useState(24); // 1986
  const [source, setSource] = useState<string | null>(null);
  const [unit, setUnit] = useState<WeightUnit>('lbs');
  const [weight, setWeight] = useState(154);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [desired, setDesired] = useState(140);
  const [pace, setPace] = useState<'slow' | 'rec' | 'fast'>('rec');
  const [diet, setDiet] = useState<string | null>(null);
  const [referral, setReferral] = useState('');

  const step: Step = STEPS[i];
  const progress = (i + 1) / STEPS.length;

  const advance = () => {
    let j = i + 1;
    // skip target + pace when maintaining
    if (goal === 'maintain' && STEPS[j] === 'desired') j = STEPS.indexOf('comparison');
    if (j >= STEPS.length) return setPhase('loading');
    setI(j);
  };
  const back = () => {
    if (i === 0) return setPhase('welcome');
    let j = i - 1;
    if (goal === 'maintain' && (STEPS[j] === 'pace' || STEPS[j] === 'desired')) j = STEPS.indexOf('goal');
    setI(Math.max(0, j));
  };

  const finishAndSave = () => {
    const profile: OnboardingProfile = {
      goalType: goal ?? 'lose',
      sex: gender === 'Female' ? 'female' : gender === 'Male' ? 'male' : 'other',
      age: Math.max(16, 2026 - (2010 - yr)),
      heightCm: 172,
      heightUnit: 'cm',
      weightKg: unit === 'lbs' ? Math.round((weight / 2.20462) * 10) / 10 : weight,
      unit: unit === 'lbs' ? 'lb' : 'kg',
      activityLevel: workouts === '6+' ? 'very' : workouts === '3-5' ? 'moderate' : 'light',
      targetWeightKg: goal === 'maintain' ? null : Math.round(((unit === 'lbs' ? desired / 2.20462 : desired)) * 10) / 10,
      paceKgPerWeek: pace === 'slow' ? 0.3 : pace === 'rec' ? 0.6 : 0.9,
      dietSplit: diet === 'High protein' ? 'high-protein' : diet === 'Low carb' ? 'low-carb' : diet === 'Keto' ? 'keto' : 'balanced',
      workoutsPerWeek: workouts === '6+' ? '6+' : workouts === '3-5' ? '3-5' : '0-2',
      referralCode: referral.trim() || undefined,
    };
    saveProfile(profile);
    onExit?.();
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 'demoScan': return true;
      case 'gender': return gender !== null;
      case 'workouts': return workouts !== null;
      case 'source': return source !== null;
      case 'goal': return goal !== null;
      case 'diet': return diet !== null;
      default: return true;
    }
  };

  const paceKg = pace === 'slow' ? 0.3 : pace === 'rec' ? 0.6 : 0.9;
  const dailyCal = pace === 'slow' ? 1420 : pace === 'rec' ? 1090 : 820;
  const months = Math.max(1, Math.round(Math.abs(weight - desired) / (unit === 'lbs' ? paceKg * 2.2 : paceKg) / 4.3));

  /* ---------------------------------------------------------- phases */

  if (phase === 'welcome') return <Welcome onStart={() => { setPhase('quiz'); setI(0); }} onSignIn={finishAndSave} />;
  if (phase === 'loading') return <Loading onDone={() => setPhase('plan')} />;
  if (phase === 'plan') return <Plan unit={unit} weight={weight} desired={desired} goal={goal} workouts={workouts} months={months} onStart={() => setPhase('account')} />;
  if (phase === 'account') return <Account onDone={finishAndSave} />;

  /* ----------------------------------------------------------- quiz */

  if (step === 'demoScan') {
    return <OnboardingScannerDemo onDone={advance} onBack={back} />;
  }

  /* ----------------------------------------------------------- quiz */

  const footer = ['burned', 'rollover'].includes(step) ? null : (
    <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 8 }}>
      {step === 'referral' ? (
        <Cta onPress={advance}>Skip</Cta>
      ) : (
        <Cta onPress={advance} disabled={!canContinue()}>Continue</Cta>
      )}
    </View>
  );

  return (
    <Screen>
      <ProgressHeader progress={progress} onBack={back} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {step === 'gender' && (
          <>
            <Title>Choose your{'\n'}Gender</Title>
            <Sub>This will be used to calibrate your custom plan.</Sub>
            <View style={{ gap: 12, marginTop: 34 }}>
              {['Male', 'Female', 'Other'].map((g) => (
                <OptionRow key={g} title={g} selected={gender === g} onPress={() => setGender(g)} />
              ))}
            </View>
          </>
        )}

        {step === 'workouts' && (
          <>
            <Title>How many workouts do{'\n'}you do per week?</Title>
            <Sub>This will be used to calibrate your custom plan.</Sub>
            <View style={{ gap: 12, marginTop: 34 }}>
              <OptionRow icon={<WorkoutDots n={1} />} title="0-2" sub="Workouts now and then" selected={workouts === '0-2'} onPress={() => setWorkouts('0-2')} />
              <OptionRow icon={<WorkoutDots n={3} />} title="3-5" sub="A few workouts per week" selected={workouts === '3-5'} onPress={() => setWorkouts('3-5')} />
              <OptionRow icon={<WorkoutDots n={6} />} title="6+" sub="Dedicated athlete" selected={workouts === '6+'} onPress={() => setWorkouts('6+')} />
            </View>
          </>
        )}

        {step === 'birth' && (
          <>
            <Title>When were you born?</Title>
            <Sub>This will be used to calculate your daily nutrition goals.</Sub>
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <WheelBand />
                <Wheel items={MONTHS} index={mo} onChange={setMo} width={150} align="left" />
                <Wheel items={Array.from({ length: 31 }, (_, d) => `${d + 1}`)} index={day} onChange={setDay} width={60} />
                <Wheel items={YEARS} index={yr} onChange={setYr} width={90} align="right" />
              </View>
            </View>
          </>
        )}

        {step === 'source' && (
          <>
            <Title>Where did you hear{'\n'}about us?</Title>
            <View style={{ gap: 10, marginTop: 26 }}>
              {['Instagram', 'TikTok', 'Google', 'TV', 'Facebook', 'App Store', 'Friend or family'].map((s) => (
                <OptionRow key={s} icon={<SourceIcon kind={s} />} title={s} selected={source === s} onPress={() => setSource(s)} />
              ))}
            </View>
          </>
        )}

        {step === 'trend' && (
          <>
            <Title>Designed to help you{'\n'}stay on track</Title>
            <View style={{ marginTop: 30 }}>
              <TrendChart />
              <Text style={{ fontFamily: F.b500, fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 20, lineHeight: 20 }}>Track your habits and stay{'\n'}consistent over time.</Text>
            </View>
          </>
        )}

        {step === 'weight' && (
          <>
            <Title>What is your weight?</Title>
            <Sub>This will be used to calculate your daily nutrition goals.</Sub>
            <View style={{ marginTop: 24 }}>
              <Segmented options={[{ key: 'lbs', label: 'lbs' }, { key: 'kg', label: 'kg' }]} value={unit} onChange={(u) => { setUnit(u); setWeight(u === 'kg' ? Math.round(weight / 2.2) : Math.round(weight * 2.2)); setDesired(u === 'kg' ? Math.round(desired / 2.2) : Math.round(desired * 2.2)); }} />
            </View>
            <View style={{ marginTop: 40 }}>
              <Ruler
                min={unit === 'kg' ? 30 : 66}
                max={unit === 'kg' ? 200 : 440}
                step={unit === 'kg' ? 0.1 : 0.2}
                value={weight}
                onChange={setWeight}
                renderValue={(v) => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.sub }}>Current weight</Text>
                    <Text style={{ fontFamily: F.d800, fontSize: 34, color: C.ink, marginTop: 2 }}>{v.toFixed(1)} {unit}</Text>
                  </View>
                )}
              />
            </View>
          </>
        )}

        {step === 'goal' && (
          <>
            <Title>What is your goal?</Title>
            <Sub>This helps us generate a plan for your calorie intake.</Sub>
            <View style={{ gap: 12, marginTop: 34 }}>
              <OptionRow icon={<GoalArrow dir="down" />} title="Lose weight" selected={goal === 'lose'} onPress={() => { setGoal('lose'); setDesired(Math.round(weight * 0.9)); }} />
              <OptionRow icon={<GoalArrow dir="flat" />} title="Maintain" selected={goal === 'maintain'} onPress={() => setGoal('maintain')} />
              <OptionRow icon={<GoalArrow dir="up" />} title="Gain weight" selected={goal === 'gain'} onPress={() => { setGoal('gain'); setDesired(Math.round(weight * 1.1)); }} />
            </View>
          </>
        )}

        {step === 'desired' && (
          <>
            <Title>What is your{'\n'}desired weight?</Title>
            <View style={{ marginTop: 40 }}>
              <Ruler
                min={unit === 'kg' ? 30 : 66}
                max={unit === 'kg' ? 200 : 440}
                step={unit === 'kg' ? 0.1 : 0.2}
                value={desired}
                onChange={setDesired}
                renderValue={(v) => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.sub }}>{goal === 'gain' ? 'Gain weight' : 'Lose weight'}</Text>
                    <Text style={{ fontFamily: F.d800, fontSize: 34, color: C.ink, marginTop: 2 }}>{v.toFixed(1)} {unit}</Text>
                  </View>
                )}
              />
            </View>
            {goal === 'lose' && desired < weight * 0.82 && (
              <View style={{ marginTop: 30 }}>
                <Note tone="warn" title="Goal may be too low">Below a typical healthy range for your height.</Note>
              </View>
            )}
          </>
        )}

        {step === 'pace' && (
          <>
            <Title>How fast do you want{'\n'}to reach your goal?</Title>
            <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.ink, textAlign: 'center', marginTop: 40 }}>{goal === 'gain' ? 'Weight gain' : 'Weight loss'} speed per week</Text>
            <Text style={{ fontFamily: F.d800, fontSize: 40, color: C.ink, textAlign: 'center', marginTop: 8 }}>{(unit === 'lbs' ? paceKg * 2.2 : paceKg).toFixed(1)} {unit === 'lbs' ? 'lbs' : 'kg'}</Text>
            <PaceSlider value={pace} onChange={setPace} />
            <View style={{ marginTop: 34 }}>
              <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>
                  You should reach your goal in <Text style={{ color: C.accent }}>{months} month{months > 1 ? 's' : ''}</Text>
                </Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 18 }}>
                  {pace === 'rec' ? 'This is the most balanced pace, motivating and ideal for most users.' : pace === 'slow' ? 'A gentle, sustainable pace that is easy to maintain.' : 'An ambitious pace for fast, focused results.'}
                  {'\n'}Daily calorie goal: {dailyCal.toLocaleString()} cal
                </Text>
              </View>
            </View>
          </>
        )}

        {step === 'comparison' && (
          <>
            <Title>A simpler way to stay{'\n'}on track</Title>
            <Sub>Log meals in seconds, follow your plan, and see your progress add up.</Sub>
            <View style={{ marginTop: 30 }}><Comparison /></View>
          </>
        )}

        {step === 'diet' && (
          <>
            <Title>Do you follow a{'\n'}specific diet?</Title>
            <View style={{ gap: 10, marginTop: 26 }}>
              {[
                ['Balanced', '🍎'],
                ['Whole-food focus', '🥗'],
                ['Mediterranean', '🫒'],
                ['Flexitarian', '🥕'],
                ['Pescatarian', '🐟'],
                ['Vegetarian', '🥦'],
              ].map(([d, e]) => (
                <OptionRow key={d} icon={<Text style={{ fontSize: 20 }}>{e}</Text>} title={d} selected={diet === d} onPress={() => setDiet(d)} />
              ))}
            </View>
          </>
        )}

        {step === 'potential' && (
          <>
            <Title>You have great{'\n'}potential to crush{'\n'}your goal</Title>
            <View style={{ marginTop: 30 }}><PotentialChart /></View>
          </>
        )}

        {step === 'burned' && (
          <>
            <Title>Add calories burned{'\n'}back to your daily goal?</Title>
            <View style={{ marginTop: 30 }}><BurnedCard /></View>
          </>
        )}

        {step === 'rollover' && (
          <>
            <Title>Rollover extra calories{'\n'}to the next day?</Title>
            <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.sub, marginTop: 8 }}>Rollover up to <Text style={{ color: '#8AA0FF' }}>200 cals</Text></Text>
            <View style={{ marginTop: 30 }}><RolloverCards /></View>
          </>
        )}

        {step === 'reviews' && (
          <>
            <Review name="Sarah" date="August 12, 2025" body="Very good app, it has and is still helping me achieve my goals and keeping me fit. The final result left me speechless — I'd recommend it to anyone trying to lose weight." />
            <Review name="Muhammad" date="September 2, 2025" body="I think it's very useful to track your calories and how much you need for the specific target you have set for yourself. This app helps you perfectly well with tracking that." />
            <Review name="Adam" date="November 3, 2024" body="Brilliant, I'm far too lazy to journal but snapping a photo takes seconds and it just works." />
          </>
        )}

        {step === 'thankyou' && (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <HandsIllustration />
            <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink, textAlign: 'center', marginTop: 34, letterSpacing: -0.6 }}>Thank you for{'\n'}trusting us!</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 15, color: C.sub, textAlign: 'center', marginTop: 12 }}>Now let's personalize Cal AI for you…</Text>
            <View style={{ marginTop: 30, backgroundColor: C.card, borderRadius: 16, padding: 18, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>Personalized to your goals</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.sub, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>We'll use your answers to tailor your plan, targets, and recommendations.</Text>
            </View>
          </View>
        )}

        {step === 'notifications' && (
          <NotificationPrompt onDecide={advance} />
        )}

        {step === 'referral' && (
          <>
            <Title>Enter referral code{'\n'}(optional)</Title>
            <Sub>You can skip this step</Sub>
            <View style={{ marginTop: 44, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ flex: 1 }}><TextField value={referral} onChangeText={setReferral} placeholder="Referral Code" /></View>
              <Pressable style={{ height: 58, paddingHorizontal: 22, borderRadius: 16, backgroundColor: referral ? C.dark : C.card, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.d700, fontSize: 15, color: referral ? C.white : C.sub2 }}>Submit</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {step === 'burned' && (
        <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}><YesNo onYes={advance} onNo={advance} /></View>
      )}
      {step === 'rollover' && (
        <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}><YesNo onYes={advance} onNo={advance} /></View>
      )}
      {footer && step !== 'burned' && step !== 'rollover' && step !== 'notifications' ? footer : null}
    </Screen>
  );
}

/* =============================================================== welcome */

function Welcome({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ marginBottom: 28, alignItems: 'center' }}>
          <Logo size={126} shadow />
        </View>
        <Text style={{ fontFamily: F.d800, fontSize: 42, color: C.ink, letterSpacing: -0.8, textAlign: 'center' }}>
          AvoLens<Text style={{ color: C.green }}>.</Text>
        </Text>
        <Text style={{ fontFamily: F.b700, fontSize: 18, color: C.ink, marginTop: 12, textAlign: 'center' }}>
          Snap it. AvoLens tracks it.
        </Text>
        <Text
          style={{
            fontFamily: F.b500,
            fontSize: 14,
            color: C.sub,
            marginTop: 12,
            lineHeight: 22,
            maxWidth: 270,
            textAlign: 'center',
          }}
        >
          Effortless calorie & macro tracking. Just point your camera at the plate.
        </Text>

        <View style={{ width: '100%', marginTop: 44 }}>
          <Cta onPress={onStart}>Get Started</Cta>
          <Pressable onPress={onSignIn} style={{ marginTop: 18 }}>
            <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 14, color: C.sub }}>
              Already have an account? <Text style={{ fontFamily: F.d700, color: C.green }}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function PhoneMock() {
  return (
    <View style={{ width: 210, height: 330, borderRadius: 40, backgroundColor: C.ink, padding: 8 }}>
      <View style={{ flex: 1, borderRadius: 32, backgroundColor: '#EDE6DC', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 150, height: 150, borderRadius: 18, backgroundColor: '#F6F1E8', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 56 }}>🥪</Text>
        </View>
        {/* corner scan brackets */}
        {[[16, 16, true, true], [16, 16, false, true], [16, 16, true, false], [16, 16, false, false]].map((_, k) => (
          <View key={k} />
        ))}
        <View style={{ position: 'absolute', bottom: 20, backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: C.ink }}>Scan Food</Text>
        </View>
      </View>
    </View>
  );
}

/* =============================================================== loading */

function Loading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(id); setTimeout(onDone, 400); return 100; }
        return p + 2;
      });
    }, 55);
    Animated.timing(anim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: false }).start();
    return () => clearInterval(id);
  }, [anim, onDone]);

  const line = (label: string, done: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: done ? C.ink : C.border, alignItems: 'center', justifyContent: 'center' }}>
        {done && <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
      </View>
      <Text style={{ fontFamily: F.b600, fontSize: 14, color: done ? C.ink : C.sub2 }}>{label}</Text>
    </View>
  );

  return (
    <Screen>
      <CenterView>
        <Text style={{ fontFamily: F.d800, fontSize: 64, color: C.ink }}>{pct}%</Text>
        <Text style={{ fontFamily: F.d700, fontSize: 22, color: C.ink, textAlign: 'center', marginTop: 6 }}>We're setting{'\n'}everything up for you</Text>
        <Text style={{ fontFamily: F.b500, fontSize: 14, color: C.sub, marginTop: 10 }}>Customizing your health plan…</Text>
        <View style={{ width: '80%', marginTop: 30 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: C.sub, marginBottom: 4 }}>Daily recommendation for</Text>
          {line('Calories', pct > 20)}
          {line('Carbs', pct > 45)}
          {line('Protein', pct > 65)}
          {line('Fats', pct > 82)}
          {line('Health Score', pct > 95)}
        </View>
      </CenterView>
    </Screen>
  );
}

/* ============================================================ plan reveal */

function Plan({ unit, weight, desired, goal, workouts, months, onStart }: { unit: WeightUnit; weight: number; desired: number; goal: Goal | null; workouts: string | null; months: number; onStart: () => void }) {
  const target = goal === 'gain' ? Math.abs(desired - weight) : Math.abs(weight - desired);
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const activity = workouts === '6+' ? 'High' : workouts === '3-5' ? 'Moderate' : 'Limited';

  const row = (icon: React.ReactNode, label: string, value: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
      {icon}
      <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.ink }}>{label} <Text style={{ fontFamily: F.d700 }}>{value}</Text></Text>
    </View>
  );
  const how = (emoji: string, text: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 15, color: C.ink }}>{text}</Text>
    </View>
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 8 }}>
        <Text style={{ fontFamily: F.d800, fontSize: 28, color: C.ink, letterSpacing: -0.6 }}>Congratulations,{'\n'}your custom plan is ready!</Text>
        <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 18, marginTop: 22 }}>
          {row(<Text style={{ fontSize: 16 }}>🧍</Text>, 'Starting weight:', `${weight.toFixed(1)} ${unit}`)}
          {row(<Text style={{ fontSize: 16 }}>🏁</Text>, 'Goal weight:', `${desired.toFixed(1)} ${unit}`)}
          {row(<Text style={{ fontSize: 16 }}>🏃</Text>, 'Activity level:', activity)}
          {row(<Text style={{ fontSize: 16 }}>🎯</Text>, 'Target:', goal === 'maintain' ? `Maintain ${weight.toFixed(1)} ${unit}` : `${goal === 'gain' ? 'Gain' : 'Lose'} ${target.toFixed(0)} ${unit} by ${dateStr}`)}
        </View>
        <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink, marginTop: 28 }}>How to reach your goals:</Text>
        {how('🥑', 'Track your food')}
        {how('🔥', 'Follow your daily calorie recommendation')}
        {how('⚖️', 'Balance your carbs, protein, fat')}
        {how('💗', 'Get your health score and insights for your routine')}
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingBottom: 10, paddingTop: 6 }}>
        <Cta onPress={onStart}>Let's get started!</Cta>
      </View>
    </Screen>
  );
}

/* =============================================================== account */

function Account({ onDone }: { onDone: () => void }) {
  const [terms, setTerms] = useState(true);
  const [promo, setPromo] = useState(true);

  const authBtn = (label: string, glyph: React.ReactNode, dark?: boolean) => (
    <Pressable onPress={onDone} style={{ height: 58, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: dark ? C.ink : C.white, borderWidth: dark ? 0 : 1.5, borderColor: C.border }}>
      {glyph}
      <Text style={{ fontFamily: F.d700, fontSize: 16, color: dark ? C.white : C.ink }}>{label}</Text>
    </Pressable>
  );

  const check = (on: boolean, set: (v: boolean) => void, label: string) => (
    <Pressable onPress={() => set(!on)} style={{ flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'flex-start' }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: on ? C.ink : 'transparent', borderWidth: on ? 0 : 1.5, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' }}>
        {on && <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>}
      </View>
      <Text style={{ flex: 1, fontFamily: F.b500, fontSize: 12.5, color: C.sub, lineHeight: 18 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 20 }}>
        <Title>Save your progress</Title>
        <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
          {authBtn('Sign in with Apple', <Svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><Path d="M16 1c-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.3.7-.8 1.2-1.9 1-3zM19 17c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.4 3.2-4.1 3.2-1.5 0-1.9-1-3.9-1-2 0-2.5 1-4 1-1.7 0-3-1.6-4-3C-.6 16.6-.9 11 1.4 8.2 2.4 6.9 4 6 5.6 6c1.7 0 2.7 1 4 1 1.3 0 2-1 4-1 1.4 0 2.9.8 4 2.1-3.5 1.9-3 6.9 1.4 8.8z" /></Svg>, true)}
          {authBtn('Sign in with Google', <Text style={{ fontFamily: F.d800, fontSize: 17, color: '#4285F4' }}>G</Text>)}
          {authBtn('Continue with email', <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m2 7 10 6 10-6" /></Svg>)}
        </View>
        <View style={{ paddingBottom: 20 }}>
          {check(terms, setTerms, "I agree to Cal AI's Terms and Conditions and Privacy Policy")}
          {check(promo, setPromo, 'Send me tips, new features, and personalized offers from Cal AI')}
        </View>
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------ pace slider (tap) */

function PaceSlider({ value, onChange }: { value: 'slow' | 'rec' | 'fast'; onChange: (v: 'slow' | 'rec' | 'fast') => void }) {
  const stops: { key: 'slow' | 'rec' | 'fast'; label: string; emoji: string }[] = [
    { key: 'slow', label: 'Slow', emoji: '🦥' },
    { key: 'rec', label: 'Recommended', emoji: '🐇' },
    { key: 'fast', label: 'Fast', emoji: '🐆' },
  ];
  const idx = stops.findIndex((s) => s.key === value);

  // While dragging we track a continuous 0..1 fraction so the thumb follows the
  // finger; on release we snap to the nearest of the three stops. Refs keep the
  // once-created PanResponder reading the latest width / handler.
  const [trackW, setTrackW] = useState(0);
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const trackWRef = useRef(0);
  trackWRef.current = trackW;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const w = trackWRef.current || 1;
    const f = Math.max(0, Math.min(1, x / w));
    setDragFrac(f);
    onChangeRef.current(stops[Math.round(f * 2)].key);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderRelease: () => setDragFrac(null),
      onPanResponderTerminate: () => setDragFrac(null),
    }),
  ).current;

  const active = dragFrac == null ? idx : Math.round(dragFrac * 2);
  const frac = dragFrac ?? idx / 2;

  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        {stops.map((s, si) => (
          <Pressable key={s.key} onPress={() => { setDragFrac(null); onChange(s.key); }} style={{ alignItems: 'center', width: 90 }}>
            <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
            <Text style={{ fontFamily: F.d700, fontSize: 13, color: si === active ? C.accent : C.sub, marginTop: 4 }}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {/* Tall transparent hit area so the whole strip is swipeable, not just the 8px bar */}
      <View
        {...pan.panHandlers}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={{ height: 40, justifyContent: 'center' }}
      >
        <View style={{ height: 8, borderRadius: 99, backgroundColor: C.track, justifyContent: 'center' }}>
          <View style={{ width: `${frac * 100}%`, height: 8, borderRadius: 99, backgroundColor: C.ink }} />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${frac * 100}%`,
            marginLeft: -15,
            width: 30,
            height: 30,
            borderRadius: 99,
            backgroundColor: C.white,
            borderWidth: 2,
            borderColor: C.ink,
            shadowColor: '#000',
            shadowOpacity: 0.16,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
      </View>
    </View>
  );
}

/* --------------------------------------------- simulated iOS notif prompt */

function NotificationPrompt({ onDecide }: { onDecide: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 40 }}>
      <Text style={{ fontFamily: F.d800, fontSize: 28, color: C.ink, textAlign: 'center', letterSpacing: -0.6 }}>Stay on track with{'\n'}Cal AI notifications</Text>
      <View style={{ marginTop: 60, width: 300, backgroundColor: '#F2F2F5', borderRadius: 18, overflow: 'hidden' }}>
        <View style={{ padding: 18, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>"Cal AI" Would Like to Send</Text>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>You Notifications</Text>
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#D9D9DE' }}>
          <Pressable onPress={onDecide} style={{ flex: 1, paddingVertical: 13, alignItems: 'center', borderRightWidth: 1, borderColor: '#D9D9DE' }}>
            <Text style={{ fontFamily: F.b600, fontSize: 15, color: '#0A84FF' }}>Don't Allow</Text>
          </Pressable>
          <Pressable onPress={onDecide} style={{ flex: 1, paddingVertical: 13, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.d700, fontSize: 15, color: '#0A84FF' }}>Allow</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
