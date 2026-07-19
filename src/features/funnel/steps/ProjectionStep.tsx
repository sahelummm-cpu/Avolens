import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { CalorieRing } from '@/components/CalorieRing';
import { useStore } from '@/lib/store';
import { computeGoal, DIET_SPLITS } from '@/lib/goals';
import type { OnboardingProfile, WeightUnit } from '@/lib/types';
import { F } from '@/lib/fonts';
import { Sub, Title, FieldLabel, PRIVACY_URL, TERMS_URL, stepEntering } from '../components/ui';
import { derailerLabel, type Derailer } from './DerailerStep';
import { tap } from '../haptics';

const KG_TO_LB = 2.20462;

/**
 * Step 5 — future pacing. Shows the computed plan and, when a target and pace
 * exist, projects the date the user lands on it; the CTA hands off to the
 * paywall. Evolved from the previous PlanSummary screen.
 */
export function ProjectionStep({ profile, unit, usesGlp1, targetKg, derailer, remindOn, healthOn, onToggleRemind, onToggleHealth, onStart, onCreateAccount, openLink }: {
  profile: OnboardingProfile; unit: WeightUnit; usesGlp1: boolean; targetKg: number | null; derailer: Derailer | null;
  remindOn: boolean; healthOn: boolean; onToggleRemind: () => void; onToggleHealth: () => void;
  onStart: () => void; onCreateAccount?: () => void; openLink: (u: string) => void;
}) {
  const { theme: t } = useStore();
  const goal = computeGoal(profile);
  const split = DIET_SPLITS[profile.dietSplit ?? 'balanced'];
  const weeks = targetKg != null && profile.paceKgPerWeek ? Math.max(1, Math.round(Math.abs(profile.weightKg - targetKg) / profile.paceKgPerWeek)) : null;
  const targetDate = weeks != null ? new Date(Date.now() + weeks * 7 * 86_400_000) : null;

  const weightLabel = (kg: number) => (unit === 'lb' ? `${Math.round(kg * KG_TO_LB)} lb` : `${Math.round(kg * 10) / 10} kg`);
  const dateLabel = targetDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
    <Animated.View entering={stepEntering}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 16 }}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.greenGrad2} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 12 5 5 9-11" /></Svg>
        <Text style={{ fontFamily: F.b700, fontSize: 10.5, color: t.greenGrad2, letterSpacing: 0.6, textTransform: 'uppercase' }}>Plan ready</Text>
      </View>

      {targetKg != null && weeks != null ? (
        <>
          <Title t={t.ink}>{`You're on track to reach ${weightLabel(targetKg)} by ${dateLabel}`}</Title>
          <Sub t={t.muted}>
            {profile.name ? `${profile.name}, that's` : "That's"} about {weeks} week{weeks === 1 ? '' : 's'} at your chosen pace — here's the daily plan that gets you there.
          </Sub>
        </>
      ) : (
        <>
          <Title t={t.ink}>{profile.name ? `${profile.name}, meet your plan` : 'Your plan is ready'}</Title>
          <Sub t={t.muted}>Based on your answers — fine-tune anything later in Settings.</Sub>
        </>
      )}

      <View style={{ alignItems: 'center', marginTop: 26, marginBottom: 4 }}>
        <View style={{ width: 196, height: 196, alignItems: 'center', justifyContent: 'center' }}>
          <CalorieRing size={196} fractions={{ calories: 1, protein: split.p, carbs: split.c, fat: split.f }} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ fontFamily: F.d800, fontSize: 36, color: t.ink, letterSpacing: -1 }}>{goal.calories.toLocaleString('en-US')}</Text>
            <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: t.muted, marginTop: 2, letterSpacing: 0.3 }}>KCAL / DAY</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Macro label="Protein" g={goal.protein} color={t.protein} />
        <Macro label="Carbs" g={goal.carbs} color={t.carbs} />
        <Macro label="Fat" g={goal.fat} color={t.fat} />
      </View>

      {derailer != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: t.greenTint, borderRadius: 14, padding: 14 }}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6 9 17l-5-5" /></Svg>
          <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.greenGrad2, flex: 1 }}>
            Tuned for your #1 obstacle: {derailerLabel(derailer)}
          </Text>
        </View>
      )}
      {usesGlp1 && (
        <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 14 }}>GLP-1 tracking is on — set up your medication on the Home screen.</Text>
      )}

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
        <PrimaryButton onPress={() => { tap(); onStart(); }}>Unlock My Custom Plan</PrimaryButton>
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
