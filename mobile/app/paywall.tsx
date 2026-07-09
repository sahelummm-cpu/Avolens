import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';

const FEATURES = ['Unlimited AI food scans', 'Barcode, label & fridge modes', 'AI Coach & advanced insights'];

export default function PaywallPage() {
  const router = useRouter();
  const { theme: t } = useStore();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{
          position: 'absolute',
          top: 24,
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

      <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 26, paddingBottom: 26, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Logo size={96} shadow />
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green, letterSpacing: 2.16, marginTop: 14 }}>AVOLENS PRO</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: t.ink, marginTop: 6, textAlign: 'center', lineHeight: 32.5 }}>
            Track smarter,{'\n'}effortlessly
          </Text>
        </View>

        <View style={{ gap: 11, marginBottom: 22 }}>
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

        <View style={{ gap: 10 }}>
          <Pressable
            onPress={() => setPlan('monthly')}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: t.surface,
              borderWidth: plan === 'monthly' ? 2 : 1.5,
              borderColor: plan === 'monthly' ? t.green : t.border,
              borderRadius: 18,
              paddingVertical: 15,
              paddingHorizontal: 18,
            }}
          >
            <View>
              <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>Monthly</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>Billed every month</Text>
            </View>
            <Text style={{ fontFamily: F.d800, fontSize: 18, color: t.ink }}>$9.99</Text>
          </Pressable>

          <Pressable
            onPress={() => setPlan('yearly')}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: t.surface,
              borderWidth: plan === 'yearly' ? 2 : 1.5,
              borderColor: plan === 'yearly' ? t.green : t.border,
              borderRadius: 18,
              paddingVertical: 15,
              paddingHorizontal: 18,
              marginTop: 6,
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
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 10, letterSpacing: 0.4 }}>BEST VALUE · SAVE 75%</Text>
            </View>
            <View>
              <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>Yearly</Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>$2.50 / month</Text>
            </View>
            <Text style={{ fontFamily: F.d800, fontSize: 18, color: t.green }}>$29.99</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 'auto', gap: 12, paddingTop: 24 }}>
          <PrimaryButton onPress={() => router.push('/home')}>Start 7-day free trial</PrimaryButton>
          <Text style={{ textAlign: 'center', fontFamily: F.b500, fontSize: 12, color: t.muted }}>
            Cancel anytime · Restore purchase
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
