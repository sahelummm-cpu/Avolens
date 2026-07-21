import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { parseSpokenMeal, scanMeal } from '@/lib/api';
import { barcodeBasis, scaleBasis, searchFoods, type FoodBasis } from '@/lib/foods';
import { searchCommonFoods } from '@/lib/commonFoods';
import type { ScanResult } from '@/lib/types';
import { F } from '@/lib/fonts';
import { ProteinIcon, CarbsIcon, FatIcon, FiberIcon, SodiumIcon, SugarIcon, CalorieIcon } from '@/components/NutritionIcons';

function scanResultFromBasis(b: FoodBasis, grams: number): ScanResult {
  const s = scaleBasis(b, grams);
  return {
    name: b.brands ? `${b.name} (${b.brands})` : b.name,
    matchConfidence: 100,
    calories: s.calories,
    protein: s.protein,
    carbs: s.carbs,
    fat: s.fat,
    fiber: s.fiber,
    sodium: s.sodium,
    sugar: s.sugar,
    healthScore: b.healthScore,
    ingredients: [`${grams} g`],
  };
}

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] as const;

function mealForNow(): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

export default function ScannerPage() {
  const router = useRouter();
  const { state, addEntry, theme: t } = useStore();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<'food' | 'barcode' | 'label' | 'voice'>('food');
  const [basis, setBasis] = useState<FoodBasis | null>(null);
  const [grams, setGrams] = useState(100);
  // Portion multiplier for AI (meal/label/voice) results — barcode results
  // scale by grams via `basis` instead.
  const [aiServings, setAiServings] = useState(1);
  const scanningBarcode = useRef(false);

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FoodBasis[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [selectedBasis, setSelectedBasis] = useState<FoodBasis | null>(null);
  const [addGrams, setAddGrams] = useState('100');

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!searchModalVisible) return;
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchErr(null);
      return;
    }
    setSearching(true);
    setSearchErr(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const timeoutId = setTimeout(async () => {
      try {
        const common = searchCommonFoods(q);
        setSearchResults(common);
        const apiRes = await searchFoods(q, ac.signal);
        setSearchResults([...common, ...apiRes]);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setSearchErr(err instanceof Error ? err.message : 'Search failed');
      } finally {
        if (!ac.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [search, searchModalVisible]);

  const confirmAddIngredient = () => {
    if (!selectedBasis || !result) return;
    const g = parseFloat(addGrams) || 0;
    if (g <= 0) return;
    const s = scaleBasis(selectedBasis, g);
    setResult({
      ...result,
      calories: result.calories + s.calories,
      protein: result.protein + s.protein,
      carbs: result.carbs + s.carbs,
      fat: result.fat + s.fat,
      fiber: result.fiber + s.fiber,
      sodium: result.sodium + s.sodium,
      sugar: result.sugar + s.sugar,
      ingredients: [...result.ingredients, `${selectedBasis.name} (${g}g)`],
    });
    setSearchModalVisible(false);
    setSelectedBasis(null);
    setSearch('');
  };

  // Voice mode: on-device speech recognition → AI parse of the transcript.
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results?.[0]?.transcript ?? '';
    if (text) setTranscript(text);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      setScanError('Voice recognition failed — try again speaking clearly, or add the food manually.');
    }
  });

  const toggleListening = async () => {
    if (listening) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        setListening(false);
      }
      return;
    }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setScanError('Microphone permission is needed for voice logging.');
        return;
      }
      setTranscript('');
      setScanError(null);
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: true });
      setListening(true);
    } catch {
      setScanError('Voice recognition is not available on this device.');
    }
  };

  const analyzeTranscript = async () => {
    const text = transcript.trim();
    if (!text || loading) return;
    if (listening) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // ignore
      }
    }
    setLoading(true);
    setScanError(null);
    setAiServings(1);
    try {
      setResult(await parseSpokenMeal(text));
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Could not parse that description.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const cameraError = permission && !permission.granted
    ? 'Camera access is unavailable. You can still add food manually.'
    : null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const capture = async () => {
    if (mode === 'barcode') {
      showToast('Point the camera at a barcode — it scans automatically');
      return;
    }
    if (mode === 'voice') {
      toggleListening();
      return;
    }
    if (loading) return;
    setLoading(true);
    setScanError(null);
    setResult(null);
    setBasis(null);
    setAiServings(1);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.85 });
      if (!photo?.base64) throw new Error('Could not capture a photo.');
      const data = await scanMeal(photo.base64, 'image/jpeg', mode === 'label' ? 'label' : 'meal');
      setResult(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const onBarcode = async (code: string) => {
    if (scanningBarcode.current || loading || result) return;
    scanningBarcode.current = true;
    setLoading(true);
    setScanError(null);
    try {
      const b = await barcodeBasis(code);
      const g = b.servingG ?? 100;
      setBasis(b);
      setGrams(g);
      setResult(scanResultFromBasis(b, g));
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
      // Let the next scan run once the current result/error is dismissed.
      setTimeout(() => {
        scanningBarcode.current = false;
      }, 1500);
    }
  };

  const discardResult = () => {
    setResult(null);
    setBasis(null);
    setAiServings(1);
    setTranscript('');
  };

  const removeIngredient = (i: number) => {
    if (!result) return;
    setResult({ ...result, ingredients: result.ingredients.filter((_, idx) => idx !== i) });
  };

  const setPortion = (g: number) => {
    const clamped = Math.max(1, Math.round(g));
    setGrams(clamped);
    if (basis) setResult(scanResultFromBasis(basis, clamped));
  };

  // The values shown/logged — AI results scale by the servings multiplier,
  // barcode results are already scaled by grams via `basis`.
  const scaleAi = (r: ScanResult, k: number): ScanResult => ({
    ...r,
    calories: r.calories * k,
    protein: r.protein * k,
    carbs: r.carbs * k,
    fat: r.fat * k,
    fiber: r.fiber * k,
    sodium: r.sodium * k,
    sugar: r.sugar * k,
  });
  const shown = result ? (basis ? result : scaleAi(result, aiServings)) : null;

  const addToLog = () => {
    if (!shown) return;
    addEntry({
      name: shown.name,
      meal: mealForNow(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories: Math.round(shown.calories),
      protein: Math.round(shown.protein),
      carbs: Math.round(shown.carbs),
      fat: Math.round(shown.fat),
      fiber: Math.round(shown.fiber),
      sodium: Math.round(shown.sodium),
      sugar: Math.round(shown.sugar),
      healthScore: Math.round(shown.healthScore),
      ingredients: shown.ingredients,
      icon: 'generic',
      ...(basis
        ? { amount: grams, unit: 'g' as const }
        : { amount: aiServings, unit: 'serving' as const }),
    });
    router.push('/home');
  };

  const macroTotal = shown ? shown.protein + shown.carbs + shown.fat : 0;
  const pct = (v: number) => (macroTotal > 0 ? Math.round((v / macroTotal) * 100) : 0);

  return (
    <Screen bg="#121614" inset={false}>
      <View style={{ flex: 1, backgroundColor: '#121614', overflow: 'hidden' }}>
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            facing="back"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: [...BARCODE_TYPES] } : undefined}
            onBarcodeScanned={mode === 'barcode' ? ({ data }) => onBarcode(data) : undefined}
          />
        )}
        {/* scrim over the live preview */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,22,20,.35)' }} />

        <View
          style={{
            position: 'absolute',
            top: insets.top + 20,
            left: 20,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
          }}
        >
          <Pressable
            onPress={() => router.push('/home')}
            accessibilityRole="button"
            style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m15 5-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={{ fontFamily: F.b600, fontSize: 14, color: '#fff' }}>Scan your meal</Text>
          <View style={{ width: 40, height: 40 }} />
        </View>

        {!result && !loading && (
          <View style={{ position: 'absolute', top: insets.top + 100, left: 52, right: 52, height: 286, zIndex: 20 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, width: 38, height: 38, borderTopWidth: 3, borderLeftWidth: 3, borderColor: t.greenGrad1, borderTopLeftRadius: 16 }} />
            <View style={{ position: 'absolute', top: 0, right: 0, width: 38, height: 38, borderTopWidth: 3, borderRightWidth: 3, borderColor: t.greenGrad1, borderTopRightRadius: 16 }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, width: 38, height: 38, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: t.greenGrad1, borderBottomLeftRadius: 16 }} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 38, height: 38, borderBottomWidth: 3, borderRightWidth: 3, borderColor: t.greenGrad1, borderBottomRightRadius: 16 }} />
            <Text style={{ position: 'absolute', bottom: -32, left: 0, right: 0, textAlign: 'center', fontFamily: F.b500, fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
              {cameraError ??
                (mode === 'barcode'
                  ? 'Center the barcode — it scans automatically'
                  : mode === 'label'
                    ? 'Center the nutrition facts label in the frame'
                    : mode === 'voice'
                      ? 'Tap the button and say what you ate'
                      : 'Center your plate in the frame')}
            </Text>
          </View>
        )}

        {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 35, gap: 14 }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ fontFamily: F.b600, fontSize: 13, color: '#fff' }}>
              {mode === 'label' ? 'Reading the label…' : mode === 'voice' ? 'Working out the nutrition…' : 'Analyzing your meal…'}
            </Text>
          </View>
        )}

        {scanError && !loading && (
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 190, backgroundColor: t.surface, borderRadius: 20, padding: 16, zIndex: 30, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.protein, marginBottom: 10, textAlign: 'center' }}>{scanError}</Text>
            <Pressable onPress={() => setScanError(null)} accessibilityRole="button">
              <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.green }}>Try again</Text>
            </Pressable>
          </View>
        )}

        {shown && !loading && (
          <ScrollView
            style={{ position: 'absolute', left: 18, right: 18, bottom: 184, backgroundColor: t.surface, borderRadius: 26, zIndex: 30, maxHeight: '62%' }}
            contentContainerStyle={{ padding: 18 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Svg width={26} height={26} viewBox="0 0 32 32" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 14h22a11 11 0 0 1-11 11A11 11 0 0 1 5 14Z" />
                  <Path d="M9 14a7 7 0 0 1 14 0" />
                </Svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>{shown.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>
                    {Math.round(shown.matchConfidence)}% match · AvoLens AI
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: t.greenTint, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 7 }}>
                    <Svg width={9} height={9} viewBox="0 0 24 24" fill={t.green}>
                      <Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
                    </Svg>
                    <Text style={{ fontFamily: F.d700, fontSize: 10, color: t.greenGrad2 }}>{Math.round(shown.healthScore)}/10</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <CalorieIcon color="#FF3B30" size={18} />
                  <Text style={{ fontFamily: F.d800, fontSize: 24, color: t.ink }}>{Math.round(shown.calories)}</Text>
                </View>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: -4 }}>kcal</Text>
              </View>
            </View>

            {basis && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 12, color: t.ink }}>
                  Portion <Text style={{ color: t.muted }}>· {basis.calories} kcal / 100g</Text>
                </Text>
                <Pressable onPress={() => setPortion(grams - 10)} accessibilityRole="button" accessibilityLabel="Less" hitSlop={8} style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={3} strokeLinecap="round"><Path d="M5 12h14" /></Svg>
                </Pressable>
                <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink, minWidth: 52, textAlign: 'center' }}>{grams} g</Text>
                <Pressable onPress={() => setPortion(grams + 10)} accessibilityRole="button" accessibilityLabel="More" hitSlop={8} style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                </Pressable>
              </View>
            )}

            {/* Servings adjust for AI meal/label/voice results (barcode scales by grams above) */}
            {!basis && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 12, color: t.ink }}>
                  Portion <Text style={{ color: t.muted }}>· of what was scanned</Text>
                </Text>
                <Pressable
                  onPress={() => setAiServings((s) => Math.max(0.5, Math.round((s - 0.5) * 2) / 2))}
                  accessibilityRole="button"
                  accessibilityLabel="Smaller portion"
                  hitSlop={8}
                  style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={3} strokeLinecap="round"><Path d="M5 12h14" /></Svg>
                </Pressable>
                <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink, minWidth: 52, textAlign: 'center' }}>{aiServings}×</Text>
                <Pressable
                  onPress={() => setAiServings((s) => Math.min(10, Math.round((s + 0.5) * 2) / 2))}
                  accessibilityRole="button"
                  accessibilityLabel="Larger portion"
                  hitSlop={8}
                  style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                </Pressable>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <Text style={{ fontFamily: F.b700, fontSize: 12, color: t.ink, letterSpacing: 0.2 }}>
                  Scanned Ingredients ({shown.ingredients.length})
                </Text>
                <Pressable
                  onPress={() => setSearchModalVisible(true)}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round">
                    <Path d="M12 5v14M5 12h14" />
                  </Svg>
                  <Text style={{ fontFamily: F.d700, fontSize: 11.5, color: t.green }}>+ Add Ingredient</Text>
                </Pressable>
              </View>
              {shown.ingredients.map((ing, i) => (
                <View
                  key={ing + i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: t.greenTint,
                    borderWidth: 1,
                    borderColor: t.green + '33',
                    paddingVertical: 5,
                    paddingLeft: 11,
                    paddingRight: 9,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.greenGrad2 }}>{ing}</Text>
                  <Pressable onPress={() => removeIngredient(i)} accessibilityRole="button" accessibilityLabel={`Remove ${ing}`} hitSlop={8}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={t.greenGrad2} strokeWidth={3} strokeLinecap="round">
                      <Path d="M6 6l12 12M18 6 6 18" />
                    </Svg>
                  </Pressable>
                </View>
              ))}
              {shown.ingredients.length === 0 && (
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted, fontStyle: 'italic' }}>
                  No ingredients listed. Tap + Add Ingredient to add items.
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <MacroCell icon={<ProteinIcon color={t.protein} size={14} />} value={`${Math.round(shown.protein)}g`} label={`Protein · ${pct(shown.protein)}%`} />
              <MacroCell icon={<CarbsIcon color={t.carbs} size={14} />} value={`${Math.round(shown.carbs)}g`} label={`Carbs · ${pct(shown.carbs)}%`} />
              <MacroCell icon={<FatIcon color={t.fat} size={14} />} value={`${Math.round(shown.fat)}g`} label={`Fat · ${pct(shown.fat)}%`} />
            </View>

            <View style={{ flexDirection: 'row', marginTop: 12, borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
              <NutrientCell icon={<FiberIcon color={t.fiber} size={13} />} value={`${Math.round(shown.fiber)}g`} label={`Fiber · ${Math.round((shown.fiber / state.goal.fiber) * 100)}%`} />
              <NutrientCell icon={<SodiumIcon color={t.sodium} size={13} />} value={`${Math.round(shown.sodium)}mg`} label={`Sodium · ${Math.round((shown.sodium / state.goal.sodium) * 100)}%`} border />
              <NutrientCell icon={<SugarIcon color={t.sugar} size={13} />} value={`${Math.round(shown.sugar)}g`} label={`Sugar · ${Math.round((shown.sugar / state.goal.sugar) * 100)}%`} border />
            </View>

            <Pressable
              onPress={() => setSearchModalVisible(true)}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, backgroundColor: t.surface2, paddingVertical: 12, borderRadius: 14 }}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.6} strokeLinecap="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
              <Text style={{ fontFamily: F.d700, fontSize: 13, color: t.green }}>+ Add ingredient to improve scan accuracy</Text>
            </Pressable>

            <Pressable
              onPress={addToLog}
              accessibilityRole="button"
              style={{ width: '100%', height: 50, borderRadius: 16, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center', marginTop: 14 }}
            >
              <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 15 }}>Add to Log</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/manual-entry')}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
              <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted }}>Add food manually</Text>
            </Pressable>
            <Pressable
              onPress={discardResult}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round">
                <Path d="M6 6l12 12M18 6 6 18" />
              </Svg>
              <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.muted }}>Discard & rescan</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Voice transcript panel */}
        {mode === 'voice' && !result && !loading && (
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 250, backgroundColor: t.surface, borderRadius: 20, padding: 16, zIndex: 30, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: listening ? t.protein : t.muted2 }} />
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>
                {listening ? 'Listening… tap the button to stop' : transcript ? 'Heard:' : 'e.g. "two eggs, toast with butter and an orange juice"'}
              </Text>
            </View>
            {!!transcript && (
              <Text style={{ fontFamily: F.b600, fontSize: 14.5, color: t.ink }}>{transcript}</Text>
            )}
            {!!transcript && !listening && (
              <Pressable
                onPress={analyzeTranscript}
                accessibilityRole="button"
                style={{ height: 44, borderRadius: 14, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 14 }}>Get nutrition</Text>
              </Pressable>
            )}
          </View>
        )}

        {!result && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 32, zIndex: 30 }}>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              {mode === 'food' ? (
                <ActiveChip label="Food">
                  <Path d="M6 2v6a2 2 0 0 0 4 0V2" />
                  <Path d="M8 8v14" />
                  <Path d="M17 2c-1.6 0-2.6 2-2.6 5s1 5 2.6 5 2.6-1.6 2.6-5S18.6 2 17 2Z" />
                  <Path d="M17 12v10" />
                </ActiveChip>
              ) : (
                <ModeChip label="Food" onPress={() => setMode('food')}>
                  <Path d="M6 2v6a2 2 0 0 0 4 0V2" />
                  <Path d="M8 8v14" />
                  <Path d="M17 2c-1.6 0-2.6 2-2.6 5s1 5 2.6 5 2.6-1.6 2.6-5S18.6 2 17 2Z" />
                  <Path d="M17 12v10" />
                </ModeChip>
              )}
              {mode === 'barcode' ? (
                <ActiveChip label="Barcode">
                  <Path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12" />
                </ActiveChip>
              ) : (
                <ModeChip label="Barcode" onPress={() => setMode('barcode')}>
                  <Path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12" />
                </ModeChip>
              )}
              {mode === 'label' ? (
                <ActiveChip label="Label">
                  <Rect x={4} y={3} width={16} height={18} rx={2.5} />
                  <Path d="M8 8h8M8 12h8M8 16h5" />
                </ActiveChip>
              ) : (
                <ModeChip label="Label" onPress={() => setMode('label')}>
                  <Rect x={4} y={3} width={16} height={18} rx={2.5} />
                  <Path d="M8 8h8M8 12h8M8 16h5" />
                </ModeChip>
              )}
              <ModeChip label="Manual" onPress={() => router.push('/manual-entry')}>
                <Path d="M12 20h9" />
                <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </ModeChip>
              {mode === 'voice' ? (
                <ActiveChip label="Voice">
                  <Rect x={9} y={3} width={6} height={12} rx={3} />
                  <Path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
                </ActiveChip>
              ) : (
                <ModeChip label="Voice" onPress={() => setMode('voice')}>
                  <Rect x={9} y={3} width={6} height={12} rx={3} />
                  <Path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
                </ModeChip>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 }}>
              <Pressable
                onPress={() => router.push('/manual-entry')}
                accessibilityRole="button"
                style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={5} width={18} height={14} rx={3} />
                  <Circle cx={12} cy={12} r={3.5} />
                </Svg>
              </Pressable>
              <Pressable
                onPress={capture}
                accessibilityRole="button"
                accessibilityLabel={mode === 'voice' ? (listening ? 'Stop listening' : 'Start listening') : 'Capture'}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: listening ? 30 : 56,
                    height: listening ? 30 : 56,
                    borderRadius: listening ? 8 : 28,
                    backgroundColor: mode === 'voice' ? t.protein : '#fff',
                  }}
                />
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

        {toast && (
          <View
            style={{
              position: 'absolute',
              bottom: 210,
              alignSelf: 'center',
              backgroundColor: 'rgba(0,0,0,.8)',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 99,
              zIndex: 50,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: F.b600, fontSize: 12 }}>{toast}</Text>
          </View>
        )}

        <Modal visible={searchModalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <View style={{ height: '80%', backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Pressable onPress={() => { setSearchModalVisible(false); setSelectedBasis(null); }} hitSlop={12}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.5} strokeLinecap="round"><Path d="M18 6L6 18M6 6l12 12" /></Svg>
                </Pressable>
                <Text style={{ fontFamily: F.b600, fontSize: 16, color: t.ink, flex: 1 }}>{selectedBasis ? 'Amount' : 'Search Ingredient'}</Text>
              </View>

              {!selectedBasis ? (
                <>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search foods (e.g. butter)"
                    placeholderTextColor={t.muted2}
                    autoFocus
                    style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 14, fontFamily: F.b500, fontSize: 15, color: t.ink, marginBottom: 16 }}
                  />
                  {searching && <ActivityIndicator style={{ marginTop: 20 }} color={t.green} />}
                  {searchErr && <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.protein, marginTop: 10 }}>{searchErr}</Text>}
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {searchResults.map((r, i) => (
                      <Pressable
                        key={i}
                        onPress={() => setSelectedBasis(r)}
                        style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border }}
                      >
                        <Text style={{ fontFamily: F.b600, fontSize: 14, color: t.ink }}>{r.name}</Text>
                        <Text style={{ fontFamily: F.b500, fontSize: 12, color: t.muted }}>{r.brands ? `${r.brands} · ` : ''}{r.calories} kcal / 100g</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <View style={{ gap: 20, marginTop: 10 }}>
                  <Text style={{ fontFamily: F.b600, fontSize: 18, color: t.ink, textAlign: 'center' }}>{selectedBasis.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <TextInput
                      value={addGrams}
                      onChangeText={setAddGrams}
                      keyboardType="numeric"
                      autoFocus
                      style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 14, fontFamily: F.d700, fontSize: 24, color: t.ink, minWidth: 100, textAlign: 'center' }}
                    />
                    <Text style={{ fontFamily: F.b600, fontSize: 16, color: t.muted }}>grams</Text>
                  </View>
                  <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, textAlign: 'center' }}>
                    Tip: 1 tsp butter ≈ 5g, 1 tbsp ≈ 14g.
                  </Text>
                  <Pressable
                    onPress={confirmAddIngredient}
                    style={{ backgroundColor: t.green, borderRadius: 16, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
                  >
                    <Text style={{ fontFamily: F.d700, fontSize: 15, color: '#fff' }}>Add to Scan</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

function ActiveChip({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme: t } = useStore();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff',
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 99,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </Svg>
      <Text style={{ fontFamily: F.b700, fontSize: 12, color: '#26331a' }}>{label}</Text>
    </View>
  );
}

function ModeChip({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </Svg>
    </Pressable>
  );
}

function MacroCell({ icon, value, label }: { icon?: React.ReactNode; value: string; label: string }) {
  const { theme: t } = useStore();
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

function NutrientCell({ icon, value, label, border }: { icon?: React.ReactNode; value: string; label: string; border?: boolean }) {
  const { theme: t } = useStore();
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
