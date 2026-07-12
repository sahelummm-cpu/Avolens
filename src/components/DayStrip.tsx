import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore, useDailyTotals } from '@/lib/store';
import { buildWeek } from '@/lib/dayStrip';
import { F } from '@/lib/fonts';

const CIRC = 2 * Math.PI * 12.5;

export function DayStrip() {
  const { state, selectDay, theme: t } = useStore();
  const totals = useDailyTotals();
  const days = buildWeek(state, totals.calories);

  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22 }}>
      {days.map((d) => {
        const sel = d.selected;
        const ringColor = d.ringColor === 'transparent' ? 'transparent' : t[d.ringColor];
        return (
          <Pressable
            key={d.index}
            onPress={() => selectDay(d.index)}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 5,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: sel ? t.navBg : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: F.b600,
                fontSize: 11,
                color: sel ? 'rgba(255,255,255,.6)' : t.muted2,
              }}
            >
              {d.label}
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
                  stroke={sel ? 'rgba(255,255,255,.18)' : ringColor === 'transparent' ? 'transparent' : t.greenTrack}
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
              <Text style={{ fontFamily: F.d600, fontSize: 13, color: sel ? '#fff' : t.muted, zIndex: 1 }}>
                {d.date}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
