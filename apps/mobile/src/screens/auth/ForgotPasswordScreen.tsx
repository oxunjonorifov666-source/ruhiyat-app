import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { getPasswordPolicyError } from '../../lib/passwordPolicy';
import { normalizeUzbekPhone, isValidUzbekMobile } from '../../lib/phone';

type Step = 'request' | 'reset';

export function ForgotPasswordScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [step, setStep] = useState<Step>('request');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  /** So‘rov qilgan kanal (verify bilan bir xil bo‘lishi kerak) */
  const [requestBody, setRequestBody] = useState<{ phone?: string; email?: string }>({});
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  /** Qayta yuborish (rate limit bilan mos) */
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    const body: { phone?: string; email?: string } = {};
    const p = normalizeUzbekPhone(phone.trim());
    const em = email.trim();
    if (em) {
      body.email = em;
    } else if (p && isValidUzbekMobile(p)) {
      body.phone = p;
    } else {
      Alert.alert('Xatolik', 'To‘g‘ri telefon (+998901234567) yoki email kiriting');
      return;
    }
    if (cooldown > 0) {
      Alert.alert('Kuting', `Kodni qayta yuborishdan oldin ${cooldown} s kuting.`);
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(body);
      setRequestBody(body);
      setCooldown(60);
      Alert.alert(
        'Kod yuborildi',
        'Agar akkauntingiz mavjud bo‘lsa, SMS yoki email orqali 6 raqamli kod yuborildi. Kod 15 daqiqa amal qiladi.',
        [{ text: 'OK', onPress: () => setStep('reset') }],
      );
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'So‘rov yuborilmadi');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0 || (!requestBody.phone && !requestBody.email)) return;
    setLoading(true);
    try {
      await authService.requestPasswordReset(requestBody);
      setCooldown(60);
      Alert.alert('Kod yuborildi', 'Yangi kod yuborildi (agar akkaunt mavjud bo‘lsa).');
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Yuborilmadi');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    const c = code.trim();
    if (c.length !== 6 || !/^\d{6}$/.test(c)) {
      Alert.alert('Xatolik', '6 raqamli kodni kiriting');
      return;
    }
    const err = getPasswordPolicyError(newPass);
    if (err) {
      Alert.alert('Parol', err);
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Xatolik', 'Parollar mos emas');
      return;
    }
    setLoading(true);
    try {
      const verifyBody = {
        ...requestBody,
        code: c,
      };
      const { resetToken } = await authService.verifyPasswordReset(verifyBody);
      await authService.resetPassword({ resetToken, newPassword: newPass });
      Alert.alert('Tayyor', 'Parol yangilandi. Yangi parol bilan kiring.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Tiklashda xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Orqaga</Text>
        </TouchableOpacity>

        {step === 'request' ? (
          <>
            <View style={styles.icon}><Text style={{ fontSize: 48 }}>🔐</Text></View>
            <Text style={styles.title}>Parolni tiklash</Text>
            <Text style={styles.subtitle}>
              Telefon yoki email kiriting. Kod SMS yoki email orqali yuboriladi.
            </Text>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.or}>yoki</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.btn, (loading || cooldown > 0) && { opacity: 0.7 }]}
              onPress={sendCode}
              disabled={loading || cooldown > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>
                  {cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : 'Tiklash kodini yuborish'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Kod va yangi parol</Text>
            <Text style={styles.subtitle}>SMS/email orqali kelgan 6 raqamli kod va yangi parol</Text>
            <Text style={styles.label}>Tiklash kodi</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.label}>Yangi parol</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPass}
              onChangeText={setNewPass}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Yangi parol (tasdiq)</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submitReset} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Parolni saqlash</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('request')} style={styles.link}>
              <Text style={styles.linkText}>← Orqaga (telefon/emailni o‘zgartirish)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resendCode}
              style={[styles.link, (cooldown > 0 || loading) && { opacity: 0.5 }]}
              disabled={cooldown > 0 || loading}
            >
              <Text style={styles.linkText}>
                {cooldown > 0 ? `Kodni qayta yuborish (${cooldown}s)` : 'Kodni qayta yuborish'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  icon: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  or: { textAlign: 'center', color: Colors.textMuted, marginVertical: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 12,
  },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
