import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/store';

/**
 * RN counterpart of the web MobileFrame: a full-screen themed background.
 * Applies the top safe-area inset so content starts below the notch
 * (screens that want edge-to-edge content, like the scanner, skip it).
 */
export function Screen({
  children,
  bg,
  inset = true,
}: {
  children: React.ReactNode;
  bg?: string;
  inset?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: bg ?? t.bg, paddingTop: inset ? insets.top : 0 }}>
      {children}
    </View>
  );
}
