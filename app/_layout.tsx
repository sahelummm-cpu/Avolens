import { useEffect } from 'react';
import { Platform, Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { StoreProvider, useStore } from '@/lib/store';
import { F } from '@/lib/fonts';

// Configure PlusJakartaSans as the default font family everywhere across the app
if ((RNText as any).defaultProps) {
  (RNText as any).defaultProps.style = [{ fontFamily: F.b400 }, (RNText as any).defaultProps.style];
} else {
  (RNText as any).defaultProps = { style: { fontFamily: F.b400 } };
}

if ((RNTextInput as any).defaultProps) {
  (RNTextInput as any).defaultProps.style = [{ fontFamily: F.b400 }, (RNTextInput as any).defaultProps.style];
} else {
  (RNTextInput as any).defaultProps = { style: { fontFamily: F.b400 } };
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedApp() {
  const { theme, resolvedDark } = useStore();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={resolvedDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: isWeb ? 'none' : 'fade',
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: isWeb ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="auth" options={{ animation: isWeb ? 'none' : 'slide_from_bottom' }} />
        <Stack.Screen name="coach" options={{ animation: isWeb ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="scanner" options={{ contentStyle: { backgroundColor: '#121614' } }} />
        <Stack.Screen name="manual-entry" options={{ animation: isWeb ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="paywall" options={{ animation: isWeb ? 'none' : 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <StoreProvider>
      <ThemedApp />
    </StoreProvider>
  );
}
