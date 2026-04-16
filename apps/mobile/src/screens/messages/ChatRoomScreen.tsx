import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, type ChatMessage } from '../../services/chat';
import { getChatSocket } from '../../services/chat-socket';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenStates } from '../../components/ScreenStates';

type Props = any;

export function ChatRoomScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const chatId: number = route?.params?.chatId;
  const title: string = route?.params?.title || 'Chat';

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);

  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  useEffect(() => {
    navigation?.setOptions?.({ title });
  }, [navigation, title]);

  const load = useCallback(async () => {
    if (!chatId || Number.isNaN(Number(chatId))) {
      setLoadError('Chat topilmadi');
      setLoading(false);
      return;
    }
    setLoadError(null);
    setComposeError(null);
    setLoading(true);
    try {
      const res = await chatService.listMyMessages(chatId, { limit: 100 });
      setMessages(res.data);
    } catch (e: any) {
      setLoadError(e?.message || 'Xabarlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    let s: any;
    (async () => {
      try {
        s = await getChatSocket();
        if (!mounted) return;

        // Ensure user is joined
        s.emit('joinChat', { chatId });
        s.emit('markRead', { chatId });

        const onNewMessage = (msg: ChatMessage) => {
          if (msg.chatId !== chatId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        };

        s.on('newMessage', onNewMessage);
        return () => {
          s.off('newMessage', onNewMessage);
        };
      } catch {
        // Socket errors shouldn't block basic REST chat
      }
    })();

    return () => { mounted = false; };
  }, [chatId]);

  const sendText = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;
    setComposeError(null);
    setSending(true);
    try {
      const s = await getChatSocket();
      const msg: ChatMessage = await new Promise((resolve, reject) => {
        s.timeout(10000).emit('sendMessage', { chatId, content, type: 'text' }, (err: any, data: any) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
      setText('');
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      // Fallback to REST if socket fails
      try {
        const msg = await (await import('../../services/api')).apiClient.post<ChatMessage>(`/mobile/chats/${chatId}/messages`, { content, type: 'text' });
        setText('');
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch (e2: any) {
        setComposeError(e2?.message || e?.message || 'Yuborib bo‘lmadi');
      }
    } finally {
      setSending(false);
    }
  }, [chatId, sending, text]);

  const pickAndSendFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const f = result.assets?.[0];
    if (!f?.uri) return;
    const name = (f.name || 'file').slice(0, 120);
    const type = f.mimeType || 'application/octet-stream';

    setSending(true);
    setComposeError(null);
    try {
      const uploaded = await chatService.uploadChatAttachment(chatId, { uri: f.uri, name, type });
      // Send message that references attachment
      const msg = await (await import('../../services/api')).apiClient.post<ChatMessage>(`/mobile/chats/${chatId}/messages`, {
        type: 'attachment',
        content: name,
        attachmentUrl: uploaded.url,
      });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      setComposeError(e?.message || 'Fayl yuborib bo‘lmadi');
    } finally {
      setSending(false);
    }
  }, [chatId]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.bubbleRow, isMe ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!!item.attachmentUrl && (
            <Text style={[styles.attachment, isMe ? styles.meText : styles.otherText]}>
              📎 {item.attachmentUrl}
            </Text>
          )}
          {!!item.content && (
            <Text style={[styles.msgText, isMe ? styles.meText : styles.otherText]}>
              {item.content}
            </Text>
          )}
          <Text style={[styles.time, isMe ? styles.meTime : styles.otherTime]}>
            {new Date(item.createdAt).toLocaleTimeString().slice(0, 5)}
          </Text>
        </View>
      </View>
    );
  }, [currentUserId]);

  if (loading) {
    return <ScreenStates loading />;
  }

  if (loadError && messages.length === 0) {
    return <ScreenStates error={loadError} onRetry={load} />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {composeError ? <Text style={styles.errorBanner}>{composeError}</Text> : null}
      <FlatList
        ref={(r) => {
          listRef.current = r;
        }}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.composer}>
        <TouchableOpacity onPress={pickAndSendFile} style={styles.attachBtn}>
          <Text style={styles.attachText}>📎</Text>
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Xabar yozing..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={sendText} disabled={sending || !text.trim()} style={[styles.sendBtn, (sending || !text.trim()) ? styles.sendDisabled : null]}>
          <Text style={styles.sendText}>{sending ? '...' : 'Yuborish'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  helper: { marginTop: 10, color: Colors.textSecondary, fontSize: 13 },
  errorBanner: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: '700' },

  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  msgText: { fontSize: 14, lineHeight: 20 },
  meText: { color: '#fff' },
  otherText: { color: Colors.text },
  attachment: { fontSize: 12, marginBottom: 6 },
  time: { marginTop: 6, fontSize: 10 },
  meTime: { color: 'rgba(255,255,255,0.75)' },
  otherTime: { color: Colors.textMuted },

  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  attachText: { fontSize: 18 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: Colors.background, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  sendBtn: { marginLeft: 8, height: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

