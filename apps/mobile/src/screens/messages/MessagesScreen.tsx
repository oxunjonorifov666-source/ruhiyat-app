import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  chatService,
  type Chat,
  type ChatContact,
  getUserDisplayName,
} from '../../services/chat';
import { useNavigation } from '@react-navigation/native';
import { ScreenStates } from '../../components/ScreenStates';
import { useAppPalette } from '../../theme/useAppPalette';

export function MessagesScreen() {
  const C = useAppPalette();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const currentUserId = user?.id;

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQ, setSearchQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const [emailExact, setEmailExact] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setContacts([]);
      setContactError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setContactLoading(true);
      setContactError(null);
      try {
        const rows = await chatService.searchContacts(debouncedQ);
        if (!cancelled) setContacts(rows || []);
      } catch (e: any) {
        if (!cancelled) {
          setContacts([]);
          setContactError(e?.message || 'Qidiruvda xatolik');
        }
      } finally {
        if (!cancelled) setContactLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const getChatTitle = useCallback(
    (chat: Chat) => {
      if (chat.title) return chat.title;
      const other = chat.participants.find((p) => p.userId !== currentUserId);
      return getUserDisplayName(other?.user);
    },
    [currentUserId],
  );

  const getLastMessageText = useCallback((chat: Chat) => {
    const lm = chat.lastMessage;
    if (!lm) return "Hali xabar yo'q";
    if (lm.attachmentUrl && !lm.content) return '📎 Fayl';
    if (lm.attachmentUrl) return `📎 ${lm.content || 'Fayl'}`;
    return lm.content || '';
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await chatService.listMyChats({ limit: 50 });
      setChats(res.data);
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openDirectChat = async (otherUserId: number, titleHint: string) => {
    setOpeningId(otherUserId);
    try {
      const chat = await chatService.createDirectChat(otherUserId);
      await load();
      navigation.navigate('ChatRoom', { chatId: chat.id, title: titleHint });
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Chat ochilmadi');
    } finally {
      setOpeningId(null);
    }
  };

  const openByEmail = async () => {
    const em = emailExact.trim();
    if (!em.includes('@')) {
      Alert.alert('Email', 'To‘liq email manzilini kiriting');
      return;
    }
    setEmailBusy(true);
    try {
      const chat = await chatService.createDirectChatByEmail(em);
      setEmailExact('');
      await load();
      const other = chat.participants.find((p) => p.userId !== currentUserId);
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        title: getUserDisplayName(other?.user),
      });
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Topilmadi yoki chat ochilmadi');
    } finally {
      setEmailBusy(false);
    }
  };

  const openSupport = async () => {
    try {
      const chat = await chatService.ensureSupportChat();
      navigation.navigate('ChatRoom', { chatId: chat.id, title: chat.title || 'Qo‘llab-quvvatlash' });
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Chat ochilmadi');
    }
  };

  const dynamic = useMemo(
    () => ({
      container: { backgroundColor: C.background },
      title: { color: C.text },
      subtitle: { color: C.textSecondary },
      input: {
        backgroundColor: C.surface,
        borderColor: C.border,
        color: C.text,
      },
      contactRow: { backgroundColor: C.surface, borderBottomColor: C.border },
      contactName: { color: C.text },
      contactMeta: { color: C.textMuted },
      sectionLabel: { color: C.textSecondary },
    }),
    [C],
  );

  if (loading && !refreshing) {
    return <ScreenStates loading />;
  }
  if (error && chats.length === 0) {
    return <ScreenStates error={error} onRetry={load} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScreenStates>
        <ScrollView
          style={[styles.container, dynamic.container]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, dynamic.title]}>Xabarlar</Text>
            <Text style={[styles.subtitle, dynamic.subtitle]}>Suhbatdosh qidiring yoki ro‘yxatdan tanlang</Text>
            <TouchableOpacity style={[styles.supportBtn, { backgroundColor: C.primary }]} onPress={openSupport} activeOpacity={0.85}>
              <Text style={styles.supportBtnText}>Superadmin bilan chat</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, dynamic.sectionLabel]}>Email bo‘yicha chat</Text>
          <View style={styles.emailRow}>
            <TextInput
              style={[styles.emailInput, dynamic.input]}
              placeholder="masalan, dost@mail.com"
              placeholderTextColor={C.textMuted}
              value={emailExact}
              onChangeText={setEmailExact}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.emailGo, { backgroundColor: C.primary }, emailBusy && { opacity: 0.6 }]}
              onPress={openByEmail}
              disabled={emailBusy}
            >
              {emailBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.emailGoText}>Boshlash</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, dynamic.sectionLabel, { marginTop: 18 }]}>Ism, email yoki telefon bo‘yicha qidiruv</Text>
          <TextInput
            style={[styles.searchInput, dynamic.input]}
            placeholder="Kamida 2 belgi (masalan: ali yoki @gmail)"
            placeholderTextColor={C.textMuted}
            value={searchQ}
            onChangeText={setSearchQ}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {contactLoading ? (
            <View style={styles.contactLoading}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : null}
          {contactError ? <Text style={[styles.contactErr, { color: C.error }]}>{contactError}</Text> : null}
          {debouncedQ.length >= 2 && !contactLoading && contacts.length === 0 && !contactError ? (
            <Text style={[styles.emptySearch, { color: C.textMuted }]}>Natija yo‘q</Text>
          ) : null}
          {contacts.map((c) => {
            const name = getUserDisplayName(c);
            const sub = c.email || c.phone || '';
            const busy = openingId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.contactRow, dynamic.contactRow]}
                onPress={() => openDirectChat(c.id, name)}
                disabled={busy}
              >
                <View style={[styles.contactAvatar, { backgroundColor: C.primaryLight }]}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, dynamic.contactName]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.contactMeta, dynamic.contactMeta]} numberOfLines={1}>
                    {sub}
                  </Text>
                </View>
                {busy ? <ActivityIndicator color={C.primary} /> : <Text style={{ color: C.primary, fontWeight: '800' }}>→</Text>}
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.sectionLabel, dynamic.sectionLabel, { marginTop: 22 }]}>Mening chatlarim</Text>
          {chats.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.helperText, { color: C.textSecondary }]}>Hozircha suhbatlar yo‘q</Text>
              <TouchableOpacity onPress={load} style={[styles.retryBtn, { backgroundColor: C.primary }]}>
                <Text style={styles.retryText}>Yangilash</Text>
              </TouchableOpacity>
            </View>
          ) : (
            chats.map((chat) => {
              const title = getChatTitle(chat);
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={[styles.chatItem, { backgroundColor: C.surface, borderBottomColor: C.border }]}
                  onPress={() => navigation.navigate('ChatRoom', { chatId: chat.id, title })}
                >
                  <View style={[styles.avatar, { backgroundColor: C.primaryLight }]}>
                    <Text style={{ fontSize: 22 }}>{chat.type === 'GROUP' ? '👥' : '💬'}</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTop}>
                      <Text style={[styles.chatName, { color: C.text }]} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={[styles.chatTime, { color: C.textMuted }]}>
                        {chat.lastMessage?.createdAt
                          ? new Date(chat.lastMessage.createdAt).toLocaleTimeString().slice(0, 5)
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.chatBottom}>
                      <Text style={[styles.lastMsg, { color: C.textSecondary }]} numberOfLines={1}>
                        {getLastMessageText(chat)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </ScreenStates>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  supportBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  supportBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  emailGo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailGoText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginHorizontal: 4,
  },
  contactLoading: { padding: 16, alignItems: 'center' },
  contactErr: { fontSize: 13, paddingHorizontal: 8, marginBottom: 8 },
  emptySearch: { fontSize: 13, paddingHorizontal: 8, marginBottom: 8 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: { fontSize: 15, fontWeight: '700' },
  contactMeta: { fontSize: 12, marginTop: 2 },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  helperText: { marginTop: 12, fontSize: 13, textAlign: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chatItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 15, fontWeight: '700', flex: 1, paddingRight: 8 },
  chatTime: { fontSize: 11 },
  chatBottom: { flexDirection: 'row', alignItems: 'center' },
  lastMsg: { flex: 1, fontSize: 13 },
});
