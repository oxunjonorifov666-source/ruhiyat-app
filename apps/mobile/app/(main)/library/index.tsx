import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { fetchAnnouncements, fetchArticles } from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import { htmlToPlainText } from '~/lib/htmlToPlainText';
import type { AnnouncementRow, ArticleRow } from '~/types/dailyHub';

function preview(text: string, max = 140) {
  const t = htmlToPlainText(text).replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function LibraryIndexScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [a, b] = await Promise.all([
        fetchAnnouncements({ limit: 30, page: 1 }),
        fetchArticles({ limit: 30, page: 1 }),
      ]);
      setAnnouncements(a.data ?? []);
      setArticles(b.data ?? []);
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

  if (loading && announcements.length === 0 && articles.length === 0) {
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
        <Text className="text-lg font-semibold text-calm-900">{"Maqolalar va e'lonlar"}</Text>
        <View style={{ width: 64 }} />
      </View>
      {error ? (
        <View className="px-5 py-3">
          <Text className="text-red-800 mb-2">{error}</Text>
          <Pressable onPress={() => { setLoading(true); void load(); }}>
            <Text className="text-accent font-semibold">Qayta urinish</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor="#5b7c6a" />
        }
      >
        <Text className="text-calm-900 font-semibold text-base mb-2">{"E'lonlar"}</Text>
        {announcements.length === 0 ? (
          <Text className="text-calm-600 text-sm mb-6">{"Hozircha e'lon yo'q."}</Text>
        ) : (
          announcements.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/(main)/library/announcement/${item.id}`)}
              className="rounded-2xl border border-calm-200 bg-white p-4 mb-3"
            >
              <Text className="text-calm-900 font-semibold mb-1">{item.title}</Text>
              <Text className="text-calm-600 text-sm leading-5">{preview(item.content)}</Text>
              <Text className="text-calm-400 text-xs mt-2">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </Pressable>
          ))
        )}

        <Text className="text-calm-900 font-semibold text-base mb-2 mt-2">Maqolalar</Text>
        {articles.length === 0 ? (
          <Text className="text-calm-600 text-sm">{"Hozircha maqola yo'q."}</Text>
        ) : (
          articles.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/(main)/library/article/${item.id}`)}
              className="rounded-2xl border border-calm-200 bg-white p-4 mb-3"
            >
              <Text className="text-calm-900 font-semibold mb-1">{item.title}</Text>
              <Text className="text-calm-600 text-sm leading-5">
                {item.excerpt ? preview(item.excerpt) : preview(item.content)}
              </Text>
              {item.category ? (
                <Text className="text-accent text-xs mt-2">{item.category}</Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
