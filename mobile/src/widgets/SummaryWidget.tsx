import * as React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { WidgetSnapshot } from '@/lib/types';

/**
 * Android home-screen widget — a slice of the app's Home dashboard card:
 * the same four-ring calorie/macro ring (rendered as an SVG string via
 * SvgWidget), the big "kcal left" number, and the macro rows. It renders
 * headlessly, so the light-theme card palette from `theme.tsx` is inlined.
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
};

// Light-theme tokens (src/lib/theme.tsx → lightTheme).
const SURFACE = '#ffffff';
const INK: ColorProp = '#26331a';
const MUTED: ColorProp = '#7c8a7f';
const GREEN_GRAD1 = '#a9c24a';
const GREEN_GRAD2 = '#5a8a2e';
const GREEN_TRACK = '#edf1eb';
const PROTEIN = '#e4586e';
const PROTEIN_TINT = '#fbeaed';
const CARBS = '#e8a13b';
const CARBS_TINT = '#fbf1e0';
const FAT = '#4da8f0';
const FAT_TINT = '#e9f3fc';

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

/** Builds the four-ring calorie/macro ring as an SVG string (156×156 viewBox). */
function ringSvg(s: WidgetSnapshot): string {
  const cal = clamp(s.kcalGoal - s.kcalLeft, s.kcalGoal);
  const p = clamp(s.protein, s.proteinGoal);
  const c = clamp(s.carbs, s.carbsGoal);
  const f = clamp(s.fat, s.fatGoal);
  return (
    `<svg width="156" height="156" viewBox="0 0 156 156" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${GREEN_GRAD1}"/><stop offset="1" stop-color="${GREEN_GRAD2}"/>` +
    `</linearGradient></defs>` +
    ring(66, 12, GREEN_TRACK, 'url(#g)', cal) +
    ring(51, 10, PROTEIN_TINT, PROTEIN, p) +
    ring(38, 10, CARBS_TINT, CARBS, c) +
    ring(25, 10, FAT_TINT, FAT, f) +
    `</svg>`
  );
}

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: ColorProp }) {
  return (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', marginTop: 5 }}>
      <FlexWidget style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: color, marginRight: 7 }} />
      <TextWidget text={label} style={{ fontSize: 12, color: MUTED }} />
      <FlexWidget style={{ flex: 1 }} />
      <TextWidget text={`${value}/${goal}g`} style={{ fontSize: 12, color: INK, fontFamily: 'sans-serif-medium' }} />
    </FlexWidget>
  );
}

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
        <TextWidget text={`${s.kcalLeft.toLocaleString('en-US')}`} style={{ fontSize: 30, color: INK, fontFamily: 'sans-serif-black' }} />
        <TextWidget text="kcal left" style={{ fontSize: 12, color: MUTED, marginBottom: 4 }} />
        <Macro label="Protein" value={s.protein} goal={s.proteinGoal} color={PROTEIN} />
        <Macro label="Carbs" value={s.carbs} goal={s.carbsGoal} color={CARBS} />
        <Macro label="Fat" value={s.fat} goal={s.fatGoal} color={FAT} />
      </FlexWidget>
    </FlexWidget>
  );
}
