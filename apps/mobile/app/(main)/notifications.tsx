import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { fetchNotifications, markNotificationRead } from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { NotificationRow } from '~/types/dailyHub';

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchNotifications({ limit: 50, page: 1 });
      setItems(res.data ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onOpen = async (n: NotificationRow) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch {
        /* still show content */
      }
    }
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['top', 'bottom']}>
        <ActivityIndicator color="#5b7c6a" />
        <Text className="text-calm-500 mt-2">Yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2 border-b border-calm-200">
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-calm-900">Bildirishnomalar</Text>
        <View style={{ width: 64 }} />
      </View>
      {error ? (
        <View className="px-5 py-4">
          <Text className="text-red-800 mb-2">{error}</Text>
          <Pressable onPress={() => { setLoading(true); void load(); }}>
            <Text className="text-accent font-semibold">Qayta urinish</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor="#5b7c6a" />
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text className="text-calm-600 text-center leading-6">Hozircha bildirishnoma yo‘q.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void onOpen(item)}
            className={`rounded-2xl border p-4 mb-3 ${item.isRead ? 'bg-white border-calm-200' : 'bg-accent/5 border-accent/30'}`}
          >
            <Text className="text-calm-900 font-semibold mb-1">{item.title}</Text>
            {item.body ? <Text className="text-calm-700 leading-5">{item.body}</Text> : null}
            <Text className="text-calm-400 text-xs mt-2">{new Date(item.createdAt).toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
