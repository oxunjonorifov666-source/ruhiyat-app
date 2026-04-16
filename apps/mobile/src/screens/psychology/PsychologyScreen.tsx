import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { mobilePublicService, MobilePsychologist } from '../../services/mobilePublic';
import { chatService } from '../../services/chat';
import { ScreenStates } from '../../components/ScreenStates';

const specializations = ['Barchasi', 'Oila', 'Yoshlar', 'Stress', 'Munosabat', 'Kasbiy'];

export function PsychologyScreen({ navigation }: any) {
  const openPsychChat = async (p: MobilePsychologist) => {
    const uid = p.userId;
    if (!uid) {
      Alert.alert('Chat', 'Psixolog akkaunti topilmadi.');
      return;
    }
    try {
      const chat = await chatService.createDirectChat(uid);
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        title: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Psixolog',
      });
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Chat ochilmadi');
    }
  };

  const [psychologists, setPsychologists] = useState<MobilePsychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState('Barchasi');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await mobilePublicService.listPsychologists({ page: 1, limit: 50 });
      setPsychologists(res.data || []);
    } catch (e) {
      setPsychologists([]);
      setError(e instanceof Error ? e.message : 'Ro‘yxat yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = psychologists.filter((p) =>
    selectedSpec === 'Barchasi'
      ? true
      : (p.specialization || '').toLowerCase().includes(selectedSpec.toLowerCase()),
  );

  if (loading) {
    return <ScreenStates loading />;
  }
  if (error && psychologists.length === 0) {
    return <ScreenStates error={error} onRetry={load} />;
  }
  if (!filtered.length && !psychologists.length) {
    return <ScreenStates empty emptyMessage="Hozircha psixologlar yo‘q" onRetry={load} />;
  }

  return (
    <ScreenStates>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Psixologlar</Text>
          <Text style={styles.subtitle}>Mutaxassis bilan suhbatlashing</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {specializations.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, selectedSpec === s && styles.chipActive]}
              onPress={() => setSelectedSpec(s)}
            >
              <Text style={[styles.chipText, selectedSpec === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!filtered.length ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>Tanlangan filtr bo‘yicha natija yo‘q</Text>
            <TouchableOpacity onPress={() => setSelectedSpec('Barchasi')} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.primary, fontWeight: '800' }}>Filtrni tozalash</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {p.firstName?.[0]}
                      {p.lastName?.[0]}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.spec}>{p.specialization}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.star}>⭐</Text>
                      <Text style={styles.rating}>{p.rating != null ? p.rating.toFixed(1) : '—'}</Text>
                      <View style={[styles.badge, p.isAvailable ? styles.badgeGreen : styles.badgeGray]}>
                        <Text style={[styles.badgeText, { color: p.isAvailable ? Colors.success : Colors.textMuted }]}>
                          {p.isAvailable ? "● Bo'sh" : '● Band'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {p.bio && <Text style={styles.bio}>{p.bio}</Text>}
                <View style={styles.cardFooter}>
                  <Text style={styles.price}>
                    {p.sessionPrice ? `${(p.sessionPrice / 1000).toFixed(0)}K so'm / sessiya` : 'Narx kelishiladi'}
                  </Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.chatBtn} onPress={() => openPsychChat(p)}>
                      <Text style={styles.chatBtnText}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.videoBtn} onPress={() => navigation.navigate('Videochat')}>
                      <Text style={styles.videoBtnText}>📹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bookBtn, !p.isAvailable && styles.bookBtnDisabled]}
                      disabled={!p.isAvailable}
                      onPress={() =>
                        navigation.navigate('BookPsychologist', {
                          psychologistId: p.id,
                          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
                        })
                      }
                    >
                      <Text style={styles.bookText}>{p.isAvailable ? 'Band qilish' : 'Band'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  chips: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  cardInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.text },
  spec: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  star: { fontSize: 14 },
  rating: { fontSize: 13, fontWeight: '700', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeGray: { backgroundColor: Colors.border },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bio: { fontSize: 13, color: Colors.textSecondary, marginTop: 10, lineHeight: 18 },
  cardFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 13, fontWeight: '700', color: Colors.primary, flex: 1 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { fontSize: 18 },
  videoBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtnText: { fontSize: 18 },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  bookBtnDisabled: { opacity: 0.5 },
  bookText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
