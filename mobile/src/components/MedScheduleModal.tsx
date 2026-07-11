import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore, useTheme } from '@/lib/store';
import { MEDICATIONS, getMedication } from '@/lib/meds';
import { F } from '@/lib/fonts';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Pick the medication and its dose day/time; changes apply immediately. */
export function MedScheduleModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, setMedication, setMedSchedule } = useStore();
  const med = getMedication(state.medKey);

  const shiftHour = (d: number) => {
    const h = (state.medHour + d + 24) % 24;
    setMedSchedule(state.medDay, h, state.medMinute);
  };

  const toggleMinute = () => {
    setMedSchedule(state.medDay, state.medHour, state.medMinute === 0 ? 30 : 0);
  };

  const h12 = ((state.medHour + 11) % 12) + 1;
  const ampm = state.medHour < 12 ? 'AM' : 'PM';

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 22,
            paddingTop: 24,
            paddingBottom: 32,
            maxHeight: '82%',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 14 }}>Medication</Text>

            <View style={{ gap: 9, marginBottom: 20 }}>
              {MEDICATIONS.map((m) => {
                const selected = m.key === state.medKey;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMedication(m.key)}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderWidth: 1.5,
                      borderColor: selected ? t.purple : t.border,
                      backgroundColor: selected ? t.purpleTint : t.surface2,
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>{m.name}</Text>
                      <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 1 }}>
                        {m.brands} · {m.frequency === 'weekly' ? 'Weekly' : 'Daily'} · {m.doses[0]}–{m.doses[m.doses.length - 1]} mg
                      </Text>
                    </View>
                    {selected && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.purple} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="m5 12 5 5 9-11" />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {med.frequency === 'weekly' && (
              <>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
                  Dose day
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  {DAY_LABELS.map((lab, i) => {
                    const selected = state.medDay === i;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => setMedSchedule(i, state.medHour, state.medMinute)}
                        accessibilityRole="button"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 99,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? t.purple : t.surface2,
                          borderWidth: 1,
                          borderColor: selected ? t.purple : t.border,
                        }}
                      >
                        <Text style={{ fontFamily: F.d700, fontSize: 13, color: selected ? '#fff' : t.muted }}>{lab}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
              Dose time
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 22 }}>
              <Pressable
                onPress={() => shiftHour(-1)}
                accessibilityRole="button"
                accessibilityLabel="Earlier"
                style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.6} strokeLinecap="round">
                  <Path d="M5 12h14" />
                </Svg>
              </Pressable>
              <Pressable onPress={toggleMinute} accessibilityRole="button" accessibilityLabel="Toggle half hour">
                <Text style={{ fontFamily: F.d800, fontSize: 30, color: t.ink, letterSpacing: -0.6 }}>
                  {h12}:{String(state.medMinute).padStart(2, '0')}
                  <Text style={{ fontSize: 16, color: t.muted }}> {ampm}</Text>
                </Text>
              </Pressable>
              <Pressable
                onPress={() => shiftHour(1)}
                accessibilityRole="button"
                accessibilityLabel="Later"
                style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: t.purple, alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round">
                  <Path d="M12 5v14M5 12h14" />
                </Svg>
              </Pressable>
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted2, textAlign: 'center', marginBottom: 18 }}>
              Tap the time to switch between :00 and :30 · the reminder follows this slot
            </Text>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={{ width: '100%', height: 50, borderRadius: 16, backgroundColor: t.purple, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Done</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
