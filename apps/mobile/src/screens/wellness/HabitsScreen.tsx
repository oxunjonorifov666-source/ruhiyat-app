import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { wellnessService, Habit } from '../../services/wellness';
import { ScreenStates } from '../../components/ScreenStates';

export function HabitsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['habits'],
    queryFn: () => wellnessService.getHabits(),
  });
  const [name, setName] = useState('');

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    await wellnessService.createHabit({ name: n, frequency: 'daily', targetCount: 1 });
    setName('');
    qc.invalidateQueries({ queryKey: ['habits'] });
  };

  const log = async (id: number) => {
    await wellnessService.logHabit(id);
    qc.invalidateQueries({ queryKey: ['habits'] });
  };

  const remove = (h: Habit) => {
    Alert.alert('O‘chirish', `${h.name} o‘chirilsinmi?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O‘chirish',
        style: 'destructive',
        onPress: async () => {
          await wellnessService.deleteHabit(h.id);
          qc.invalidateQueries({ queryKey: ['habits'] });
        },
      },
    ]);
  };

  const render = useCallback(
    ({ item }: { item: Habit }) => (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.meta}>
            Oxirgi 7 kun: {item.logs?.length ?? 0} marta
          </Text>
        </View>
        <TouchableOpacity style={styles.logBtn} onPress={() => log(item.id)}>
          <Text style={styles.logText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item)} style={styles.delBtn}>
          <Text style={styles.delText}>×</Text>
        </TouchableOpacity>
      </View>
    ),
    [qc],
  );

  if (isLoading) {
    return <ScreenStates loading />;
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Odatlar yuklanmadi';
    return <ScreenStates error={msg} onRetry={() => refetch()} />;
  }

  return (
    <ScreenStates>
    <View style={styles.container}>
      <Text style={styles.title}>Odatlar</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Yangi odat nomi"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>Qo‘shish</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data || []}
        keyExtractor={(h) => String(h.id)}
        renderItem={render}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text style={styles.empty}>Hozircha odatlar yo‘q</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.primary, fontWeight: '800' }}>Yangilash</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  addRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  addBtn: { justifyContent: 'center', paddingHorizontal: 16, backgroundColor: Colors.primary, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  logBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.success + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  logText: { fontSize: 20, color: Colors.success, fontWeight: '800' },
  delBtn: { marginLeft: 6, padding: 8 },
  delText: { fontSize: 22, color: Colors.error },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
