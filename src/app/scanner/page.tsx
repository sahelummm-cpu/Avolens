'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/MobileFrame';
import { useStore } from '@/lib/store';
import type { ScanResult } from '@/app/api/scan/route';

function mealForNow(): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

export default function ScannerPage() {
  const router = useRouter();
  const { state, addEntry } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError('Camera access is unavailable. You can still add food manually.');
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || loading) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const imageBase64 = dataUrl.split(',')[1];

    setLoading(true);
    setScanError(null);
    setResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult(data as ScanResult);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const removeIngredient = (i: number) => {
    if (!result) return;
    setResult({ ...result, ingredients: result.ingredients.filter((_, idx) => idx !== i) });
  };

  const addToLog = () => {
    if (!result) return;
    addEntry({
      name: result.name,
      meal: mealForNow(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories: Math.round(result.calories),
      protein: Math.round(result.protein),
      carbs: Math.round(result.carbs),
      fat: Math.round(result.fat),
      fiber: Math.round(result.fiber),
      sodium: Math.round(result.sodium),
      sugar: Math.round(result.sugar),
      healthScore: Math.round(result.healthScore),
      ingredients: result.ingredients,
      icon: 'generic',
    });
    router.push('/home');
  };

  const macroTotal = result ? result.protein + result.carbs + result.fat : 0;
  const pct = (v: number) => (macroTotal > 0 ? Math.round((v / macroTotal) * 100) : 0);

  return (
    <MobileFrame bg="#121614">
      <div style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden', background: '#121614' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: cameraError ? 0 : 1 }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 36%, rgba(40,49,43,.35), rgba(18,22,20,.7) 75%)' }} />

        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
          <div onClick={() => router.push('/home')} role="button" style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
          </div>
          <div style={{ font: '600 14px var(--font-body)', color: '#fff' }}>Scan your meal</div>
          <div style={{ width: 40, height: 40 }} />
        </div>

        {!result && !loading && (
          <div style={{ position: 'absolute', top: 100, left: 52, right: 52, height: 286, zIndex: 20 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 38, height: 38, borderTop: '3px solid var(--av-green-grad-1)', borderLeft: '3px solid var(--av-green-grad-1)', borderTopLeftRadius: 16 }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 38, height: 38, borderTop: '3px solid var(--av-green-grad-1)', borderRight: '3px solid var(--av-green-grad-1)', borderTopRightRadius: 16 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 38, height: 38, borderBottom: '3px solid var(--av-green-grad-1)', borderLeft: '3px solid var(--av-green-grad-1)', borderBottomLeftRadius: 16 }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 38, height: 38, borderBottom: '3px solid var(--av-green-grad-1)', borderRight: '3px solid var(--av-green-grad-1)', borderBottomRightRadius: 16 }} />
            <div style={{ position: 'absolute', bottom: -32, left: 0, right: 0, textAlign: 'center', font: '500 12px var(--font-body)', color: 'rgba(255,255,255,.55)' }}>
              {cameraError ?? 'Center your plate in the frame'}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35, flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 99, border: '3px solid rgba(255,255,255,.25)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ font: '600 13px var(--font-body)', color: '#fff' }}>Analyzing your meal…</span>
            <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          </div>
        )}

        {scanError && !loading && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--av-surface)', borderRadius: '28px 28px 0 0', padding: '24px 22px 34px', zIndex: 30, textAlign: 'center', border: '1px solid var(--av-border)', borderBottom: 'none' }}>
            <div style={{ font: '600 13px var(--font-body)', color: 'var(--av-protein)', marginBottom: 10 }}>{scanError}</div>
            <div onClick={() => setScanError(null)} role="button" style={{ font: '700 13px var(--font-display)', color: 'var(--av-green)', cursor: 'pointer' }}>Try again</div>
          </div>
        )}

        {result && !loading && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--av-surface)', borderRadius: '28px 28px 0 0', padding: '18px 22px 34px', zIndex: 30, maxHeight: '70dvh', overflowY: 'auto', border: '1px solid var(--av-border)', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--av-green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="var(--av-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14h22a11 11 0 0 1-11 11A11 11 0 0 1 5 14Z" /><path d="M9 14a7 7 0 0 1 14 0" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 15px var(--font-body)', color: 'var(--av-ink)' }}>{result.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ font: '500 12px var(--font-body)', color: 'var(--av-muted)' }}>{Math.round(result.matchConfidence)}% match · AvoLens AI</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--av-green-tint)', borderRadius: 99, padding: '2px 7px' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--av-green)"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></svg>
                    <span style={{ font: '700 10px var(--font-display)', color: 'var(--av-green-grad-2)' }}>{Math.round(result.healthScore)}/10</span>
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: '800 24px var(--font-display)', color: 'var(--av-ink)' }}>{Math.round(result.calories)}</div>
                <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted-2)', marginTop: -4 }}>kcal</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ font: '600 11px var(--font-body)', color: 'var(--av-muted-2)', width: '100%' }}>Ingredients</span>
              {result.ingredients.map((ing, i) => (
                <span key={ing + i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px var(--font-body)', color: 'var(--av-green-grad-2)', background: 'var(--av-green-tint)', padding: '4px 8px 4px 10px', borderRadius: 99 }}>
                  {ing}
                  <svg onClick={() => removeIngredient(i)} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#7FB79A" strokeWidth="3" strokeLinecap="round" style={{ cursor: 'pointer' }}><path d="M6 6l12 12M18 6 6 18" /></svg>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <MacroCell color="var(--av-protein)" value={`${Math.round(result.protein)}g`} label={`Protein · ${pct(result.protein)}%`} />
              <MacroCell color="var(--av-carbs)" value={`${Math.round(result.carbs)}g`} label={`Carbs · ${pct(result.carbs)}%`} />
              <MacroCell color="var(--av-fat)" value={`${Math.round(result.fat)}g`} label={`Fat · ${pct(result.fat)}%`} />
            </div>

            <div style={{ display: 'flex', marginTop: 12, border: '1px solid var(--av-border)', borderRadius: 12, overflow: 'hidden' }}>
              <NutrientCell value={`${Math.round(result.fiber)}g`} label={`Fiber · ${Math.round((result.fiber / state.goal.fiber) * 100)}%`} />
              <NutrientCell value={`${Math.round(result.sodium)}mg`} label={`Sodium · ${Math.round((result.sodium / state.goal.sodium) * 100)}%`} border />
              <NutrientCell value={`${Math.round(result.sugar)}g`} label={`Sugar · ${Math.round((result.sugar / state.goal.sugar) * 100)}%`} border />
            </div>

            <button onClick={addToLog} style={{ width: '100%', height: 50, borderRadius: 16, background: 'var(--av-green)', border: 'none', color: '#fff', font: '700 15px var(--font-display)', marginTop: 14, cursor: 'pointer' }}>
              Add to Log
            </button>
            <div onClick={() => router.push('/manual-entry')} role="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span style={{ font: '600 13px var(--font-body)', color: 'var(--av-muted)' }}>Add food manually</span>
            </div>
          </div>
        )}

        {!result && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 32px', zIndex: 30 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '700 12px var(--font-body)', color: 'var(--av-ink)', background: '#fff', padding: '9px 15px', borderRadius: 99, boxShadow: '0 2px 10px rgba(0,0,0,.18)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v6a2 2 0 0 0 4 0V2" /><path d="M8 8v14" /><path d="M17 2c-1.6 0-2.6 2-2.6 5s1 5 2.6 5 2.6-1.6 2.6-5S18.6 2 17 2Z" /><path d="M17 12v10" /></svg>
                Food
              </div>
              <ModeChip title="Barcode" onClick={() => showToast('Barcode scanning coming soon')}>
                <path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12" />
              </ModeChip>
              <ModeChip title="Label" onClick={() => showToast('Label scanning coming soon')}>
                <rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" />
              </ModeChip>
              <ModeChip title="Manual" onClick={() => router.push('/manual-entry')}>
                <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </ModeChip>
              <ModeChip title="Voice" onClick={() => showToast('Voice logging coming soon')}>
                <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
              </ModeChip>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
              <div onClick={() => router.push('/manual-entry')} role="button" style={{ width: 44, height: 44, borderRadius: 99, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="12" cy="12" r="3.5" /></svg>
              </div>
              <div onClick={capture} role="button" style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff' }} />
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 99, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: 'absolute', bottom: 210, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.8)', color: '#fff', padding: '8px 16px', borderRadius: 99, font: '600 12px var(--font-body)', zIndex: 50 }}>
            {toast}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}

function ModeChip({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div title={title} onClick={onClick} role="button" style={{ width: 38, height: 38, borderRadius: 99, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </div>
  );
}

function MacroCell({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: '1px solid var(--av-border)', padding: '10px 0', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 9, background: color }} />
        <span style={{ font: '700 13px var(--font-display)', color: 'var(--av-ink)' }}>{value}</span>
      </div>
      <span style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted-2)' }}>{label}</span>
    </div>
  );
}

function NutrientCell({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '9px 0', borderLeft: border ? '1px solid var(--av-border)' : undefined }}>
      <span style={{ font: '700 13px var(--font-display)', color: 'var(--av-ink)' }}>{value}</span>
      <span style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted-2)' }}>{label}</span>
    </div>
  );
}
