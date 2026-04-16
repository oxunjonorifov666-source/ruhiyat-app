import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { Colors } from '../../constants/colors';
import { videochatService, type VideoSession } from '../../services/videochat';
import { ScreenStates } from '../../components/ScreenStates';

export function VideochatScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      /** Barcha rejalashtirilgan / jarayondagi / yaqin seanslar (status filtri juda tor bo‘lib qolmasin) */
      const res = await videochatService.listSessions({
        page: 1,
        limit: 40,
        status: 'SCHEDULED,IN_PROGRESS',
      });
      setSessions(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Seanslarni yuklab bo‘lmadi');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const renderItem = ({ item }: { item: VideoSession }) => {
    const scheduled = new Date(item.scheduledAt);
    const time = `${scheduled.toLocaleDateString('uz-UZ')} • ${scheduled.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
    const canJoin = item.status === 'IN_PROGRESS' || scheduled.getTime() <= Date.now() + 15 * 60 * 1000;

    return (
      <TouchableOpacity
        style={[styles.card, !canJoin && styles.cardDisabled]}
        onPress={() => canJoin && navigation.navigate('VideochatRoom', { sessionId: item.id })}
        disabled={!canJoin}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{time}</Text>
          <Text style={styles.badge}>{item.status}</Text>
        </View>
        <Text style={[styles.join, !canJoin && { opacity: 0.4 }]}>{canJoin ? 'Kirish' : 'Kutilmoqda'}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Videochat</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScreenStates loading />
      </SafeAreaView>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Videochat</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScreenStates error={error} onRetry={fetchSessions} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videochat</Text>
        <TouchableOpacity onPress={fetchSessions} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <ScreenStates empty emptyMessage="Hozircha rejalashtirilgan seanslar yo‘q" onRetry={fetchSessions} />
      ) : (
        <ScreenStates>
          <FlatList
            data={sessions}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          />
        </ScreenStates>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.text, fontSize: 28, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  meta: { marginTop: 10, color: Colors.textSecondary, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardDisabled: { opacity: 0.7 },
  title: { color: Colors.text, fontSize: 15, fontWeight: '800' },
  badge: { marginTop: 8, alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: Colors.primary },
  join: { color: Colors.primary, fontWeight: '900' },
});
