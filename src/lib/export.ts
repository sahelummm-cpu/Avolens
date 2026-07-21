import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { dayKey } from './days';
import type { AvoLensState } from './types';

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(state: AvoLensState): string {
  const lines: string[] = [];
  lines.push('AvoLens export');
  lines.push('');
  lines.push('# Food log');
  lines.push(['date', 'meal', 'name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'sugar_g'].join(','));
  const days: [string, typeof state.todayEntries][] = [
    [state.todayKey, state.todayEntries],
    ...Object.entries(state.history)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, v]) => [k, v.entries] as [string, typeof state.todayEntries]),
  ];
  for (const [date, entries] of days) {
    for (const e of entries) {
      lines.push([date, e.meal, csvCell(e.name), e.calories, e.protein, e.carbs, e.fat, e.fiber, e.sodium, e.sugar].join(','));
    }
  }
  lines.push('');
  lines.push('# Water (500 ml glasses)');
  lines.push(['date', 'glasses'].join(','));
  const waterDays: [string, number][] = [
    [state.todayKey, state.glasses],
    ...Object.entries(state.history)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, v]) => [k, v.glasses] as [string, number]),
  ];
  for (const [date, glasses] of waterDays) {
    if (glasses > 0) lines.push([date, glasses].join(','));
  }

  lines.push('');
  lines.push('# Weight');
  lines.push(['date', 'kg'].join(','));
  for (const w of state.weightLog) lines.push([w.ts ? dayKey(new Date(w.ts)) : w.date, w.kg].join(','));

  if (state.shots.length > 0) {
    lines.push('');
    lines.push('# Injections');
    lines.push(['date', 'time', 'dose', 'site'].join(','));
    for (const s of state.shots) {
      lines.push([s.date, csvCell(s.time), csvCell(s.doseMg), csvCell(s.site)].join(','));
    }
  }

  if (state.measurements.length > 0) {
    lines.push('');
    lines.push('# Measurements (cm)');
    lines.push(['date', 'waist', 'chest', 'hips', 'arm', 'thigh'].join(','));
    for (const m of state.measurements) {
      lines.push([dayKey(new Date(m.ts)), m.waist ?? '', m.chest ?? '', m.hips ?? '', m.arm ?? '', m.thigh ?? ''].join(','));
    }
  }
  return lines.join('\n');
}

/** Write the log/weight/measurements to a CSV file and open the share sheet or download on web. */
export async function exportCsv(state: AvoLensState): Promise<void> {
  const csvContent = buildCsv(state);
  if (Platform.OS === 'web') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avolens-export-${dayKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, `avolens-export-${dayKey(new Date())}.csv`);
  if (file.exists) file.delete();
  file.write(csvContent);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export AvoLens data' });
  }
}

/** Share a short progress summary via the OS share sheet. */
export async function shareProgress(state: AvoLensState, streak: number, unit: string): Promise<void> {
  const kg = (v: number) => (unit === 'lb' ? v * 2.20462 : v);
  const first = state.weightLog[0];
  const last = state.weightLog[state.weightLog.length - 1];
  const lines = ['My AvoLens progress 🥑'];
  if (first && last) {
    const delta = kg(last.kg) - kg(first.kg);
    lines.push(`Weight: ${kg(last.kg).toFixed(1)} ${unit} (${delta <= 0 ? '' : '+'}${delta.toFixed(1)} ${unit})`);
  }
  if (streak > 0) lines.push(`🔥 ${streak}-day logging streak`);
  const loggedDays = (state.todayEntries.length > 0 ? 1 : 0) + Object.values(state.history).filter((d) => d.entries.length > 0).length;
  lines.push(`${loggedDays} days logged`);
  await Share.share({ message: lines.join('\n') });
}
