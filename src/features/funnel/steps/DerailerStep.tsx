import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Theme } from '@/lib/theme';
import { OptionCard, Sub, Title } from '../components/ui';

export type Derailer = 'snacking' | 'restaurants' | 'emotional' | 'time';

const OPTIONS: { key: Derailer; title: string; sub: string; icon: (c: string) => React.ReactNode }[] = [
  { key: 'snacking', title: 'Late-night snacking', sub: 'The day goes fine — until 10pm', icon: (c) => <MoonIcon color={c} /> },
  { key: 'restaurants', title: 'Guessing calories at restaurants', sub: 'Menus without numbers throw me off', icon: (c) => <ForkIcon color={c} /> },
  { key: 'emotional', title: 'Emotional eating', sub: 'Stress and food are tangled up', icon: (c) => <HeartIcon color={c} /> },
  { key: 'time', title: 'Tracking takes too much time', sub: 'Logging every meal never sticks', icon: (c) => <ClockIcon color={c} /> },
];

/** Step 1 — the behavioral hook. Names the user's failure mode before asking for anything. */
export function DerailerStep({ value, onSelect, t }: { value: Derailer | null; onSelect: (d: Derailer) => void; t: Theme }) {
  return (
    <View>
      <Title t={t.ink}>What usually derails your progress?</Title>
      <Sub t={t.muted}>Everyone has one. Your plan will be built around it.</Sub>
      <View style={{ gap: 12, marginTop: 24 }}>
        {OPTIONS.map((o) => (
          <OptionCard key={o.key} selected={value === o.key} onPress={() => onSelect(o.key)} title={o.title} sub={o.sub} icon={o.icon(t.muted)} />
        ))}
      </View>
    </View>
  );
}

/** Short human label for the picked derailer — used for future-pacing copy. */
export function derailerLabel(d: Derailer): string {
  switch (d) {
    case 'snacking': return 'late-night cravings';
    case 'restaurants': return 'eating out';
    case 'emotional': return 'emotional eating';
    case 'time': return 'slow, tedious tracking';
  }
}

function MoonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </Svg>
  );
}

function ForkIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 2v20M7 2v7a3 3 0 0 0 3 3M7 2 4 2v7a3 3 0 0 0 3 3" />
      <Path d="M17 2v20M21 15V2a5 5 0 0 0-4 5v8h4Z" />
    </Svg>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2C10.5 3.5 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3.5 2" />
    </Svg>
  );
}
