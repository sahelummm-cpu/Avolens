import { useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore, useDailyTotals } from '@/lib/store';
import { buildStrip, STRIP_PAST_DAYS } from '@/lib/dayStrip';
import { F } from '@/lib/fonts';

const CIRC = 2 * Math.PI * 12.5;
const CELL_W = 46;
const CELL_GAP = 4;

/**
 * Scrollable date strip: past 4 weeks through today plus the next 7 dates
 * (shown dimmed, not selectable). Auto-scrolls so today is in view.
 */
export function DayStrip() {
  const { state, selectDay, theme: t } = useStore();
  const totals = useDailyTotals();
  const days = buildStrip(state, totals.calories);
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  // Land with today (cell index STRIP_PAST_DAYS) near the right edge so the
  // recent past is visible and the disabled future peeks in from the right.
  const initialX = Math.max(0, (STRIP_PAST_DAYS - 4) * (CELL_W + CELL_GAP));

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 22, marginHorizontal: -24 }}
      contentContainerStyle={{ gap: CELL_GAP, paddingHorizontal: 24 }}
      onContentSizeChange={() => {
        if (didAutoScroll.current) return;
        didAutoScroll.current = true;
        scrollRef.current?.scrollTo({ x: initialX, animated: false });
      }}
    >
      {days.map((d) => {
        const sel = d.selected;
        const ringColor = d.ringColor === 'transparent' ? 'transparent' : t[d.ringColor];
        return (
          <Pressable
            key={d.key}
            onPress={d.isFuture ? undefined : () => selectDay(d.key)}
            disabled={d.isFuture}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            style={{
              width: CELL_W,
              alignItems: 'center',
              gap: 5,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: sel ? t.navBg : 'transparent',
              opacity: d.isFuture ? 0.35 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: F.b600,
                fontSize: 11,
                color: sel ? 'rgba(255,255,255,.6)' : t.muted2,
              }}
            >
              {d.month ?? d.label}
            </Text>
            <View style={{ width: 29, height: 29, alignItems: 'center', justifyContent: 'center' }}>
              <Svg
                width={29}
                height={29}
                viewBox="0 0 29 29"
                style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
              >
                <Circle
                  cx={14.5}
                  cy={14.5}
                  r={12.5}
                  fill="none"
                  stroke={
                    d.isToday && !sel
                      ? t.border
                      : sel
                        ? 'rgba(255,255,255,.18)'
                        : ringColor === 'transparent'
                          ? 'transparent'
                          : t.greenTrack
                  }
                  strokeWidth={2.4}
                />
                <Circle
                  cx={14.5}
                  cy={14.5}
                  r={12.5}
                  fill="none"
                  stroke={ringColor === 'transparent' ? 'transparent' : sel ? '#fff' : ringColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray={`${CIRC}`}
                  strokeDashoffset={CIRC * (1 - d.fraction)}
                />
              </Svg>
              <Text
                style={{
                  fontFamily: F.d600,
                  fontSize: 13,
                  color: sel ? '#fff' : d.isToday ? t.ink : t.muted,
                  zIndex: 1,
                }}
              >
                {d.date}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
