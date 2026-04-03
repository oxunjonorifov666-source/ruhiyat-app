import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('Xatolik', 'Ism va familiyani kiriting');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Xatolik', 'Telefon raqamni kiriting');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Xatolik', 'Parollar mos kelmadi');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        phone: form.phone.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
      });
      await login(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ro'yxatdan o'tish</Text>
      <Text style={styles.subtitle}>Yangi hisob yaratish uchun ma'lumotlaringizni kiriting</Text>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Ism</Text>
          <TextInput style={styles.input} value={form.firstName} onChangeText={v => setForm({ ...form, firstName: v })} placeholder="Ismingiz" placeholderTextColor={Colors.light.textSecondary} />
        </View>
        <View>
          <Text style={styles.label}>Familiya</Text>
          <TextInput style={styles.input} value={form.lastName} onChangeText={v => setForm({ ...form, lastName: v })} placeholder="Familiyangiz" placeholderTextColor={Colors.light.textSecondary} />
        </View>
        <View>
          <Text style={styles.label}>Telefon raqam</Text>
          <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} placeholder="+998901234567" keyboardType="phone-pad" placeholderTextColor={Colors.light.textSecondary} />
        </View>
        <View>
          <Text style={styles.label}>Parol</Text>
          <TextInput style={styles.input} value={form.password} onChangeText={v => setForm({ ...form, password: v })} placeholder="Kamida 6 ta belgi" secureTextEntry placeholderTextColor={Colors.light.textSecondary} />
        </View>
        <View>
          <Text style={styles.label}>Parolni tasdiqlash</Text>
          <TextInput style={styles.input} value={form.confirmPassword} onChangeText={v => setForm({ ...form, confirmPassword: v })} placeholder="Parolni qayta kiriting" secureTextEntry placeholderTextColor={Colors.light.textSecondary} />
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Hisobingiz bormi? <Text style={styles.linkBold}>Kirish</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 8, marginBottom: 32 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  input: { backgroundColor: Colors.light.surface, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: Colors.light.border, color: Colors.light.text },
  button: { backgroundColor: Colors.light.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: Colors.light.textSecondary },
  linkBold: { color: Colors.light.primary, fontWeight: '600' },
});
