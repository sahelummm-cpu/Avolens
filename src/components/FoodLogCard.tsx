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
    <View style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', flexShrink: 0, backgroundColor: t.surface3 }}>
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

import { ProteinIcon, CarbsIcon, FatIcon, FiberIcon, SodiumIcon, SugarIcon, CalorieIcon } from './NutritionIcons';

function MacroPill({ icon, label, val, unit = 'g', bg, color }: { icon: React.ReactNode; label?: string; val: number; unit?: string; bg: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5, backgroundColor: bg, paddingVertical: 2.5, paddingHorizontal: 7, borderRadius: 7 }}>
      {icon}
      <Text style={{ fontFamily: F.b700, fontSize: 10.5, color }}>{label ? `${label} ` : ''}{val}{unit}</Text>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
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
        <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
          <MacroPill icon={<ProteinIcon color={t.protein} size={11} />} label="P" val={entry.protein} bg={t.proteinTint} color={t.protein} />
          <MacroPill icon={<CarbsIcon color={t.carbs} size={11} />} label="C" val={entry.carbs} bg={t.carbsTint} color={t.carbs} />
          <MacroPill icon={<FatIcon color={t.fat} size={11} />} label="F" val={entry.fat} bg={t.fatTint} color={t.fat} />
          {entry.fiber > 0 && (
            <MacroPill icon={<FiberIcon color={t.fiber} size={11} />} val={entry.fiber} bg={t.fiberTint} color={t.fiber} />
          )}
          {entry.sodium > 0 && (
            <MacroPill icon={<SodiumIcon color={t.sodium} size={11} />} val={entry.sodium} unit="mg" bg={t.sodiumTint} color={t.sodium} />
          )}
          {entry.sugar > 0 && (
            <MacroPill icon={<SugarIcon color={t.sugar} size={11} />} val={entry.sugar} bg={t.sugarTint} color={t.sugar} />
          )}
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
