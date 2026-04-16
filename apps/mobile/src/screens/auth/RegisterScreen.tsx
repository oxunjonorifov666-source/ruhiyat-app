import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Constants from 'expo-constants';
import type { AppPalette } from '../../constants/colors';
import { useAppPalette } from '../../theme/useAppPalette';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { getPasswordPolicyError } from '../../lib/passwordPolicy';
import { normalizeUzbekPhone, isValidUzbekMobile } from '../../lib/phone';

function isValidEmail(s: string) {
  const t = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function RegisterScreen({ navigation }: any) {
  const C = useAppPalette();
  const { login } = useAuth();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const skipRegisterOtp =
    (Constants.expoConfig?.extra as { skipRegisterOtp?: boolean } | undefined)?.skipRegisterOtp === true;

  const sendOtp = async () => {
    if (skipRegisterOtp) return;
    setSendingOtp(true);
    try {
      if (mode === 'phone') {
        const phone = normalizeUzbekPhone(form.phone);
        if (!isValidUzbekMobile(phone)) {
          Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
          return;
        }
        const res = await authService.sendRegistrationOtp({ phone });
        setOtpSent(true);
        if (res.devCode) {
          Alert.alert(
            'Kod (test muhiti)',
            `SMS kelmasa ham server javobida kod bor: ${res.devCode}\n\nProductionda Eskiz/SMS sozlang; devda AUTH_DEV_RETURN_OTP=true.`,
          );
        } else {
          Alert.alert('Kod yuborildi', 'SMS orqali kelgan 6 raqamli kodni kiriting.');
        }
      } else {
        const email = form.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
          Alert.alert('Email', 'To‘g‘ri email manzilini kiriting');
          return;
        }
        const res = await authService.sendRegistrationOtp({ email });
        setOtpSent(true);
        if (res.devCode) {
          Alert.alert(
            'Kod (test muhiti)',
            `Pochtaga kelmasa ham server javobida kod bor: ${res.devCode}\n\nSMTP sozlang; devda AUTH_DEV_RETURN_OTP=true.`,
          );
        } else {
          Alert.alert('Kod yuborildi', 'Emaildagi 6 raqamli kodni kiriting.');
        }
      }
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Kod yuborilmadi. SMS/Email server sozlamalarini tekshiring.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async () => {
    if (!form.firstName?.trim() || !form.password) {
      Alert.alert('Xatolik', 'Ism va parolni to‘ldiring');
      return;
    }
    if (mode === 'phone' && !form.phone?.trim()) {
      Alert.alert('Xatolik', 'Telefon raqamni kiriting');
      return;
    }
    if (mode === 'email' && !form.email?.trim()) {
      Alert.alert('Xatolik', 'Email kiriting');
      return;
    }
    const passErr = getPasswordPolicyError(form.password);
    if (passErr) {
      Alert.alert('Parol', passErr);
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Xatolik', 'Parollar mos kelmaydi');
      return;
    }
    if (!skipRegisterOtp && !/^\d{6}$/.test(form.code.trim())) {
      Alert.alert('Kod', 'Avval «Kod olish» ni bosing va kelgan 6 raqamni kiriting');
      return;
    }
    setLoading(true);
    try {
      let phone: string | undefined;
      let email: string | undefined;
      if (mode === 'phone') {
        phone = normalizeUzbekPhone(form.phone);
        if (!isValidUzbekMobile(phone)) {
          Alert.alert('Xatolik', 'Telefon: +998901234567 ko‘rinishida kiriting');
          setLoading(false);
          return;
        }
      } else {
        email = form.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
          Alert.alert('Xatolik', 'Email noto‘g‘ri');
          setLoading(false);
          return;
        }
      }
      const res = await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        password: form.password,
        ...(skipRegisterOtp ? {} : { code: form.code.trim() }),
      });
      await login(res.accessToken, res.refreshToken, res.user);
    } catch (e: any) {
      Alert.alert('Xatolik', e.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const f = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="default" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.backIcon, { color: C.text }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: C.text }]}>Ro'yxatdan o'tish</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Telefon yoki email orqali tasdiqlash kodi yuboriladi — keyin hisob ochiladi.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.modeRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'phone' && { backgroundColor: C.primary }]}
                onPress={() => {
                  setMode('phone');
                  setOtpSent(false);
                }}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'phone' ? '#fff' : C.text }]}>Telefon</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'email' && { backgroundColor: C.primary }]}
                onPress={() => {
                  setMode('email');
                  setOtpSent(false);
                }}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'email' ? '#fff' : C.text }]}>Email</Text>
              </TouchableOpacity>
            </View>

            <Field label="Ismingiz" value={form.firstName} onChangeText={f('firstName')} placeholder="Ism" C={C} />
            <Field label="Familiyangiz" value={form.lastName} onChangeText={f('lastName')} placeholder="Familiya" C={C} />

            {mode === 'phone' ? (
              <>
                <Text style={[styles.label, { color: C.text }]}>Telefon raqamingiz</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  placeholder="+998 90 123 45 67"
                  placeholderTextColor={C.textMuted}
                  value={form.phone}
                  onChangeText={f('phone')}
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <Field
                label="Email manzilingiz"
                value={form.email}
                onChangeText={f('email')}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                C={C}
              />
            )}
            {!skipRegisterOtp ? (
              <>
                <TouchableOpacity
                  style={[styles.otpBtn, { backgroundColor: C.secondary, borderColor: C.border }]}
                  onPress={sendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.otpBtnText}>
                      {otpSent ? 'Kodni qayta yuborish' : mode === 'phone' ? 'Tasdiqlash kodini olish (SMS)' : 'Tasdiqlash kodini olish (email)'}
                    </Text>
                  )}
                </TouchableOpacity>

                <Field
                  label={mode === 'phone' ? 'SMS kodi (6 raqam)' : 'Email kodi (6 raqam)'}
                  value={form.code}
                  onChangeText={f('code')}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  C={C}
                />
              </>
            ) : (
              <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}>
                (Dev) OTP o‘chirilgan — serverda ham AUTH_SKIP_REGISTER_OTP ishlating.
              </Text>
            )}

            <Field label="Parol" value={form.password} onChangeText={f('password')} placeholder="••••••" secure C={C} />
            <Field label="Parolni tasdiqlang" value={form.confirmPassword} onChangeText={f('confirmPassword')} placeholder="••••••" secure C={C} />

            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: C.primary }, loading && { opacity: 0.65 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ro'yxatdan o'tish</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: C.textSecondary }]}>Hisobingiz bormi? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: C.primary }]}>Kirish</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  maxLength,
  autoCapitalize,
  C,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences';
  C: AppPalette;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: C.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingVertical: 20 },
  header: { marginTop: 40, marginBottom: 24 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  backIcon: { fontSize: 32, bottom: 2 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  form: { gap: 14 },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { fontWeight: '800', fontSize: 14 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  otpBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  otpBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  mainBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});
