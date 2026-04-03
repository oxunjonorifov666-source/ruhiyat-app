import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export function OTPVerifyScreen({ route, navigation }: any) {
  const phone = route?.params?.phone || '+998 90 ***';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
            style={styles.codeInput}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Tasdiqlash</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton}>
        <Text style={styles.linkText}>Kodni qayta yuborish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  codeInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.light.border, textAlign: 'center', fontSize: 20, fontWeight: '600', color: Colors.light.text },
  button: { backgroundColor: Colors.light.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: Colors.light.primary, fontWeight: '600' },
});
