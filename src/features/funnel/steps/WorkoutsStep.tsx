import { View } from 'react-native';
import type { Theme } from '@/lib/theme';
import { OptionCard, Sub, Title } from '../components/ui';

export type WorkoutsFreq = '0-2' | '3-5' | '6+';

export function WorkoutsStep({ value, onSelect, t }: { value: WorkoutsFreq | null; onSelect: (v: WorkoutsFreq) => void; t: Theme }) {
  const options: { id: WorkoutsFreq; title: string; sub: string }[] = [
    { id: '0-2', title: '0–2 workouts / week', sub: 'Light or occasional exercise' },
    { id: '3-5', title: '3–5 workouts / week', sub: 'Consistent training routine' },
    { id: '6+', title: '6+ workouts / week', sub: 'Daily intense training' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Title t={t.ink}>How often do you train?</Title>
      <Sub t={t.muted}>This helps us estimate your daily energy expenditure.</Sub>
      
      <View style={{ gap: 12, marginTop: 32 }}>
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            title={opt.title}
            sub={opt.sub}
            selected={value === opt.id}
            onPress={() => onSelect(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}
