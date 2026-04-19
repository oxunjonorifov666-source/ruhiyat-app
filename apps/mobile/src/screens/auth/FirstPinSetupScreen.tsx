import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppPalette } from '../../theme/useAppPalette';
import { useAppLockStore, PIN_LENGTH } from '../../stores/appLockStore';
import { Shield } from 'lucide-react-native';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
const H_PAD = 24;

export function FirstPinSetupScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const C = useAppPalette();
  const setPin = useAppLockStore((s) => s.setPin);
  const markMandatoryPinDone = useAppLockStore((s) => s.markMandatoryPinDone);

  const [step, setStep] = useState<'a' | 'b'>('a');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [busy, setBusy] = useState(false);

  const active = step === 'a' ? first : second;
  const setActive = step === 'a' ? setFirst : setSecond;

  const pushDigit = (d: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (active.length >= PIN_LENGTH) return;
    const next = active + d;
    setActive(next);
    if (next.length === PIN_LENGTH) {
      if (step === 'a') {
        setTimeout(() => setStep('b'), 200);
      } else {
        void confirmBoth(first, next);
      }
    }
  };

  const back = () => {
    void Haptics.selectionAsync();
    setActive(active.slice(0, -1));
  };

  const confirmBoth = async (a: string, b: string) => {
    if (a !== b) {
      Alert.alert('PIN mos emas', 'Iltimos, qaytadan kiriting.', [
        {
          text: 'OK',
          onPress: () => {
            setStep('a');
            setFirst('');
            setSecond('');
          },
        },
      ]);
      return;
    }
    setBusy(true);
    try {
      await setPin(a);
      await markMandatoryPinDone();
      onComplete();
    } catch (e) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Saqlanmadi');
      setStep('a');
      setFirst('');
      setSecond('');
    } finally {
      setBusy(false);
    }
  };

  const onKey = (k: string) => {
    if (k === 'del') {
      if (active.length > 0) back();
      return;
    }
    if (k === '') return;
    pushDigit(k);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: C.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: H_PAD }]}>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: C.primaryLight }]}>
          <Shield size={40} color={C.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>4 raqamli PIN yarating</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          {step === 'a'
            ? 'Ilova xavfsizligi uchun PIN kod kiriting.'
            : 'PIN ni qayta kiriting (tasdiqlash).'}
        </Text>
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: C.border,
                backgroundColor: i < active.length ? C.primary : C.surface,
              },
            ]}
          />
        ))}
      </View>

      {busy ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.pad}>
          {KEYS.map((k, idx) => (
            <TouchableOpacity
              key={`${k}-${idx}`}
              style={[styles.key, !k ? styles.keyEmpty : null]}
              onPress={() => onKey(k)}
              disabled={!k}
              activeOpacity={0.7}
            >
              {k === 'del' ? (
                <Text style={[styles.keyDel, { color: C.text }]}>⌫</Text>
              ) : k ? (
                <Text style={[styles.keyNum, { color: C.text }]}>{k}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.hint, { color: C.textMuted }]}>PIN hisob parolingizdan alohida va qurilmada shifrlangan holda saqlanadi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  hero: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 340,
    alignSelf: 'center',
  },
  key: {
    width: '28%',
    aspectRatio: 1.1,
    maxHeight: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,120,0.08)',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyNum: { fontSize: 24, fontWeight: '600' },
  keyDel: { fontSize: 22, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
