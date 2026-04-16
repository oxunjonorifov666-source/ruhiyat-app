import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity style={styles.outline} onPress={() => logout()}>
      <Text style={styles.outlineText}>Hisobdan chiqish</Text>
    </TouchableOpacity>
  );
}

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(!user?.biometricEnabled);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user?.biometricEnabled) {
          setUnlocked(true);
          return;
        }
        const has = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!has || !enrolled) {
          setUnlocked(true);
          return;
        }
        const r = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Ruhiyatga kirish',
          cancelLabel: 'Bekor',
        });
        if (alive) setUnlocked(r.success);
      } catch {
        if (alive) setUnlocked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.biometricEnabled, user?.id]);

  const retry = async () => {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ruhiyatga kirish',
      cancelLabel: 'Bekor',
    });
    setUnlocked(r.success);
  };

  if (!unlocked) {
    return (
      <View style={styles.block}>
        <Text style={styles.title}>Biometrik tasdiq</Text>
        <Text style={styles.sub}>Davom etish uchun Face ID / barmoq izi</Text>
        <TouchableOpacity style={styles.btn} onPress={retry}>
          <Text style={styles.btnText}>Qayta urinish</Text>
        </TouchableOpacity>
        <LogoutButton />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  block: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  btn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '800' },
  outline: { marginTop: 16, paddingVertical: 12 },
  outlineText: { color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
});
