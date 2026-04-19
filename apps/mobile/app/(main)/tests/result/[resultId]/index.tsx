import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { AiSafetyDisclaimer } from '~/components/AiSafetyDisclaimer';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import { MedicalDisclaimerBanner } from '~/components/MedicalDisclaimerBanner';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchTestResult } from '~/lib/assessmentsApi';
import { interpretationMayNeedCrisisUi, textMightIndicateCrisis } from '~/lib/crisisHeuristic';
import { getApiErrorMessage } from '~/lib/errors';
import { parseInterpretation } from '~/lib/interpretation';
import type { TestResultDetail } from '~/types/assessments';
import { useAuthStore } from '~/store/authStore';
import { usePremiumEntitlementStore } from '~/store/premiumEntitlementStore';

export default function TestResultScreen() {
  const { resultId: rid } = useLocalSearchParams<{ resultId: string }>();
  const resultId = Number(rid);
  const router = useRouter();
  const navigation = useNavigation();
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.user?.role);
  const fetchEntitlements = usePremiumEntitlementStore((s) => s.fetchEntitlements);
  const premiumEnt = usePremiumEntitlementStore((s) => s.entitlements);

  useFocusEffect(
    useCallback(() => {
      void fetchEntitlements(true);
    }, [fetchEntitlements]),
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<TestResultDetail | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(resultId)) {
      setErr('Noto‘g‘ri natija');
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const r = await fetchTestResult(resultId);
      setSnapshot(r);
      navigation.setOptions({ title: r.test?.title ?? 'Natija' });
    } catch (e) {
      setErr(getApiErrorMessage(e));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [navigation, resultId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parsed = useMemo(() => parseInterpretation(snapshot?.interpretation ?? null), [snapshot?.interpretation]);

  const crisis = useMemo(() => {
    if (!snapshot?.interpretation) return false;
    if (parsed) {
      const blob = [parsed.summary, ...parsed.attention, ...parsed.strengths].join('\n');
      return interpretationMayNeedCrisisUi([blob]);
    }
    return textMightIndicateCrisis(snapshot.interpretation);
  }, [parsed, snapshot?.interpretation]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
      </SafeAreaView>
    );
  }

  if (err || !snapshot) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 justify-center" edges={['bottom']}>
        <Text className="text-calm-900 font-semibold mb-2">Natija yuklanmadi</Text>
        <Text className="text-calm-600 mb-4">{err}</Text>
        <PrimaryButton
          title="Qayta urinish"
          onPress={() => {
            setLoading(true);
            void load();
          }}
        />
      </SafeAreaView>
    );
  }

  const score = snapshot.score;
  const max = snapshot.maxScore;
  const pct =
    score != null && max != null && max > 0 ? Math.round((score / max) * 100) : parsed?.scorePercent ?? null;

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 36 }}>
        <Text className="text-calm-500 text-sm mb-1">
          {snapshot.test?.title}
          {snapshot.completedAt ? ` · ${new Date(snapshot.completedAt).toLocaleString()}` : ''}
        </Text>

        <View className="rounded-3xl bg-white border border-calm-200 p-6 mb-4">
          <Text className="text-calm-600 text-sm mb-1">Umumiy natija</Text>
          <Text className="text-3xl font-semibold text-calm-900 mb-1">
            {score != null && max != null ? `${score} / ${max}` : '—'}
          </Text>
          {pct != null ? <Text className="text-accent text-lg font-medium">{pct}%</Text> : null}
        </View>

        <MedicalDisclaimerBanner />
        <AiSafetyDisclaimer />

        <CrisisResourcesStrip emphasize={crisis} />

        <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
          <Text className="text-xs font-semibold text-calm-500 uppercase tracking-wide mb-2">Qisqa xulosa</Text>
          <Text className="text-calm-900 text-lg font-semibold leading-7 mb-3">
            {parsed?.headline ?? `${snapshot.test?.title ?? 'Test'} yakunlandi`}
          </Text>
          <Text className="text-calm-700 leading-6">
            {parsed?.summary
              ? parsed.summary
              : 'Natija server tomonidan shakllantirilgan. Batafsil tushuntirish keyingi sahifada — u umumiy yo‘l-yo‘riq sifatida tavsiya etiladi.'}
          </Text>
        </View>

        <PrimaryButton
          title="To‘liq tushuntirish"
          onPress={() => router.push(`/(main)/tests/result/${resultId}/interpretation`)}
          variant="ghost"
        />
        <View className="h-3" />
        <PrimaryButton title="Hissiy yordam" onPress={() => router.push(`/(main)/tests/result/${resultId}/support`)} />
        {hydrated && role === 'MOBILE_USER' && premiumEnt && !premiumEnt.isPremium ? (
          <Pressable onPress={() => router.push('/(settings)/premium')} className="py-3">
            <Text className="text-calm-600 text-center text-sm leading-5">
              Test tarixini chuqur saqlash va tahlillar:{' '}
              <Text className="text-accent font-semibold">Ruhiyat Premium</Text> (ixtiyoriy)
            </Text>
          </Pressable>
        ) : null}
        <View className="h-6" />
        <Pressable onPress={() => router.push('/(main)/psychologists')} className="py-2 px-1">
          <Text className="text-calm-600 text-center text-sm leading-6">
            Insoniy yordamni davom ettirish uchun istasangiz:{' '}
            <Text className="text-accent font-semibold">Mutaxassis bilan gaplashish</Text>
          </Text>
          <Text className="text-calm-500 text-xs text-center mt-1">Tashxis emas — suhbat va qo‘llab-quvvatlash uchun</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
