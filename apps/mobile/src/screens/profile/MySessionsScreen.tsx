import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { profileMobileService, BookingRow } from '../../services/profileMobile';
import { ScreenStates } from '../../components/ScreenStates';
import { useAppPalette } from '../../theme/useAppPalette';
import { addPsychologySessionToCalendar } from '../../lib/deviceCalendar';

const PREP_ITEMS = [
  'Jimgina joy va barqaror internet',
  'Kulaklik / mikrofon tekshirildi',
  'Seans maqsadini qisqa yozib oldim',
];

export function MySessionsScreen({ navigation }: any) {
  const C = useAppPalette();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [prepFor, setPrepFor] = useState<BookingRow | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<BookingRow | null>(null);
  const [calBusy, setCalBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await profileMobileService.getMyBookings({ limit: 50 });
      setRows(res?.data || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : 'Yuklab bo‘lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const statusUz = (s: string) => {
    const m: Record<string, string> = {
      PENDING: 'Kutilmoqda',
      ACCEPTED: 'Tasdiqlandi',
      COMPLETED: 'Yakunlangan',
      CANCELLED: 'Bekor qilindi',
      REJECTED: 'Rad etildi',
    };
    return m[s] || s;
  };

  const openPrep = (item: BookingRow) => {
    setPrepFor(item);
    setPrepOpen(true);
  };

  const addToCalendar = async (item: BookingRow) => {
    setCalBusy(item.id);
    try {
      const start = new Date(item.scheduledAt);
      const end = new Date(start.getTime() + (item.duration || 50) * 60 * 1000);
      const title = `Ruhiyat: ${item.psychologist.firstName ?? ''} ${item.psychologist.lastName ?? ''}`.trim();
      await addPsychologySessionToCalendar({
        title,
        start,
        end,
        notes: item.psychologist.specialization || undefined,
      });
      Alert.alert('Kalendar', 'Tadbir qo‘shildi yoki yangilandi.');
    } catch (e) {
      Alert.alert('Kalendar', e instanceof Error ? e.message : 'Qo‘shib bo‘lmadi');
    } finally {
      setCalBusy(null);
    }
  };

  const submitFeedback = (score: number) => {
    if (!feedbackFor) return;
    setFeedbackOpen(false);
    Alert.alert('Rahmat', `Sizning bahoyingiz: ${score}/10. Bu ma’lumot faqat sizning qurilmangizda qoldi.`);
    setFeedbackFor(null);
  };

  if (loading && !refreshing) {
    return <ScreenStates loading />;
  }

  if (error && rows.length === 0) {
    return <ScreenStates error={error} onRetry={load} />;
  }

  return (
    <ScreenStates>
      <FlatList
        contentContainerStyle={[styles.list, rows.length === 0 && { flexGrow: 1 }, { backgroundColor: C.background }]}
        data={rows}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <ScreenStates empty emptyMessage="Hozircha band qilingan seanslar yo‘q. Psixologlar ro‘yxatidan band qiling." onRetry={load} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.name, { color: C.text }]}>
              {item.psychologist.firstName} {item.psychologist.lastName}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary }]}>{item.psychologist.specialization}</Text>
            <Text style={[styles.date, { color: C.textMuted }]}>
              {new Date(item.scheduledAt).toLocaleString('uz-UZ')} · {item.duration} daq.
            </Text>
            <View style={styles.row}>
              <Text style={[styles.badge, { color: C.primary }]}>{statusUz(item.status)}</Text>
              <Text style={[styles.price, { color: C.text }]}>{item.price?.toLocaleString?.() || 0} so‘m</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.miniBtn, { borderColor: C.border, backgroundColor: C.background }]}
                onPress={() => openPrep(item)}
                activeOpacity={0.88}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={C.primary} />
                <Text style={[styles.miniBtnText, { color: C.primary }]}>Tayyorlanish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniBtn, { borderColor: C.border, backgroundColor: C.background }]}
                onPress={() => addToCalendar(item)}
                disabled={calBusy === item.id}
                activeOpacity={0.88}
              >
                {calBusy === item.id ? (
                  <ActivityIndicator color={C.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="calendar-plus" size={18} color={C.primary} />
                    <Text style={[styles.miniBtnText, { color: C.primary }]}>Kalendar</Text>
                  </>
                )}
              </TouchableOpacity>
              {item.status === 'COMPLETED' ? (
                <TouchableOpacity
                  style={[styles.miniBtn, { borderColor: C.border, backgroundColor: C.background }]}
                  onPress={() => {
                    setFeedbackFor(item);
                    setFeedbackOpen(true);
                  }}
                  activeOpacity={0.88}
                >
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color={C.primary} />
                  <Text style={[styles.miniBtnText, { color: C.primary }]}>Baholash</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />

      <Modal visible={prepOpen} animationType="slide" transparent onRequestClose={() => setPrepOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Seans oldi tekshiruv</Text>
            {prepFor ? (
              <Text style={[styles.modalSub, { color: C.text, fontWeight: '700', marginBottom: 6 }]}>
                {prepFor.psychologist.firstName} {prepFor.psychologist.lastName}
              </Text>
            ) : null}
            <Text style={[styles.modalSub, { color: C.textSecondary }]}>
              Video suhbatdan oldin quyidagilarni eslab chiqing:
            </Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {PREP_ITEMS.map((t, i) => (
                <View key={i} style={styles.prepRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={22} color={C.primary} />
                  <Text style={[styles.prepText, { color: C.text }]}>{t}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalOk, { backgroundColor: C.primary }]} onPress={() => setPrepOpen(false)}>
              <Text style={styles.modalOkText}>Tushunarli</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={feedbackOpen} animationType="fade" transparent onRequestClose={() => setFeedbackOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Seansdan keyin</Text>
            <Text style={[styles.modalSub, { color: C.textSecondary }]}>O‘zingizni qanday his qildingiz? (1–10)</Text>
            <View style={styles.scoreGrid}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.scoreCell, { borderColor: C.border, backgroundColor: C.background }]}
                  onPress={() => submitFeedback(n)}
                >
                  <Text style={[styles.scoreNum, { color: C.text }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => { setFeedbackOpen(false); setFeedbackFor(null); }}>
              <Text style={{ color: C.textMuted, textAlign: 'center', marginTop: 8 }}>Bekor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  name: { fontSize: 17, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 2 },
  date: { fontSize: 13, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  badge: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  miniBtnText: { fontSize: 12, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { borderRadius: 20, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub: { fontSize: 13, marginBottom: 12, lineHeight: 19 },
  prepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  prepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  modalOk: { marginTop: 8, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalOkText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  scoreCell: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 16, fontWeight: '800' },
});
