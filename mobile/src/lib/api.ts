import type { ScanResult } from './types';

/**
 * The AI scan runs on the web app's server route (/api/scan) so the Anthropic
 * key never ships inside the mobile binary. Point EXPO_PUBLIC_API_URL at your
 * deployed AvoLens web app (e.g. https://avolens.vercel.app) — or a local
 * `npm run dev` server — in mobile/.env.
 */
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export async function scanMeal(imageBase64: string, mediaType = 'image/jpeg'): Promise<ScanResult> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Set it to your AvoLens web app URL.');
  }
  const res = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  return data as ScanResult;
}
