import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { contentService, Article } from '../../services/content';

export function ArticlesListScreen() {
  const navigation = useNavigation<any>();
  const [cat, setCat] = useState<string | null>(null);

  const { data: allForCats } = useQuery({
    queryKey: ['articles-all-cats'],
    queryFn: () => contentService.getArticles({ limit: 100 }),
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['articles', cat],
    queryFn: () => contentService.getArticles({ limit: 50, category: cat || undefined }),
  });

  const categories = useMemo(() => {
    const rows = allForCats?.data || [];
    const s = new Set<string>();
    rows.forEach((a) => {
      if (a.category) s.add(a.category);
    });
    return ['Barchasi', ...Array.from(s)];
  }, [allForCats]);

  const list = data?.data || [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maqolalar</Text>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c}
        style={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, (item === 'Barchasi' ? !cat : cat === item) && styles.chipOn]}
            onPress={() => setCat(item === 'Barchasi' ? null : item)}
          >
            <Text style={[styles.chipText, (item === 'Barchasi' ? !cat : cat === item) && styles.chipTextOn]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={list}
        keyExtractor={(a) => String(a.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ArticleDetail', { id: item.id, title: item.title })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.category ? <Text style={styles.cat}>{item.category}</Text> : null}
            <Text numberOfLines={2} style={styles.excerpt}>
              {item.excerpt || item.summary || item.content?.replace(/<[^>]+>/g, '').slice(0, 160)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Maqolalar yo‘q</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, paddingHorizontal: 16, marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8, paddingLeft: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextOn: { color: Colors.primaryDark },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cat: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  excerpt: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
