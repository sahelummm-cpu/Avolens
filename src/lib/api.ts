import type { ScanResult } from './types';
import { supabase } from './supabase';

/**
 * The AI scan runs on the web app's server route (/api/scan) so the Anthropic
 * key never ships inside the mobile binary. Point EXPO_PUBLIC_API_URL at your
 * deployed AvoLens web app (e.g. https://avolens.vercel.app) — or a local
 * `npm run dev` server — in .env.
 */
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/**
 * Barcode lookup via the free OpenFoodFacts database. Values are per 100 g.
 */
export async function lookupBarcode(code: string): Promise<ScanResult> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,nutriscore_grade,ingredients`,
    { headers: { 'User-Agent': 'AvoLens/1.0 (mobile)' } },
  );
  if (!res.ok) throw new Error('Barcode lookup failed. Check your connection.');
  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found in the food database.');
  }
  const p = data.product;
  const n = p.nutriments ?? {};
  const grade: string = (p.nutriscore_grade ?? '').toLowerCase();
  const healthScore = { a: 9, b: 8, c: 6, d: 4, e: 2 }[grade as 'a'] ?? 6;
  const ingredients: string[] = Array.isArray(p.ingredients)
    ? p.ingredients
      .map((i: { text?: string }) => (i.text ?? '').trim())
      .filter(Boolean)
      .slice(0, 6)
    : [];
  const energyKcal =
    n['energy-kcal_100g'] ??
    n['energy-kcal'] ??
    n['energy-kcal_value'] ??
    (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);
  return {
    name: [p.product_name, p.brands ? `(${String(p.brands).split(',')[0].trim()})` : '']
      .filter(Boolean)
      .join(' ') || 'Scanned product',
    matchConfidence: 100,
    calories: Math.round(energyKcal ?? 0),
    protein: Math.round(n.proteins_100g ?? 0),
    carbs: Math.round(n.carbohydrates_100g ?? 0),
    fat: Math.round(n.fat_100g ?? 0),
    fiber: Math.round(n.fiber_100g ?? 0),
    sodium: Math.round((n.sodium_100g ?? 0) * 1000),
    sugar: Math.round(n.sugars_100g ?? 0),
    healthScore,
    ingredients: ['per 100g', ...ingredients],
  };
}

async function invokeScan(body: Record<string, unknown>): Promise<ScanResult> {
  // Prefer the Supabase 'scan' edge function when the backend is configured;
  // fall back to the web app's /api/scan route.
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('scan', { body });
    if (error) {
      // FunctionsHttpError carries the server Response — surface its message.
      const ctx = (error as { context?: Response }).context;
      if (ctx?.status === 401) throw new Error('Sign in (Settings → Account) to use AI scanning.');
      if (ctx?.status === 429) throw new Error("You've reached today's AI scan limit — try again tomorrow.");
      let serverMsg: string | null = null;
      try {
        serverMsg = ((await ctx?.json()) as { error?: string })?.error ?? null;
      } catch {
        // body unavailable / not JSON
      }
      throw new Error(serverMsg ?? 'Scan failed. Please check your connection and try again.');
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as ScanResult;
  }
  if (!API_URL) {
    throw new Error('No scan backend configured. Set EXPO_PUBLIC_SUPABASE_URL (+key) or EXPO_PUBLIC_API_URL.');
  }
  const res = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  return data as ScanResult;
}

/** AI nutrition estimate from a meal photo ('meal') or an exact read of a printed nutrition label ('label'). */
export async function scanMeal(
  imageBase64: string,
  mediaType = 'image/jpeg',
  mode: 'meal' | 'label' = 'meal',
): Promise<ScanResult> {
  return invokeScan({ imageBase64, mediaType, mode });
}

/** AI nutrition estimate parsed from a spoken description of what was eaten. */
export async function parseSpokenMeal(text: string): Promise<ScanResult> {
  return invokeScan({ mode: 'voice', text });
}
