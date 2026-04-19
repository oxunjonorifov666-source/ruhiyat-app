import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchTest } from '~/lib/assessmentsApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { TestListItem } from '~/types/assessments';

export default function TestDetailScreen() {
  const { testId: idParam } = useLocalSearchParams<{ testId: string }>();
  const testId = Number(idParam);
  const router = useRouter();
  const navigation = useNavigation();
  const [test, setTest] = useState<TestListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(testId)) {
      setError('Noto‘g‘ri test');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const t = await fetchTest(testId);
      setTest(t);
      navigation.setOptions({ title: t.title });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [navigation, testId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
      </SafeAreaView>
    );
  }

  if (error || !test) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-4 justify-center" edges={['bottom']}>
        <Text className="text-calm-900 font-semibold mb-2">Test topilmadi</Text>
        <Text className="text-calm-600 mb-4 leading-6">{error ?? 'Ma’lumot yo‘q'}</Text>
        <PrimaryButton title="Qayta urinish" onPress={() => { setLoading(true); void load(); }} />
      </SafeAreaView>
    );
  }

  const qCount = test._count?.questions ?? null;

  return (
    <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-2" edges={['bottom']}>
      {test.category ? (
        <Text className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">{test.category}</Text>
      ) : null}
      {test.description ? <Text className="text-calm-700 leading-7 mb-6">{test.description}</Text> : null}
      <View className="rounded-2xl bg-white border border-calm-200 p-4 mb-8">
        <Text className="text-calm-600 text-sm">
          {qCount != null ? `${qCount} ta savol` : 'Savollar keyingi qadamda ochiladi'}
          {test.duration != null && test.duration > 0 ? ` · taxminan ${test.duration} daqiqa` : ''}
        </Text>
      </View>
      <PrimaryButton title="Testni boshlash" onPress={() => router.push(`/(main)/tests/${testId}/take`)} />
    </SafeAreaView>
  );
}
