import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';
import {
  ProteinIcon,
  CarbsIcon,
  FatIcon,
  FiberIcon,
  SodiumIcon,
  SugarIcon,
} from './NutritionIcons';

export interface MacrosData {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

export interface SwipeableMacrosProps {
  values: MacrosData;
  onChange?: (key: keyof MacrosData, value: number) => void;
  readOnly?: boolean;
}

function NumericInput({
  value,
  onChange,
  readOnly,
  textColor,
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  textColor: string;
}) {
  const { theme: t } = useStore();
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState(value !== 0 ? String(value) : '');

  React.useEffect(() => {
    if (!isFocused) {
      setText(value !== 0 ? String(value) : '');
    }
  }, [value, isFocused]);

  const handleChange = (v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    setText(cleaned);
    if (onChange) {
      const parsed = parseFloat(cleaned);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  if (readOnly || !onChange) {
    return (
      <Text style={{ fontFamily: F.d800, fontSize: 19, color: textColor }}>
        {value}
      </Text>
    );
  }

  return (
    <TextInput
      keyboardType="decimal-pad"
      value={text}
      onChangeText={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (text.trim() === '') {
          setText(value !== 0 ? String(value) : '');
        }
      }}
      placeholder="0"
      placeholderTextColor={t.muted2}
      selectTextOnFocus
      style={{
        minWidth: 32,
        fontFamily: F.d800,
        fontSize: 19,
        color: textColor,
        textAlign: 'center',
        padding: 0,
      }}
    />
  );
}

export function SwipeableMacros({ values, onChange, readOnly = false }: SwipeableMacrosProps) {
  const { theme: t } = useStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const items: {
    key: keyof MacrosData;
    label: string;
    unit: string;
    color: string;
    tint: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      color: t.protein,
      tint: t.proteinTint,
      icon: <ProteinIcon color={t.protein} size={15} />,
    },
    {
      key: 'carbs',
      label: 'Carbs',
      unit: 'g',
      color: t.carbs,
      tint: t.carbsTint,
      icon: <CarbsIcon color={t.carbs} size={15} />,
    },
    {
      key: 'fat',
      label: 'Fat',
      unit: 'g',
      color: t.fat,
      tint: t.fatTint,
      icon: <FatIcon color={t.fat} size={15} />,
    },
    {
      key: 'fiber',
      label: 'Fiber',
      unit: 'g',
      color: t.fiber,
      tint: t.fiberTint,
      icon: <FiberIcon color={t.fiber} size={15} />,
    },
    {
      key: 'sodium',
      label: 'Sodium',
      unit: 'mg',
      color: t.sodium,
      tint: t.sodiumTint,
      icon: <SodiumIcon color={t.sodium} size={15} />,
    },
    {
      key: 'sugar',
      label: 'Sugar',
      unit: 'g',
      color: t.sugar,
      tint: t.sugarTint,
      icon: <SugarIcon color={t.sugar} size={15} />,
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const layoutW = event.nativeEvent.layoutMeasurement.width;
    const contentW = event.nativeEvent.contentSize.width;
    const maxScroll = Math.max(1, contentW - layoutW);
    const ratio = Math.min(1, Math.max(0, offset / maxScroll));
    const index = Math.round(ratio * (items.length - 1));
    setActivePageIndex(index);
  };

  const scrollToItem = (index: number) => {
    if (layoutWidth > 0 && contentWidth > layoutWidth) {
      const maxScroll = contentWidth - layoutWidth;
      const targetX = (maxScroll * index) / (items.length - 1);
      scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      setActivePageIndex(index);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Header with swipe indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>
          Macros & Nutrients
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2 }}>
            Swipe for all 6
          </Text>
          <Svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.muted2}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M5 12h14M12 5l7 7-7 7" />
          </Svg>
        </View>
      </View>

      {/* Swipeable Container */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        scrollEventThrottle={16}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 10, paddingRight: 10 }}
      >
        {items.map((item) => {
          const val = values[item.key] ?? 0;
          return (
            <View
              key={item.key}
              style={{
                width: 108,
                backgroundColor: item.tint,
                borderWidth: 1,
                borderColor: item.color + '22',
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 98,
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {/* Header Icon + Label */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {item.icon}
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}
                >
                  {item.label}
                </Text>
              </View>

              {/* Value Input/Readout */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 2,
                  justifyContent: 'center',
                }}
              >
                <NumericInput
                  value={val}
                  onChange={(n) => onChange?.(item.key, n)}
                  readOnly={readOnly}
                  textColor={item.color}
                />
                <Text
                  style={{
                    fontFamily: F.b500,
                    fontSize: 11,
                    color: t.muted2,
                    marginLeft: 1,
                  }}
                >
                  {item.unit}
                </Text>
              </View>

              {/* Bottom Color Accent Strip */}
              <View
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 99,
                  backgroundColor: item.color,
                  opacity: 0.8,
                }}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* 2 Simple Carousel Page Dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
        }}
      >
        {[0, 1].map((pIdx) => {
          const isActive = (activePageIndex < 3 && pIdx === 0) || (activePageIndex >= 3 && pIdx === 1);
          return (
            <Pressable
              key={pIdx}
              onPress={() => scrollToItem(pIdx * 3)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Macro page ${pIdx + 1}`}
              style={{
                width: isActive ? 16 : 6,
                height: 6,
                borderRadius: 99,
                backgroundColor: pIdx === 0 ? t.protein : t.fiber,
                opacity: isActive ? 1 : 0.35,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
