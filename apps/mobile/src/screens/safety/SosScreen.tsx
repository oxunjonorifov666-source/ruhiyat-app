import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAppPalette } from '../../theme/useAppPalette';
import { sosService } from '../../services/sos';
import { hapticWarning } from '../../lib/haptics';

const COUNTDOWN_SEC = 3;

export function SosScreen({ navigation }: any) {
  const C = useAppPalette();
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [armed, setArmed] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SEC);

  useEffect(() => {
    if (!armed) return;
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [armed, seconds]);

  const startCountdown = () => {
    setArmed(true);
    setSeconds(COUNTDOWN_SEC);
    hapticWarning();
  };

  const cancelArm = () => {
    setArmed(false);
    setSeconds(COUNTDOWN_SEC);
  };

  const confirmSend = () => {
    Alert.alert(
      'SOS',
      "Signal `sos_alerts` jadvaliga yoziladi va mas’ullarga bildirishnoma ketadi.",
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Yuborish',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await sosService.trigger({ message: msg.trim() || undefined });
              Alert.alert('Yuborildi', 'Signal qabul qilindi.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch (e: any) {
              Alert.alert('Xatolik', e?.message || 'Yuborib bo‘lmadi');
            } finally {
              setLoading(false);
              cancelArm();
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.wrap, { backgroundColor: C.background }]}>
      <Text style={[styles.title, { color: C.text }]}>Favqulodda yordam (SOS)</Text>
      <Text style={[styles.sub, { color: C.textSecondary }]}>
        Avval teskari hisoblash, keyin tasdiq — tasodifiy bosilish kamayadi. Ma’lumotlar real bazaga yoziladi.
      </Text>

      <TouchableOpacity
        style={[styles.linkCard, { borderColor: C.border, backgroundColor: C.surface }]}
        onPress={() => navigation.navigate('CrisisResources')}
        activeOpacity={0.88}
      >
        <Text style={{ color: C.primary, fontWeight: '800', fontSize: 15 }}>Yordam liniyalari va ishonch telefonlari</Text>
        <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
          Tez qo‘ng‘iroq raqamlari — 103, 102 va boshqalar (tarmoq operatori bo‘yicha).
        </Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.surface }]}
        placeholder="Qisqa izoh (ixtiyoriy)"
        placeholderTextColor={C.textMuted}
        value={msg}
        onChangeText={setMsg}
        multiline
        editable={!armed || seconds > 0}
      />

      {!armed ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.error }]} onPress={startCountdown} disabled={loading}>
          <Text style={styles.btnText}>SOS tayyorlash</Text>
        </TouchableOpacity>
      ) : seconds > 0 ? (
        <View style={styles.countBox}>
          <Text style={[styles.countLabel, { color: C.textSecondary }]}>Tayyorlanmoqda</Text>
          <Text style={[styles.countNum, { color: C.error }]}>{seconds}</Text>
          <TouchableOpacity onPress={cancelArm}>
            <Text style={[styles.cancel, { color: C.primary }]}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.error }]} onPress={confirmSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SOS yuborish (tasdiqlash)</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: C.primary }]}>Orqaga</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  linkCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  countBox: { alignItems: 'center', marginBottom: 16 },
  countLabel: { fontSize: 14, fontWeight: '600' },
  countNum: { fontSize: 72, fontWeight: '900', marginVertical: 8 },
  cancel: { fontWeight: '700', marginTop: 8 },
  btn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  back: { textAlign: 'center', marginTop: 20, fontWeight: '600' },
});
