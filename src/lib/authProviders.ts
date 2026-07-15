import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Finish any auth session left open (e.g. after a cold start).
WebBrowser.maybeCompleteAuthSession();

/** Native Apple sign-in is only available on iOS 13+. */
export const appleAuthAvailable = Platform.OS === 'ios';

/** Distinguishes "signed in" from "user backed out" from "something failed". */
export type AuthOutcome =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

const ok: AuthOutcome = { status: 'success' };
const cancelled: AuthOutcome = { status: 'cancelled' };
const fail = (message: string): AuthOutcome => ({ status: 'error', message });

async function completeFromUrl(url: string): Promise<AuthOutcome> {
  if (!supabase) return fail('Cloud sync is not configured.');
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return error ? fail(error.message) : ok;
    }
    // Implicit fallback: tokens in the URL fragment.
    const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
    const hp = new URLSearchParams(hash);
    const access_token = hp.get('access_token');
    const refresh_token = hp.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return error ? fail(error.message) : ok;
    }
  } catch {
    // fall through
  }
  return fail('Sign-in did not complete.');
}

async function oauthViaBrowser(provider: 'google' | 'apple'): Promise<AuthOutcome> {
  if (!supabase) return fail('Cloud sync is not configured.');
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return fail(error?.message ?? `Could not start ${provider} sign-in.`);
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return cancelled; // user closed the browser
  return completeFromUrl(res.url);
}

/** Sign in with Google via the Supabase OAuth flow (in-app browser). */
export function signInWithGoogle(): Promise<AuthOutcome> {
  return oauthViaBrowser('google');
}

/**
 * Sign in with Apple — native on iOS (id-token flow), OAuth browser
 * elsewhere.
 */
export async function signInWithApple(): Promise<AuthOutcome> {
  if (!supabase) return fail('Cloud sync is not configured.');
  if (Platform.OS === 'ios') {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) return fail('No identity token returned by Apple.');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
      return error ? fail(error.message) : ok;
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return cancelled;
      return fail('Apple sign-in failed.');
    }
  }
  return oauthViaBrowser('apple');
}
