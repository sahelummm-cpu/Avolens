import * as React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';
import type { WidgetSnapshot } from '@/lib/types';

/**
 * Android home-screen widget, defined in JS via react-native-android-widget.
 * It renders headlessly (no theme context), so brand colors are inlined to
 * match the app's dark nav surface.
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

const INK: ColorProp = '#FFFFFF';
const MUTED: ColorProp = '#8FA096';
const GREEN: ColorProp = '#83BA49';
const PROTEIN: ColorProp = '#EC7284';
const CARBS: ColorProp = '#F0B458';
const FAT: ColorProp = '#6BB8F4';

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: ColorProp }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: color, marginRight: 5 }} />
        <TextWidget text={label} style={{ fontSize: 11, color: MUTED }} />
      </FlexWidget>
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
        backgroundColor: '#26331A',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextWidget text="AvoLens" style={{ fontSize: 13, color: MUTED, fontFamily: 'sans-serif-medium' }} />
        <TextWidget text={`🔥 ${s.streak}`} style={{ fontSize: 12, color: GREEN, fontFamily: 'sans-serif-medium' }} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={`${s.kcalLeft}`} style={{ fontSize: 36, color: INK, fontFamily: 'sans-serif' }} />
        <TextWidget text="kcal left" style={{ fontSize: 12, color: MUTED }} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <Macro label="Protein" value={s.protein} goal={s.proteinGoal} color={PROTEIN} />
        <Macro label="Carbs" value={s.carbs} goal={s.carbsGoal} color={CARBS} />
        <Macro label="Fat" value={s.fat} goal={s.fatGoal} color={FAT} />
      </FlexWidget>
    </FlexWidget>
  );
}
