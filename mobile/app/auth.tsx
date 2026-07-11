import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';
import { appleAuthAvailable, signInWithApple, signInWithGoogle } from '@/lib/authProviders';
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

  const social = async (fn: () => Promise<string | null>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    else router.replace('/home');
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
            <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          </View>

          <SocialButton
            label="Continue with Google"
            onPress={() => social(signInWithGoogle)}
            disabled={busy}
            bg={t.surface}
            border={t.border}
            fg={t.ink}
            icon={
              <Svg width={18} height={18} viewBox="0 0 48 48">
                <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5Z" />
                <Path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
                <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44Z" />
                <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5Z" />
              </Svg>
            }
          />
          {appleAuthAvailable && (
            <View style={{ marginTop: 10 }}>
              <SocialButton
                label="Continue with Apple"
                onPress={() => social(signInWithApple)}
                disabled={busy}
                bg="#000"
                border="#000"
                fg="#fff"
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">
                    <Path d="M16.4 12.9c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.6-3.8ZM14 5.6c.7-.8 1.1-2 1-3.1-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.8-1.3Z" />
                  </Svg>
                }
              />
            </View>
          )}

          <Pressable
            onPress={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
              setError(null);
              setNotice(null);
            }}
            accessibilityRole="button"
            style={{ marginTop: 18 }}
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

function SocialButton({ label, onPress, disabled, icon, bg, border, fg }: { label: string; onPress: () => void; disabled?: boolean; icon: React.ReactNode; bg: string; border: string; fg: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 50,
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      <Text style={{ fontFamily: F.d700, fontSize: 15, color: fg }}>{label}</Text>
    </Pressable>
  );
}
