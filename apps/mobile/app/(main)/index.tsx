import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import {
  fetchAnnouncements,
  fetchArticles,
  fetchMobileDashboardStats,
  fetchNotifications,
} from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import { htmlToPlainText } from '~/lib/htmlToPlainText';
import { useAuthStore } from '~/store/authStore';
import type { AnnouncementRow, ArticleRow } from '~/types/dailyHub';

function shortPreview(html: string, max = 100) {
  const t = htmlToPlainText(html).replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function HomeTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [testsDone, setTestsDone] = useState<number | null>(null);

  const [unread, setUnread] = useState<number | null>(null);
  const [highlightAnn, setHighlightAnn] = useState<AnnouncementRow | null>(null);
  const [highlightArt, setHighlightArt] = useState<ArticleRow | null>(null);
  const [extrasError, setExtrasError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatsError(null);
    setExtrasError(null);
    setStatsLoading(true);
    try {
      const s = await fetchMobileDashboardStats();
      setStreak(s.days ?? 0);
      setTestsDone(s.testsCompleted ?? 0);
    } catch (e) {
      setStatsError(getApiErrorMessage(e));
      setStreak(null);
      setTestsDone(null);
    } finally {
      setStatsLoading(false);
    }

    try {
      const [notif, ann, art] = await Promise.all([
        fetchNotifications({ limit: 50, page: 1 }),
        fetchAnnouncements({ limit: 5, page: 1 }),
        fetchArticles({ limit: 5, page: 1 }),
      ]);
      const list = notif.data ?? [];
      setUnread(list.filter((n) => !n.isRead).length);
      setHighlightAnn(ann.data?.[0] ?? null);
      setHighlightArt(art.data?.[0] ?? null);
    } catch (e) {
      setExtrasError(getApiErrorMessage(e));
      setUnread(null);
      setHighlightAnn(null);
      setHighlightArt(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-2xl font-semibold text-calm-900 mb-1">Salom, {name}</Text>
        <Text className="text-calm-600 text-base leading-6 mb-4">
          Bugun o‘zingizga bir necha daqiqa ajrating — kichik qadamlar katta o‘zgarishlar keltiradi.
        </Text>

        <CrisisResourcesStrip />

        <View className="rounded-3xl bg-white p-5 border border-calm-200 mb-4">
          <Text className="text-calm-800 font-medium mb-3">Tez kirish</Text>
          <Pressable onPress={() => router.push('/(main)/tests')} className="py-2.5 border-b border-calm-100">
            <Text className="text-accent font-medium">Psixologik testlar</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/support')} className="py-2.5 border-b border-calm-100">
            <Text className="text-accent font-medium">Yordam va qo‘llab-quvvatlash</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/psychologists')} className="py-2.5 border-b border-calm-100">
            <Text className="text-accent font-medium">Mutaxassislar</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/psychologists/bookings')} className="py-2.5 border-b border-calm-100">
            <Text className="text-calm-700">Mening bronlarim</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/notifications')} className="py-2.5 border-b border-calm-100">
            <Text className="text-accent font-medium">
              Bildirishnomalar
              {unread != null && unread > 0 ? (
                <Text className="text-calm-600 font-normal">{` (${unread} o‘qilmagan)`}</Text>
              ) : null}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/wellness')} className="py-2.5 border-b border-calm-100">
            <Text className="text-accent font-medium">Ruhiy farovonlik</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/library')} className="py-2.5">
            <Text className="text-accent font-medium">{"Maqolalar va e'lonlar"}</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl bg-white p-5 border border-calm-200 mb-4">
          <Text className="text-calm-800 font-medium mb-2">Bugungi ko‘rinish</Text>
          {statsLoading ? (
            <ActivityIndicator color="#5b7c6a" />
          ) : statsError ? (
            <Text className="text-calm-600 text-sm">{statsError}</Text>
          ) : (
            <>
              <Text className="text-calm-700 text-sm leading-6">
                Faollik ketma-ketligi: <Text className="font-semibold text-calm-900">{streak ?? '—'}</Text> kun
              </Text>
              <Text className="text-calm-700 text-sm leading-6 mt-1">
                Tugatilgan testlar: <Text className="font-semibold text-calm-900">{testsDone ?? '—'}</Text>
              </Text>
            </>
          )}
        </View>

        <View className="rounded-3xl bg-white p-5 border border-calm-200 mb-4">
          <Text className="text-calm-800 font-medium mb-2">Yangiliklar</Text>
          {extrasError ? (
            <Text className="text-calm-600 text-sm">{extrasError}</Text>
          ) : (
            <>
              {highlightAnn ? (
                <Pressable
                  onPress={() => router.push(`/(main)/library/announcement/${highlightAnn.id}`)}
                  className="mb-3 pb-3 border-b border-calm-100"
                >
                  <Text className="text-calm-500 text-xs mb-1">{"E'lon"}</Text>
                  <Text className="text-calm-900 font-medium mb-1">{highlightAnn.title}</Text>
                  <Text className="text-calm-600 text-sm">{shortPreview(highlightAnn.content, 90)}</Text>
                </Pressable>
              ) : null}
              {highlightArt ? (
                <Pressable onPress={() => router.push(`/(main)/library/article/${highlightArt.id}`)}>
                  <Text className="text-calm-500 text-xs mb-1">Maqola</Text>
                  <Text className="text-calm-900 font-medium mb-1">{highlightArt.title}</Text>
                  <Text className="text-calm-600 text-sm">
                    {highlightArt.excerpt ? shortPreview(highlightArt.excerpt, 90) : shortPreview(highlightArt.content, 90)}
                  </Text>
                </Pressable>
              ) : null}
              {!highlightAnn && !highlightArt ? (
                <Text className="text-calm-600 text-sm">{"Hozircha yangi maqola yoki e'lon yo'q."}</Text>
              ) : null}
              <Pressable onPress={() => router.push('/(main)/library')} className="mt-3 pt-2">
                <Text className="text-accent font-medium text-sm">Barchasini ko‘rish →</Text>
              </Pressable>
            </>
          )}
        </View>

        <View className="rounded-3xl border border-calm-200 bg-calm-50/80 p-4 mb-2">
          <Text className="text-calm-800 font-medium mb-2">Huquq va maxfiylik</Text>
          <Pressable onPress={() => router.push('/(settings)/compliance')}>
            <Text className="text-accent font-medium text-sm">Maxfiylik va moslik →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
