import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { wellnessService } from '../../services/wellness';
import { profileMobileService } from '../../services/profileMobile';

type Ev = { date: string; label: string; kind: string };

export function CalendarScreen() {
  const moodQ = useQuery({ queryKey: ['mood-entries'], queryFn: () => wellnessService.getMoodEntries() });
  const diaryQ = useQuery({ queryKey: ['diary'], queryFn: () => wellnessService.getDiaryEntries() });
  const bookQ = useQuery({ queryKey: ['bookings-cal'], queryFn: () => profileMobileService.getMyBookings({ limit: 50 }) });

  const events = useMemo(() => {
    const list: Ev[] = [];
    (moodQ.data || []).forEach((m) => {
      list.push({ date: m.createdAt.slice(0, 10), label: `Kayfiyat: ${m.mood}`, kind: 'mood' });
    });
    (diaryQ.data || []).forEach((d) => {
      list.push({ date: d.createdAt.slice(0, 10), label: `Kundalik`, kind: 'diary' });
    });
    (bookQ.data?.data || []).forEach((b) => {
      list.push({
        date: b.scheduledAt.slice(0, 10),
        label: `Seans: ${b.psychologist.firstName} ${b.psychologist.lastName} (${b.status})`,
        kind: 'booking',
      });
    });
    list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return list;
  }, [moodQ.data, diaryQ.data, bookQ.data]);

  const loading = moodQ.isLoading || diaryQ.isLoading || bookQ.isLoading;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Kalendar</Text>
      <Text style={styles.sub}>Kayfiyat, kundalik va uchrashuvlar (baza)</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>Hozircha yozuvlar yo‘q</Text>
      ) : (
        events.map((e, i) => (
          <View key={`${e.kind}-${e.date}-${i}`} style={styles.row}>
            <Text style={styles.date}>{e.date}</Text>
            <Text style={styles.kind}>
              {e.kind === 'mood' ? '😊' : e.kind === 'diary' ? '📔' : '📅'} {e.label}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  date: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  kind: { fontSize: 15, color: Colors.text, marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
