import { useRouter } from 'expo-router';
import CalAiOnboarding from '@/features/calai/CalAiOnboarding';

/**
 * Main AvoLens Onboarding Route (`/onboarding`).
 * Features AvoLens logo & title welcome screen, AI demo scan step,
 * comprehensive onboarding questionnaire with AvoLens design system & colors,
 * personalized plan generator, and store profile integration.
 */
export default function OnboardingPage() {
  const router = useRouter();

  return (
    <CalAiOnboarding
      onExit={() => {
        router.replace('/paywall');
      }}
    />
  );
}
