'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/MobileFrame';
import { useStore } from '@/lib/store';
import { FREQUENT_FOODS } from '@/lib/constants';
import type { FoodEntry } from '@/lib/types';
import type { FoodItem } from '@/app/api/foods/route';

const MEALS: FoodEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function ManualEntryPage() {
  const router = useRouter();
  const { addEntry } = useStore();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [name, setName] = useState('Avocado toast');
  const [meal, setMeal] = useState<FoodEntry['meal']>('Breakfast');
  const [servings, setServings] = useState(1);
  const [protein, setProtein] = useState(12);
  const [carbs, setCarbs] = useState(34);
  const [fat, setFat] = useState(16);
  const [fiber, setFiber] = useState(8);
  const [sodium, setSodium] = useState(380);
  const [sugar, setSugar] = useState(4);
  const [showMoreNutrients, setShowMoreNutrients] = useState(false);

  const calories = useMemo(() => Math.round((protein * 4 + carbs * 4 + fat * 9) * servings), [protein, carbs, fat, servings]);

  // Debounced live search against the real food database (Open Food Facts).
  useEffect(() => {
    const q = search.trim();
    let cancelled = false;
    const ctrl = new AbortController();
    const run = async () => {
      if (q.length < 2) {
        if (!cancelled) {
          setResults([]);
          setSearching(false);
          setSearchError(null);
        }
        return;
      }
      if (!cancelled) {
        setSearching(true);
        setSearchError(null);
      }
      try {
        const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'Search failed');
        setResults(data.items as FoodItem[]);
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        setResults([]);
        setSearchError('Could not reach the food database. Check your connection or create a custom entry below.');
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    const timer = setTimeout(run, q.length < 2 ? 0 : 350);
    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [search]);

  const applyFrequent = (f: (typeof FREQUENT_FOODS)[number]) => {
    setName(f.name);
    setProtein(f.protein);
    setCarbs(f.carbs);
    setFat(f.fat);
  };

  const applyFood = (f: FoodItem) => {
    setName(f.brand ? `${f.name} · ${f.brand}` : f.name);
    setProtein(f.protein);
    setCarbs(f.carbs);
    setFat(f.fat);
    setFiber(f.fiber);
    setSodium(f.sodium);
    setSugar(f.sugar);
    setServings(1);
    setShowMoreNutrients(true);
    setSearch('');
    setResults([]);
  };

  const save = () => {
    const now = new Date();
    addEntry({
      name,
      meal,
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories,
      protein: protein * servings,
      carbs: carbs * servings,
      fat: fat * servings,
      fiber: fiber * servings,
      sodium: sodium * servings,
      sugar: sugar * servings,
      healthScore: 7,
      icon: 'generic',
    });
    router.push('/home');
  };

  return (
    <MobileFrame>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 12px' }}>
        <div
          onClick={() => router.back()}
          role="button"
          aria-label="Back"
          style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--av-surface)', border: '1px solid var(--av-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--av-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
        </div>
        <span style={{ font: '700 17px var(--font-display)', color: 'var(--av-ink)' }}>Add Food</span>
        <span onClick={save} role="button" style={{ font: '700 14px var(--font-display)', color: 'var(--av-green)', width: 36, textAlign: 'right', cursor: 'pointer' }}>
          Save
        </span>
      </div>

      <div style={{ padding: '2px 22px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 16, padding: '13px 15px', marginBottom: 18 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods by name or brand"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: '500 14px var(--font-body)', color: 'var(--av-ink)' }}
          />
        </div>

        {search.trim().length >= 2 ? (
          <div style={{ marginBottom: 20 }}>
            {searching && (
              <div style={{ font: '500 13px var(--font-body)', color: 'var(--av-muted)', padding: '4px 2px 12px' }}>Searching the food database…</div>
            )}
            {!searching && searchError && (
              <div style={{ font: '500 13px var(--font-body)', color: 'var(--av-protein)', padding: '4px 2px 12px' }}>{searchError}</div>
            )}
            {!searching && !searchError && results.length === 0 && (
              <div style={{ font: '500 13px var(--font-body)', color: 'var(--av-muted)', padding: '4px 2px 12px' }}>No matches — try another name, or create a custom entry below.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map((f) => (
                <div
                  key={f.id}
                  onClick={() => applyFood(f)}
                  role="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 14, padding: '11px 14px', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 14px var(--font-body)', color: 'var(--av-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                      {f.brand && <span style={{ color: 'var(--av-muted)', fontWeight: 500 }}> · {f.brand}</span>}
                    </div>
                    <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted-2)', marginTop: 3 }}>
                      {f.calories} cal · P{f.protein} C{f.carbs} F{f.fat} · per {f.serving}
                    </div>
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--av-green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ font: '700 11px var(--font-body)', color: 'var(--av-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Frequent</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {FREQUENT_FOODS.map((f) => (
                <span
                  key={f.name}
                  onClick={() => applyFrequent(f)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px var(--font-body)', color: 'var(--av-ink)', background: 'var(--av-surface)', border: '1px solid var(--av-border)', padding: '8px 12px', borderRadius: 99, cursor: 'pointer' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 9, background: f.color }} />
                  {f.name}
                </span>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--av-border)' }} />
          <span style={{ font: '600 12px var(--font-body)', color: 'var(--av-muted-2)' }}>Or create custom</span>
          <div style={{ flex: 1, height: 1, background: 'var(--av-border)' }} />
        </div>

        <Field label="Food name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Meal</FieldLabel>
            <select value={meal} onChange={(e) => setMeal(e.target.value as FoodEntry['meal'])} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
              {MEALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Servings</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 14, padding: '8px 10px' }}>
              <Stepper onClick={() => setServings((s) => Math.max(1, s - 1))} color="var(--av-ink)" bg="var(--av-surface-3)" icon="minus" />
              <span style={{ font: '700 15px var(--font-display)', color: 'var(--av-ink)' }}>{servings}</span>
              <Stepper onClick={() => setServings((s) => s + 1)} color="#fff" bg="var(--av-green-tint)" iconColor="var(--av-green)" icon="plus" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 16, padding: '15px 18px', marginBottom: 16 }}>
          <div>
            <div style={{ font: '700 14px var(--font-display)', color: 'var(--av-ink)' }}>Calories</div>
            <div style={{ font: '500 11px var(--font-body)', color: 'var(--av-muted-2)', marginTop: 2 }}>Auto-calculated from macros</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ font: '800 28px var(--font-display)', color: 'var(--av-ink)', letterSpacing: '-.02em' }}>{calories}</span>
            <span style={{ font: '600 13px var(--font-display)', color: 'var(--av-muted-2)' }}>kcal</span>
          </div>
        </div>

        <div style={{ font: '600 12px var(--font-body)', color: 'var(--av-muted)', marginBottom: 8 }}>Macros (g)</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <MacroInput label="Protein" color="var(--av-protein)" value={protein} onChange={setProtein} />
          <MacroInput label="Carbs" color="var(--av-carbs)" value={carbs} onChange={setCarbs} />
          <MacroInput label="Fat" color="var(--av-fat)" value={fat} onChange={setFat} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ font: '600 12px var(--font-body)', color: 'var(--av-muted)' }}>More nutrients</span>
          {!showMoreNutrients && (
            <span onClick={() => setShowMoreNutrients(true)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 4, font: '600 12px var(--font-body)', color: 'var(--av-green)', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--av-green)" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Add
            </span>
          )}
        </div>
        {showMoreNutrients && (
          <div style={{ display: 'flex', gap: 10 }}>
            <NutrientInput label="Fiber" suffix="g" value={fiber} onChange={setFiber} />
            <NutrientInput label="Sodium" suffix="mg" value={sodium} onChange={setSodium} />
            <NutrientInput label="Sugar" suffix="g" value={sugar} onChange={setSugar} />
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 480, padding: '14px 22px 26px', background: 'linear-gradient(to top, var(--av-bg) 72%, transparent)' }}>
        <button onClick={save} style={{ width: '100%', height: 54, borderRadius: 18, background: 'var(--av-green)', border: 'none', color: '#fff', font: '700 16px var(--font-display)', boxShadow: '0 12px 26px -10px rgba(47,158,110,.6)', cursor: 'pointer' }}>
          Add to Log
        </button>
      </div>
    </MobileFrame>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 14, padding: '13px 15px',
  font: '600 15px var(--font-body)', color: 'var(--av-ink)', outline: 'none',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ font: '600 12px var(--font-body)', color: 'var(--av-muted)', marginBottom: 7 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function Stepper({ onClick, bg, color, iconColor, icon }: { onClick: () => void; bg: string; color: string; iconColor?: string; icon: 'plus' | 'minus' }) {
  return (
    <div onClick={onClick} role="button" style={{ width: 28, height: 28, borderRadius: 99, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={iconColor ?? color} strokeWidth="3" strokeLinecap="round">
        {icon === 'plus' ? <path d="M12 5v14M5 12h14" /> : <path d="M5 12h14" />}
      </svg>
    </div>
  );
}

function MacroInput({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ flex: 1, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 16, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 9, background: color }} />
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{ width: 40, border: 'none', outline: 'none', background: 'transparent', font: '800 20px var(--font-display)', color: 'var(--av-ink)', textAlign: 'center' }}
        />
      </div>
      <span style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted)' }}>{label}</span>
    </div>
  );
}

function NutrientInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ flex: 1, background: 'var(--av-surface)', border: '1px solid var(--av-border)', borderRadius: 16, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{ width: 44, border: 'none', outline: 'none', background: 'transparent', font: '700 15px var(--font-display)', color: 'var(--av-ink)', textAlign: 'right' }}
        />
        <span style={{ font: '700 12px var(--font-display)', color: 'var(--av-ink)' }}>{suffix}</span>
      </div>
      <span style={{ font: '500 10px var(--font-body)', color: 'var(--av-muted)' }}>{label}</span>
    </div>
  );
}
