import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { notificationsService, AppNotification } from '../../services/notifications';
import { ScreenStates } from '../../components/ScreenStates';

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Hozirgina";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} daqiqa oldin`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} kun oldin`;
    return d.toLocaleDateString('uz-UZ');
  } catch {
    return '';
  }
}

export function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await notificationsService.list({ limit: 50 });
      setItems(res?.data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Yuklashda xatolik";
      setLoadError(msg);
      setItems([]);
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

  const onRead = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await notificationsService.markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    } catch {
      /* ignore */
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenStates error={loadError} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirishnomalar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
            <Text style={styles.readAll}>Sozlash</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => load()}>
            <Text style={styles.readAll}>Yangilash</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.unreadCard]}
            onPress={() => onRead(item)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                {!item.isRead && <View style={styles.dot} />}
                <Text style={[styles.cardTitle, !item.isRead && { fontWeight: '800' }]}>{item.title}</Text>
              </View>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
            <Text style={styles.emptyText}>Hozircha bildirishnomalar yo'q</Text>
            <Text style={styles.emptyHint}>Superadmin yuborgan xabarlar shu yerda ko'rinadi.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 32, color: Colors.text, bottom: 2 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  readAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#f8fafc',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadCard: {
    backgroundColor: Colors.primaryLight + '50',
    borderColor: Colors.primaryLight,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 8 },
  cardTitle: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  time: { fontSize: 11, color: Colors.textMuted },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: Colors.textMuted, fontSize: 15 },
  emptyHint: { marginTop: 8, color: Colors.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
