import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';

export default function AuthPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, theme: t } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const valid = /.+@.+\..+/.test(email.trim()) && password.length >= 6;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const err =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === 'signup') {
      // With email confirmation enabled there's no session yet.
      setNotice('Account created. Check your inbox if confirmation is required, then sign in.');
      setMode('signin');
      return;
    }
    router.replace('/home');
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: F.b600,
    fontSize: 15,
    color: t.ink,
    marginBottom: 12,
  } as const;

  return (
    <Screen inset={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: insets.top + 12 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m15 5-7 7 7 7" />
            </Svg>
          </Pressable>

          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Logo size={64} />
            <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink, marginTop: 14 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, marginTop: 6, textAlign: 'center' }}>
              Your log, goals, and progress sync securely to the cloud.
            </Text>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={t.muted2}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min. 6 characters)"
            placeholderTextColor={t.muted2}
            secureTextEntry
            autoComplete={mode === 'signin' ? 'password' : 'new-password'}
            onSubmitEditing={submit}
            style={inputStyle}
          />

          {error && (
            <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.protein, marginBottom: 10 }}>{error}</Text>
          )}
          {notice && (
            <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: t.green, marginBottom: 10 }}>{notice}</Text>
          )}

          <PrimaryButton onPress={submit} disabled={!valid || busy} small>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </PrimaryButton>

          <Pressable
            onPress={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
              setError(null);
              setNotice(null);
            }}
            accessibilityRole="button"
            style={{ marginTop: 16 }}
          >
            <Text style={{ textAlign: 'center', fontFamily: F.b600, fontSize: 13, color: t.muted }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: t.green }}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
