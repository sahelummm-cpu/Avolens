import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';
import { PRIVACY_URL, TERMS_URL } from '@/features/funnel/components/ui';
import { formatPrice, perWeekLabel, purchases, savingsPct, type PlanId, type PlanOffering } from '@/features/funnel/purchases';
import { success, tap } from '@/features/funnel/haptics';

const FEATURES = ['Unlimited AI food scans', 'Barcode, label & fridge modes', 'AI Coach & advanced insights'];

const KG_TO_LB = 2.20462;
/** Fallback weekly pace when the profile didn't store one (kg/week). */
const DEFAULT_PACE = { lose: 0.5, gain: 0.25 } as const;

export default function PaywallPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, theme: t } = useStore();
  const [plan, setPlan] = useState<PlanId>('annual');
  const [offerings, setOfferings] = useState<PlanOffering[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    purchases.getOfferings().then((o) => { if (live) setOfferings(o); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const annual = offerings?.find((o) => o.id === 'annual');
  const monthly = offerings?.find((o) => o.id === 'monthly');

  // ── Personalized summary from the onboarding answers already in the store ──
  const currentKg = state.weightLog.length ? state.weightLog[state.weightLog.length - 1].kg : null;
  const targetKg = state.targetWeightKg;
  const rawDelta = currentKg != null && targetKg != null ? Math.round(Math.abs(currentKg - targetKg) * 10) / 10 : null;
  const deltaKg = rawDelta != null && rawDelta > 0 ? rawDelta : null;
  const pace = state.goalType === 'lose' || state.goalType === 'gain' ? DEFAULT_PACE[state.goalType] : null;
  const goalDate = deltaKg != null && pace ? new Date(Date.now() + Math.max(1, Math.ceil(deltaKg / pace)) * 7 * 86_400_000) : null;

  const deltaLabel = deltaKg != null ? (state.unit === 'lb' ? `${Math.round(deltaKg * KG_TO_LB)} lb` : `${deltaKg} kg`) : null;
  const dateLabel = goalDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const verb = state.goalType === 'gain' ? 'gain' : 'lose';
  const summary = deltaLabel != null && dateLabel != null
    ? `Your custom plan to ${verb} ${deltaLabel} by ${dateLabel} is ready to unlock.`
    : 'Your custom plan is ready to unlock.';

  const done = () => router.replace('/home');

  const buy = async () => {
    if (busy) return;
    tap();
    setNotice(null);
    setBusy(true);
    const res = await purchases.purchase(plan);
    setBusy(false);
    if (res.ok) {
      success();
      done();
    } else if (res.error) {
      setNotice(res.error);
    }
  };

  const restore = async () => {
    if (busy) return;
    tap();
    const found = await purchases.restore();
    if (found) done();
    else setNotice('No previous purchase found.');
  };

  return (
    <Screen inset={false}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : done())}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 22,
          width: 34,
          height: 34,
          borderRadius: 99,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
        }}
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.4} strokeLinecap="round">
          <Path d="M6 6l12 12M18 6 6 18" />
        </Svg>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 54, paddingHorizontal: 26, paddingBottom: 26, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Dynamic summary card */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.greenTint, borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <Logo size={48} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 10.5, color: t.greenGrad2, letterSpacing: 1.6 }}>AVOLENS PRO</Text>
            <Text style={{ fontFamily: F.d700, fontSize: 15.5, color: t.ink, marginTop: 3, lineHeight: 21 }}>
              {state.displayName ? `${state.displayName} — ${summary}` : summary}
            </Text>
          </View>
        </View>

        {/* Social proof */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 20 }}>
          <StarIcon color={t.carbs} />
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>4.8/5 Average Rating</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted2 }}>·</Text>
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>Join 40,000+ people reaching their goals</Text>
        </View>

        <View style={{ gap: 11, marginBottom: 24 }}>
          {FEATURES.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <View style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="m5 12 5 5 9-11" />
                </Svg>
              </View>
              <Text style={{ fontFamily: F.b500, fontSize: 14, color: t.ink }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Tiers — annual pre-selected, price re-framed as the weekly breakdown */}
        {annual && monthly && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => { tap(); setPlan('annual'); }}
              accessibilityRole="button"
              accessibilityState={{ selected: plan === 'annual' }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: plan === 'annual' ? t.greenTint : t.surface,
                borderWidth: plan === 'annual' ? 2 : 1.5,
                borderColor: plan === 'annual' ? t.green : t.border,
                borderRadius: 18,
                paddingVertical: 16,
                paddingHorizontal: 18,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -11,
                  left: 16,
                  backgroundColor: t.green,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 10, letterSpacing: 0.4 }}>SAVE {savingsPct(annual, monthly)}% — BEST VALUE</Text>
              </View>
              <View>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>Annual</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 2 }}>{formatPrice(annual.price, annual.currency)} billed annually</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: F.d800, fontSize: 20, color: t.green }}>{perWeekLabel(annual)}</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>per week</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => { tap(); setPlan('monthly'); }}
              accessibilityRole="button"
              accessibilityState={{ selected: plan === 'monthly' }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: plan === 'monthly' ? t.greenTint : t.surface,
                borderWidth: plan === 'monthly' ? 2 : 1.5,
                borderColor: plan === 'monthly' ? t.green : t.border,
                borderRadius: 18,
                paddingVertical: 15,
                paddingHorizontal: 18,
              }}
            >
              <View>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>Monthly</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 2 }}>Billed every month</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: F.d800, fontSize: 20, color: t.ink }}>{formatPrice(monthly.price, monthly.currency)}</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted }}>per month</Text>
              </View>
            </Pressable>
          </View>
        )}

        {notice != null && (
          <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 12, color: t.protein, marginTop: 12 }}>{notice}</Text>
        )}

        <View style={{ marginTop: 'auto', gap: 12, paddingTop: 24 }}>
          {/* High-converting CTA — taller than the standard PrimaryButton on purpose */}
          <Pressable
            onPress={buy}
            disabled={busy || !annual}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => ({
              height: 65,
              borderRadius: 22,
              backgroundColor: t.green,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: busy ? 0.75 : 1,
              shadowColor: 'rgba(47,158,110,1)',
              shadowOpacity: 0.5,
              shadowRadius: 26,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            })}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 17 }}>Start My Custom Plan</Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LockIcon color={t.muted2} />
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>No commitment. Cancel anytime in your app store settings.</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FooterLink label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} color={t.muted2} />
            <Dot color={t.muted2} />
            <FooterLink label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} color={t.muted2} />
            <Dot color={t.muted2} />
            <FooterLink label="Restore" onPress={restore} color={t.muted2} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FooterLink({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
      <Text style={{ fontFamily: F.b500, fontSize: 11, color, textDecorationLine: 'underline' }}>{label}</Text>
    </Pressable>
  );
}

function Dot({ color }: { color: string }) {
  return <Text style={{ fontFamily: F.b500, fontSize: 11, color }}>·</Text>;
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round">
      <Path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 11h14v10H5Z" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}
