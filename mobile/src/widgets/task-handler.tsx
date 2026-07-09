import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { SummaryWidget } from './SummaryWidget';
import { WIDGET_STORAGE_KEY } from '@/lib/widgets';
import type { WidgetSnapshot } from '@/lib/types';

async function readSnapshot(): Promise<WidgetSnapshot | undefined> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Headless handler invoked by the OS whenever the widget is added, updated,
 * resized, or tapped. It reloads the latest snapshot from storage and re-renders.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await readSnapshot();
      props.renderWidget(<SummaryWidget snapshot={snapshot} />);
      break;
    }
    // WIDGET_CLICK is handled by the root FlexWidget's clickAction="OPEN_APP".
    default:
      break;
  }
}
