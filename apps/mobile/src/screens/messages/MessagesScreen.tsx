import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

export function MessagesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Xabarlar</Text>
      <Text style={styles.subtitle}>Bildirishnomalar va e'lonlar</Text>

      <SectionCard title="Bildirishnomalar" subtitle="3 ta yangi bildirishnoma" icon="🔔" onPress={() => {}} />
      <SectionCard title="E'lonlar" subtitle="1 ta yangi e'lon" icon="📢" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4, marginBottom: 20 },
});
