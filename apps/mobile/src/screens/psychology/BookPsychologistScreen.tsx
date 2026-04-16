import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { profileMobileService } from '../../services/profileMobile';

export function BookPsychologistScreen({ route, navigation }: any) {
  const { psychologistId, name } = route.params || {};
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const raw = scheduledAt.trim();
    if (!raw) {
      Alert.alert('Vaqt', 'Sanani va vaqtni kiriting (masalan: 2026-06-15T15:00:00)');
      return;
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      Alert.alert('Format', 'ISO formatida kiriting: YYYY-MM-DDTHH:mm:ss');
      return;
    }
    setLoading(true);
    try {
      await profileMobileService.createBooking({
        psychologistId,
        scheduledAt: d.toISOString(),
        duration: 60,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Muvaffaqiyat', 'So‘rov yuborildi. Psixolog tasdiqlagach, sizga xabar beriladi.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Yuborilmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Seans band qilish</Text>
      <Text style={styles.sub}>{name || 'Psixolog'}</Text>

      <Text style={styles.label}>Rejalashtirilgan vaqt (ISO)</Text>
      <TextInput
        style={styles.input}
        value={scheduledAt}
        onChangeText={setScheduledAt}
        placeholder="2026-06-15T15:00:00"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />
      <Text style={styles.hint}>Yaqin sanani tanlang va vaqtni yozing (mahalliy vaqt).</Text>

      <Text style={styles.label}>Izoh (ixtiyoriy)</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Qisqacha maqsad yoki savollar..."
        placeholderTextColor={Colors.textMuted}
      />

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>So‘rov yuborish</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6, marginBottom: 18 },
  btn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
