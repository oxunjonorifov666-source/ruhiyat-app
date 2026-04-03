import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

export function OTPVerifyScreen({ route, navigation }: any) {
  const phone = route?.params?.phone || '';
  const purpose = route?.params?.purpose || 'login';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { login } = useAuth();

  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = code.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Xatolik', '6 xonali kodni to\'liq kiriting');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyOtp(phone, otpCode, purpose);

      if (data.user && data.accessToken && data.refreshToken) {
        await login(data.accessToken, data.refreshToken, data.user);
      } else {
        Alert.alert('Muvaffaqiyat', 'Kod tasdiqlandi');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Noto\'g\'ri kod');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authService.sendOtp(phone, purpose);
      Alert.alert('Yuborildi', 'Yangi kod yuborildi');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Kod yuborilmadi');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasdiqlash kodi</Text>
      <Text style={styles.subtitle}>{phone} raqamiga yuborilgan kodni kiriting</Text>

      <View style={styles.codeContainer}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={ref => { inputs.current[i] = ref }}
            style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={handleResend}
        disabled={resendLoading}
      >
        <Text style={styles.linkText}>
          {resendLoading ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  codeInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.light.border, textAlign: 'center', fontSize: 20, fontWeight: '600', color: Colors.light.text, backgroundColor: Colors.light.surface },
  codeInputFilled: { borderColor: Colors.light.primary },
  button: { backgroundColor: Colors.light.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: Colors.light.primary, fontWeight: '600' },
});
