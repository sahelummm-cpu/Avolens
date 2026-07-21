import { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';
import { tick } from '@/features/funnel/haptics';

const ITEM_HEIGHT = 48;

/**
 * Vertical wheel picker (similar to iOS native picker)
 */
export function WheelPicker({ min, max, step = 1, value, onChange, format }: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const { theme: t } = useStore();
  const scrollRef = useRef<ScrollView>(null);
  
  const count = Math.round((max - min) / step) + 1;
  const items = Array.from({ length: count }, (_, i) => min + i * step);

  // clamp value to valid index
  const safeIdx = (v: number) => Math.max(0, Math.min(count - 1, Math.round((v - min) / step)));
  
  const [current, setCurrent] = useState(items[safeIdx(value)]);
  const lastIdx = useRef(-1);

  useEffect(() => {
    // Initial scroll position on mount
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: safeIdx(value) * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(count - 1, Math.round(y / ITEM_HEIGHT)));
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      const v = items[idx];
      setCurrent(v);
      tick();
      onChange(v);
    }
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 5, overflow: 'hidden', position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item) => {
          const isSelected = item === current;
          return (
            <View key={item} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ 
                fontFamily: F.d700, 
                fontSize: isSelected ? 24 : 20, 
                color: isSelected ? t.ink : t.muted2,
                opacity: isSelected ? 1 : 0.4
              }}>
                {format ? format(item) : item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      {/* Center highlight borders */}
      <View style={{ position: 'absolute', top: ITEM_HEIGHT * 2, left: 0, right: 0, height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border, pointerEvents: 'none' }} />
      {/* Gradient fades for top and bottom */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.5, backgroundColor: t.surface, opacity: 0.6, pointerEvents: 'none' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.5, backgroundColor: t.surface, opacity: 0.6, pointerEvents: 'none' }} />
    </View>
  );
}
