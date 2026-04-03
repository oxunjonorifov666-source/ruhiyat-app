import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export function ForgotPasswordScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parolni tiklash</Text>
      <Text style={styles.subtitle}>Telefon raqamingizni kiriting, biz sizga tasdiqlash kodi yuboramiz</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Telefon raqam</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" keyboardType="phone-pad" placeholderTextColor={Colors.light.textSecondary} />

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('OTPVerify', { phone })}>
          <Text style={styles.buttonText}>Kodni yuborish</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton}>
          <Text style={styles.linkText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 8, marginBottom: 32 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  input: { backgroundColor: Colors.light.surface, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: Colors.light.border, color: Colors.light.text },
  button: { backgroundColor: Colors.light.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: Colors.light.primary, fontWeight: '600' },
});
