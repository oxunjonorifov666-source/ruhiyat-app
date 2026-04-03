import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

const sections = [
  { title: 'Maqolalar', subtitle: 'Foydali maqolalar va maslahatlar', icon: '📰' },
  { title: 'Audio', subtitle: 'Meditatsiya va dam olish', icon: '🎧' },
  { title: 'Video', subtitle: 'Ta\'limiy videolar', icon: '🎬' },
  { title: 'Afirmatsiyalar', subtitle: 'Ijobiy fikrlash uchun', icon: '✨' },
  { title: 'Metodikalar', subtitle: 'Proyektiv usullar', icon: '🧩' },
  { title: 'Treninglar', subtitle: 'Rivojlanish dasturlari', icon: '🎯' },
];

export function ContentScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Kontent</Text>
      <Text style={styles.subtitle}>Ta'limiy va rivojlantiruvchi materiallar</Text>

      {sections.map((section, i) => (
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
});
