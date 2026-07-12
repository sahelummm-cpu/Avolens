import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/lib/store';
import { F } from '@/lib/fonts';

export function PromptModal({
  title,
  placeholder,
  initial = '',
  onClose,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  initial?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const t = useTheme();
  const [value, setValue] = useState(initial);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior="padding">
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
            <Text style={{ fontFamily: F.d700, fontSize: 17, color: t.ink, marginBottom: 16 }}>{title}</Text>
            <TextInput
              autoFocus
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
              onSubmitEditing={submit}
              placeholder={placeholder}
              placeholderTextColor={t.muted2}
              style={{
                width: '100%',
                backgroundColor: t.surface2,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 14,
                paddingVertical: 13,
                paddingHorizontal: 15,
                fontFamily: F.b600,
                fontSize: 16,
                color: t.ink,
                marginBottom: 16,
              }}
            />
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
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
