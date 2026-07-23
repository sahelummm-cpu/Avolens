/**
 * Food database (OpenFoodFacts) search + portion scaling.
 * A `FoodBasis` holds nutrients per 100 g; `scaleBasis` turns it into the
 * absolute macros for a portion the user actually ate.
 */

export interface FoodBasis {
  name: string;
  brands?: string;
  // per 100 g
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number; // mg per 100 g
  sugar: number;
  healthScore: number;
  servingG?: number; // typical serving weight, when known
  imageUri?: string;
}

export interface ScaledMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

/** Absolute macros for `grams` of a per-100g basis. */
export function scaleBasis(b: FoodBasis, grams: number): ScaledMacros {
  const k = Math.max(0, grams) / 100;
  return {
    calories: Math.round(b.calories * k),
    protein: Math.round(b.protein * k),
    carbs: Math.round(b.carbs * k),
    fat: Math.round(b.fat * k),
    fiber: Math.round(b.fiber * k),
    sodium: Math.round(b.sodium * k),
    sugar: Math.round(b.sugar * k),
  };
}

function nutriHealth(grade: unknown): number {
  const g = String(grade ?? '').toLowerCase();
  return ({ a: 9, b: 8, c: 6, d: 4, e: 2 } as Record<string, number>)[g] ?? 6;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBasis(p: any): FoodBasis | null {
  const n = p?.nutriments ?? {};
  const kcal =
    n['energy-kcal_100g'] ??
    n['energy-kcal'] ??
    n['energy-kcal_value'] ??
    (n['energy_100g'] ? n['energy_100g'] / 4.184 : null);
  if (kcal == null || !p?.product_name) return null;
  const serving = Number(p.serving_quantity);
  return {
    name: String(p.product_name).trim(),
    brands: p.brands ? String(p.brands).split(',')[0].trim() : undefined,
    calories: Math.round(kcal),
    protein: Math.round(n.proteins_100g ?? 0),
    carbs: Math.round(n.carbohydrates_100g ?? 0),
    fat: Math.round(n.fat_100g ?? 0),
    fiber: Math.round(n.fiber_100g ?? 0),
    sodium: Math.round((n.sodium_100g ?? 0) * 1000),
    sugar: Math.round(n.sugars_100g ?? 0),
    healthScore: nutriHealth(p.nutriscore_grade),
    servingG: Number.isFinite(serving) && serving > 0 ? Math.round(serving) : undefined,
    imageUri: p.image_front_small_url || p.image_url || undefined,
  };
}

const FIELDS = 'product_name,brands,nutriments,nutriscore_grade,serving_quantity,image_front_small_url,image_url';
const UA = { 'User-Agent': 'AvoLens/1.0 (mobile; support@avolens.app)' };

/**
 * fetch with a per-attempt timeout and one automatic retry — OpenFoodFacts
 * can be slow or drop the first request, which the UI used to surface as
 * "Search failed. Check your connection."
 */
async function fetchResilient(url: string, signal?: AbortSignal, attempts = 2, timeoutMs = 8000): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted) throw new Error('aborted');
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: UA, signal: ctrl.signal });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (signal?.aborted) throw e;
      lastErr = e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 600));
  }
  throw lastErr instanceof Error ? lastErr : new Error('Network request failed');
}

/** Free-text search of the OpenFoodFacts database. Returns per-100g bases. */
export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodBasis[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
  const res = await fetchResilient(url, signal);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: any[] = Array.isArray(data.products) ? data.products : [];
  const seen = new Set<string>();
  const out: FoodBasis[] = [];
  for (const p of products) {
    const b = toBasis(p);
    if (!b) continue;
    const key = `${b.name.toLowerCase()}|${b.brands ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
    if (out.length >= 20) break;
  }
  return out;
}

/** Barcode → per-100g basis (used by the scanner's portion adjust). */
export async function barcodeBasis(code: string): Promise<FoodBasis> {
  const res = await fetchResilient(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
  );
  const data = await res.json();
  const basis = data.status === 1 ? toBasis(data.product) : null;
  if (!basis) throw new Error('Product not found in the food database.');
  return basis;
}
