import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fingerprint, KeyRound } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppPalette } from '../theme/useAppPalette';
import { useAppLockStore, MAX_PIN_ATTEMPTS, APP_LOCK_IDLE_MS } from '../stores/appLockStore';
import { useAppActivityStore } from '../stores/appActivityStore';
import { authService } from '../services/auth';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function LogoutRow({ onLogout }: { onLogout: () => void }) {
  const C = useAppPalette();
  return (
    <TouchableOpacity onPress={onLogout} style={styles.logout}>
      <Text style={[styles.logoutText, { color: C.textSecondary }]}>Boshqa hisobga kirish</Text>
    </TouchableOpacity>
  );
}

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const C = useAppPalette();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const touchActivity = useAppActivityStore((s) => s.touch);

  const hydrated = useAppLockStore((s) => s.hydrated);
  const enabled = useAppLockStore((s) => s.enabled);
  const hydrate = useAppLockStore((s) => s.hydrate);
  const verifyPin = useAppLockStore((s) => s.verifyPin);
  const incrementFailCount = useAppLockStore((s) => s.incrementFailCount);
  const resetFailCount = useAppLockStore((s) => s.resetFailCount);
  const failCount = useAppLockStore((s) => s.failCount);
  const pinLen = useAppLockStore((s) => s.storedPinLength);

  const [unlocked, setUnlocked] = useState(!enabled);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const has = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) setBioAvailable(has && enrolled);
      } catch {
        if (mounted) setBioAvailable(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' && enabled) setUnlocked(false);
    });
    return () => sub.remove();
  }, [enabled]);

  /** 5 daqiqa faolsizlikdan keyin qulf */
  useEffect(() => {
    if (!hydrated || !enabled || !user) return;
    const t = setInterval(() => {
      const idle = Date.now() - useAppActivityStore.getState().lastActivityAt;
      if (idle >= APP_LOCK_IDLE_MS && unlocked) {
        setUnlocked(false);
        setPin('');
        setErr('');
      }
    }, 2500);
    return () => clearInterval(t);
  }, [hydrated, enabled, user?.id, unlocked]);

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

  const runShake = () => {
    shake.value = withSequence(
      withTiming(-12, { duration: 40 }),
      withTiming(12, { duration: 40 }),
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  };

  const tryBiometric = useCallback(async () => {
    if (!user?.biometricEnabled) return;
    try {
      if (!bioAvailable) return;
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ruhiyat — biometrik tasdiq',
        cancelLabel: 'Bekor',
        disableDeviceFallback: false,
      });
      if (r.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await resetFailCount();
        touchActivity();
        setUnlocked(true);
        setPin('');
        setErr('');
      }
    } catch {
      /* ignore */
    }
  }, [user?.biometricEnabled, bioAvailable, resetFailCount, touchActivity]);

  useEffect(() => {
    if (!hydrated || !user || !enabled || unlocked) return;
    if (user.biometricEnabled && bioAvailable) {
      const id = setTimeout(() => void tryBiometric(), 400);
      return () => clearTimeout(id);
    }
  }, [hydrated, user, enabled, unlocked, user?.biometricEnabled, bioAvailable, tryBiometric]);

  const submitPin = async (code: string) => {
    setErr('');
    setChecking(true);
    try {
      const ok = await verifyPin(code);
      if (ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await resetFailCount();
        touchActivity();
        setUnlocked(true);
        setPin('');
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        runShake();
        const n = await incrementFailCount();
        setErr(`Noto‘g‘ri PIN. Qoldi: ${MAX_PIN_ATTEMPTS - n}`);
        setPin('');
        if (n >= MAX_PIN_ATTEMPTS) {
          await resetFailCount();
          await logout();
        }
      }
    } finally {
      setChecking(false);
    }
  };

  const pushDigit = (d: string) => {
    if (checking) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pin.length >= pinLen) return;
    const next = pin + d;
    setPin(next);
    if (next.length === pinLen) void submitPin(next);
  };

  const backspace = () => {
    void Haptics.selectionAsync();
    if (checking) return;
    setPin((p) => p.slice(0, -1));
  };

  const onKey = (k: string) => {
    if (k === 'del') {
      backspace();
      return;
    }
    if (k === '') return;
    pushDigit(k);
  };

  const openPasswordUnlock = () => {
    setPwd('');
    setPwdOpen(true);
  };

  const submitPasswordUnlock = async () => {
    if (!pwd.trim()) return;
    setChecking(true);
    try {
      await authService.verifySessionPassword(pwd);
      await resetFailCount();
      touchActivity();
      setPwdOpen(false);
      setPwd('');
      setUnlocked(true);
      setPin('');
      setErr('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Parol noto‘g‘ri');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    <>
      <View style={[styles.wrap, { backgroundColor: C.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <Text style={[styles.title, { color: C.text }]}>PIN kod</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          Davom etish uchun PIN kiriting. Qolgan urinishlar: {Math.max(0, MAX_PIN_ATTEMPTS - failCount)}.
        </Text>

        <Animated.View style={[styles.dotsRow, shakeStyle]}>
          {Array.from({ length: pinLen }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: C.border,
                  backgroundColor: i < pin.length ? C.primary : 'transparent',
                },
              ]}
            />
          ))}
        </Animated.View>

        {err ? (
          <Text style={[styles.err, { color: C.error }]} accessibilityLiveRegion="polite">
            {err}
          </Text>
        ) : null}

        {checking && pin.length === 0 ? <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} /> : null}

        <View style={styles.pad}>
          {KEYS.map((k, idx) => (
            <TouchableOpacity
              key={`${k}-${idx}`}
              style={[styles.key, !k ? styles.keyEmpty : null, { backgroundColor: C.surface }]}
              onPress={() => onKey(k)}
              disabled={!k || checking}
              activeOpacity={0.75}
            >
              {k === 'del' ? (
                <Text style={[styles.keyDel, { color: C.text }]}>⌫</Text>
              ) : k ? (
                <Text style={[styles.keyNum, { color: C.text }]}>{k}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {user.biometricEnabled && bioAvailable ? (
          <TouchableOpacity style={[styles.bioBtn, { borderColor: C.border }]} onPress={() => void tryBiometric()}>
            <Fingerprint size={22} color={C.primary} />
            <Text style={[styles.bioText, { color: C.primary }]}>Face ID / barmoq izi</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.linkBtn} onPress={openPasswordUnlock} disabled={checking}>
          <KeyRound size={18} color={C.textSecondary} />
          <Text style={[styles.linkText, { color: C.textSecondary }]}>Hisob paroli bilan kirish</Text>
        </TouchableOpacity>

        <LogoutRow onLogout={() => void logout()} />
      </View>

      <Modal visible={pwdOpen} animationType="slide" transparent onRequestClose={() => setPwdOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPwdOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Hisob paroli</Text>
            <Text style={[styles.modalSub, { color: C.textSecondary }]}>
              PIN o‘rniga akkaunt parolini kiriting. Sessiya ochiq qoladi.
            </Text>
            <TextInput
              style={[styles.pwdInput, { borderColor: C.border, color: C.text }]}
              placeholder="Parol"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={pwd}
              onChangeText={setPwd}
              onSubmitEditing={() => void submitPasswordUnlock()}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.primary, opacity: checking ? 0.75 : 1 }]}
              onPress={() => void submitPasswordUnlock()}
              disabled={checking || !pwd}
            >
              {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Tasdiqlash</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 16 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  err: { marginBottom: 12, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: 8,
  },
  key: {
    width: '28%',
    aspectRatio: 1.1,
    maxHeight: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  keyEmpty: { borderWidth: 0, backgroundColor: 'transparent' },
  keyNum: { fontSize: 24, fontWeight: '600' },
  keyDel: { fontSize: 22, fontWeight: '700' },
  bioBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bioText: { fontWeight: '700', fontSize: 16 },
  linkBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  linkText: { fontWeight: '600', fontSize: 15 },
  logout: { marginTop: 28, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 14, lineHeight: 20 },
  pwdInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
