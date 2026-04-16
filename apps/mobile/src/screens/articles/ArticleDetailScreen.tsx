import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { contentService, Article } from '../../services/content';

export function ArticleDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route?.params?.id as number;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Maqola tanlanmagan');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const a = await contentService.getArticle(id);
      setArticle(a);
      navigation?.setOptions?.({ title: a.title?.slice(0, 32) || 'Maqola' });
    } catch (e: unknown) {
      setArticle(null);
      setError(e instanceof Error ? e.message : 'Yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.muted}>Yuklanmoqda...</Text>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>{error || 'Maqola topilmadi'}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Qayta urinish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const plain = article.content ? article.content.replace(/<[^>]+>/g, '') : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {article.category ? <Text style={styles.cat}>{article.category}</Text> : null}
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>{new Date(article.createdAt).toLocaleString('uz-UZ')}</Text>
      <Text style={styles.body}>{plain}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background },
  muted: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  errTitle: { fontSize: 16, color: Colors.text, textAlign: 'center', marginBottom: 16 },
  retry: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  cat: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  meta: { fontSize: 12, color: Colors.textMuted, marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 26, color: Colors.text },
});
