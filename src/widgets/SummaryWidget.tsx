import * as React from 'react';
import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { WidgetSnapshot } from '@/lib/types';

/**
 * Android home-screen widgets — the "Home Widget" screen from the Nibbl v2
 * design. Three separate widgets the user can place independently:
 *   • AvoLensSummary — the ring card: calorie/macro ring with "kcal LEFT" in
 *     the center, the AvoLens brand, and Protein/Carbs progress bars.
 *   • AvoLensStreak  — a small "N day streak" card with a flame.
 *   • AvoLensWater   — a small "N.N L water today" card with a droplet.
 * They render headlessly, so the light-theme card palette from `theme.tsx` is
 * inlined here.
 */

const EMPTY: WidgetSnapshot = {
  kcalLeft: 0,
  kcalGoal: 2050,
  protein: 0,
  proteinGoal: 124,
  carbs: 0,
  carbsGoal: 180,
  fat: 0,
  fatGoal: 56,
  streak: 0,
  glasses: 0,
  glassesGoal: 5,
};

// Light-theme tokens (src/lib/theme.tsx → lightTheme).
const SURFACE = '#ffffff';
const INK: ColorProp = '#0E0E12';
const MUTED: ColorProp = '#8A8A8F';
const GREEN = '#111116';
const GREEN_TRACK = '#E9E9EB';
const PROTEIN = '#e4586e';
const PROTEIN_TINT = '#f1e6e9';
const CARBS = '#e8a13b';
const CARBS_TINT = '#f3ecdd';
const FLAME = '#ff3b30';
const WATER = '#4da8f0';

const AVO_LOGO = require('../../assets/images/avo-logo.png');

const clamp = (v: number, total: number) => (total > 0 ? Math.max(0, Math.min(1, v / total)) : 0);

/** One SVG ring arc: a full track circle plus the progress arc, rotated -90°. */
function ring(r: number, sw: number, track: string, stroke: string, frac: number, cx = 78, cy = 78): string {
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - frac);
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${track}" stroke-width="${sw}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" ` +
    `stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" ` +
    `transform="rotate(-90 ${cx} ${cy})"/>`
  );
}

/**
 * The concentric calorie / protein / carbs ring as an SVG string (156×156
 * viewBox), with the kcal-left number + "LEFT" label centered inside — the
 * Nibbl v2 widget ring.
 */
function ringSvg(s: WidgetSnapshot): string {
  const cal = clamp(s.kcalGoal - s.kcalLeft, s.kcalGoal);
  const p = clamp(s.protein, s.proteinGoal);
  const c = clamp(s.carbs, s.carbsGoal);
  return (
    `<svg width="156" height="156" viewBox="0 0 156 156" xmlns="http://www.w3.org/2000/svg">` +
    ring(66, 12, GREEN_TRACK, GREEN, cal) +
    ring(51, 12, PROTEIN_TINT, PROTEIN, p) +
    ring(36, 12, CARBS_TINT, CARBS, c) +
    `<text x="78" y="80" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="30" fill="#26331a">${s.kcalLeft.toLocaleString('en-US')}</text>` +
    `<text x="78" y="98" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" letter-spacing="1.5" fill="#7c8a7f">LEFT</text>` +
    `</svg>`
  );
}

/** A rounded track with a colored fill sized to `frac` of a fixed-width bar. */
function Bar({ label, value, frac, color, track }: { label: string; value: string; frac: number; color: ColorProp; track: ColorProp }) {
  const W = 130;
  return (
    <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', marginTop: 8 }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', marginBottom: 4 }}>
        <TextWidget text={label} style={{ fontSize: 11, color: MUTED }} />
        <FlexWidget style={{ flex: 1 }} />
        <TextWidget text={value} style={{ fontSize: 11, color: INK, fontFamily: 'sans-serif-medium' }} />
      </FlexWidget>
      <FlexWidget style={{ width: W, height: 6, borderRadius: 6, backgroundColor: track }}>
        <FlexWidget style={{ width: Math.max(0, Math.round(W * frac)), height: 6, borderRadius: 6, backgroundColor: color }} />
      </FlexWidget>
    </FlexWidget>
  );
}

/** The ring card (medium): ring + AvoLens brand + Protein/Carbs bars. */
export function SummaryWidget({ snapshot = EMPTY }: { snapshot?: WidgetSnapshot }) {
  const s = snapshot;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: SURFACE,
        borderRadius: 28,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <SvgWidget svg={ringSvg(s)} style={{ width: 116, height: 116, marginRight: 16 }} />

      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <ImageWidget image={AVO_LOGO} imageWidth={22} imageHeight={22} style={{ width: 22, height: 22, marginRight: 6 }} />
          <TextWidget text="AvoLens" style={{ fontSize: 14, color: INK, fontFamily: 'sans-serif-medium' }} />
        </FlexWidget>
        <Bar label="Protein" value={`${s.protein}g`} frac={clamp(s.protein, s.proteinGoal)} color={PROTEIN} track={PROTEIN_TINT} />
        <Bar label="Carbs" value={`${s.carbs}g`} frac={clamp(s.carbs, s.carbsGoal)} color={CARBS} track={CARBS_TINT} />
      </FlexWidget>
    </FlexWidget>
  );
}

const FLAME_SVG =
  `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" fill="${FLAME}"/></svg>`;

const DROPLET_SVG =
  `<svg width="20" height="26" viewBox="0 0 20 26" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M10 1 C10 1 18 12 18 17.5 A8 8 0 0 1 2 17.5 C2 12 10 1 10 1 Z" fill="${WATER}"/></svg>`;

/** Small "N day streak" card. */
export function StreakWidget({ snapshot = EMPTY }: { snapshot?: WidgetSnapshot }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: SURFACE,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <SvgWidget svg={FLAME_SVG} style={{ width: 24, height: 24 }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={`${snapshot.streak}`} style={{ fontSize: 26, color: INK, fontFamily: 'sans-serif-black' }} />
        <TextWidget text="day streak" style={{ fontSize: 11, color: MUTED, marginTop: 3 }} />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Small "N.N L water today" card. */
export function WaterWidget({ snapshot = EMPTY }: { snapshot?: WidgetSnapshot }) {
  const liters = (snapshot.glasses * 0.5).toFixed(1);
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: SURFACE,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <SvgWidget svg={DROPLET_SVG} style={{ width: 20, height: 26 }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <TextWidget text={liters} style={{ fontSize: 26, color: INK, fontFamily: 'sans-serif-black' }} />
          <TextWidget text=" L" style={{ fontSize: 13, color: MUTED, fontFamily: 'sans-serif-medium' }} />
        </FlexWidget>
        <TextWidget text="water today" style={{ fontSize: 11, color: MUTED, marginTop: 3 }} />
      </FlexWidget>
    </FlexWidget>
  );
}
