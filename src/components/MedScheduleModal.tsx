import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore, useTheme } from '@/lib/store';
import { CUSTOM_MED_KEY, MEDICATIONS, resolveMedication } from '@/lib/meds';
import { F } from '@/lib/fonts';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Pick the medication and its dose day/time; changes apply immediately. */
export function MedScheduleModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, setMedication, setCustomMed, setMedSchedule } = useStore();
  const med = resolveMedication(state);
  const isCustom = state.medKey === CUSTOM_MED_KEY;

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
    // statusBarTranslucent + navigationBarTranslucent: with Android edge-to-edge
    // the sheet otherwise stops above the gesture bar and floats mid-screen.
    <Modal transparent animationType="slide" visible onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 14 }}>Medication</Text>

            <View style={{ gap: 9, marginBottom: 20 }}>
              {MEDICATIONS.map((m) => {
                const selected = m.key === state.medKey;
                const doseRange =
                  m.doses.length > 1 ? `${m.doses[0]}–${m.doses[m.doses.length - 1]} ${m.unit}` : `${m.doses[0]} ${m.unit}`;
                const subtitle =
                  m.key === CUSTOM_MED_KEY
                    ? m.brands
                    : `${m.brands} · ${m.frequency === 'weekly' ? 'Weekly' : 'Daily'} · ${doseRange}`;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => (m.key === CUSTOM_MED_KEY ? setCustomMed(state.medCustomName, state.medCustomFrequency, state.medCustomDose) : setMedication(m.key))}
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
                      <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: t.muted, marginTop: 1 }}>{subtitle}</Text>
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

            {isCustom && (
              <View style={{ marginBottom: 20, gap: 12 }}>
                <View>
                  <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 8 }}>
                    Medication name
                  </Text>
                  <TextInput
                    value={state.medCustomName}
                    onChangeText={(v) => setCustomMed(v, state.medCustomFrequency, state.medCustomDose)}
                    placeholder="e.g. Compounded semaglutide"
                    placeholderTextColor={t.muted2}
                    style={{ backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontFamily: F.b600, fontSize: 15, color: t.ink }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 8 }}>
                      Dose
                    </Text>
                    <TextInput
                      value={state.medCustomDose}
                      onChangeText={(v) => setCustomMed(state.medCustomName, state.medCustomFrequency, v)}
                      placeholder="e.g. 0.5 mg"
                      placeholderTextColor={t.muted2}
                      style={{ backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontFamily: F.b600, fontSize: 15, color: t.ink }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 8 }}>
                      Frequency
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface3, borderRadius: 12, padding: 3 }}>
                      {(['weekly', 'daily'] as const).map((f) => (
                        <Pressable
                          key={f}
                          onPress={() => setCustomMed(state.medCustomName, f, state.medCustomDose)}
                          style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: state.medCustomFrequency === f ? t.purple : 'transparent' }}
                        >
                          <Text style={{ fontFamily: F.d700, fontSize: 12, color: state.medCustomFrequency === f ? '#fff' : t.muted }}>
                            {f === 'weekly' ? 'Weekly' : 'Daily'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

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
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
