import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 3,
        backgroundColor: t.surface3,
        borderRadius: 12,
        padding: 3,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 7,
              borderRadius: 9,
              backgroundColor: active ? t.surface : 'transparent',
            }}
          >
            <Text style={{ color: active ? t.ink : t.muted, fontFamily: F.d700, fontSize: 12 }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
