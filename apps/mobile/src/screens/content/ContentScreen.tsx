import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';
import { apiClient } from '../../services/api';

interface Article {
  id: number;
  title: string;
  category: string | null;
  viewCount: number;
}

const contentSections = [
  { title: 'Audio', subtitle: 'Meditatsiya va dam olish', icon: '🎧' },
  { title: 'Video', subtitle: "Ta'limiy videolar", icon: '🎬' },
  { title: 'Afirmatsiyalar', subtitle: 'Ijobiy fikrlash uchun', icon: '✨' },
  { title: 'Metodikalar', subtitle: 'Proyektiv usullar', icon: '🧩' },
  { title: 'Treninglar', subtitle: 'Rivojlanish dasturlari', icon: '🎯' },
];

export function ContentScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const res = await apiClient.get<{ data: Article[] }>('/articles', { page: 1, limit: 10 });
      setArticles(res.data || []);
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Kontent</Text>
      <Text style={styles.subtitle}>Ta'limiy va rivojlantiruvchi materiallar</Text>

      <Text style={styles.sectionHeader}>Maqolalar</Text>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.light.primary} />
      ) : articles.length > 0 ? (
        articles.map((a) => (
          <TouchableOpacity key={a.id} style={styles.articleCard}>
            <View style={styles.articleIcon}><Text style={styles.articleIconText}>📰</Text></View>
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle}>{a.title}</Text>
              <Text style={styles.articleMeta}>{a.category || 'Umumiy'} · {a.viewCount || 0} ko'rish</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>Hozircha maqolalar yo'q</Text>
      )}

      <Text style={styles.sectionHeader}>Boshqa materiallar</Text>
      {contentSections.map((section, i) => (
        <SectionCard key={i} title={section.title} subtitle={section.subtitle} icon={section.icon} onPress={() => {}} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4, marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 12, marginTop: 8 },
  articleCard: { flexDirection: 'row', backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.light.border },
  articleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  articleIconText: { fontSize: 20 },
  articleInfo: { flex: 1, justifyContent: 'center' },
  articleTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  articleMeta: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginVertical: 20 },
});
