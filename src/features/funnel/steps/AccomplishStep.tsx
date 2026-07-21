import { View } from 'react-native';
import type { Theme } from '@/lib/theme';
import { OptionCard, Sub, Title } from '../components/ui';

export type Accomplishment = 'sleep' | 'energy' | 'confidence' | 'performance';

const OPTIONS: { key: Accomplishment; title: string; sub: string }[] = [
  { key: 'energy', title: 'More energy', sub: 'Wake up feeling rested and ready' },
  { key: 'sleep', title: 'Better sleep', sub: 'Fall asleep faster, sleep deeper' },
  { key: 'confidence', title: 'Feel more confident', sub: 'Comfortable in your own skin' },
  { key: 'performance', title: 'Athletic performance', sub: 'Fuel your workouts and recovery' },
];

/** Step for capturing broader life goals. Multi-select. */
export function AccomplishStep({
  values,
  onToggle,
  t,
}: {
  values: Accomplishment[];
  onToggle: (v: Accomplishment) => void;
  t: Theme;
}) {
  return (
    <View>
      <Title t={t.ink}>What else do you want to accomplish?</Title>
      <Sub t={t.muted}>Beyond the scale, what changes are you looking for? (Select all that apply)</Sub>
      <View style={{ gap: 12, marginTop: 24 }}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.key}
            selected={values.includes(o.key)}
            onPress={() => onToggle(o.key)}
            title={o.title}
            sub={o.sub}
          />
        ))}
      </View>
    </View>
  );
}
