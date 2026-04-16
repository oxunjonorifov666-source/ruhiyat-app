import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { getPasswordPolicyError } from '../../lib/passwordPolicy';

export function ChangePasswordScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const err = getPasswordPolicyError(next);
    if (err) {
      Alert.alert('Yangi parol', err);
      return;
    }
    if (next !== confirm) {
      Alert.alert('Xatolik', 'Yangi parollar mos kelmaydi');
      return;
    }
    if (!current.trim()) {
      Alert.alert('Xatolik', 'Joriy parolni kiriting');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(current, next);
      Alert.alert('Muvaffaqiyat', 'Parol yangilandi.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Saqlashda xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Parolni o‘zgartirish</Text>
        <Text style={styles.hint}>Joriy parol va yangi parol (kamida 8 belgi, katta/kichik harf va raqam)</Text>

        <Text style={styles.label}>Joriy parol</Text>
        <TextInput
          style={styles.input}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Yangi parol</Text>
        <TextInput
          style={styles.input}
          value={next}
          onChangeText={setNext}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Yangi parol (tasdiq)</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.textMuted}
        />

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Saqlash</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  hint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
