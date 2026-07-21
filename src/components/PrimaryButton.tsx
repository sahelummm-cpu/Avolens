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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : 1,
        height: small ? 50 : 56,
        borderRadius: small ? 16 : 20,
        backgroundColor: disabled ? '#CFCFD4' : '#111116',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...(small
          ? null
          : {
              shadowColor: '#111116',
              shadowOpacity: 0.25,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }),
      })}
    >
      <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: small ? 15 : 16 }}>{children}</Text>
    </Pressable>
  );
}
