import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useAppPalette } from '../theme/useAppPalette';
import { useAppLockStore } from '../stores/appLockStore';

function LogoutRow() {
  const { logout } = useAuth();
  const C = useAppPalette();
  return (
    <TouchableOpacity onPress={() => logout()} style={styles.logout}>
      <Text style={[styles.logoutText, { color: C.textSecondary }]}>Boshqa hisobga kirish</Text>
    </TouchableOpacity>
  );
}

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const C = useAppPalette();
  const { user } = useAuth();
  const hydrated = useAppLockStore((s) => s.hydrated);
  const enabled = useAppLockStore((s) => s.enabled);
  const hydrate = useAppLockStore((s) => s.hydrate);
  const verifyPin = useAppLockStore((s) => s.verifyPin);

  const [unlocked, setUnlocked] = useState(!enabled);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      // Faqat fon rejimida qulflash — `inactive` klaviatura/dialog tufayli tez-tez ishga tushishi mumkin
      if (next === 'background') {
        if (enabled) setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setUnlocked(true);
      return;
    }
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(false);
    setPin('');
    setErr('');
  }, [hydrated, enabled, user?.id]);

  const tryBiometric = useCallback(async () => {
    if (!user?.biometricEnabled) return;
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) return;
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ruhiyat — biometrik tasdiq',
        cancelLabel: 'Bekor',
      });
      if (r.success) setUnlocked(true);
    } catch {
      /* ignore */
    }
  }, [user?.biometricEnabled]);

  const submit = async () => {
    setErr('');
    setChecking(true);
    try {
      const ok = await verifyPin(pin);
      if (ok) {
        setUnlocked(true);
        setPin('');
      } else {
        setErr('Noto‘g‘ri PIN');
      }
    } finally {
      setChecking(false);
    }
  };

  if (!hydrated || !user) {
    return <>{children}</>;
  }

  if (!enabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.wrap, { backgroundColor: C.background }]}>
      <Text style={[styles.title, { color: C.text }]}>Ilova qulfi</Text>
      <Text style={[styles.sub, { color: C.textSecondary }]}>
        Maxfiylik markazida o‘rnatilgan PIN — hisob parolingizdan alohida.
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        placeholder="PIN (4–6 raqam)"
        placeholderTextColor={C.textMuted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={submit}
      />
      {err ? <Text style={[styles.err, { color: C.error }]}>{err}</Text> : null}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.primary, opacity: checking ? 0.7 : 1 }]}
        onPress={submit}
        disabled={checking || pin.length < 4}
      >
        {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirish</Text>}
      </TouchableOpacity>
      {user?.biometricEnabled ? (
        <TouchableOpacity style={styles.bioBtn} onPress={tryBiometric}>
          <Text style={[styles.bioText, { color: C.primary }]}>Face ID / barmoq izi</Text>
        </TouchableOpacity>
      ) : null}
      <LogoutRow />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 28 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  err: { marginTop: 8, textAlign: 'center', fontWeight: '600' },
  btn: { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bioBtn: { marginTop: 16, padding: 12, alignItems: 'center' },
  bioText: { fontWeight: '700', fontSize: 15 },
  logout: { marginTop: 28, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '600' },
});
