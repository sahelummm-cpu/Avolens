import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import type { Theme } from '@/lib/theme';
import { Sub, Title } from '../components/ui';
import { F } from '@/lib/fonts';

export function PermissionsStep({
  referralCode,
  onChangeReferralCode,
  t,
}: {
  referralCode: string;
  onChangeReferralCode: (v: string) => void;
  t: Theme;
}) {
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [rating, setRating] = useState(0);

  const requestNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      setNotifsEnabled(true);
      Alert.alert('Success', 'Notifications enabled!');
    } else {
      Alert.alert('Permission Denied', 'You can enable notifications later in your device settings.');
    }
  };

  const Star = ({ fill }: { fill: string }) => (
    <Svg width="36" height="36" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );

  return (
    <View>
      <Title t={t.ink}>How are we doing so far?</Title>
      <Sub t={t.muted}>Rate your onboarding experience to help us improve.</Sub>
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 40 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.85 : 1 }] })}>
            <Star fill={star <= rating ? '#FFB800' : 'transparent'} />
          </Pressable>
        ))}
      </View>

      <Title t={t.ink}>Stay on track</Title>
      <Sub t={t.muted}>
        Consistency is the secret. We can send you gentle reminders to log your meals and celebrate your streaks.
      </Sub>

      <View style={{ marginTop: 24, marginBottom: 32 }}>
        <Pressable
          onPress={requestNotifications}
          style={({ pressed }) => ({
            backgroundColor: notifsEnabled ? t.greenTint : t.green,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ fontFamily: F.b700, fontSize: 16, color: notifsEnabled ? t.green : t.bg }}>
            {notifsEnabled ? 'Notifications Enabled ✓' : 'Enable Notifications'}
          </Text>
        </Pressable>
      </View>

      <Title t={t.ink}>Have a referral code?</Title>
      <Sub t={t.muted}>If a friend sent you, enter their code here.</Sub>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          borderBottomWidth: 2,
          borderBottomColor: referralCode ? t.green : t.border,
          paddingBottom: 10,
          marginTop: 24,
        }}
      >
        <TextInput
          value={referralCode}
          onChangeText={onChangeReferralCode}
          placeholder="Code (optional)"
          placeholderTextColor={t.faint}
          autoCapitalize="characters"
          style={{
            flex: 1,
            fontFamily: F.d800,
            fontSize: 26,
            color: t.ink,
            letterSpacing: -0.3,
          }}
        />
      </View>
    </View>
  );
}
