import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

const sections = [
  { title: 'Kundalik', subtitle: 'Fikrlaringizni yozing', icon: '📝' },
  { title: 'Odatlar', subtitle: 'Foydali odatlarni shakllantiring', icon: '🎯' },
  { title: 'Uyqu', subtitle: 'Uyqu sifatini kuzating', icon: '😴' },
  { title: 'Nafas mashqlari', subtitle: 'Tinchlanish uchun mashqlar', icon: '🧘' },
  { title: 'Testlar', subtitle: 'O\'zingizni tekshiring', icon: '📊' },
  { title: 'Natijalar', subtitle: 'Test natijalari va tahlil', icon: '📈' },
];

export function DevelopmentScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rivojlantirish</Text>
      <Text style={styles.subtitle}>Shaxsiy o'sish va rivojlanish vositalari</Text>

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
