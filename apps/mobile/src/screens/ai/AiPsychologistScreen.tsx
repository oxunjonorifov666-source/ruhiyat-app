import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppPalette } from '../../theme/useAppPalette';
import { aiPsychologistService, AiMessageRow } from '../../services/aiPsychologist';

export function AiPsychologistScreen() {
  const C = useAppPalette();
  const [items, setItems] = useState<AiMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await aiPsychologistService.getMessages();
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await aiPsychologistService.sendMessage(t);
      setItems((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', content: res.userMessage, createdAt: new Date().toISOString() },
        res.assistant,
      ]);
    } catch (e: any) {
      setText(t);
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: e?.message || 'Xatolik yuz berdi. AI kaliti superadmin panelida sozlanganini tekshiring.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user'
                ? { alignSelf: 'flex-end', backgroundColor: C.primary }
                : {
                    alignSelf: 'flex-start',
                    backgroundColor: C.surface,
                    borderWidth: 1,
                    borderColor: C.border,
                  },
            ]}
          >
            <Text style={[styles.bubbleText, item.role === 'user' ? { color: '#fff' } : { color: C.text }]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: C.textMuted }]}>
            Salom! Savolingizni yozing — AI psixolog javob beradi.
          </Text>
        }
      />
      <View style={[styles.inputRow, { borderTopColor: C.border, backgroundColor: C.surface }]}>
        <TextInput
          style={[styles.input, { borderColor: C.border, color: C.text }]}
          placeholder="Xabar..."
          placeholderTextColor={C.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: C.primary }]} onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>→</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
