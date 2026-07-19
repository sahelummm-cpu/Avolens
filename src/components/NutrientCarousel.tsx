import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore, useDailyTotals, frac } from '@/lib/store';
import { CUSTOM_MED_KEY, countdownLabel, formatDoseSlot, resolveMedication, suggestedSite, takenThisCycle } from '@/lib/meds';
import { F } from '@/lib/fonts';
import { ProgressBar } from './ProgressBar';
import { MedScheduleModal } from './MedScheduleModal';
import { ShotModal } from './ShotModal';

function ProgressRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const { theme: t } = useStore();
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{label}</Text>
        <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.ink }}>
          {value}
          <Text style={{ fontFamily: F.d600, fontSize: 11, color: t.muted2 }}>
            /{target}
            {label === 'Sodium' ? 'mg' : 'g'}
          </Text>
        </Text>
      </View>
      <ProgressBar fraction={frac(value, target)} color={color} trackColor={t.greenTrack} />
    </View>
  );
}

function RoundBtn({
  onPress,
  bg,
  border,
  children,
  label,
}: {
  onPress: () => void;
  bg: string;
  border?: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        width: 34,
        height: 34,
        borderRadius: 99,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

const PlusIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const MinusIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round">
    <Path d="M5 12h14" />
  </Svg>
);

const PAGE_GAP = 14;

export function NutrientCarousel() {
  const { state, addGlass, removeGlass, setDose, toggleReminder, markShot, theme: t } = useStore();
  const totals = useDailyTotals();
  const [page, setPage] = useState(0);
  const [pageW, setPageW] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [shotOpen, setShotOpen] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: (pageW + PAGE_GAP) * i, animated: true });
    setPage(i);
  };

  // Water tracks whichever day is selected in the strip (today or a past day).
  const viewingToday = state.selectedDate === state.todayKey;
  const dayGlasses = viewingToday ? state.glasses : (state.history[state.selectedDate]?.glasses ?? 0);
  const waterCur = (dayGlasses * 0.5).toFixed(1);
  const waterTarget = (state.goal.water * 0.5).toFixed(1);

  const med = resolveMedication(state);
  const isCustom = state.medKey === CUSTOM_MED_KEY;
  const sched = {
    medKey: state.medKey,
    medDay: state.medDay,
    medHour: state.medHour,
    medMinute: state.medMinute,
    shots: state.shots,
    medCustomName: state.medCustomName,
    medCustomFrequency: state.medCustomFrequency,
    medCustomDose: state.medCustomDose,
  };
  const taken = takenThisCycle(sched);
  const pages = state.medEnabled ? [0, 1, 2] : [0, 1];

  const pageStyle = { width: pageW, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, gap: 11 } as const;

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginBottom: 12,
        gap: 13,
      }}
    >
      <View onLayout={(e) => setPageW(e.nativeEvent.layout.width)}>
        {pageW > 0 && (
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={pageW + PAGE_GAP}
            decelerationRate="fast"
            contentContainerStyle={{ gap: PAGE_GAP }}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / (pageW + PAGE_GAP)))
            }
          >
            {/* Page 1: Water — always first, shown by default */}
            <View style={{ ...pageStyle, backgroundColor: t.fatTint2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Svg width={15} height={19} viewBox="0 0 20 26" fill={t.fat}>
                    <Path d="M10 1 C10 1 18 12 18 17.5 A8 8 0 0 1 2 17.5 C2 12 10 1 10 1 Z" />
                  </Svg>
                  <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink }}>
                    Water{viewingToday ? '' : ' · past day'}
                  </Text>
                </View>
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.fat }}>
                  {waterCur}
                  <Text style={{ color: t.muted2, fontSize: 11 }}>/{waterTarget}L</Text>
                </Text>
              </View>
              <ProgressBar fraction={frac(dayGlasses, state.goal.water)} color={t.fat} trackColor={t.fatTint3} height={8} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <RoundBtn label="Remove glass" onPress={removeGlass} bg={t.surface}>
                  <MinusIcon stroke={t.fat} />
                </RoundBtn>
                <Text style={{ flex: 1, textAlign: 'center', fontFamily: F.b600, fontSize: 12, color: t.ink }}>
                  {dayGlasses} glasses <Text style={{ color: t.muted }}>· 500 ml</Text>
                </Text>
                <RoundBtn label="Add glass" onPress={addGlass} bg={t.fat}>
                  <PlusIcon stroke="#fff" />
                </RoundBtn>
              </View>
            </View>

            {/* Page 2: GLP-1 Medication (hidden when tracking is off) */}
            {state.medEnabled && (
              <View style={{ ...pageStyle, backgroundColor: t.purpleTint }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.purpleTint2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="m18 2 4 4" />
                      <Path d="m17 7 3-3" />
                      <Path d="M19 9 8.7 19.3c-1 1-2 1-3 0l-.7-.7c-1-1-1-2 0-3L15.3 5.3" />
                      <Path d="m9 11 4 4" />
                      <Path d="m5 19-3 3" />
                      <Path d="m14 4 6 6" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>{med.name}</Text>
                    <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 1 }}>
                      {med.brands} · {med.frequency === 'weekly' ? 'Weekly' : 'Daily'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={toggleReminder}
                    accessibilityLabel="Toggle reminder"
                    accessibilityRole="button"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 99,
                      backgroundColor: state.reminderOn ? t.purpleTint2 : t.surface,
                      borderWidth: 1,
                      borderColor: t.purpleBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={state.reminderOn ? t.purple : t.muted2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </Svg>
                    {state.reminderOn ? (
                      <View style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 99, backgroundColor: t.protein, borderWidth: 1.5, borderColor: t.surface }} />
                    ) : (
                      <View style={{ position: 'absolute', left: 5, top: 15, width: 24, height: 1.8, backgroundColor: t.muted2, transform: [{ rotate: '-45deg' }] }} />
                    )}
                  </Pressable>
                  <Pressable onPress={() => setScheduleOpen(true)} accessibilityRole="button" accessibilityLabel="Edit medication schedule" style={{ alignItems: 'flex-end', gap: 1 }}>
                    <View style={{ backgroundColor: t.purpleTint2, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99 }}>
                      <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.purple }}>{formatDoseSlot(sched)}</Text>
                    </View>
                    <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2 }}>{countdownLabel(sched)}</Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 12, color: t.ink }}>
                    Current dose <Text style={{ color: t.muted }}>· {med.doses[state.dose]}{med.unit ? ` ${med.unit}` : ''}</Text>
                  </Text>
                  {isCustom ? (
                    <Pressable
                      onPress={() => setScheduleOpen(true)}
                      accessibilityRole="button"
                      style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.purpleBorder, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 }}
                    >
                      <Text style={{ fontFamily: F.d700, fontSize: 11, color: t.purple }}>Edit dose</Text>
                    </Pressable>
                  ) : (
                    <>
                      <RoundBtn label="Decrease dose" onPress={() => setDose(Math.max(0, state.dose - 1))} bg={t.surface} border={t.purpleBorder}>
                        <MinusIcon stroke={t.purple} />
                      </RoundBtn>
                      <RoundBtn label="Increase dose" onPress={() => setDose(Math.min(med.doses.length - 1, state.dose + 1))} bg={t.purple}>
                        <PlusIcon stroke="#fff" />
                      </RoundBtn>
                    </>
                  )}
                </View>
                {taken ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      backgroundColor: t.greenTint,
                      borderRadius: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="m5 12 5 5 9-11" />
                    </Svg>
                    <Text style={{ fontFamily: F.d700, fontSize: 12.5, color: t.green }}>
                      Taken · {taken.site} · {taken.time}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShotOpen(true)}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      backgroundColor: t.purple,
                      borderRadius: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="m5 12 5 5 9-11" />
                    </Svg>
                    <Text style={{ fontFamily: F.d700, fontSize: 12.5, color: '#fff' }}>Mark as taken</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Page 3: Fiber / Sodium / Sugar */}
            <View style={{ ...pageStyle, backgroundColor: t.surface2 }}>
              <ProgressRow label="Fiber" value={totals.fiber} target={state.goal.fiber} color={t.green} />
              <ProgressRow label="Sodium" value={totals.sodium} target={state.goal.sodium} color={t.carbs} />
              <ProgressRow label="Sugar" value={totals.sugar} target={state.goal.sugar} color={t.protein} />
            </View>
          </ScrollView>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        {pages.map((i) => (
          <Pressable
            key={i}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={`Page ${i + 1}`}
            accessibilityState={{ selected: page === i }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: page === i ? 16 : 6,
              height: 6,
              borderRadius: 99,
              backgroundColor: page === i ? t.purple : t.border,
            }}
          />
        ))}
      </View>

      {scheduleOpen && <MedScheduleModal onClose={() => setScheduleOpen(false)} />}
      {shotOpen && (
        <ShotModal
          suggested={suggestedSite(state.shots)}
          onClose={() => setShotOpen(false)}
          onConfirm={(site) => {
            markShot(site);
            setShotOpen(false);
          }}
        />
      )}
    </View>
  );
}
