import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { apiClient } from '../../services/api';
import { ScreenStates } from '../../components/ScreenStates';

interface Test {
  id: number;
  title: string;
  description: string;
  questionsCount: number;
  duration: number;
}

export function TestsScreen() {
  const navigation = useNavigation<any>();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.get<{
        data: Array<{
          id: number;
          title: string;
          description: string | null;
          duration: number | null;
          _count?: { questions: number };
        }>;
      }>('/assessments/tests', { published: 'true' });
      const rows = (res?.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        questionsCount: t._count?.questions ?? 0,
        duration: t.duration ?? 0,
      }));
      setTests(rows);
    } catch (e) {
      setTests([]);
      setError(e instanceof Error ? e.message : 'Testlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  if (loading) {
    return <ScreenStates loading />;
  }
  if (error && tests.length === 0) {
    return <ScreenStates error={error} onRetry={fetchTests} />;
  }
  if (!tests.length) {
    return <ScreenStates empty emptyMessage="Hozircha testlar yo‘q" onRetry={fetchTests} />;
  }

  return (
    <ScreenStates>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Psixologik Testlar</Text>
          <Text style={styles.subtitle}>O'zingizni yaxshiroq anglang</Text>
        </View>

        <View style={styles.list}>
          {tests.map((test) => (
            <View key={test.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{test.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🧠 Test</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{test.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.meta}>📊 {test.questionsCount} ta savol</Text>
                <Text style={styles.meta}>🕒 {test.duration || '—'} daqiqa</Text>
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => navigation.navigate('TestPass', { testId: test.id, title: test.title })}
                >
                  <Text style={styles.startText}>Boshlash</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 12, color: Colors.textMuted },
  startBtn: { marginLeft: 'auto', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  startText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
