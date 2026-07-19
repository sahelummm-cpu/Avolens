/**
 * Billing adapter for the paywall. No store billing SDK is wired up yet, so
 * the exported `purchases` is a local mock that always "succeeds" — swap it
 * for a real implementation (e.g. RevenueCat) without touching the paywall UI:
 *
 *   import Purchases from 'react-native-purchases';
 *   export const purchases: PurchasesAdapter = {
 *     getOfferings: async () => mapRcOfferings(await Purchases.getOfferings()),
 *     purchase: async (id) => { await Purchases.purchasePackage(...); ... },
 *     restore: async () => (await Purchases.restorePurchases()) ... ,
 *   };
 */

export type PlanId = 'annual' | 'monthly';

export interface PlanOffering {
  id: PlanId;
  /** Full price for one billing period, in `currency`. */
  price: number;
  /** ISO currency code — display uses the symbol for USD, falls back to the code. */
  currency: string;
  periodLabel: 'year' | 'month';
}

export interface PurchaseResult {
  ok: boolean;
  /** Human-readable reason when `ok` is false; null on user cancellation. */
  error?: string | null;
}

export interface PurchasesAdapter {
  getOfferings(): Promise<PlanOffering[]>;
  purchase(id: PlanId): Promise<PurchaseResult>;
  /** Returns true when a previous purchase was found and re-activated. */
  restore(): Promise<boolean>;
}

const MOCK_OFFERINGS: PlanOffering[] = [
  { id: 'annual', price: 29.99, currency: 'USD', periodLabel: 'year' },
  { id: 'monthly', price: 9.99, currency: 'USD', periodLabel: 'month' },
];

export const purchases: PurchasesAdapter = {
  getOfferings: async () => MOCK_OFFERINGS,
  purchase: async () => {
    // Simulate the store sheet round-trip so the UI's busy state is exercised.
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  },
  restore: async () => false,
};

/** "$0.58" — weekly breakdown of an annual price, for price re-framing. */
export function perWeekLabel(o: PlanOffering): string {
  const weeks = o.periodLabel === 'year' ? 52 : 52 / 12;
  return formatPrice(o.price / weeks, o.currency);
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}

/** Percentage saved choosing `annual` over 12 months of `monthly`. */
export function savingsPct(annual: PlanOffering, monthly: PlanOffering): number {
  return Math.round((1 - annual.price / (monthly.price * 12)) * 100);
}
