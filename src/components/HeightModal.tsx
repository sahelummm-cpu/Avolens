import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/lib/store';
import { cmToFtIn, ftInToCm } from '@/lib/goals';
import type { HeightUnit } from '@/lib/types';
import { F } from '@/lib/fonts';

/** Height editor with a cm ⇄ ft/in unit toggle. */
export function HeightModal({
  heightCm,
  heightUnit,
  onClose,
  onSubmit,
}: {
  heightCm: number;
  heightUnit: HeightUnit;
  onClose: () => void;
  onSubmit: (cm: number, unit: HeightUnit) => void;
}) {
  const t = useTheme();
  const initial = cmToFtIn(heightCm);
  const [unit, setUnit] = useState<HeightUnit>(heightUnit);
  const [cm, setCm] = useState(String(heightCm));
  const [ft, setFt] = useState(String(initial.ft));
  const [inch, setInch] = useState(String(initial.inch));

  const currentCm = (): number =>
    unit === 'cm' ? parseInt(cm, 10) || 0 : ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0);

  const switchUnit = (u: HeightUnit) => {
    if (u === unit) return;
    // Carry the entered value across units.
    if (u === 'ftin') {
      const v = cmToFtIn(parseInt(cm, 10) || 0);
      setFt(String(v.ft));
      setInch(String(v.inch));
    } else {
      setCm(String(ftInToCm(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0)));
    }
    setUnit(u);
  };

  const submit = () => {
    const v = currentCm();
    if (v >= 90 && v <= 250) onSubmit(v, unit);
    else onClose();
  };

  const inputStyle = {
    flex: 1,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: F.b600,
    fontSize: 16,
    color: t.ink,
  } as const;

  return (
    <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>Height</Text>
              <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface3, borderRadius: 11, padding: 3 }}>
                <Pressable
                  onPress={() => switchUnit('cm')}
                  style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: unit === 'cm' ? t.navBg : 'transparent' }}
                >
                  <Text style={{ color: unit === 'cm' ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>cm</Text>
                </Pressable>
                <Pressable
                  onPress={() => switchUnit('ftin')}
                  style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: unit === 'ftin' ? t.navBg : 'transparent' }}
                >
                  <Text style={{ color: unit === 'ftin' ? '#fff' : t.muted, fontFamily: F.d700, fontSize: 12 }}>ft / in</Text>
                </Pressable>
              </View>
            </View>

            {unit === 'cm' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  value={cm}
                  onChangeText={setCm}
                  onSubmitEditing={submit}
                  placeholder="e.g. 174"
                  placeholderTextColor={t.muted2}
                  style={inputStyle}
                />
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.muted }}>cm</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  value={ft}
                  onChangeText={setFt}
                  placeholder="5"
                  placeholderTextColor={t.muted2}
                  style={inputStyle}
                />
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.muted }}>ft</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={inch}
                  onChangeText={setInch}
                  onSubmitEditing={submit}
                  placeholder="9"
                  placeholderTextColor={t.muted2}
                  style={inputStyle}
                />
                <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.muted }}>in</Text>
              </View>
            )}

            <Pressable
              onPress={submit}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 16,
                backgroundColor: t.green,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
