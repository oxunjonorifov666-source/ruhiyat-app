import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AiSafetyDisclaimer } from '~/components/AiSafetyDisclaimer';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import { MedicalDisclaimerBanner } from '~/components/MedicalDisclaimerBanner';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchTestResult } from '~/lib/assessmentsApi';
import { interpretationMayNeedCrisisUi, textMightIndicateCrisis } from '~/lib/crisisHeuristic';
import { getApiErrorMessage } from '~/lib/errors';
import { interpretationFallbackText, parseInterpretation } from '~/lib/interpretation';
import type { TestResultDetail } from '~/types/assessments';
import { useAuthStore } from '~/store/authStore';
import { usePremiumEntitlementStore } from '~/store/premiumEntitlementStore';

function BulletList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'warn' | 'neutral' }) {
  if (!items.length) return null;
  const border =
    tone === 'good' ? 'border-emerald-200 bg-emerald-50' : tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-calm-200 bg-white';
  return (
    <View className={`rounded-2xl border p-4 mb-4 ${border}`}>
      <Text className="text-calm-900 font-semibold mb-2">{title}</Text>
      {items.map((line, i) => (
        <Text key={`${title}-${i}`} className="text-calm-800 leading-6 mb-2">
          • {line}
        </Text>
      ))}
    </View>
  );
}

export default function InterpretationScreen() {
  const { resultId: rid } = useLocalSearchParams<{ resultId: string }>();
  const resultId = Number(rid);
  const router = useRouter();
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
    } catch (e) {
      setErr(getApiErrorMessage(e));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parsed = useMemo(() => parseInterpretation(snapshot?.interpretation ?? null), [snapshot?.interpretation]);
  const plain = useMemo(() => interpretationFallbackText(snapshot?.interpretation ?? null), [snapshot?.interpretation]);

  const crisis = useMemo(() => {
    if (!snapshot?.interpretation) return false;
    if (parsed) {
      const blob = [parsed.summary, parsed.closing, ...parsed.attention, ...parsed.strengths, ...parsed.selfCare].join('\n');
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
        <Text className="text-calm-900 font-semibold mb-2">Yuklanmadi</Text>
        <Text className="text-calm-600 mb-4">{err}</Text>
        <PrimaryButton title="Qayta urinish" onPress={() => { setLoading(true); void load(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-calm-600 leading-6 mb-4">
          Quyidagi matn qo‘llab-quvvatlovchi yo‘l-yo‘riq sifatida berilgan; ruhiy holatingizning yakuniy bahosi yoki tibbiy
          xulosasi emas.
        </Text>

        <MedicalDisclaimerBanner />
        <AiSafetyDisclaimer />
        <CrisisResourcesStrip emphasize={crisis} />

        {parsed ? (
          <>
            <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
              <Text className="text-calm-900 text-xl font-semibold leading-7 mb-2">{parsed.headline}</Text>
              <Text className="text-calm-800 leading-7">{parsed.summary}</Text>
            </View>
            <BulletList title="Kuchli tomonlar" items={parsed.strengths} tone="good" />
            <BulletList title="E’tibor berish mumkin" items={parsed.attention} tone="warn" />
            <BulletList title="O‘z-o‘ziga yordam g‘oyalari" items={parsed.selfCare} tone="neutral" />
            {parsed.closing ? (
              <View className="rounded-2xl border border-calm-200 bg-calm-100/80 p-4 mb-4">
                <Text className="text-calm-800 leading-6">{parsed.closing}</Text>
              </View>
            ) : null}
          </>
        ) : plain ? (
          <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
            <Text className="text-calm-800 leading-7">{plain}</Text>
          </View>
        ) : (
          <Text className="text-calm-600 mb-4">Tushuntirish matni mavjud emas.</Text>
        )}

        {hydrated && role === 'MOBILE_USER' && premiumEnt && !premiumEnt.isPremium ? (
          <View className="rounded-2xl border border-accent/30 bg-accent/5 p-4 mb-5">
            <Text className="text-calm-800 text-sm leading-5 mb-3">
              Chuqurroq tahlillar va saqlangan tarix kabi imkoniyatlar Ruhiyat Premium bilan kengayishi mumkin — bu
              ixtiyoriy va hozirgi tushuntirishga ta’sir qilmaydi.
            </Text>
            <Pressable onPress={() => router.push('/(settings)/premium')} className="py-1">
              <Text className="text-accent font-semibold text-center">Premium haqida bilib olish</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={() => router.push('/(main)/psychologists')} className="mb-5 py-1">
          <Text className="text-calm-600 text-center text-sm leading-6">
            <Text className="text-accent font-semibold">Mutaxassis bilan gaplashish</Text>
            {' — '}istalgan vaqtda, majburiy emas
          </Text>
        </Pressable>

        <PrimaryButton title="Hissiy yordamga o‘tish" onPress={() => router.push(`/(main)/tests/result/${resultId}/support`)} />
      </ScrollView>
    </SafeAreaView>
  );
}
