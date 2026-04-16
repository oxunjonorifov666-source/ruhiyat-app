import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { wellnessService, SleepRecord } from '../../services/wellness';
import { ScreenStates } from '../../components/ScreenStates';

export function SleepScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['sleep'],
    queryFn: () => wellnessService.getSleepRecords(),
  });
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [quality, setQuality] = useState('3');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!start.trim()) return;
    setSaving(true);
    try {
      await wellnessService.createSleepRecord({
        sleepStart: start.trim(),
        sleepEnd: end.trim() || undefined,
        quality: parseInt(quality, 10) || undefined,
      });
      setStart('');
      setEnd('');
      qc.invalidateQueries({ queryKey: ['sleep'] });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <ScreenStates loading />;
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Ma’lumot yuklanmadi';
    return <ScreenStates error={msg} onRetry={() => refetch()} />;
  }

  return (
    <ScreenStates>
    <View style={styles.container}>
      <Text style={styles.title}>Uyqu nazorati</Text>
      <Text style={styles.hint}>Vaqt: ISO format (masalan 2026-04-11T23:00:00)</Text>
      <TextInput
        style={styles.input}
        placeholder="Uyqu boshlanishi *"
        placeholderTextColor={Colors.textMuted}
        value={start}
        onChangeText={setStart}
      />
      <TextInput
        style={styles.input}
        placeholder="Uyg‘onish (ixtiyoriy)"
        placeholderTextColor={Colors.textMuted}
        value={end}
        onChangeText={setEnd}
      />
      <TextInput
        style={styles.input}
        placeholder="Sifat 1-5"
        placeholderTextColor={Colors.textMuted}
        value={quality}
        onChangeText={setQuality}
        keyboardType="number-pad"
      />
      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
        <Text style={styles.saveText}>Saqlash</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Tarix</Text>
      <FlatList
        data={data || []}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }: { item: SleepRecord }) => (
          <View style={styles.row}>
            <Text style={styles.rowText}>
              {new Date(item.sleepStart).toLocaleString()} —{' '}
              {item.sleepEnd ? new Date(item.sleepEnd).toLocaleTimeString() : '—'}
            </Text>
            {item.quality != null ? <Text style={styles.q}>Sifat: {item.quality}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Yozuvlar yo‘q</Text>}
      />
    </View>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  saveBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  saveText: { color: '#fff', fontWeight: '800' },
  listTitle: { fontWeight: '700', marginBottom: 8, color: Colors.text },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowText: { fontSize: 14, color: Colors.text },
  q: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
});
