import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View, Image } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import Svg, { Circle, Path } from 'react-native-svg';
import type { FoodEntry } from '@/lib/types';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

import { getFoodImageUri } from '@/lib/foodImages';

function MealIcon({ entry }: { entry: FoodEntry }) {
  const t = useTheme();
  const uri = entry.imageUri || getFoodImageUri(entry.name, entry.meal);
  return (
    <View style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', flexShrink: 0, backgroundColor: t.surface3 }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

function MealTimeIcon({ meal }: { meal: FoodEntry['meal'] }) {
  const t = useTheme();
  if (meal === 'Breakfast') {
    return (
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.carbs} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3v2" />
        <Path d="M5 7l1.5 1.5" />
        <Path d="M19 7l-1.5 1.5" />
        <Path d="M7 15a5 5 0 0 1 10 0" />
        <Path d="M3 19h18" />
      </Svg>
    );
  }
  if (meal === 'Lunch') {
    return (
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.carbs} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={12} r={4} />
        <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </Svg>
    );
  }
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 3" />
    </Svg>
  );
}

import { ProteinIcon, CarbsIcon, FatIcon, CalorieIcon } from './NutritionIcons';

function MacroTag({ icon, grams }: { icon: React.ReactNode; grams: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontFamily: F.b600, fontSize: 11, color: t.muted }}>{grams}g</Text>
    </View>
  );
}

export function FoodLogCard({
  entry,
  delay = 0,
  onPress,
}: {
  entry: FoodEntry;
  delay?: number;
  onPress?: () => void;
}) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // av-card-in: .55s cubic-bezier(.22,.9,.3,1), translateY 14 -> 0 with fade.
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      delay: delay * 1000,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 20,
        padding: 12,
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <MealIcon entry={entry} />
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>
          {entry.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MealTimeIcon meal={entry.meal} />
          <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2 }}>
            {entry.amount && entry.unit && entry.unit !== 'kcal' && entry.unit !== 'serving'
              ? `${entry.meal} · ${entry.amount} ${entry.unit} · ${entry.time}`
              : `${entry.meal} · ${entry.time}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MacroTag icon={<ProteinIcon color={t.protein} size={13} />} grams={entry.protein} />
          <MacroTag icon={<CarbsIcon color={t.carbs} size={13} />} grams={entry.carbs} />
          <MacroTag icon={<FatIcon color={t.fat} size={13} />} grams={entry.fat} />
        </View>
      </View>
      <View style={{ alignSelf: 'flex-start', alignItems: 'flex-end', gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 11 }}>
          <CalorieIcon color="#FF3B30" size={12} />
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.greenGrad2 }}>{entry.calories} kcal</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill={t.green}>
            <Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
          </Svg>
          <Text style={{ fontFamily: F.d700, fontSize: 11, color: t.green }}>
            {entry.healthScore}
            <Text style={{ color: t.muted2 }}>/10</Text>
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}
