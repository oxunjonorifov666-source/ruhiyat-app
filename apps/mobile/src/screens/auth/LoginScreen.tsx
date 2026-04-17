import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeUzbekPhone, isValidUzbekMobile } from '../../lib/phone';

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone?.trim() || !password) {
      Alert.alert('Xatolik', 'Telefon raqam va parolni kiriting');
      return;
    }
    const normalized = normalizeUzbekPhone(phone.trim());
    if (!isValidUzbekMobile(normalized)) {
      Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.loginWithPhone(normalized, password);
      await login(res.accessToken, res.refreshToken, res.user);
    } catch (e: any) {
      Alert.alert('Kirish xatoligi', e.message || 'Telefon yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🧠</Text>
          </View>
          <Text style={styles.title}>Ruhiyat</Text>
          <Text style={styles.subtitle}>Raqamli ruhiy salomatlik platformasi</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kirish</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Telefon raqam</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parol</Text>
            <TextInput
              style={styles.input}
              placeholder="Parolingizni kiriting"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Kirish</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>yoki</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>Yangi hisob yaratish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.background,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.textMuted, fontSize: 13 },
  registerBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  registerText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
