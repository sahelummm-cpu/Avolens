import { dayKey } from './days';
import type { AvoLensState, InjectionSite, Medication, ShotRecord } from './types';

/** GLP-1 medication catalog with each drug's dose ladder and cadence. */
export const MEDICATIONS: Medication[] = [
  {
    key: 'semaglutide',
    name: 'Semaglutide',
    brands: 'Ozempic · Wegovy',
    frequency: 'weekly',
    doses: ['0.25', '0.5', '1.0', '1.7', '2.4'],
  },
  {
    key: 'tirzepatide',
    name: 'Tirzepatide',
    brands: 'Mounjaro · Zepbound',
    frequency: 'weekly',
    doses: ['2.5', '5', '7.5', '10', '12.5', '15'],
  },
  {
    key: 'liraglutide',
    name: 'Liraglutide',
    brands: 'Saxenda · Victoza',
    frequency: 'daily',
    doses: ['0.6', '1.2', '1.8', '2.4', '3.0'],
  },
  {
    key: 'dulaglutide',
    name: 'Dulaglutide',
    brands: 'Trulicity',
    frequency: 'weekly',
    doses: ['0.75', '1.5', '3.0', '4.5'],
  },
];

export function getMedication(key: string): Medication {
  return MEDICATIONS.find((m) => m.key === key) ?? MEDICATIONS[0];
}

/** Rotation order for injection sites; the app suggests the next one. */
export const SITES: InjectionSite[] = ['Belly L', 'Belly R', 'Thigh L', 'Thigh R', 'Arm L', 'Arm R'];

export function suggestedSite(shots: ShotRecord[]): InjectionSite {
  const last = shots[shots.length - 1];
  if (!last) return SITES[0];
  const i = SITES.indexOf(last.site);
  return SITES[(i + 1) % SITES.length];
}

type MedSchedule = Pick<AvoLensState, 'medKey' | 'medDay' | 'medHour' | 'medMinute' | 'shots'>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Was a dose taken in the current cycle (today for daily, last 6 days for weekly)? */
export function takenThisCycle(s: MedSchedule, now = new Date()): ShotRecord | undefined {
  const med = getMedication(s.medKey);
  const windowDays = med.frequency === 'daily' ? 0 : 6;
  for (let i = s.shots.length - 1; i >= 0; i--) {
    const shot = s.shots[i];
    for (let n = 0; n <= windowDays; n++) {
      if (shot.date === dayKey(new Date(now.getTime() - n * DAY_MS))) return shot;
    }
    // Shots are appended chronologically; once older than the window, stop.
    break;
  }
  return undefined;
}

/** The next scheduled dose time (skips the current cycle once it's taken). */
export function nextDoseAt(s: MedSchedule, now = new Date()): Date {
  const med = getMedication(s.medKey);
  const d = new Date(now);
  d.setHours(s.medHour, s.medMinute, 0, 0);

  if (med.frequency === 'daily') {
    if (d <= now || takenThisCycle(s, now)) d.setDate(d.getDate() + 1);
    return d;
  }

  // Weekly: first occurrence of medDay at the scheduled time that's ahead.
  for (let i = 0; i < 8; i++) {
    if (d.getDay() === s.medDay && d > now) break;
    d.setDate(d.getDate() + 1);
  }
  if (takenThisCycle(s, now) && d.getTime() - now.getTime() < 7 * DAY_MS) {
    // Already injected this week and the next slot is still inside it.
    const taken = takenThisCycle(s, now)!;
    if (taken.date >= dayKey(new Date(d.getTime() - 7 * DAY_MS))) d.setDate(d.getDate() + 7);
  }
  return d;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDoseSlot(s: MedSchedule): string {
  const med = getMedication(s.medKey);
  const h12 = ((s.medHour + 11) % 12) + 1;
  const ampm = s.medHour < 12 ? 'AM' : 'PM';
  const time = `${h12}:${String(s.medMinute).padStart(2, '0')} ${ampm}`;
  return med.frequency === 'daily' ? `Daily ${time}` : `${DAY_NAMES[s.medDay]} ${time}`;
}

export function countdownLabel(s: MedSchedule, now = new Date()): string {
  const next = nextDoseAt(s, now);
  const days = Math.round((new Date(next).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/**
 * Consecutive cycles (weeks for weekly meds, days for daily) with at least
 * one shot, counting back from the current cycle. The current cycle counts
 * only once its shot is logged.
 */
export function shotStreak(s: MedSchedule, now = new Date()): number {
  const med = getMedication(s.medKey);
  const period = med.frequency === 'daily' ? 1 : 7;
  const taken = new Set(s.shots.map((x) => x.date));
  const hasShotInPeriod = (offset: number): boolean => {
    for (let n = 0; n < period; n++) {
      if (taken.has(dayKey(new Date(now.getTime() - (offset * period + n) * DAY_MS)))) return true;
    }
    return false;
  };
  let streak = 0;
  let offset = 0;
  if (hasShotInPeriod(0)) {
    streak = 1;
    offset = 1;
  } else {
    offset = 1; // current cycle not yet taken — don't break the streak for it
  }
  while (hasShotInPeriod(offset)) {
    streak++;
    offset++;
  }
  return streak;
}

/** Last 8 cycles (oldest → newest incl. current) — true where a shot exists. */
export function recentCycles(s: MedSchedule, now = new Date()): boolean[] {
  const med = getMedication(s.medKey);
  const period = med.frequency === 'daily' ? 1 : 7;
  const taken = new Set(s.shots.map((x) => x.date));
  const out: boolean[] = [];
  for (let offset = 7; offset >= 0; offset--) {
    let hit = false;
    for (let n = 0; n < period; n++) {
      if (taken.has(dayKey(new Date(now.getTime() - (offset * period + n) * DAY_MS)))) hit = true;
    }
    out.push(hit);
  }
  return out;
}
