import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { wellnessService, BreathingScenario } from '../../services/wellness';
import { ScreenStates } from '../../components/ScreenStates';

/** Bazada senariy bo‘lmasa — mahalliy (oflayn) senariylar */
const FALLBACK_SCENARIOS: BreathingScenario[] = [
  {
    id: -1,
    title: '4-4-4-4 (Box)',
    description: 'Tinchlantiruvchi klassik nafas',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    cyclesDefault: 4,
    orderIndex: 0,
  },
  {
    id: -2,
    title: '4-7-8 (tinchlantirish)',
    description: 'Uyqu va stress uchun',
    inhaleSec: 4,
    holdSec: 7,
    exhaleSec: 8,
    cyclesDefault: 4,
    orderIndex: 1,
  },
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'idle';

export function BreathingScreen() {
  const [scenarios, setScenarios] = useState<BreathingScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState<BreathingScenario | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = () => {
    setLoadError(null);
    setLoading(true);
    wellnessService
      .getBreathingScenarios()
      .then((rows) => setScenarios(rows?.length ? rows : FALLBACK_SCENARIOS))
      .catch(() => {
        setScenarios(FALLBACK_SCENARIOS);
        setLoadError(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPhase('idle');
    setActive(null);
    setCount(0);
    setCycle(0);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const start = (s: BreathingScenario) => {
    stop();
    setActive(s);
    setCycle(0);
    setPhase('inhale');
    setCount(s.inhaleSec);
    Animated.spring(scale, { toValue: 1.12, useNativeDriver: true }).start();
    let ph: Phase = 'inhale';
    let left = s.inhaleSec;
    let cyc = 0;
    timerRef.current = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setCount(left);
        return;
      }
      if (ph === 'inhale') {
        ph = 'hold';
        left = s.holdSec;
        setPhase('hold');
        setCount(left);
        Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }).start();
      } else if (ph === 'hold') {
        ph = 'exhale';
        left = s.exhaleSec;
        setPhase('exhale');
        setCount(left);
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      } else {
        cyc += 1;
        if (cyc >= s.cyclesDefault) {
          if (s.id > 0) {
            wellnessService
              .createBreathingSession((s.inhaleSec + s.holdSec + s.exhaleSec) * s.cyclesDefault, s.title)
              .catch(() => {});
          }
          stop();
          return;
        }
        setCycle(cyc);
        ph = 'inhale';
        left = s.inhaleSec;
        setPhase('inhale');
        setCount(left);
        Animated.spring(scale, { toValue: 1.12, useNativeDriver: true }).start();
      }
    }, 1000);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  if (loading) {
    return <ScreenStates loading />;
  }

  if (loadError && scenarios.length === 0) {
    return <ScreenStates error={loadError} onRetry={reload} />;
  }

  return (
    <ScreenStates>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Nafas mashqlari</Text>
      <Text style={styles.sub}>Senariylarni tanlang — timer va animatsiya bilan bajariladi (natija serverga yoziladi).</Text>

      {active && (
        <View style={styles.activeBox}>
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
            <Text style={styles.phase}>
              {phase === 'inhale' ? 'Nafas oling' : phase === 'hold' ? 'Ushlab turing' : phase === 'exhale' ? 'Chiqaring' : ''}
            </Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.cycleHint}>
              Sikllar: {cycle + 1} / {active.cyclesDefault}
            </Text>
          </Animated.View>
          <TouchableOpacity onPress={stop} style={styles.stopBtn}>
            <Text style={styles.stopText}>To‘xtatish</Text>
          </TouchableOpacity>
        </View>
      )}

      {scenarios.length === 0 ? (
        <ScreenStates empty emptyMessage="Hozircha nafas senariylari yo‘q" onRetry={reload} />
      ) : (
        scenarios.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card} onPress={() => start(s)} disabled={!!active}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            {s.description ? <Text style={styles.cardDesc}>{s.description}</Text> : null}
            <Text style={styles.meta}>
              {s.inhaleSec}-{s.holdSec}-{s.exhaleSec}s · {s.cyclesDefault} sikl
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, marginBottom: 16 },
  activeBox: { alignItems: 'center', marginBottom: 20 },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phase: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  count: { fontSize: 48, fontWeight: '800', color: Colors.text },
  cycleHint: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  stopBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.border, borderRadius: 10 },
  stopText: { fontWeight: '700', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});
