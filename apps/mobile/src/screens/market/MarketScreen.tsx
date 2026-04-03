import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { SectionCard } from '../../components/SectionCard';

export function MarketScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Market</Text>
      <Text style={styles.subtitle}>Xizmatlar va premium imkoniyatlar</Text>

      <View style={styles.premiumCard}>
        <Text style={styles.premiumTitle}>⭐ Premium obuna</Text>
        <Text style={styles.premiumDesc}>Barcha imkoniyatlardan cheksiz foydalaning</Text>
        <TouchableOpacity style={styles.premiumButton}>
          <Text style={styles.premiumButtonText}>Obuna bo'lish</Text>
        </TouchableOpacity>
      </View>

      <SectionCard title="Xizmatlar" subtitle="Individual va guruh seanslar" icon="🛍️" onPress={() => {}} />
      <SectionCard title="Premium" subtitle="Premium rejalar va afzalliklar" icon="⭐" onPress={() => {}} />
      <SectionCard title="To'lovlar" subtitle="To'lov tarixi va boshqaruv" icon="💳" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4, marginBottom: 20 },
  premiumCard: { backgroundColor: Colors.light.primary, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' },
  premiumTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  premiumDesc: { fontSize: 14, color: '#FFF', opacity: 0.9, marginTop: 8, textAlign: 'center' },
  premiumButton: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12, marginTop: 16 },
  premiumButtonText: { color: Colors.light.primary, fontWeight: '600', fontSize: 16 },
});
