import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';
import { apiClient } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const moods = [
  { emoji: '😊', label: "A'lo", value: 5 },
  { emoji: '🙂', label: 'Yaxshi', value: 4 },
  { emoji: '😐', label: "O'rtacha", value: 3 },
  { emoji: '😔', label: 'Yomon', value: 2 },
  { emoji: '😢', label: "Juda yomon", value: 1 },
];

const quickActions = [
  { emoji: '📝', label: 'Kundalik' },
  { emoji: '🧘', label: 'Nafas' },
  { emoji: '😴', label: 'Uyqu' },
  { emoji: '📊', label: 'Test' },
  { emoji: '🎧', label: 'Audio' },
  { emoji: '💬', label: 'Chat' },
];

interface Article {
  id: number;
  title: string;
  category: string | null;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodSaving, setMoodSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [articlesRes, announcementsRes] = await Promise.all([
        apiClient.get<{ data: Article[] }>('/articles', { page: 1, limit: 3 }).catch(() => ({ data: [] })),
        apiClient.get<{ data: Announcement[] }>('/announcements', { page: 1, limit: 2 }).catch(() => ({ data: [] })),
      ]);
      setArticles(articlesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleMoodSelect(index: number) {
    setSelectedMood(index);
    setMoodSaving(true);
    try {
      await apiClient.post('/mood', { value: moods[index].value, note: moods[index].label });
    } catch {}
    finally { setMoodSaving(false); }
  }

  const displayName = user?.firstName || 'Foydalanuvchi';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Assalomu alaykum, {displayName}! 👋</Text>
        <Text style={styles.greetingSubtext}>Bugun o'zingizni qanday his qilyapsiz?</Text>
      </View>

      <View style={styles.moodContainer}>
        {moods.map((mood, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.moodButton, selectedMood === i && styles.moodSelected]}
            onPress={() => handleMoodSelect(i)}
            disabled={moodSaving}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Tezkor harakatlar</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity key={i} style={styles.quickAction}>
            <Text style={styles.quickEmoji}>{action.emoji}</Text>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {announcements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>E'lonlar</Text>
          {announcements.map((a) => (
            <SectionCard key={a.id} title={a.title} subtitle={a.content.slice(0, 60)} icon="📢" onPress={() => {}} />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Tavsiyalar</Text>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.light.primary} />
      ) : articles.length > 0 ? (
        articles.map((a) => (
          <SectionCard key={a.id} title={a.title} subtitle={a.category || 'Maqola'} icon="📰" onPress={() => {}} />
        ))
      ) : (
        <>
          <SectionCard title="Stressni boshqarish" subtitle="5 daqiqalik nafas mashqi" icon="🧘" onPress={() => {}} />
          <SectionCard title="Yaxshi uyqu uchun" subtitle="Uxlashdan oldingi odatlar" icon="🌙" onPress={() => {}} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
  greetingSubtext: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4 },
  moodContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  moodButton: { alignItems: 'center', padding: 12, borderRadius: 16, flex: 1, marginHorizontal: 2 },
  moodSelected: { backgroundColor: Colors.light.primaryLight },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 12, marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  quickAction: { width: '30%', alignItems: 'center', padding: 16, backgroundColor: Colors.light.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 12, color: Colors.light.text, marginTop: 6, fontWeight: '500' },
});
