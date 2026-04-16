import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { assessmentsMobileService } from '../../services/assessmentsMobile';

export function TestHistoryScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['test-results'],
    queryFn: () => assessmentsMobileService.getMyResults(),
  });

  const rows = data?.data || [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test natijalari</Text>
      <Text style={styles.hint}>Karta ustiga bosing — batafsil natija va AI tahlil</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }) => {
          const pct =
            item.score != null && item.maxScore != null && item.maxScore > 0
              ? Math.round((item.score / item.maxScore) * 100)
              : null;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('TestResult', {
                  result: {
                    id: item.id,
                    score: item.score,
                    maxScore: item.maxScore,
                    interpretation: item.interpretation,
                    test: item.test,
                  },
                })
              }
            >
              <View style={styles.cardTop}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={Colors.primary} />
                <Text style={styles.t} numberOfLines={2}>
                  {item.test.title}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
              </View>
              <Text style={styles.meta}>
                {item.score != null && item.maxScore != null
                  ? `Ball: ${item.score} / ${item.maxScore}${pct != null ? ` (${pct}%)` : ''}`
                  : 'Yakunlangan'}
              </Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Hozircha natijalar yo‘q</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  hint: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  t: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  meta: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
