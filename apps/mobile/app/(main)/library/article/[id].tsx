import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchArticleById } from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import { htmlToPlainText } from '~/lib/htmlToPlainText';
import type { ArticleRow } from '~/types/dailyHub';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Noto‘g‘ri maqola');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const a = await fetchArticleById(id);
      setArticle(a);
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

  if (error || !article) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-4" edges={['top', 'bottom']}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <Text className="text-red-800">{error ?? 'Maqola topilmadi'}</Text>
      </SafeAreaView>
    );
  }

  const body = htmlToPlainText(article.content);

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2 border-b border-calm-200">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-semibold text-calm-900 mb-2">{article.title}</Text>
        {article.category ? <Text className="text-accent text-sm mb-4">{article.category}</Text> : null}
        <Text className="text-calm-800 text-base leading-7">{body}</Text>
        <View className="rounded-2xl bg-calm-100/80 p-4 mt-6">
          <Text className="text-calm-600 text-sm leading-5">
            Bu maqola umumiy ma’lumot xarakterida; u tibbiy tashxis yoki professional maslahat o‘rnini bosmaydi.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
