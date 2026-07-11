import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Finish any auth session left open (e.g. after a cold start).
WebBrowser.maybeCompleteAuthSession();

/** Native Apple sign-in is only available on iOS 13+. */
export const appleAuthAvailable = Platform.OS === 'ios';

async function completeFromUrl(url: string): Promise<string | null> {
  if (!supabase) return 'Cloud sync is not configured.';
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return error ? error.message : null;
    }
    // Implicit fallback: tokens in the URL fragment.
    const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
    const hp = new URLSearchParams(hash);
    const access_token = hp.get('access_token');
    const refresh_token = hp.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return error ? error.message : null;
    }
  } catch {
    // fall through
  }
  return 'Sign-in did not complete.';
}

async function oauthViaBrowser(provider: 'google' | 'apple'): Promise<string | null> {
  if (!supabase) return 'Cloud sync is not configured.';
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return error?.message ?? `Could not start ${provider} sign-in.`;
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return null; // user cancelled
  return completeFromUrl(res.url);
}

/** Sign in with Google via the Supabase OAuth flow (in-app browser). */
export function signInWithGoogle(): Promise<string | null> {
  return oauthViaBrowser('google');
}

/**
 * Sign in with Apple — native on iOS (id-token flow), OAuth browser
 * elsewhere. Returns an error message, or null on success / cancellation.
 */
export async function signInWithApple(): Promise<string | null> {
  if (!supabase) return 'Cloud sync is not configured.';
  if (Platform.OS === 'ios') {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) return 'No identity token returned by Apple.';
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
      return error ? error.message : null;
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
      return 'Apple sign-in failed.';
    }
  }
  return oauthViaBrowser('apple');
}
