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

function isValidEmail(s: string) {
  const t = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phoneLogin, setPhoneLogin] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (mode === 'phone' && phoneLogin === 'otp') {
      const normalized = normalizeUzbekPhone(phone.trim());
      if (!isValidUzbekMobile(normalized)) {
        Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
        return;
      }
      if (!/^\d{6}$/.test(otpCode.trim())) {
        Alert.alert('Kod', '6 raqamli SMS kodni kiriting');
        return;
      }
      setLoading(true);
      try {
        const res = await authService.verifyLoginOtp({ phone: normalized, code: otpCode.trim() });
        if (res.accessToken && res.refreshToken && res.user) {
          await login(res.accessToken, res.refreshToken, res.user);
        } else {
          Alert.alert('Kirish', 'Kod tasdiqlanmadi');
        }
      } catch (e: any) {
        Alert.alert('Kirish xatoligi', e.message || 'Kod noto‘g‘ri yoki muddati o‘tgan');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      Alert.alert('Xatolik', 'Parolni kiriting');
      return;
    }
    if (mode === 'phone') {
      if (!phone?.trim()) {
        Alert.alert('Xatolik', 'Telefon raqamni kiriting');
        return;
      }
      const normalized = normalizeUzbekPhone(phone.trim());
      if (!isValidUzbekMobile(normalized)) {
        Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
        return;
      }
    } else {
      const em = email.trim().toLowerCase();
      if (!isValidEmail(em)) {
        Alert.alert('Email', 'To‘g‘ri email manzilini kiriting');
        return;
      }
    }

    setLoading(true);
    try {
      const res =
        mode === 'phone'
          ? await authService.loginWithPhone(normalizeUzbekPhone(phone.trim()), password)
          : await authService.loginWithEmail(email.trim().toLowerCase(), password);
      await login(res.accessToken, res.refreshToken, res.user);
    } catch (e: any) {
      Alert.alert('Kirish xatoligi', e.message || 'Telefon/email yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  const sendLoginOtp = async () => {
    const normalized = normalizeUzbekPhone(phone.trim());
    if (!isValidUzbekMobile(normalized)) {
      Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
      return;
    }
    setLoading(true);
    try {
      await authService.sendLoginOtp({ phone: normalized });
      setOtpSent(true);
      Alert.alert('SMS', 'Tasdiqlash kodi yuborildi (5 daqiqa).');
    } catch (e: any) {
      Alert.alert('Xatolik', e.message || 'Kod yuborilmadi');
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

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
              onPress={() => {
                setMode('phone');
                setOtpSent(false);
                setOtpCode('');
              }}
            >
              <Text style={[styles.modeBtnText, mode === 'phone' && styles.modeBtnTextActive]}>Telefon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
              onPress={() => {
                setMode('email');
                setPhoneLogin('password');
              }}
            >
              <Text style={[styles.modeBtnText, mode === 'email' && styles.modeBtnTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          {mode === 'phone' ? (
            <>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, phoneLogin === 'password' && styles.modeBtnActive]}
                  onPress={() => {
                    setPhoneLogin('password');
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                >
                  <Text style={[styles.modeBtnText, phoneLogin === 'password' && styles.modeBtnTextActive]}>Parol</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, phoneLogin === 'otp' && styles.modeBtnActive]}
                  onPress={() => setPhoneLogin('otp')}
                >
                  <Text style={[styles.modeBtnText, phoneLogin === 'otp' && styles.modeBtnTextActive]}>SMS kod</Text>
                </TouchableOpacity>
              </View>
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
              {phoneLogin === 'otp' ? (
                <>
                  <TouchableOpacity style={[styles.outlineBtn, loading && styles.btnDisabled]} onPress={sendLoginOtp} disabled={loading}>
                    <Text style={styles.outlineBtnText}>{otpSent ? 'Kodni qayta yuborish' : 'Kod olish'}</Text>
                  </TouchableOpacity>
                  <View style={styles.field}>
                    <Text style={styles.label}>SMS kodi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6 raqam"
                      placeholderTextColor={Colors.textMuted}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {mode === 'email' || phoneLogin === 'password' ? (
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
          ) : null}

          {mode === 'email' || phoneLogin === 'password' ? (
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 8 }} />
          )}

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
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  modeBtnTextActive: { color: '#fff' },
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
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
