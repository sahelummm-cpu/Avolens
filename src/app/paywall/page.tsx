'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { MobileFrame } from '@/components/MobileFrame';
import { PrimaryButton } from '@/components/PrimaryButton';

const FEATURES = ['Unlimited AI food scans', 'Barcode, label & fridge modes', 'AI Coach & advanced insights'];

export default function PaywallPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <MobileFrame>
      <div
        onClick={() => router.back()}
        role="button"
        aria-label="Close"
        style={{ position: 'absolute', top: 24, right: 22, width: 34, height: 34, borderRadius: 99, background: 'var(--av-surface)', border: '1px solid var(--av-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, cursor: 'pointer' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </div>

      <div style={{ padding: '80px 26px 26px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Logo size={96} shadow />
          <div style={{ font: '700 12px var(--font-display)', color: 'var(--av-green)', letterSpacing: '.18em', marginTop: 14 }}>AVOLENS PRO</div>
          <div style={{ font: '800 26px var(--font-display)', color: 'var(--av-ink)', marginTop: 6, textAlign: 'center', lineHeight: 1.25 }}>
            Track smarter,<br />effortlessly
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 24, height: 24, borderRadius: 99, background: 'var(--av-green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-11" /></svg>
              </div>
              <span style={{ font: '500 14px var(--font-body)', color: 'var(--av-ink)' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            onClick={() => setPlan('monthly')}
            role="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--av-surface)',
              border: plan === 'monthly' ? '2px solid var(--av-green)' : '1.5px solid var(--av-border)', borderRadius: 18, padding: '15px 18px', cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ font: '600 15px var(--font-body)', color: 'var(--av-ink)' }}>Monthly</div>
              <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>Billed every month</div>
            </div>
            <div style={{ font: '800 18px var(--font-display)', color: 'var(--av-ink)' }}>$9.99</div>
          </div>

          <div
            onClick={() => setPlan('yearly')}
            role="button"
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--av-surface)',
              border: plan === 'yearly' ? '2px solid var(--av-green)' : '1.5px solid var(--av-border)', borderRadius: 18, padding: '15px 18px', cursor: 'pointer',
            }}
          >
            <div style={{ position: 'absolute', top: -11, left: 16, background: 'var(--av-green)', color: '#fff', font: '700 10px var(--font-display)', letterSpacing: '.04em', padding: '4px 10px', borderRadius: 99 }}>
              BEST VALUE · SAVE 75%
            </div>
            <div>
              <div style={{ font: '600 15px var(--font-body)', color: 'var(--av-ink)' }}>Yearly</div>
              <div style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>$2.50 / month</div>
            </div>
            <div style={{ font: '800 18px var(--font-display)', color: 'var(--av-green)' }}>$29.99</div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          <PrimaryButton onClick={() => router.push('/home')}>Start 7-day free trial</PrimaryButton>
          <div style={{ textAlign: 'center', font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>Cancel anytime · Restore purchase</div>
        </div>
      </div>
    </MobileFrame>
  );
}
