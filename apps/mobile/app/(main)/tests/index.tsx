import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TestCard } from '~/components/tests/TestCard';
import { fetchPublishedTests } from '~/lib/assessmentsApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { TestListItem } from '~/types/assessments';

export default function TestsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchPublishedTests();
      setItems(res.data ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
        <Text className="text-calm-500 mt-3">Testlar yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-4 justify-center" edges={['bottom']}>
        <Text className="text-calm-900 text-lg font-semibold mb-2">Yuklashda xatolik</Text>
        <Text className="text-calm-600 mb-6 leading-6">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            void load();
          }}
          className="rounded-2xl bg-accent py-3.5 items-center"
        >
          <Text className="text-white font-semibold">Qayta urinish</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor="#5b7c6a"
          />
        }
      >
        <Text className="text-calm-600 leading-6 mb-4">
          O‘zingizni yaxshiroq tushunish uchun testlardan foydalaning — natijalar umumiy yo‘l-yo‘riq uchun mo‘ljallangan.
        </Text>
        {items.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-calm-300 p-8 items-center">
            <Text className="text-calm-600 text-center leading-6">
              Hozircha chop etilgan testlar yo‘q. Keyinroq qayta tekshiring.
            </Text>
          </View>
        ) : (
          items.map((t) => (
            <TestCard key={t.id} test={t} onPress={() => router.push(`/(main)/tests/${t.id}`)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
