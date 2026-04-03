import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Xatolik', 'Telefon raqamni kiriting');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Xatolik', 'Parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(phone.trim(), password);
      await login(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      Alert.alert('Kirish xatoligi', err.message || 'Noto\'g\'ri ma\'lumotlar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>Ruhiyat</Text>
          <Text style={styles.subtitle}>Ruhiy salomatlik platformasi</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Telefon raqam</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+998901234567"
            placeholderTextColor={Colors.light.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Parol</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Parolni kiriting"
            placeholderTextColor={Colors.light.textSecondary}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Kirish...' : 'Kirish'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
            <Text style={styles.linkText}>
              Hisobingiz yo'qmi? <Text style={styles.linkBold}>Ro'yxatdan o'ting</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkButton}>
            <Text style={styles.linkText}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: 'bold', color: Colors.light.primary },
  subtitle: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 8 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: Colors.light.textSecondary },
  linkBold: { color: Colors.light.primary, fontWeight: '600' },
});
