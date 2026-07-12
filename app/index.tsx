import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { supabaseConfigured } from '@/lib/supabase';
import { F } from '@/lib/fonts';

export default function SplashPage() {
  const router = useRouter();
  const { finishOnboarding, theme: t } = useStore();

  const start = () => router.push('/onboarding');

  const skip = () => {
    finishOnboarding();
    // With a backend configured, "I already have an account" means signing in
    // (which pulls the synced state down); otherwise it just enters the app.
    router.push(supabaseConfigured ? '/auth' : '/home');
  };

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Logo size={126} shadow />
        <Text style={{ fontFamily: F.d800, fontSize: 42, color: t.ink, letterSpacing: -0.84, marginTop: 32 }}>
          AvoLens<Text style={{ color: t.green }}>.</Text>
        </Text>
        <Text style={{ fontFamily: F.b600, fontSize: 18, color: t.ink, marginTop: 12 }}>
          Snap it. AvoLens tracks it.
        </Text>
        <Text
          style={{
            fontFamily: F.b500,
            fontSize: 14,
            color: t.muted,
            marginTop: 12,
            lineHeight: 22.4,
            maxWidth: 250,
            textAlign: 'center',
          }}
        >
          Effortless calorie & macro tracking. Just point your camera at the plate.
        </Text>

        <View style={{ position: 'absolute', bottom: 48, left: 40, right: 40, gap: 16 }}>
          <PrimaryButton onPress={start}>Get Started</PrimaryButton>
          <Pressable onPress={skip}>
            <Text style={{ textAlign: 'center', fontFamily: F.b600, fontSize: 14, color: t.ink, opacity: 0.6 }}>
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
