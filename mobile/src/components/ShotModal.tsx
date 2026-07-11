import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/lib/store';
import { SITES } from '@/lib/meds';
import type { InjectionSite } from '@/lib/types';
import { F } from '@/lib/fonts';

/** Log an injection: pick the site (the rotation-suggested one is preselected). */
export function ShotModal({
  suggested,
  onClose,
  onConfirm,
}: {
  suggested: InjectionSite;
  onClose: () => void;
  onConfirm: (site: InjectionSite) => void;
}) {
  const t = useTheme();
  const [site, setSite] = useState<InjectionSite>(suggested);

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
          }}
        >
          <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>Where did you inject?</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: t.muted, marginTop: 4, marginBottom: 16 }}>
            Rotating sites helps avoid irritation — we suggest the next one for you.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 20 }}>
            {SITES.map((s) => {
              const selected = s === site;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSite(s)}
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    width: '31%',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: selected ? t.purple : t.border,
                    backgroundColor: selected ? t.purpleTint : t.surface2,
                  }}
                >
                  <Text style={{ fontFamily: F.d700, fontSize: 12.5, color: selected ? t.purple : t.ink }}>{s}</Text>
                  {s === suggested && (
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill={selected ? t.purple : t.muted2}>
                      <Path d="M12 3c.35 3.7 2.3 5.65 6 6-3.7.35-5.65 2.3-6 6-.35-3.7-2.3-5.65-6-6 3.7-.35 5.65-2.3 6-6Z" />
                    </Svg>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => onConfirm(site)}
            accessibilityRole="button"
            style={{ width: '100%', height: 50, borderRadius: 16, backgroundColor: t.purple, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Log injection</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
