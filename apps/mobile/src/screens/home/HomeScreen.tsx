import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

const moods = [
  { emoji: '😊', label: "A'lo" },
  { emoji: '🙂', label: 'Yaxshi' },
  { emoji: '😐', label: "O'rtacha" },
  { emoji: '😔', label: 'Yomon' },
  { emoji: '😢', label: "Juda yomon" },
];

const quickActions = [
  { emoji: '📝', label: 'Kundalik' },
  { emoji: '🧘', label: 'Nafas' },
  { emoji: '😴', label: 'Uyqu' },
  { emoji: '📊', label: 'Test' },
  { emoji: '🎧', label: 'Audio' },
  { emoji: '💬', label: 'Chat' },
];

export function HomeScreen({ navigation }: any) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Assalomu alaykum! 👋</Text>
        <Text style={styles.greetingSubtext}>Bugun o'zingizni qanday his qilyapsiz?</Text>
      </View>

      <View style={styles.moodContainer}>
        {moods.map((mood, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.moodButton, selectedMood === i && styles.moodSelected]}
            onPress={() => setSelectedMood(i)}
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

      <Text style={styles.sectionTitle}>Tavsiyalar</Text>
      <SectionCard title="Stressni boshqarish" subtitle="5 daqiqalik nafas mashqi" icon="🧘" onPress={() => {}} />
      <SectionCard title="Yaxshi uyqu uchun" subtitle="Uxlashdan oldingi odatlar" icon="🌙" onPress={() => {}} />
      <SectionCard title="Bugungi afirmatsiya" subtitle="Har bir kun — yangi imkoniyat" icon="✨" onPress={() => {}} />

      <Text style={styles.sectionTitle}>Yaqinlashayotgan uchrashuvlar</Text>
      <SectionCard title="Dr. Karimova bilan seans" subtitle="Bugun, 15:00" icon="📅" onPress={() => {}} />
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
