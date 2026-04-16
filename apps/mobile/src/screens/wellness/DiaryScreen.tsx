import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, SafeAreaView, FlatList
} from 'react-native';
import { useAppPalette } from '../../theme/useAppPalette';
import { wellnessService } from '../../services/wellness';
import { ScreenStates } from '../../components/ScreenStates';

export function DiaryScreen({ navigation }: any) {
  const C = useAppPalette();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoadError(null);
    try {
      const data = await wellnessService.getDiaryEntries();
      setEntries(data || []);
    } catch (e) {
      setEntries([]);
      setLoadError(e instanceof Error ? e.message : 'Kundalik yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await wellnessService.createDiaryEntry(note);
      setNote('');
      await fetchEntries();
      Alert.alert('Muvaffaqiyat', 'Xotira muvaffaqiyatli saqlandi ✨');
    } catch (e) {
       Alert.alert('Xatolik', 'Saqlashda muammo yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: C.surface }]}>
            <Text style={[styles.backIcon, { color: C.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Ruhiyat Kundaligi</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScreenStates loading />
      </SafeAreaView>
    );
  }

  if (loadError && entries.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: C.surface }]}>
            <Text style={[styles.backIcon, { color: C.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Ruhiyat Kundaligi</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScreenStates error={loadError} onRetry={fetchEntries} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScreenStates>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: C.surface }]}>
          <Text style={[styles.backIcon, { color: C.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Ruhiyat Kundaligi</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.inputSection, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.label, { color: C.text }]}>Bugungi xotiralaringiz...</Text>
        <TextInput 
          style={[styles.input, { color: C.text }]}
          placeholder="Nimalar haqida o'ylayapsiz? Bu yerga yozing..."
          multiline
          value={note}
          onChangeText={setNote}
          placeholderTextColor={C.textMuted}
        />
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: C.primary }, (!note.trim() || saving) && { opacity: 0.6 }]} 
          onPress={handleSave}
          disabled={!note.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Saqlash</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.historyHeader}>
        <Text style={[styles.historyTitle, { color: C.text }]}>O'tmishdagi qaydlar</Text>
      </View>

      <FlatList 
          data={entries}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.entryDate, { color: C.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={[styles.entryContent, { color: C.text }]}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🖊️</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>Hozircha qaydlar yo'q. Birinchi fikringizni yozing!</Text>
            </View>
          }
        />
    </ScreenStates>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 32, bottom: 2 },
  title: { fontSize: 18, fontWeight: '800' },

  inputSection: { padding: 20, margin: 16, borderRadius: 24, gap: 12, borderWidth: 1 },
  label: { fontSize: 15, fontWeight: '700' },
  input: { 
    minHeight: 100, 
    fontSize: 16, 
    textAlignVertical: 'top'
  },
  saveBtn: { 
    height: 50, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  historyHeader: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  historyTitle: { fontSize: 19, fontWeight: '800' },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  entryCard: { 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  entryDate: { fontSize: 11, marginBottom: 8 },
  entryContent: { fontSize: 15, lineHeight: 22 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { marginTop: 16, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
