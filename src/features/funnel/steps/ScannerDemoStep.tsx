import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ProteinIcon, CarbsIcon, FatIcon, FiberIcon, SodiumIcon, SugarIcon } from '@/components/NutritionIcons';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SlideInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';
import { success, tap } from '../haptics';

const SCAN_MS = 1500;
const LASER_H = 56;
const FRAME_H = 280;

type Phase = 'idle' | 'scanning' | 'done';

/**
 * Pure-frontend AI scanner demo — a 1:1 visual replica of the real scanner
 * screen (app/scanner.tsx): same dark camera chrome, viewfinder brackets,
 * mode chips, shutter, and result card. The bundled meal photo stands in for
 * the live camera preview; tapping the shutter runs a laser sweep, pops
 * recognition tags, and slides up the result card whose CTA advances the
 * funnel. No camera, no backend.
 */
/**
 * The demo plate's fixed nutrition — one realistic total for the whole meal,
 * scaled by the portion multiplier exactly like real AI scan results are.
 */
const BASE = { calories: 536, protein: 39, carbs: 40, fat: 22.5, fiber: 8, sodium: 560, sugar: 9 };

export function OnboardingScannerDemo({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { state, theme: t } = useStore();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('idle');
  const [servings, setServings] = useState(1);
  const scanY = useSharedValue(0);

  const shown = {
    calories: BASE.calories * servings,
    protein: BASE.protein * servings,
    carbs: BASE.carbs * servings,
    fat: BASE.fat * servings,
    fiber: BASE.fiber * servings,
    sodium: BASE.sodium * servings,
    sugar: BASE.sugar * servings,
  };
  const macroTotal = shown.protein + shown.carbs + shown.fat;
  const pct = (v: number) => (macroTotal > 0 ? Math.round((v / macroTotal) * 100) : 0);
  const grams = (v: number) => `${Math.round(v * 10) / 10}g`;

  const finishScan = () => {
    success();
    setPhase('done');
  };

  const startScan = () => {
    if (phase !== 'idle') return;
    tap();
    setPhase('scanning');
    scanY.value = 0;
    scanY.value = withTiming(1, { duration: SCAN_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
      if (finished) runOnJS(finishScan)();
    });
  };

  const rescan = () => {
    tap();
    scanY.value = 0;
    setServings(1);
    setPhase('idle');
  };

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LASER_H + scanY.value * (FRAME_H + LASER_H) }],
    opacity: interpolate(scanY.value, [0, 0.05, 0.95, 1], [0, 1, 1, 0]),
  }));

  // Per-item tags sum to the 536 kcal total shown on the result card.
  const TAGS: { label: string; dot: string; pos: { top: number; left?: number; right?: number } }[] = [
    { label: 'Grilled Chicken Breast · 320 kcal', dot: t.protein, pos: { top: 96, left: 10 } },
    { label: 'Steamed Broccoli · 46 kcal', dot: t.green, pos: { top: 18, left: 64 } },
    { label: 'Roasted Sweet Potato · 170 kcal', dot: t.carbs, pos: { top: 196, right: 10 } },
  ];

  return (
    <Animated.View entering={SlideInRight.duration(350).easing(Easing.out(Easing.poly(4)))} style={{ flex: 1 }}>
      <Screen bg="#121614" inset={false}>
        <View style={{ flex: 1, backgroundColor: '#121614', overflow: 'hidden' }}>
          {/* Fake live preview — the bundled sample plate, under the same scrim the real camera uses */}
        <Image source={require('../../../../assets/demo-meal.jpg')} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} accessibilityLabel="Sample meal in the camera preview" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,22,20,.35)' }} />

        {/* Camera chrome stays phone-width on wide (web/tablet) screens; the preview above is full-bleed */}
        <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>

        {/* Header — back, title, demo badge */}
        <View style={{ position: 'absolute', top: insets.top + 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m15 5-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={{ fontFamily: F.b600, fontSize: 14, color: '#fff' }}>Scan your meal</Text>
          <View style={{ width: 40, alignItems: 'flex-end' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 }}>
              <Text style={{ fontFamily: F.b700, fontSize: 9.5, color: 'rgba(255,255,255,.85)', letterSpacing: 0.8 }}>DEMO</Text>
            </View>
          </View>
        </View>

        {/* Motivational copy */}
        {phase !== 'done' && (
          <View style={{ position: 'absolute', top: insets.top + 76, left: 32, right: 32, zIndex: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.d800, fontSize: 21, color: '#fff', textAlign: 'center', letterSpacing: -0.4 }}>No more typing ingredients.</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: 'rgba(255,255,255,.75)', textAlign: 'center', marginTop: 5 }}>See how fast tracking should be — tap the shutter.</Text>
          </View>
        )}

        {/* Viewfinder — the real scanner's corner brackets, plus laser and tags */}
        <View style={{ position: 'absolute', top: insets.top + 148, left: 52, right: 52, height: FRAME_H, zIndex: 20 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            {phase === 'scanning' && (
              <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -6, right: -6, top: 0, height: LASER_H }, laserStyle]}>
                <LinearGradient colors={['rgba(169,194,74,0)', 'rgba(169,194,74,0.4)', 'rgba(255,255,255,0.95)', 'rgba(169,194,74,0.4)', 'rgba(169,194,74,0)']} locations={[0, 0.35, 0.5, 0.65, 1]} style={{ flex: 1 }} />
                <View style={{ position: 'absolute', top: LASER_H / 2 - 1, left: 0, right: 0, height: 2, backgroundColor: '#fff', shadowColor: t.greenGrad1, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 }} />
              </Animated.View>
            )}

            {phase === 'done' && TAGS.map((tag, i) => (
              <Animated.View
                key={tag.label}
                entering={ZoomIn.springify().damping(15).stiffness(180).delay(i * 140)}
                style={{ position: 'absolute', top: tag.pos.top, ...(tag.pos.left != null ? { left: tag.pos.left } : null), ...(tag.pos.right != null ? { right: tag.pos.right } : null), maxWidth: '92%' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,.95)', borderRadius: 11, paddingVertical: 6, paddingHorizontal: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 9, backgroundColor: tag.dot }} />
                  <Text numberOfLines={1} style={{ fontFamily: F.b600, fontSize: 10.5, color: '#26331a' }}>{tag.label}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <View pointerEvents="none">
            <View style={{ position: 'absolute', top: 0, left: 0, width: 38, height: 38, borderTopWidth: 3, borderLeftWidth: 3, borderColor: t.greenGrad1, borderTopLeftRadius: 16 }} />
            <View style={{ position: 'absolute', top: 0, right: 0, width: 38, height: 38, borderTopWidth: 3, borderRightWidth: 3, borderColor: t.greenGrad1, borderTopRightRadius: 16 }} />
            <View style={{ position: 'absolute', top: FRAME_H - 38, left: 0, width: 38, height: 38, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: t.greenGrad1, borderBottomLeftRadius: 16 }} />
            <View style={{ position: 'absolute', top: FRAME_H - 38, right: 0, width: 38, height: 38, borderBottomWidth: 3, borderRightWidth: 3, borderColor: t.greenGrad1, borderBottomRightRadius: 16 }} />
          </View>

          {phase !== 'done' && (
            <Text style={{ position: 'absolute', bottom: -32, left: -20, right: -20, textAlign: 'center', fontFamily: F.b500, fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
              {phase === 'scanning' ? 'Analyzing your meal…' : 'Center your plate in the frame'}
            </Text>
          )}
        </View>

        {/* Bottom controls — mode chips + shutter, exactly like the real scanner (visual only) */}
        {phase !== 'done' && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 32, zIndex: 30 }}>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 9, paddingHorizontal: 15, borderRadius: 99, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 2v6a2 2 0 0 0 4 0V2" />
                  <Path d="M8 8v14" />
                  <Path d="M17 2c-1.6 0-2.6 2-2.6 5s1 5 2.6 5 2.6-1.6 2.6-5S18.6 2 17 2Z" />
                  <Path d="M17 12v10" />
                </Svg>
                <Text style={{ fontFamily: F.b700, fontSize: 12, color: '#111116' }}>Food</Text>
              </View>
              <FauxChip label="Barcode"><Path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12" /></FauxChip>
              <FauxChip label="Label"><Rect x={4} y={3} width={16} height={18} rx={2.5} /><Path d="M8 8h8M8 12h8M8 16h5" /></FauxChip>
              <FauxChip label="Manual"><Path d="M12 20h9" /><Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></FauxChip>
              <FauxChip label="Voice"><Rect x={9} y={3} width={6} height={12} rx={3} /><Path d="M6 11a6 6 0 0 0 12 0M12 17v4" /></FauxChip>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 }}>
              <View style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={5} width={18} height={14} rx={3} />
                  <Circle cx={12} cy={12} r={3.5} />
                </Svg>
              </View>
              <Pressable
                onPress={startScan}
                disabled={phase === 'scanning'}
                accessibilityRole="button"
                accessibilityLabel="Test the AI scanner"
                style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: phase === 'scanning' ? 0.6 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
              </Pressable>
              <View style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <Path d="M21 3v5h-5" />
                </Svg>
              </View>
            </View>
          </View>
        )}

        {/* Result card — same anatomy as the real scan result, with the funnel CTA */}
        {phase === 'done' && (
          <Animated.View entering={SlideInDown.springify().damping(17).stiffness(160).delay(TAGS.length * 140)} style={{ position: 'absolute', left: 18, right: 18, bottom: insets.bottom + 24, backgroundColor: t.surface, borderRadius: 26, padding: 18, zIndex: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={26} height={26} viewBox="0 0 32 32" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 14h22a11 11 0 0 1-11 11A11 11 0 0 1 5 14Z" />
                  <Path d="M9 14a7 7 0 0 1 14 0" />
                </Svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>Grilled Chicken Bowl</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>97% match · AvoLens AI · 1.2s</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 7 }}>
                    <Svg width={9} height={9} viewBox="0 0 24 24" fill={t.green}>
                      <Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
                    </Svg>
                    <Text style={{ fontFamily: F.d700, fontSize: 10, color: t.greenGrad2 }}>9/10</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink }}>{Math.round(shown.calories)}</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: -4 }}>kcal</Text>
              </View>
            </View>

            {/* Portion adjuster — same row as real AI scan results, scales the totals */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 12, color: t.ink }}>
                Portion <Text style={{ color: t.muted }}>· of what was scanned</Text>
              </Text>
              <Pressable
                onPress={() => { tap(); setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 2) / 2)); }}
                accessibilityRole="button"
                accessibilityLabel="Smaller portion"
                hitSlop={8}
                style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={3} strokeLinecap="round"><Path d="M5 12h14" /></Svg>
              </Pressable>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink, minWidth: 52, textAlign: 'center' }}>{servings}×</Text>
              <Pressable
                onPress={() => { tap(); setServings((s) => Math.min(10, Math.round((s + 0.5) * 2) / 2)); }}
                accessibilityRole="button"
                accessibilityLabel="Larger portion"
                hitSlop={8}
                style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <DemoMacroCell icon={<ProteinIcon color={t.protein} size={14} />} value={grams(shown.protein)} label={`Protein · ${pct(shown.protein)}%`} t={t} />
              <DemoMacroCell icon={<CarbsIcon color={t.carbs} size={14} />} value={grams(shown.carbs)} label={`Carbs · ${pct(shown.carbs)}%`} t={t} />
              <DemoMacroCell icon={<FatIcon color={t.fat} size={14} />} value={grams(shown.fat)} label={`Fat · ${pct(shown.fat)}%`} t={t} />
            </View>

            {/* Fiber / sodium / sugar strip, % of daily goals — same as the real result card */}
            <View style={{ flexDirection: 'row', marginTop: 12, borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
              <DemoNutrientCell icon={<FiberIcon color={t.fiber} size={13} />} value={grams(shown.fiber)} label={`Fiber · ${Math.round((shown.fiber / (state.goal?.fiber || 30)) * 100)}%`} t={t} />
              <DemoNutrientCell icon={<SodiumIcon color={t.sodium} size={13} />} value={`${Math.round(shown.sodium)}mg`} label={`Sodium · ${Math.round((shown.sodium / (state.goal?.sodium || 2300)) * 100)}%`} border t={t} />
              <DemoNutrientCell icon={<SugarIcon color={t.sugar} size={13} />} value={grams(shown.sugar)} label={`Sugar · ${Math.round((shown.sugar / (state.goal?.sugar || 50)) * 100)}%`} border t={t} />
            </View>

            <Pressable
              onPress={() => { tap(); onDone(); }}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', width: '100%', height: 52, borderRadius: 16, backgroundColor: '#111116', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Continue to My Personalized Plan</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </Pressable>
            <Pressable onPress={rescan} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                <Path d="M21 3v5h-5" />
              </Svg>
              <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted }}>Watch it again</Text>
            </Pressable>
          </Animated.View>
        )}

        </View>
      </View>
    </Screen>
  </Animated.View>
);
}

function FauxChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View accessibilityLabel={label} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </Svg>
    </View>
  );
}

function DemoMacroCell({ icon, value, label, t }: { icon?: React.ReactNode; value: string; label: string; t: ReturnType<typeof useStore>['theme'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: t.border, paddingVertical: 10, borderRadius: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon}
        <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>{value}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2 }}>{label}</Text>
    </View>
  );
}

function DemoNutrientCell({ icon, value, label, border, t }: { icon?: React.ReactNode; value: string; label: string; border?: boolean; t: ReturnType<typeof useStore>['theme'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 9, borderLeftWidth: border ? 1 : 0, borderLeftColor: t.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.ink }}>{value}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted2 }}>{label}</Text>
    </View>
  );
}
