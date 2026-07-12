import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { StreakWidget, SummaryWidget, WaterWidget } from './SummaryWidget';
import {
  ANDROID_STREAK_WIDGET_NAME,
  ANDROID_WATER_WIDGET_NAME,
  WIDGET_STORAGE_KEY,
} from '@/lib/widgets';
import type { WidgetSnapshot } from '@/lib/types';

async function readSnapshot(): Promise<WidgetSnapshot | undefined> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : undefined;
  } catch {
    return undefined;
  }
}

function renderFor(name: string, snapshot?: WidgetSnapshot) {
  switch (name) {
    case ANDROID_STREAK_WIDGET_NAME:
      return <StreakWidget snapshot={snapshot} />;
    case ANDROID_WATER_WIDGET_NAME:
      return <WaterWidget snapshot={snapshot} />;
    default:
      return <SummaryWidget snapshot={snapshot} />;
  }
}

/**
 * Headless handler invoked by the OS whenever a widget is added, updated,
 * resized, or tapped. It reloads the latest snapshot from storage and
 * re-renders the widget the event targets (Summary / Streak / Water).
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await readSnapshot();
      props.renderWidget(renderFor(props.widgetInfo.widgetName, snapshot));
      break;
    }
    // WIDGET_CLICK is handled by each root FlexWidget's clickAction="OPEN_APP".
    default:
      break;
  }
}
