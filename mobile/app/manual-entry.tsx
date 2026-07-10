import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { FREQUENT_FOODS } from '@/lib/constants';
import type { FoodEntry } from '@/lib/types';
import { F } from '@/lib/fonts';

const MEALS: FoodEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function ManualEntryPage() {
  const router = useRouter();
  const { addEntry, theme: t } = useStore();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [name, setName] = useState('Avocado toast');
  const [meal, setMeal] = useState<FoodEntry['meal']>('Breakfast');
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [servings, setServings] = useState(1);
  const [protein, setProtein] = useState(12);
  const [carbs, setCarbs] = useState(34);
  const [fat, setFat] = useState(16);
  const [fiber, setFiber] = useState(8);
  const [sodium, setSodium] = useState(380);
  const [sugar, setSugar] = useState(4);
  const [showMoreNutrients, setShowMoreNutrients] = useState(false);

  const calories = useMemo(() => Math.round((protein * 4 + carbs * 4 + fat * 9) * servings), [protein, carbs, fat, servings]);

  const filteredFrequent = FREQUENT_FOODS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const applyFrequent = (f: (typeof FREQUENT_FOODS)[number]) => {
    setName(f.name);
    setProtein(f.protein);
    setCarbs(f.carbs);
    setFat(f.fat);
  };

  const save = () => {
    const now = new Date();
    addEntry({
      name,
      meal,
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories,
      protein: protein * servings,
      carbs: carbs * servings,
      fat: fat * servings,
      fiber: fiber * servings,
      sodium: sodium * servings,
      sugar: sugar * servings,
      healthScore: 7,
      icon: 'generic',
    });
    router.push('/home');
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: F.b600,
    fontSize: 15,
    color: t.ink,
  } as const;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 22, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m15 5-7 7 7 7" />
          </Svg>
        </Pressable>
        <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>Add Food</Text>
        <Pressable onPress={save} accessibilityRole="button" style={{ width: 36, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.green }}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={{ paddingTop: 2, paddingHorizontal: 22, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 16,
            paddingVertical: 3,
            paddingHorizontal: 15,
            marginBottom: 18,
          }}
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={11} cy={11} r={7} />
            <Path d="m21 21-4.3-4.3" />
          </Svg>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search food database"
            placeholderTextColor={t.muted2}
            style={{ flex: 1, fontFamily: F.b500, fontSize: 14, color: t.ink, paddingVertical: 10 }}
          />
        </View>

        <Text style={{ fontFamily: F.b700, fontSize: 11, color: t.muted2, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
          Frequent
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {filteredFrequent.map((f) => (
            <Pressable
              key={f.name}
              onPress={() => applyFrequent(f)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 99,
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 9, backgroundColor: t[f.color] as string }} />
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.ink }}>{f.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted2 }}>Or create custom</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        </View>

        <FieldLabel>Food name</FieldLabel>
        <TextInput value={name} onChangeText={setName} style={{ ...inputStyle, marginBottom: 14 }} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Meal</FieldLabel>
            <Pressable onPress={() => setMealPickerOpen(true)} style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 15, color: t.ink }}>{meal}</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="m6 9 6 6 6-6" />
              </Svg>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>Servings</FieldLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 14,
                paddingVertical: 8,
                paddingHorizontal: 10,
              }}
            >
              <Stepper onPress={() => setServings((s) => Math.max(1, s - 1))} bg={t.surface3} iconColor={t.ink} icon="minus" />
              <Text style={{ fontFamily: F.d700, fontSize: 15, color: t.ink }}>{servings}</Text>
              <Stepper onPress={() => setServings((s) => s + 1)} bg={t.greenTint} iconColor={t.green} icon="plus" />
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 16,
            paddingVertical: 15,
            paddingHorizontal: 18,
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={{ fontFamily: F.d700, fontSize: 14, color: t.ink }}>Calories</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.muted2, marginTop: 2 }}>Auto-calculated from macros</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontFamily: F.d800, fontSize: 28, color: t.ink, letterSpacing: -0.56 }}>{calories}</Text>
            <Text style={{ fontFamily: F.d600, fontSize: 13, color: t.muted2 }}>kcal</Text>
          </View>
        </View>

        <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, marginBottom: 8 }}>Macros (g)</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <MacroInput label="Protein" color={t.protein} value={protein} onChange={setProtein} />
          <MacroInput label="Carbs" color={t.carbs} value={carbs} onChange={setCarbs} />
          <MacroInput label="Fat" color={t.fat} value={fat} onChange={setFat} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted }}>More nutrients</Text>
          {!showMoreNutrients && (
            <Pressable
              onPress={() => setShowMoreNutrients(true)}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2.8} strokeLinecap="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.green }}>Add</Text>
            </Pressable>
          )}
        </View>
        {showMoreNutrients && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <NutrientInput label="Fiber" suffix="g" value={fiber} onChange={setFiber} />
            <NutrientInput label="Sodium" suffix="mg" value={sodium} onChange={setSodium} />
            <NutrientInput label="Sugar" suffix="g" value={sugar} onChange={setSugar} />
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', t.bg]}
          locations={[0, 0.28]}
          style={{ paddingTop: 14, paddingHorizontal: 22, paddingBottom: Math.max(26, insets.bottom + 10) }}
        >
          <Pressable
            onPress={save}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 18,
              backgroundColor: t.green,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: 'rgba(47,158,110,1)',
              shadowOpacity: 0.6,
              shadowRadius: 26,
              shadowOffset: { width: 0, height: 12 },
              elevation: 8,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: F.d700, fontSize: 16 }}>Add to Log</Text>
          </Pressable>
        </LinearGradient>
      </View>

      <Modal transparent animationType="fade" visible={mealPickerOpen} onRequestClose={() => setMealPickerOpen(false)}>
        <Pressable onPress={() => setMealPickerOpen(false)} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 12 }}>Meal</Text>
            {MEALS.map((m, i) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMeal(m);
                  setMealPickerOpen(false);
                }}
                style={{
                  paddingVertical: 14,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: t.border2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontFamily: F.b600, fontSize: 15, color: meal === m ? t.green : t.ink }}>{m}</Text>
                {meal === m && (
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="m5 12 5 5 9-11" />
                  </Svg>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const { theme: t } = useStore();
  return <Text style={{ fontFamily: F.b600, fontSize: 12, color: t.muted, marginBottom: 7 }}>{children}</Text>;
}

function Stepper({ onPress, bg, iconColor, icon }: { onPress: () => void; bg: string; iconColor: string; icon: 'plus' | 'minus' }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={3} strokeLinecap="round">
        {icon === 'plus' ? <Path d="M12 5v14M5 12h14" /> : <Path d="M5 12h14" />}
      </Svg>
    </Pressable>
  );
}

function numericOnChange(onChange: (n: number) => void) {
  return (text: string) => onChange(Number(text.replace(/[^0-9.]/g, '')) || 0);
}

function MacroInput({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (n: number) => void }) {
  const { theme: t } = useStore();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: color }} />
        <TextInput
          keyboardType="number-pad"
          value={String(value)}
          onChangeText={numericOnChange(onChange)}
          style={{ width: 40, fontFamily: F.d800, fontSize: 20, color: t.ink, textAlign: 'center', padding: 0 }}
        />
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted }}>{label}</Text>
    </View>
  );
}

function NutrientInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (n: number) => void }) {
  const { theme: t } = useStore();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <TextInput
          keyboardType="number-pad"
          value={String(value)}
          onChangeText={numericOnChange(onChange)}
          style={{ width: 44, fontFamily: F.d700, fontSize: 15, color: t.ink, textAlign: 'right', padding: 0 }}
        />
        <Text style={{ fontFamily: F.d700, fontSize: 12, color: t.ink }}>{suffix}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 10, color: t.muted }}>{label}</Text>
    </View>
  );
}
