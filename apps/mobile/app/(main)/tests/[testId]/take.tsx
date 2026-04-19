import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchQuestions, submitTest } from '~/lib/assessmentsApi';
import { clientInterpretationHint, computeScores } from '~/lib/buildTestSubmission';
import { getApiErrorMessage } from '~/lib/errors';
import type { QuestionDto } from '~/types/assessments';
import { useTestDraftStore } from '~/store/testDraftStore';

export default function TestTakeScreen() {
  const { testId: idParam } = useLocalSearchParams<{ testId: string }>();
  const testId = Number(idParam);
  const router = useRouter();
  const navigation = useNavigation();

  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const savedAnswers = useTestDraftStore((s) =>
    Number.isFinite(testId) ? s.byTestId[String(testId)]?.answers : undefined,
  );
  const setAnswer = useTestDraftStore((s) => s.setAnswer);
  const clearDraft = useTestDraftStore((s) => s.clearDraft);

  const [picked, setPicked] = useState<Record<number, number>>({});

  const load = useCallback(async () => {
    if (!Number.isFinite(testId)) {
      setLoadError('Noto‘g‘ri test');
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const q = await fetchQuestions(testId);
      setQuestions(q);
      navigation.setOptions({ title: 'Savollar' });
    } catch (e) {
      setLoadError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [navigation, testId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!questions.length || !savedAnswers || Object.keys(savedAnswers).length === 0) return;
    setPicked((prev) => (Object.keys(prev).length > 0 ? prev : savedAnswers));
  }, [questions, savedAnswers]);

  const answeredCount = useMemo(() => questions.filter((q) => picked[q.id]).length, [questions, picked]);
  const progress = questions.length ? answeredCount / questions.length : 0;

  const onPick = (questionId: number, answerId: number) => {
    setPicked((p) => ({ ...p, [questionId]: answerId }));
    if (Number.isFinite(testId)) {
      setAnswer(testId, questionId, answerId);
    }
  };

  const onSubmit = async () => {
    setSubmitError(null);
    for (const q of questions) {
      if (!picked[q.id]) {
        setSubmitError('Iltimos, barcha savollarga javob bering.');
        return;
      }
    }
    const { score, maxScore, responses } = computeScores(questions, picked);
    setSubmitting(true);
    try {
      const result = await submitTest(testId, {
        score,
        maxScore,
        responses,
        interpretation: clientInterpretationHint(score, maxScore),
      });
      clearDraft(testId);
      router.replace(`/(main)/tests/result/${result.id}`);
    } catch (e) {
      setSubmitError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
        <Text className="text-calm-500 mt-3">Savollar yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 justify-center" edges={['bottom']}>
        <Text className="text-calm-900 font-semibold mb-2">Savollar yuklanmadi</Text>
        <Text className="text-calm-600 mb-4">{loadError ?? 'Ro‘yxat bo‘sh'}</Text>
        <PrimaryButton title="Qayta urinish" onPress={() => { setLoading(true); void load(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <View className="px-5 pt-2 pb-3">
        <View className="h-2 rounded-full bg-calm-200 overflow-hidden mb-2">
          <View className="h-2 rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </View>
        <Text className="text-calm-600 text-sm">
          {answeredCount} / {questions.length} javob
        </Text>
      </View>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {questions.map((q, qi) => (
          <View key={q.id} className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
            <Text className="text-calm-900 font-semibold mb-3 leading-6">
              {qi + 1}. {q.text}
            </Text>
            {q.answers
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((a) => {
                const on = picked[q.id] === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => onPick(q.id, a.id)}
                    className={`rounded-2xl border px-4 py-3 mb-2 ${on ? 'border-accent bg-accent/10' : 'border-calm-200 bg-calm-50'}`}
                  >
                    <Text className={`text-base leading-5 ${on ? 'text-calm-900 font-medium' : 'text-calm-800'}`}>{a.text}</Text>
                  </Pressable>
                );
              })}
          </View>
        ))}
        {submitError ? <Text className="text-red-700 mb-3 text-center">{submitError}</Text> : null}
        <PrimaryButton title="Natijani yuborish" loading={submitting} onPress={() => void onSubmit()} />
      </ScrollView>
    </SafeAreaView>
  );
}
