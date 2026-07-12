import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '@/lib/store';
import { uploadProgressPhoto, deleteProgressPhoto } from '@/lib/photos';
import type { MeasurementEntry } from '@/lib/types';
import { F } from '@/lib/fonts';

const FIELDS: { key: keyof Omit<MeasurementEntry, 'date' | 'ts'>; label: string }[] = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'hips', label: 'Hips' },
  { key: 'arm', label: 'Arm' },
  { key: 'thigh', label: 'Thigh' },
];

const card = (t: ReturnType<typeof useStore>['theme']) => ({
  backgroundColor: t.surface,
  borderWidth: 1,
  borderColor: t.border,
  borderRadius: 24,
  paddingVertical: 18,
  paddingHorizontal: 20,
  marginBottom: 14,
});

export function MeasurementsCard() {
  const { state, addMeasurement, theme: t } = useStore();
  const [open, setOpen] = useState(false);
  const latest = state.measurements[state.measurements.length - 1];
  const first = state.measurements[0];

  return (
    <View style={card(t)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: latest ? 12 : 0 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Measurements</Text>
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 }}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.green }}>Log</Text>
        </Pressable>
      </View>
      {latest ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {FIELDS.filter((f) => latest[f.key] != null).map((f) => {
            const cur = latest[f.key] as number;
            const start = first?.[f.key] as number | undefined;
            const delta = start != null && first !== latest ? cur - start : null;
            return (
              <View key={f.key} style={{ width: '30%', minWidth: 92, backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: F.d800, fontSize: 18, color: t.ink }}>{cur}<Text style={{ fontFamily: F.d600, fontSize: 11, color: t.muted2 }}> cm</Text></Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 1 }}>{f.label}</Text>
                {delta != null && delta !== 0 && (
                  <Text style={{ fontFamily: F.b600, fontSize: 10.5, color: delta < 0 ? t.green : t.protein, marginTop: 2 }}>
                    {delta < 0 ? '' : '+'}{delta.toFixed(1)} cm
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: t.muted, marginTop: 8 }}>
          Track waist, chest, hips and more to see inches lost even when the scale stalls.
        </Text>
      )}

      {open && <MeasurementModal onClose={() => setOpen(false)} onSave={(m) => { addMeasurement(m); setOpen(false); }} initial={latest} />}
    </View>
  );
}

function MeasurementModal({ onClose, onSave, initial }: { onClose: () => void; onSave: (m: Omit<MeasurementEntry, 'date' | 'ts'>) => void; initial?: MeasurementEntry }) {
  const { theme: t } = useStore();
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    FIELDS.forEach((f) => { if (initial?.[f.key] != null) o[f.key] = String(initial[f.key]); });
    return o;
  });

  const save = () => {
    const m: Omit<MeasurementEntry, 'date' | 'ts'> = {};
    let any = false;
    FIELDS.forEach((f) => {
      const n = parseFloat(vals[f.key]);
      if (Number.isFinite(n) && n > 0) { m[f.key] = Math.round(n * 10) / 10; any = true; }
    });
    if (any) onSave(m);
    else onClose();
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 4 }}>Measurements (cm)</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, marginBottom: 16 }}>Fill in what you measured — leave the rest blank.</Text>
            <View style={{ gap: 10, marginBottom: 18 }}>
              {FIELDS.map((f) => (
                <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink, width: 70 }}>{f.label}</Text>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14 }}>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={vals[f.key] ?? ''}
                      onChangeText={(v) => setVals((s) => ({ ...s, [f.key]: v.replace(/[^0-9.]/g, '') }))}
                      placeholder="—"
                      placeholderTextColor={t.muted2}
                      style={{ flex: 1, paddingVertical: 12, fontFamily: F.b600, fontSize: 15, color: t.ink }}
                    />
                    <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>cm</Text>
                  </View>
                </View>
              ))}
            </View>
            <Pressable onPress={save} style={{ width: '100%', height: 50, borderRadius: 16, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Save</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export function PhotosCard() {
  const { state, addPhoto, removePhoto, theme: t } = useStore();
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);

  const add = async (fromCamera: boolean) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', `Allow ${fromCamera ? 'camera' : 'photo'} access to add progress pictures.`);
        return;
      }
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [3, 4] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [3, 4], mediaTypes: ['images'] });
      if (res.canceled || !res.assets?.[0]) return;
      setBusy(true);
      const latestKg = state.weightLog[state.weightLog.length - 1]?.kg;
      const photo = await uploadProgressPhoto(res.assets[0].uri, latestKg);
      addPhoto(photo);
    } catch {
      Alert.alert('Could not add photo', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: string, path?: string) => {
    Alert.alert('Delete photo?', 'This removes the progress picture.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removePhoto(id); deleteProgressPhoto({ id, path } as never); } },
    ]);
  };

  const photos = state.photos;
  const before = photos[photos.length - 1];
  const after = photos[0];

  return (
    <View style={card(t)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>Progress photos</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => add(true)} disabled={busy} accessibilityLabel="Take photo" style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h5l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><Path d="M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /></Svg>
          </Pressable>
          <Pressable onPress={() => add(false)} disabled={busy} accessibilityLabel="Add from library" style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
          </Pressable>
        </View>
      </View>

      {photos.length === 0 ? (
        <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: t.muted }}>
          {busy ? 'Adding…' : 'Add a photo now and again in a few weeks to see your before & after.'}
        </Text>
      ) : (
        <>
          {photos.length >= 2 && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <BeforeAfter label="Before" photo={before} onPress={() => setViewer(before.uri)} t={t} />
              <BeforeAfter label="After" photo={after} onPress={() => setViewer(after.uri)} t={t} />
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => setViewer(p.uri)} onLongPress={() => confirmDelete(p.id, p.path)} style={{ alignItems: 'center' }}>
                <Image source={{ uri: p.uri }} style={{ width: 76, height: 100, borderRadius: 12, backgroundColor: t.surface2 }} />
                <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2, marginTop: 4 }}>{p.date.split(',')[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: t.muted2, marginTop: 8 }}>Tap to view · long-press to delete</Text>
        </>
      )}

      <Modal visible={viewer != null} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable onPress={() => setViewer(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.92)', alignItems: 'center', justifyContent: 'center' }}>
          {viewer && <Image source={{ uri: viewer }} style={{ width: '92%', height: '80%', resizeMode: 'contain' }} />}
        </Pressable>
      </Modal>
    </View>
  );
}

function BeforeAfter({ label, photo, onPress, t }: { label: string; photo: { uri: string; date: string; weightKg?: number }; onPress: () => void; t: ReturnType<typeof useStore>['theme'] }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 180, borderRadius: 16, backgroundColor: t.surface2 }} />
      <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 11, color: '#fff' }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted, marginTop: 5 }}>{photo.date.split(',')[0]}</Text>
    </Pressable>
  );
}
