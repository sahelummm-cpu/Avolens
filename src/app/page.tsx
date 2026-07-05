'use client';

import { useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/MobileFrame';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStore } from '@/lib/store';

export default function SplashPage() {
  const router = useRouter();
  const { finishOnboarding } = useStore();

  const enter = () => {
    finishOnboarding();
    router.push('/home');
  };

  return (
    <MobileFrame>
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <Logo size={126} shadow />
        <div style={{ font: '800 42px var(--font-display)', color: 'var(--av-ink)', letterSpacing: '-.02em', marginTop: 32 }}>
          AvoLens<span style={{ color: 'var(--av-green)' }}>.</span>
        </div>
        <div style={{ font: '600 18px var(--font-body)', color: 'var(--av-ink)', marginTop: 12 }}>Snap it. AvoLens tracks it.</div>
        <div style={{ font: '500 14px var(--font-body)', color: 'var(--av-muted)', marginTop: 12, lineHeight: 1.6, maxWidth: 250 }}>
          Effortless calorie &amp; macro tracking. Just point your camera at the plate.
        </div>

        <div style={{ position: 'absolute', bottom: 48, left: 40, right: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PrimaryButton onClick={enter}>Get Started</PrimaryButton>
          <div onClick={enter} style={{ textAlign: 'center', font: '600 14px var(--font-body)', color: 'var(--av-ink)', opacity: 0.6, cursor: 'pointer' }}>
            I already have an account
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
