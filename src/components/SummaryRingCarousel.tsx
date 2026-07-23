import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { computeRollover } from '@/lib/days';
import type { ActivitySummary, AvoLensState } from '@/lib/types';
import { F } from '@/lib/fonts';
import { CalorieRing, type RingFractions } from './CalorieRing';
import { ExerciseRing } from './ExerciseRing';
import { FitbitActiveMinutesIcon, FitbitFlameIcon, FitbitShoeIcon } from './ExerciseIcons';

export interface SummaryRingCarouselProps {
  totals: { left: number; protein: number; carbs: number; fat: number };
  state: AvoLensState;
  activity: ActivitySummary | null;
  fractions: RingFractions;
  viewingToday: boolean;
}

function MacroRow({ color, label, cur, target }: { color: string; label: string; cur: number; target: number }) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: color }} />
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>
        {Math.round(cur)} / {target}g
      </Text>
    </View>
  );
}

function ActivityRow({
  color,
  label,
  cur,
  target,
  unit,
  icon,
}: {
  color: string;
  label: string;
  cur: number | string;
  target: number | string;
  unit: string;
  icon: React.ReactNode;
}) {
  const { theme: t } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>
        {cur} / {target}
        {unit}
      </Text>
    </View>
  );
}

export function SummaryRingCarousel({ totals, state, activity, fractions, viewingToday }: SummaryRingCarouselProps) {
  const { theme: t } = useStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cardW, setCardW] = useState(0);
  const scrollerRef = useRef<ScrollView>(null);

  // Default exercise values if health app data not available yet
  const activeCal = activity?.activeCalories ?? 320;
  const activeCalGoal = 500;
  const steps = activity?.steps ?? 6850;
  const stepsGoal = 10000;
  const activeMins = activity?.activeMinutes ?? 35;
  const activeMinsGoal = 45;

  const exerciseFractions = {
    calories: activeCal / activeCalGoal,
    steps: steps / stepsGoal,
    minutes: activeMins / activeMinsGoal,
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (cardW <= 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / (cardW + 12));
    setActiveCardIndex(idx);
  };

  const CARD_GAP = 12;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Dynamic Header Badge / Dot Indicator */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingHorizontal: 2,
        }}
      >
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>
          {activeCardIndex === 0 ? 'Nutrition Progress' : 'Move & Activity'}
        </Text>

        {/* Carousel Pagination Dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => scrollerRef.current?.scrollTo({ x: 0, animated: true })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Nutrition progress page"
            style={{
              width: activeCardIndex === 0 ? 16 : 6,
              height: 6,
              borderRadius: 99,
              backgroundColor: t.amberGrad1,
              opacity: activeCardIndex === 0 ? 1 : 0.35,
            }}
          />
          <Pressable
            onPress={() => scrollerRef.current?.scrollTo({ x: cardW + CARD_GAP, animated: true })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Move & activity page"
            style={{
              width: activeCardIndex === 1 ? 16 : 6,
              height: 6,
              borderRadius: 99,
              backgroundColor: '#FF2D55',
              opacity: activeCardIndex === 1 ? 1 : 0.35,
            }}
          />
        </View>
      </View>

      {/* Swipeable Ring Cards */}
      <View onLayout={(e) => setCardW(e.nativeEvent.layout.width)}>
        {cardW > 0 && (
          <ScrollView
            ref={scrollerRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardW + CARD_GAP}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ gap: CARD_GAP }}
          >
            {/* Card 1: Nutrition Ring */}
            <View
              style={{
                width: cardW,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 28,
                paddingVertical: 24,
                paddingHorizontal: 22,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View style={{ width: 156, height: 156, flexShrink: 0 }}>
                  <CalorieRing size={156} fractions={fractions} />
                </View>
                <View style={{ flex: 1, gap: 12 }}>
                  <View>
                    <Text style={{ fontFamily: F.d800, fontSize: 34, color: t.ink, lineHeight: 36, letterSpacing: -0.68 }}>
                      {totals.left.toLocaleString('en-US')}
                    </Text>
                    <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>kcal left</Text>
                    {viewingToday && computeRollover(state) > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, backgroundColor: '#8AA0FF22', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, alignSelf: 'flex-start' }}>
                        <Text style={{ fontFamily: F.d700, fontSize: 11, color: '#8AA0FF' }}>⏱ +{computeRollover(state)} rollover</Text>
                      </View>
                    )}
                    {viewingToday && (state.addBurnedCalories ?? true) && (activity?.activeCalories ?? 0) > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, backgroundColor: '#FF950022', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, alignSelf: 'flex-start' }}>
                        <Text style={{ fontFamily: F.d700, fontSize: 11, color: '#FF9500' }}>🔥 +{activity?.activeCalories} burned</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ gap: 8 }}>
                    <MacroRow color={t.protein} label="Protein" cur={totals.protein} target={state.goal.protein} />
                    <MacroRow color={t.carbs} label="Carbs" cur={totals.carbs} target={state.goal.carbs} />
                    <MacroRow color={t.fat} label="Fat" cur={totals.fat} target={state.goal.fat} />
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Exercise & Activity Ring (Fitbit-style Icons) */}
            <View
              style={{
                width: cardW,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 28,
                paddingVertical: 24,
                paddingHorizontal: 22,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View style={{ width: 156, height: 156, flexShrink: 0 }}>
                  <ExerciseRing size={156} fractions={exerciseFractions} />
                </View>
                <View style={{ flex: 1, gap: 12 }}>
                  <View>
                    <Text style={{ fontFamily: F.d800, fontSize: 34, color: t.ink, lineHeight: 36, letterSpacing: -0.68 }}>
                      {activeCal.toLocaleString('en-US')}
                    </Text>
                    <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginTop: 3 }}>active kcal burned</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, backgroundColor: '#FF2D5522', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, alignSelf: 'flex-start' }}>
                      <FitbitFlameIcon size={12} color="#FF2D55" />
                      <Text style={{ fontFamily: F.d700, fontSize: 11, color: '#FF2D55' }}>Fitbit Move</Text>
                    </View>
                  </View>
                  <View style={{ gap: 8 }}>
                    <ActivityRow
                      color="#FF2D55"
                      label="Active Kcal"
                      cur={activeCal}
                      target={activeCalGoal}
                      unit=" kcal"
                      icon={<FitbitFlameIcon size={13} color="#FF2D55" />}
                    />
                    <ActivityRow
                      color="#A3E635"
                      label="Steps"
                      cur={steps.toLocaleString('en-US')}
                      target="10,000"
                      unit=""
                      icon={<FitbitShoeIcon size={13} color="#A3E635" />}
                    />
                    <ActivityRow
                      color="#00D5E8"
                      label="Active Mins"
                      cur={activeMins}
                      target={activeMinsGoal}
                      unit=" min"
                      icon={<FitbitActiveMinutesIcon size={13} color="#00D5E8" />}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
