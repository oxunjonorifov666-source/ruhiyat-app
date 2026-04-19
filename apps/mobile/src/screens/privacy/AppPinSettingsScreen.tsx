import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppPalette } from '../../theme/useAppPalette';
import { useAppLockStore } from '../../stores/appLockStore';

export function AppPinSettingsScreen() {
  const C = useAppPalette();
  const hydrate = useAppLockStore((s) => s.hydrate);
  const enabled = useAppLockStore((s) => s.enabled);
  const setPin = useAppLockStore((s) => s.setPin);
  const clearLock = useAppLockStore((s) => s.clearLock);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const save = async () => {
    if (a !== b) {
      Alert.alert('PIN', 'Ikki marta bir xil kiriting');
      return;
    }
    setBusy(true);
    try {
      await setPin(a);
      Alert.alert('Saqlandi', 'Endi ilovani har ochganingizda PIN so‘raladi.');
      setA('');
      setB('');
    } catch (e) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Saqlanmadi');
    } finally {
      setBusy(false);
    }
  };

  const disable = () => {
    Alert.alert('PIN o‘chirish', 'Ilova qulfini olib tashlaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'Ha',
        style: 'destructive',
        onPress: async () => {
          await clearLock();
          Alert.alert('OK', 'PIN o‘chirildi.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={[styles.lead, { color: C.textSecondary }]}>
        Bu PIN hisob parolingizdan alohida — ilovani ochganingizda tez kirish uchun. Token saqlanadi, lekin PIN har seansda (yoki qurilma qayta
        ishga tushganda) so‘raladi.
      </Text>

      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.status, { color: C.text }]}>Holat: {enabled ? 'Yoqilgan' : 'O‘chiq'}</Text>
        <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
          PIN saqlangach avtomatik yoqiladi.
        </Text>
      </View>

      <Text style={[styles.h, { color: C.text }]}>Yangi PIN (4 raqam)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={a}
        onChangeText={setA}
        placeholder="••••"
        placeholderTextColor={C.textMuted}
      />
      <Text style={[styles.h, { color: C.text }]}>Takrorlang</Text>
      <TextInput
        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={b}
        onChangeText={setB}
        placeholder="••••"
        placeholderTextColor={C.textMuted}
      />

      <TouchableOpacity
        style={[styles.save, { backgroundColor: C.primary, opacity: busy ? 0.7 : 1 }]}
        onPress={save}
        disabled={busy || a.length !== 4}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>PIN ni saqlash</Text>}
      </TouchableOpacity>

      {enabled ? (
        <TouchableOpacity style={styles.danger} onPress={disable}>
          <Text style={{ color: C.error, fontWeight: '800' }}>PIN ni o‘chirish</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lead: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  status: { fontWeight: '700', marginBottom: 8 },
  h: { fontWeight: '700', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 18 },
  save: { marginTop: 20, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  danger: { marginTop: 24, alignItems: 'center', padding: 12 },
});
