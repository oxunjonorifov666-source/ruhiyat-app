import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';
import { apiClient } from '../../services/api';

interface Psychologist {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string | null;
  experienceYears: number | null;
  isAvailable: boolean;
  rating: number | null;
}

const sections = [
  { title: 'Psixolog AI', subtitle: "Sun'iy intellekt yordamchisi", icon: '🤖', screen: 'PsychologistAI' },
  { title: 'Chat', subtitle: 'Psixolog bilan yozishmalar', icon: '💬', screen: 'PsyChat' },
  { title: 'Videochat', subtitle: "Video qo'ng'iroq", icon: '📹', screen: 'VideoChat' },
  { title: 'Uchrashuvlar', subtitle: 'Seans rejalashtirish', icon: '📅', screen: 'PsyMeetings' },
  { title: 'Seanslar tarixi', subtitle: "O'tgan seanslar", icon: '📋', screen: 'SessionHistory' },
];

export function PsychologyScreen({ navigation }: any) {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPsychologists();
  }, []);

  async function loadPsychologists() {
    try {
      const res = await apiClient.get<{ data: Psychologist[] }>('/psychologists', { page: 1, limit: 5 });
      setPsychologists(res.data || []);
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Psixologiya</Text>
      <Text style={styles.subtitle}>Professional psixologik yordam va maslahatlar</Text>

      <Text style={styles.sectionHeader}>Mutaxassislar</Text>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.light.primary} />
      ) : psychologists.length > 0 ? (
        psychologists.map((p) => (
          <TouchableOpacity key={p.id} style={styles.psychCard}>
            <View style={styles.psychAvatar}>
              <Text style={styles.psychAvatarText}>{p.firstName[0]}{p.lastName[0]}</Text>
            </View>
            <View style={styles.psychInfo}>
              <Text style={styles.psychName}>{p.firstName} {p.lastName}</Text>
              <Text style={styles.psychSpec}>{p.specialization || 'Psixolog'}</Text>
              <View style={styles.psychMeta}>
                {p.rating && <Text style={styles.psychRating}>⭐ {p.rating.toFixed(1)}</Text>}
                {p.experienceYears && <Text style={styles.psychExp}>{p.experienceYears} yil</Text>}
                <Text style={[styles.psychStatus, p.isAvailable && styles.psychAvailableText]}>
                  {p.isAvailable ? '● Mavjud' : '○ Band'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>Hozircha psixologlar yo'q</Text>
      )}

      <Text style={styles.sectionHeader}>Xizmatlar</Text>
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
  sectionHeader: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 12, marginTop: 8 },
  psychCard: { flexDirection: 'row', backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.light.border },
  psychAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  psychAvatarText: { fontSize: 16, fontWeight: '600', color: Colors.light.primary },
  psychInfo: { flex: 1 },
  psychName: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  psychSpec: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  psychMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  psychRating: { fontSize: 12, color: Colors.light.text },
  psychExp: { fontSize: 12, color: Colors.light.textSecondary },
  psychStatus: { fontSize: 12, color: Colors.light.textSecondary },
  psychAvailableText: { color: Colors.light.success },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginVertical: 20 },
});
