import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchAnnouncementById } from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import { htmlToPlainText } from '~/lib/htmlToPlainText';
import type { AnnouncementRow } from '~/types/dailyHub';

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const [row, setRow] = useState<AnnouncementRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Noto‘g‘ri e‘lon');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const found = await fetchAnnouncementById(id);
      setRow(found);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['top', 'bottom']}>
        <ActivityIndicator color="#5b7c6a" />
      </SafeAreaView>
    );
  }

  if (error || !row) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-4" edges={['top', 'bottom']}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <Text className="text-red-800">{error ?? 'E‘lon topilmadi'}</Text>
      </SafeAreaView>
    );
  }

  const body = htmlToPlainText(row.content);

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2 border-b border-calm-200">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-semibold text-calm-900 mb-2">{row.title}</Text>
        <Text className="text-calm-500 text-xs mb-4">{new Date(row.createdAt).toLocaleString()}</Text>
        <Text className="text-calm-800 text-base leading-7">{body}</Text>
        <View className="rounded-2xl bg-calm-100/80 p-4 mt-6">
          <Text className="text-calm-600 text-sm leading-5">
            Bu e‘lon umumiy xabar sifatida taqdim etiladi; rasmiy tibbiy xulosa emas.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
