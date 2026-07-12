import { Pressable, View } from 'react-native';
import { useTheme } from '@/lib/store';

export function ToggleSwitch({
  on,
  onChange,
  activeColor,
}: {
  on: boolean;
  onChange: () => void;
  activeColor?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onChange}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        backgroundColor: on ? (activeColor ?? t.green) : t.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        padding: 3,
        flexShrink: 0,
      }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: '#fff' }} />
    </Pressable>
  );
}
