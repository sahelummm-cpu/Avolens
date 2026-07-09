import { Pressable, Text } from 'react-native';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

export function PrimaryButton({
  children,
  onPress,
  small,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  small?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : 1,
        height: small ? 50 : 56,
        borderRadius: small ? 16 : 20,
        backgroundColor: t.green,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...(small
          ? null
          : {
              shadowColor: 'rgba(47,158,110,1)',
              shadowOpacity: 0.5,
              shadowRadius: 26,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }),
      })}
    >
      <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: small ? 15 : 16 }}>{children}</Text>
    </Pressable>
  );
}
