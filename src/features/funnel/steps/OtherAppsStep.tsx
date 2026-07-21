import { View, Text, Pressable } from 'react-native';
import type { Theme } from '@/lib/theme';
import { F } from '@/lib/fonts';
import { Sub, Title } from '../components/ui';

export function OtherAppsStep({ value, onSelect, t }: { value: boolean | null; onSelect: (v: boolean) => void; t: Theme }) {
  return (
    <View style={{ flex: 1 }}>
      <Title t={t.ink}>Have you tried other calorie apps?</Title>
      <Sub t={t.muted}>Be honest. Did they actually work for you?</Sub>
      
      <View style={{ gap: 16, marginTop: 40 }}>
        <Pressable
          onPress={() => onSelect(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            borderRadius: 20,
            backgroundColor: value === true ? t.greenTint : t.surface,
            borderWidth: 2,
            borderColor: value === true ? t.green : t.border,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <Text style={{ fontSize: 32 }}>👍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.b700, fontSize: 18, color: t.ink }}>Yes</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, marginTop: 4 }}>They worked well</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => onSelect(false)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            borderRadius: 20,
            backgroundColor: value === false ? t.greenTint : t.surface,
            borderWidth: 2,
            borderColor: value === false ? t.green : t.border,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <Text style={{ fontSize: 32 }}>👎</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.b700, fontSize: 18, color: t.ink }}>No</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, marginTop: 4 }}>I hated them / didn't work</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
