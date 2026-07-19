import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useDailyTotals, useStore } from '@/lib/store';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { F } from '@/lib/fonts';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How am I doing today?',
  'High-protein dinner ideas',
  'Why does protein matter?',
];

const CHAT_KEY = 'avolens.coach.v1';
const MAX_SAVED = 40;

export default function CoachPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, session, streak, theme: t } = useStore();
  const totals = useDailyTotals();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  // Persist the conversation locally so it survives leaving the screen.
  const chatLoaded = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(CHAT_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw) as ChatMessage[];
            if (Array.isArray(saved)) setMessages(saved);
          } catch {
            // corrupt saved chat — start fresh
          }
        }
      })
      .finally(() => {
        chatLoaded.current = true;
      });
  }, []);
  useEffect(() => {
    if (!chatLoaded.current) return;
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_SAVED))).catch(() => {});
  }, [messages]);

  const clearChat = () => setMessages([]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (!supabaseConfigured || !supabase) {
      setMessages((m) => [
        ...m,
        { role: 'user', content },
        { role: 'assistant', content: 'The AI coach needs the Supabase backend to be configured (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY in .env).' },
      ]);
      return;
    }
    if (!session) {
      setMessages((m) => [
        ...m,
        { role: 'user', content },
        { role: 'assistant', content: 'Please sign in (Settings → Account) to chat with the coach.' },
      ]);
      return;
    }
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach', {
        body: {
          messages: next.slice(-12),
          context: {
            goal: state.goal,
            eatenToday: {
              calories: totals.calories,
              protein: totals.protein,
              carbs: totals.carbs,
              fat: totals.fat,
            },
            streak,
            goalType: state.goalType,
            unit: state.unit,
          },
        },
      });
      if (error) throw error;
      const reply = (data as { reply?: string })?.reply;
      if (!reply) throw new Error('Empty reply');
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      const status = (err as { context?: { status?: number } })?.context?.status;
      const fallback =
        status === 401
          ? 'Please sign in (Settings → Account) to chat with the coach.'
          : status === 429
            ? "You've reached today's coach limit — come back tomorrow!"
            : "Sorry — I couldn't reach the coach right now. Please try again in a moment.";
      setMessages((m) => [...m, { role: 'assistant', content: fallback }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  };

  return (
    <Screen inset={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m15 5-7 7 7 7" />
            </Svg>
          </Pressable>
          <Logo size={26} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink }}>AI Coach</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 11, color: t.green }}>Knows today's log & goals</Text>
          </View>
          {messages.length > 0 && (
            <Pressable
              onPress={clearChat}
              accessibilityRole="button"
              accessibilityLabel="Clear chat"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
              </Svg>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', gap: 14, paddingTop: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 99, backgroundColor: t.greenTint, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 3c.35 3.7 2.3 5.65 6 6-3.7.35-5.65 2.3-6 6-.35-3.7-2.3-5.65-6-6 3.7-.35 5.65-2.3 6-6Z" />
                </Svg>
              </View>
              <Text style={{ fontFamily: F.b500, fontSize: 13, color: t.muted, textAlign: 'center', maxWidth: 260 }}>
                Ask about your nutrition, today's progress, or meal ideas that fit your remaining macros.
              </Text>
              <View style={{ gap: 8, width: '100%', marginTop: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => send(s)}
                    accessibilityRole="button"
                    style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 }}
                  >
                    <Text style={{ fontFamily: F.b600, fontSize: 13, color: t.ink }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                backgroundColor: m.role === 'user' ? t.green : t.surface,
                borderWidth: m.role === 'user' ? 0 : 1,
                borderColor: t.border,
                borderRadius: 18,
                borderBottomRightRadius: m.role === 'user' ? 6 : 18,
                borderBottomLeftRadius: m.role === 'user' ? 18 : 6,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ fontFamily: F.b500, fontSize: 14, lineHeight: 20.5, color: m.role === 'user' ? '#fff' : t.ink }}>
                {m.content}
              </Text>
            </View>
          ))}

          {busy && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 }}>
              <Text style={{ fontFamily: F.b500, fontSize: 14, color: t.muted }}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(14, insets.bottom + 6),
            borderTopWidth: 1,
            borderTopColor: t.border,
            backgroundColor: t.bg,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={t.muted2}
            multiline
            style={{
              flex: 1,
              maxHeight: 110,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 20,
              paddingVertical: 10,
              paddingHorizontal: 15,
              fontFamily: F.b500,
              fontSize: 14,
              color: t.ink,
            }}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || busy}
            accessibilityRole="button"
            accessibilityLabel="Send"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 99,
              backgroundColor: input.trim() && !busy ? t.green : t.surface3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={input.trim() && !busy ? '#fff' : t.muted2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m5 12 14-7-4 14-3.5-5.5L5 12Z" />
            </Svg>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
