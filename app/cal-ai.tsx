import { useRouter } from 'expo-router';
import CalAiOnboarding from '@/features/calai/CalAiOnboarding';

/**
 * Cal AI onboarding clone route (`/cal-ai`). Self-contained reproduction of the
 * Cal AI new-user funnel; on finish it drops the user into the app home.
 */
export default function CalAiRoute() {
  const router = useRouter();
  return <CalAiOnboarding onExit={() => router.replace('/home')} />;
}
