import { View } from 'react-native';
import type { Theme } from '@/lib/theme';
import { OptionCard, Sub, Title } from '../components/ui';

export type PriorAttempts = 'first' | 'few' | 'many';

const OPTIONS: { key: PriorAttempts; title: string; sub: string }[] = [
  { key: 'first', title: 'This is my first time', sub: 'Fresh start — no baggage' },
  { key: 'few', title: '1–2 times', sub: 'Tried a couple, nothing stuck' },
  { key: 'many', title: "I've tried everything and always quit", sub: 'The apps failed you, not the other way round' },
];

/** Step 2 — experience level. Frames past failures as the apps' fault, not the user's. */
export function ExperienceStep({ value, onSelect, t }: { value: PriorAttempts | null; onSelect: (v: PriorAttempts) => void; t: Theme }) {
  return (
    <View>
      <Title t={t.ink}>How many times have you tried a diet app before?</Title>
      <Sub t={t.muted}>No judgement — it tells us how much hand-holding to skip.</Sub>
      <View style={{ gap: 12, marginTop: 24 }}>
        {OPTIONS.map((o) => (
          <OptionCard key={o.key} selected={value === o.key} onPress={() => onSelect(o.key)} title={o.title} sub={o.sub} />
        ))}
      </View>
    </View>
  );
}
