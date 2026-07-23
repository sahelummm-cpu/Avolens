export const runtime = 'nodejs';

/** A normalized food, values per 100 g. */
export interface FoodItem {
  id: string;
  name: string;
  brand: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number; // mg
  sugar: number;
}

// Open Food Facts asks that clients identify themselves via User-Agent.
const OFF_HEADERS = { 'User-Agent': 'AvoLens/1.0 (calorie tracker)' };

type OffNutriments = Record<string, number | string | undefined>;
interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
}

function num(v: number | string | undefined): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function normalize(p: OffProduct): FoodItem | null {
  const name = (p.product_name || '').trim();
  const n = p.nutriments || {};
  const calories = Math.round(num(n['energy-kcal_100g']));
  // Skip products with no name or no usable energy value.
  if (!name || calories <= 0) return null;
  return {
    id: p.code || name,
    name,
    brand: (p.brands || '').split(',')[0].trim(),
    serving: '100 g',
    calories,
    protein: Math.round(num(n['proteins_100g'])),
    carbs: Math.round(num(n['carbohydrates_100g'])),
    fat: Math.round(num(n['fat_100g'])),
    fiber: Math.round(num(n['fiber_100g'])),
    sodium: Math.round(num(n['sodium_100g']) * 1000), // g → mg
    sugar: Math.round(num(n['sugars_100g'])),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const barcode = searchParams.get('barcode')?.trim() ?? '';

  try {
    if (barcode) {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,serving_size,nutriments`;
      const res = await fetch(url, { headers: OFF_HEADERS });
      if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        return Response.json({ error: 'No product found for that barcode.' }, { status: 404 });
      }
      const item = normalize(data.product);
      if (!item) {
        return Response.json({ error: 'That product has no nutrition data on file.' }, { status: 404 });
      }
      return Response.json({ item });
    }

    if (q) {
      if (q.length < 2) return Response.json({ items: [] });
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=24&fields=code,product_name,brands,serving_size,nutriments`;
      const res = await fetch(url, { headers: OFF_HEADERS });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const products: OffProduct[] = Array.isArray(data.products) ? data.products : [];
      const items = products
        .map(normalize)
        .filter((x): x is FoodItem => x !== null)
        .slice(0, 20);
      return Response.json({ items });
    }

    return Response.json({ items: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Food lookup failed.';
    return Response.json({ error: message }, { status: 502 });
  }
}
