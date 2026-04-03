import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

const sections = [
  { title: 'Psixologlar', subtitle: 'Mutaxassislar bilan bog\'laning', icon: '🧠', screen: 'Psychologists' },
  { title: 'Psixolog AI', subtitle: 'Sun\'iy intellekt yordamchisi', icon: '🤖', screen: 'PsychologistAI' },
  { title: 'Chat', subtitle: 'Psixolog bilan yozishmalar', icon: '💬', screen: 'PsyChat' },
  { title: 'Videochat', subtitle: 'Video qo\'ng\'iroq', icon: '📹', screen: 'VideoChat' },
  { title: 'Uchrashuvlar', subtitle: 'Seans rejalashtirish', icon: '📅', screen: 'PsyMeetings' },
  { title: 'Seanslar tarixi', subtitle: 'O\'tgan seanslar', icon: '📋', screen: 'SessionHistory' },
];

export function PsychologyScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Psixologiya</Text>
      <Text style={styles.subtitle}>Professional psixologik yordam va maslahatlar</Text>

      {sections.map((section, i) => (
        <SectionCard
          key={i}
          title={section.title}
          subtitle={section.subtitle}
          icon={section.icon}
          onPress={() => {}}
        />
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
