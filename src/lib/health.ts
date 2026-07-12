import type { ActivitySummary } from './types';

/**
 * Web / Expo-Go-safe fallback. On iOS/Android a `.native.ts` sibling replaces
 * this module (Metro resolves `health.native.ts` on device) and talks to
 * Apple HealthKit / Android Health Connect. Here — and anywhere the native
 * modules aren't linked — activity sync simply reports "unavailable" so the
 * UI keeps its "Connect a device" empty states.
 */

export async function isHealthAvailable(): Promise<boolean> {
  return false;
}

export async function requestHealthPermissions(): Promise<boolean> {
  return false;
}

export async function getTodayActivity(): Promise<ActivitySummary | null> {
  return null;
}
