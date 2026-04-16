import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { hapticSuccess } from '../../lib/haptics';
import { assessmentsMobileService, QuestionDto } from '../../services/assessmentsMobile';

export function TestPassScreen({ route, navigation }: any) {
  const { testId, title } = route.params || {};
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** questionId -> answerId */
  const [picked, setPicked] = useState<Record<number, number>>({});

  const load = useCallback(async () => {
    if (!testId) {
      Alert.alert('Xatolik', 'Test topilmadi');
      navigation.goBack();
      return;
    }
    try {
      const q = await assessmentsMobileService.getQuestions(testId);
      setQuestions(q || []);
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Test yuklanmadi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, testId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    for (const q of questions) {
      if (!picked[q.id]) {
        Alert.alert('Diqqat', 'Barcha savollarga javob bering');
        return;
      }
    }
    let score = 0;
    let maxScore = 0;
    const responses: { questionId: number; answerId: number; score: number }[] = [];
    for (const q of questions) {
      const aid = picked[q.id];
      const ans = q.answers.find((a) => a.id === aid);
      const maxA = Math.max(0, ...q.answers.map((a) => a.score));
      maxScore += maxA;
      const sc = ans?.score ?? 0;
      score += sc;
      responses.push({ questionId: q.id, answerId: aid, score: sc });
    }
    setSubmitting(true);
    try {
      const result = await assessmentsMobileService.submitTest(testId, {
        score,
        maxScore,
        responses,
        interpretation:
          maxScore > 0
            ? `Ball: ${score} / ${maxScore}.`
            : 'Test yakunlandi.',
      });
      await hapticSuccess();
      navigation.replace('TestResult', {
        result: {
          ...result,
          test: result.test ?? { title: title || 'Test', description: null },
        },
      });
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Yuborishda xato');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title || 'Test'}</Text>
      <Text style={styles.sub}>{questions.length} ta savol</Text>

      {questions.map((q, qi) => (
        <View key={q.id} style={styles.card}>
          <Text style={styles.qLabel}>
            {qi + 1}. {q.text}
          </Text>
          {q.answers.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.ans, picked[q.id] === a.id && styles.ansOn]}
              onPress={() => setPicked((p) => ({ ...p, [q.id]: a.id }))}
            >
              <Text style={[styles.ansText, picked[q.id] === a.id && styles.ansTextOn]}>{a.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Natijani yuborish</Text>}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, lineHeight: 22 },
  ans: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ansOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '40' },
  ansText: { fontSize: 14, color: Colors.text },
  ansTextOn: { fontWeight: '700', color: Colors.primary },
  btn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
